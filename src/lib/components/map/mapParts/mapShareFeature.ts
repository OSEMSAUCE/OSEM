import { Capacitor } from "@capacitor/core";
import { toast } from "svelte-sonner";
import type { Feature, Position } from "geojson";

// Unified share path for KML / GeoJSON / .retreever exports.
// 3-tier (mirrors src/lib/mobile/utils/retreeverFile.ts shareRetreeverFile):
//   1. Native (Capacitor): write to Cache dir, hand URI to OS Share Sheet
//   2. Web Share API (canShare files): browser share sheet
//   3. Download fallback (<a download>) — never silently copies-then-toasts
//
// Why no clipboard fallback: KML/GeoJSON payloads can be large, and silently
// dumping XML on a user's clipboard from a "Share" button is not what anyone
// expects when the share sheet doesn't open.
async function shareFile(
    text: string,
    filename: string,
    _mimeType: string,
    dialogTitle: string,
): Promise<void> {
    // mimeType parameter retained for API compatibility but ignored —
    // see comment above the File constructor below for why.
    // 1️⃣ Native: Capacitor Share → OS Share Sheet
    //
    // Capacitor is imported at the top of this file (NOT dynamically
    // here) to keep click → navigator.share() synchronous on web.
    // Dynamic `await import("@capacitor/core")` bursts the user
    // activation token and Brave/Chrome silently reject share() with
    // "AbortError: Share canceled" — that was the actual root cause
    // of every failed share button.
    try {
        if (Capacitor.isNativePlatform()) {
            const { Filesystem, Directory, Encoding } = await import(
                "@capacitor/filesystem"
            );
            const { Share } = await import("@capacitor/share");
            await Filesystem.writeFile({
                path: filename,
                data: text,
                directory: Directory.Cache,
                encoding: Encoding.UTF8,
            });
            const fileUri = await Filesystem.getUri({
                path: filename,
                directory: Directory.Cache,
            });
            await Share.share({
                files: [fileUri.uri],
                dialogTitle,
            });
            return;
        }
    } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // fall through
    }

    // 2️⃣ Web Share API. Original filename. Caller MUST reach this
    // point synchronously from the click handler — any `await` in
    // between burns user activation and Brave throws AbortError.
    const file = new File([text], filename, {
        type: "application/octet-stream",
    });
    try {
        if (navigator.share) {
            await navigator.share({ title: dialogTitle, files: [file] });
            return;
        }
    } catch (e) {
        if ((e as Error).name === "AbortError") return;
    }

    // 3️⃣ Download fallback
    try {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    } catch {
        toast.error("Could not share file");
    }
}

export async function shareFeatureGeoJSON(feature: Feature): Promise<void> {
    // GeoJSON share is dev/debug only — single-feature user shares now go
    // through shareFeatureKML which produces .retreever (KML-bodied) files
    // so the recipient can open them directly in Get Cache.
    const geojson = JSON.stringify(feature, null, 2);
    const name = (feature.properties?.name as string) || "feature";
    await shareFile(
        geojson,
        `${name}.geojson`,
        "application/geo+json",
        "Map Feature",
    );
}

function coordsToKML(coords: Position[]): string {
    return coords
        .map((c) => `${c[0]},${c[1]}${c[2] != null ? `,${c[2]}` : ""}`)
        .join(" ");
}

function featureToKML(feature: Feature): string {
    const name = (feature.properties?.name as string) || "Feature";
    const desc =
        (feature.properties?.featureDesc as string) ||
        (feature.properties?.notes as string) ||
        "";
    // Preserve the pin identity (truck / bear / cache / etc.) across the
    // share boundary. Without this, exported KML loses pinTypeKey and the
    // receiver shows the generic glyph for any Point. ExtendedData/SimpleData
    // is the standard KML escape hatch for app-specific properties; other
    // KML viewers will simply ignore it.
    const pinTypeKey = (feature.properties?.pinTypeKey as string | undefined) || "";
    const extendedKML = pinTypeKey
        ? `<ExtendedData><Data name="pinTypeKey"><value>${escapeXml(pinTypeKey)}</value></Data></ExtendedData>`
        : "";
    const g = feature.geometry;
    let geomKML = "";

    if (g.type === "Point") {
        geomKML = `<Point><coordinates>${g.coordinates[0]},${g.coordinates[1]}</coordinates></Point>`;
    } else if (g.type === "MultiPoint") {
        geomKML = `<MultiGeometry>${g.coordinates.map((c) => `<Point><coordinates>${c[0]},${c[1]}</coordinates></Point>`).join("")}</MultiGeometry>`;
    } else if (g.type === "LineString") {
        geomKML = `<LineString><coordinates>${coordsToKML(g.coordinates)}</coordinates></LineString>`;
    } else if (g.type === "MultiLineString") {
        geomKML = `<MultiGeometry>${g.coordinates.map((ring) => `<LineString><coordinates>${coordsToKML(ring)}</coordinates></LineString>`).join("")}</MultiGeometry>`;
    } else if (g.type === "Polygon") {
        const outer = `<outerBoundaryIs><LinearRing><coordinates>${coordsToKML(g.coordinates[0])}</coordinates></LinearRing></outerBoundaryIs>`;
        const inner = g.coordinates
            .slice(1)
            .map(
                (ring) =>
                    `<innerBoundaryIs><LinearRing><coordinates>${coordsToKML(ring)}</coordinates></LinearRing></innerBoundaryIs>`,
            )
            .join("");
        geomKML = `<Polygon>${outer}${inner}</Polygon>`;
    } else if (g.type === "MultiPolygon") {
        geomKML = `<MultiGeometry>${g.coordinates
            .map((poly) => {
                const outer = `<outerBoundaryIs><LinearRing><coordinates>${coordsToKML(poly[0])}</coordinates></LinearRing></outerBoundaryIs>`;
                const inner = poly
                    .slice(1)
                    .map(
                        (ring) =>
                            `<innerBoundaryIs><LinearRing><coordinates>${coordsToKML(ring)}</coordinates></LinearRing></innerBoundaryIs>`,
                    )
                    .join("");
                return `<Polygon>${outer}${inner}</Polygon>`;
            })
            .join("")}</MultiGeometry>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>${escapeXml(name)}</name>
      <description>${escapeXml(desc)}</description>
      ${extendedKML}
      ${geomKML}
    </Placemark>
  </Document>
</kml>`;
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// JSON envelope carrying a KML body. Single source of truth for what
// gets written to .retreever map/feature files. The envelope tells the
// receiver everything it needs — kind, sender, timestamp — so the
// receiver never has to guess from filename or sniff at content.
// Spec: ReTreever/src/lib/mobile/utils/retreeverFile.ts (RetreeverFile).
function buildEnvelopeJson(opts: {
    kind: "feature" | "map";
    senderDisplayName: string;
    kml: string;
}): string {
    const envelope = {
        version: 1 as const,
        kind: opts.kind,
        sender: { displayName: opts.senderDisplayName },
        createdAt: new Date().toISOString(),
        targetRoute: "/mobile/inbox",
        encrypted: false,
        payload: JSON.stringify({ kml: opts.kml }),
    };
    return JSON.stringify(envelope, null, 2);
}

// Single-feature share. Body is the JSON envelope; payload is one
// Placemark with `pinTypeKey` preserved via KML ExtendedData.
//
// `senderDisplayName` is the USER's name (from `loadUserProfile()`), NOT
// the feature name. Earlier versions of this function defaulted sender
// to the feature name, which made every shared truck pin show up in
// the recipient's inbox as "from Truck_GTUser". Callers MUST pass the
// real display name.
export async function shareFeatureKML(
    feature: Feature,
    senderDisplayName: string,
): Promise<void> {
    const kml = featureToKML(feature);
    const filename = (feature.properties?.name as string) || "feature";
    const body = buildEnvelopeJson({
        kind: "feature",
        senderDisplayName,
        kml,
    });
    await shareFile(
        body,
        `${filename}.feat.retreever`,
        "application/json",
        filename,
    );
}

function buildKMLDocument(features: Feature[], docName: string): string {
    const placemarks = features
        .map((f) => {
            const inner = featureToKML(f);
            const match = inner.match(/<Placemark>[\s\S]*<\/Placemark>/);
            return match ? match[0] : "";
        })
        .join("\n    ");

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(docName)}</name>
    ${placemarks}
  </Document>
</kml>`;
}

/**
 * Share map features as a `.retreever` file. Body is the same JSON
 * envelope as single-feature shares so the receiver has one parser
 * path — no more raw-KML branch in `saveInboundPackage`.
 *
 * The KML inside still embeds each placemark's `pinTypeKey` via
 * ExtendedData, so multi-feature shares preserve every pin's identity
 * (truck stays truck, bear stays bear) across the round trip.
 *
 * `senderDisplayName` is the user's name. Callers must pass it.
 */
export async function shareRetreeverKML(
    features: Feature[],
    filename: string,
    docName: string,
    senderDisplayName: string,
): Promise<void> {
    const kml = buildKMLDocument(features, docName);
    // Kind-dot convention: collections are `*.map.retreever`,
    // single-feature shares are `*.feat.retreever`. Describes scope,
    // not payload format — both bodies are envelope-wrapped KML. See
    // src/lib/mobile/docs/NAMING_CONVENTIONS.md.
    const kindDot = features.length === 1 ? ".feat.retreever" : ".map.retreever";
    let safeName = filename;
    if (safeName.endsWith(".retreever") && !safeName.endsWith(kindDot)) {
        safeName = safeName.replace(/\.(map|feat)?\.?retreever$/, "") + kindDot;
    } else if (!safeName.endsWith(".retreever")) {
        safeName = `${safeName}${kindDot}`;
    }
    const body = buildEnvelopeJson({
        kind: features.length === 1 ? "feature" : "map",
        senderDisplayName,
        kml,
    });
    await shareFile(body, safeName, "application/json", docName);
}
