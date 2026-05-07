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
    try {
        const { Capacitor } = await import("@capacitor/core");
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

    // 2️⃣ Web Share API
    // Use generic octet-stream regardless of payload type so the file
    // doesn't carry an unrecognized MIME that some browsers refuse.
    //
    // Importantly: do NOT gate on navigator.canShare. Brave/Chromium
    // returns false for files with non-standard extensions (.retreever)
    // even when share() itself would succeed — that's why the share
    // sheet popped for .csv but not .retreever before this change.
    // Just try share() and catch. AbortError = user cancelled, no
    // fallback. Anything else = browser refused, fall through to
    // download.
    const file = new File([text], filename, { type: "application/octet-stream" });
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

// Single-feature share. Body is valid KML; extension is `.map.retreever` per
// NAMING_CONVENTIONS.md (kind dot = "map"). Recipient with Get Cache installed
// gets "Open in Get Cache" in their share sheet. They can rename to `.kml`
// and it'll open in Google Earth / ArcGIS / any KML viewer unchanged.
export async function shareFeatureKML(feature: Feature): Promise<void> {
    const kml = featureToKML(feature);
    const name = (feature.properties?.name as string) || "feature";
    await shareFile(
        kml,
        `${name}.map.retreever`,
        "application/vnd.google-earth.kml+xml",
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

export async function shareFeaturesKML(features: Feature[]): Promise<void> {
    const kml = buildKMLDocument(features, "Map Layers");
    await shareFile(
        kml,
        "layers.map.retreever",
        "application/vnd.google-earth.kml+xml",
        "Map Layers",
    );
}

/**
 * Share map features as a `.retreever` file containing KML. The body is
 * valid KML; the extension is rebranded so a double-click on a desktop
 * with ReTreever installed deep-links back into the app, while the
 * payload still opens in any KML viewer that knows the MIME type.
 */
export async function shareRetreeverKML(
    features: Feature[],
    filename: string,
    docName = "ReTreever Map",
): Promise<void> {
    const kml = buildKMLDocument(features, docName);
    // Enforce the kind-dot convention: every map share is `*.map.retreever`.
    // See src/lib/mobile/docs/NAMING_CONVENTIONS.md.
    let safeName = filename;
    if (safeName.endsWith(".retreever") && !safeName.endsWith(".map.retreever")) {
        safeName = safeName.slice(0, -".retreever".length) + ".map.retreever";
    } else if (!safeName.endsWith(".retreever")) {
        safeName = `${safeName}.map.retreever`;
    }
    await shareFile(
        kml,
        safeName,
        "application/vnd.google-earth.kml+xml",
        docName,
    );
}
