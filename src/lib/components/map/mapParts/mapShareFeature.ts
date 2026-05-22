import { Capacitor } from "@capacitor/core";
import { toast } from "svelte-sonner";
import { kml as kmlDocToGeoJSON } from "@tmcw/togeojson";
import type {
    Feature,
    FeatureCollection,
    Geometry,
    Position,
} from "geojson";

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
//
// FILENAME RULE: the feature's `name` property IS the filename stem.
// No separate filename arg, no caller-side template. One name field,
// one truth. If the user wants a different filename, they rename the
// feature.
export async function shareFeatureKML(
    feature: Feature,
    senderDisplayName: string,
): Promise<void> {
    const kml = featureToKML(feature);
    const name = (feature.properties?.name as string) || "feature";
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, "_") || "feature";
    const body = buildEnvelopeJson({
        kind: "feature",
        senderDisplayName,
        kml,
    });
    await shareFile(
        body,
        `${safe}.feature.retreever`,
        "application/json",
        name,
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
 * Share a map / multi-feature bundle as a `.retreever` file. Body is the
 * JSON envelope.
 *
 * FILENAME RULE: `name` is the canonical name of the thing being shared
 * (a map's mapTitle, or a generated bundle name). The filename is
 * `${name}.${kind}.retreever`; the KML's `<name>` element uses the same
 * string. One argument, no drift.
 *
 * KIND: pass `kind` explicitly. A map share is ALWAYS `"map"` — even when
 * the map holds a single feature — otherwise a 1-feature map mis-exports
 * as `.feature.retreever` (the bug this parameter fixes). The
 * feature-count default is a fallback for legacy callers only; a lone
 * loose feature should go through `shareFeatureKML` instead.
 *
 * The KML inside embeds each placemark's `pinTypeKey` via ExtendedData,
 * so multi-feature shares preserve every pin's identity across the
 * round trip.
 */
export async function shareRetreeverKML(
    features: Feature[],
    name: string,
    senderDisplayName: string,
    kind: "map" | "feature" = features.length === 1 ? "feature" : "map",
): Promise<void> {
    const kml = buildKMLDocument(features, name);
    const safe = (name || "").replace(/[^a-zA-Z0-9_-]/g, "_") || kind;
    const filename = `${safe}.${kind}.retreever`;
    const body = buildEnvelopeJson({
        kind,
        senderDisplayName,
        kml,
    });
    await shareFile(body, filename, "application/json", name);
}

// ─── KML → Feature[] ───────────────────────────────────────────────────
//
// Parses KML — our own round-trip exports AND foreign KML (the Google
// Earth / QGIS / Esri parcel exports planters import) — into flat
// GeoJSON features.
//
// Parsing is delegated to @tmcw/togeojson, the standard KML→GeoJSON
// library: it handles MultiGeometry, Folders, styles, ExtendedData,
// gx:Track — everything a hand-rolled reader misses. Two thin wrappers
// around it:
//   • repairKml()   — foreign KML is often NOT namespace-well-formed
//     (an `xsi:` prefix used but never declared, a stray BOM). A strict
//     XML parser then rejects the WHOLE document, so we patch the
//     missing namespace declarations on before parsing.
//   • flattenInto() — togeojson emits a GeometryCollection for a
//     <MultiGeometry> placemark, and KML can carry Multi* geometries.
//     The rest of the app handles only plain Point / LineString /
//     Polygon, so every composite is split into one feature per shape.
//
// Used by the auto-merge-on-receive flow and by importFile's KML/KMZ
// path.
export function kmlToFeatures(kml: string): Feature[] {
    if (typeof DOMParser === "undefined") return [];
    let doc: Document;
    try {
        doc = new DOMParser().parseFromString(
            repairKml(kml),
            "application/xml",
        );
    } catch {
        return [];
    }
    if (doc.getElementsByTagName("parsererror").length > 0) return [];
    let collection: FeatureCollection<Geometry | null>;
    try {
        collection = kmlDocToGeoJSON(doc);
    } catch {
        return [];
    }
    const out: Feature[] = [];
    for (const f of collection.features) flattenInto(f, out);
    return out;
}

// Foreign KML frequently uses a namespace prefix it never declares —
// classically `xsi:schemaLocation` with no `xmlns:xsi`. That makes a
// strict XML parser reject the entire file ("nothing to import"). Find
// every prefix in use and, for any that lacks an `xmlns:` declaration,
// bind it to a placeholder namespace on the root <kml> element. An
// extra unused binding is harmless; a missing one is fatal.
function repairKml(raw: string): string {
    let s = raw.replace(/^\uFEFF/, ""); // strip BOM
    const used = new Set<string>();
    for (const m of s.matchAll(/[<\s]([A-Za-z][\w-]*):[A-Za-z]/g)) {
        if (m[1] !== "xmlns") used.add(m[1]);
    }
    const missing = [...used].filter(
        (p) => !new RegExp(`xmlns:${p}[\\s=]`).test(s),
    );
    if (missing.length > 0) {
        const decls = missing
            .map((p) => `xmlns:${p}="urn:x-getcache-repair:${p}"`)
            .join(" ");
        s = s.replace(/<kml(\s|>)/, `<kml ${decls}$1`);
    }
    return s;
}

// togeojson emits a GeometryCollection for a <MultiGeometry> placemark,
// and a KML may carry Multi* geometries directly. The rest of the app
// handles only plain Point / LineString / Polygon, so split every
// composite into one feature per shape, each with its own copy of the
// parent's properties.
function flattenInto(f: Feature<Geometry | null>, out: Feature[]): void {
    const g = f.geometry;
    if (!g) return;
    if (g.type === "GeometryCollection") {
        for (const inner of g.geometries) {
            flattenInto(
                {
                    type: "Feature",
                    geometry: inner,
                    properties: f.properties,
                },
                out,
            );
        }
        return;
    }
    const props = normaliseProps(f.properties);
    if (g.type === "MultiPoint") {
        for (const c of g.coordinates) {
            out.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: c },
                properties: { ...props },
            });
        }
    } else if (g.type === "MultiLineString") {
        for (const c of g.coordinates) {
            out.push({
                type: "Feature",
                geometry: { type: "LineString", coordinates: c },
                properties: { ...props },
            });
        }
    } else if (g.type === "MultiPolygon") {
        for (const c of g.coordinates) {
            out.push({
                type: "Feature",
                geometry: { type: "Polygon", coordinates: c },
                properties: { ...props },
            });
        }
    } else {
        out.push({ type: "Feature", geometry: g, properties: props });
    }
}

// togeojson stores the KML <description> under `description`; the rest
// of the app reads `featureDesc`. Bridge the two so imported feature
// descriptions survive the round trip.
function normaliseProps(p: Feature["properties"]): Record<string, unknown> {
    const props: Record<string, unknown> = { ...(p ?? {}) };
    if (props.featureDesc == null && typeof props.description === "string") {
        props.featureDesc = props.description;
    }
    return props;
}
