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
/** Encode bytes → base64 in chunks. A single `String.fromCharCode(...)`
 *  over a large array overflows the call stack; the native
 *  `Filesystem.writeFile` path only accepts a base64 string for binary. */
function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

/** How a share ended. `"shared"` = went out through a share sheet;
 *  `"downloaded"` = the web `<a download>` leg fired (already toasted
 *  "Downloaded …" — callers must NOT add their own success toast);
 *  `"cancelled"` = the user backed out. Mirrors the ShareOutcome union in
 *  src/lib/mobile/utils/retreeverFile.ts (structurally identical — OSEM
 *  can't import the proprietary module). */
export type ShareOutcome = "shared" | "downloaded" | "cancelled";

// Every successful export announces itself; the host app's celebration
// controller listens (thumbs-up arm). Inline literal — keep in sync with
// FILE_EXPORTED_EVENT in src/lib/mobile/utils/fileEvents.ts (open-core:
// OSEM stays UI-only, no proprietary import).
function announceExport(filename: string): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent("getcache:file-exported", { detail: { filename } }),
    );
}

// Exported: the KMZ exporter (src/lib/mobile/utils/kmzExport.ts) shares
// its binary payload through this same 3-tier path. `data` is a string
// for text exports (.geojson) or a Uint8Array for binary (.retreever KMZ).
export async function shareFile(
    data: string | Uint8Array,
    filename: string,
    _mimeType: string,
    dialogTitle: string,
): Promise<ShareOutcome> {
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
                // Binary (KMZ) → base64 + no encoding. Text → UTF8.
                data: typeof data === "string" ? data : bytesToBase64(data),
                directory: Directory.Cache,
                ...(typeof data === "string"
                    ? { encoding: Encoding.UTF8 }
                    : {}),
            });
            const fileUri = await Filesystem.getUri({
                path: filename,
                directory: Directory.Cache,
            });
            await Share.share({
                files: [fileUri.uri],
                dialogTitle,
            });
            announceExport(filename);
            return "shared";
        }
    } catch (e) {
        if ((e as Error).name === "AbortError") return "cancelled";
        // fall through
    }

    // 2️⃣ Web Share API. Original filename. Caller MUST reach this
    // point synchronously from the click handler — any `await` in
    // between burns user activation and Brave throws AbortError.
    // `data as BlobPart`: a string and a Uint8Array are both valid Blob
    // parts at runtime — the cast only bridges the lib's narrow
    // ArrayBuffer-vs-ArrayBufferLike typing of Uint8Array.
    const file = new File([data as BlobPart], filename, {
        type: "application/octet-stream",
    });
    try {
        if (navigator.share) {
            await navigator.share({ title: dialogTitle, files: [file] });
            announceExport(filename);
            return "shared";
        }
    } catch (e) {
        if ((e as Error).name === "AbortError") return "cancelled";
    }

    // 3️⃣ Download fallback. A browser download gives ZERO visible feedback,
    // so the quick "Downloaded …" toast IS the feedback. Deferred revoke:
    // Chrome/Firefox dispatch downloads asynchronously — a synchronous
    // URL.revokeObjectURL kills the blob before the browser fetches it.
    try {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        toast.success(`Downloaded ${filename}`, { duration: 3000 });
        announceExport(filename);
        return "downloaded";
    } catch {
        toast.error("Could not share file");
        return "cancelled";
    }
}

export async function shareFeatureGeoJSON(feature: Feature): Promise<void> {
    // GeoJSON share is dev/debug only — single-feature user shares now go
    // through shareFeatureKML (src/lib/mobile/utils/kmzExport.ts), which
    // produces a KMZ-bodied .retreever file.
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

// Exported: the KMZ exporter builds its <Document> from these per-feature
// <Placemark> fragments (it slices the <Placemark> out and adds <Style>).
export function featureToKML(feature: Feature): string {
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
    // The provenance stamp rides across the share boundary as KML
    // ExtendedData (same escape hatch as pinTypeKey). The literal
    // "isRetreever" MUST match RETREEVER_STAMP in tinySchema.ts — OSEM can't
    // import the proprietary constant, so it's duplicated here. Foreign KML
    // never carries it, so a re-import stays unstamped; our drawn pins stay
    // "ours" through any number of sends.
    const stamped = feature.properties?.isRetreever === "isRetreever";
    // Structured data (a JSON string) rides across as its own ExtendedData
    // field so a shared feature keeps its table/list on the receiver. Kept
    // verbatim (escaped) — the importer reads it straight back into
    // properties.featureData (see PROP_SKIP), never rolled into prose.
    const featureData =
        (feature.properties?.featureData as string | undefined) || "";
    // Contact assignments (an opaque JSON string the host app stamps and
    // consumes — OSEM only ferries it). Same escape hatch as featureData.
    const contactsData =
        (feature.properties?.contactsData as string | undefined) || "";
    // A recorded TRACK must stay a track across the share boundary — its
    // geometry alone reads as a plain line, so the receiver would downgrade
    // it (wrong icon, wrong identity). Only "track" needs the stamp; every
    // other kind re-derives correctly from geometry on import.
    const isTrack = feature.properties?.featureType === "track";
    const dataItems = [
        pinTypeKey
            ? `<Data name="pinTypeKey"><value>${escapeXml(pinTypeKey)}</value></Data>`
            : "",
        isTrack ? `<Data name="featureType"><value>track</value></Data>` : "",
        stamped
            ? `<Data name="isRetreever"><value>isRetreever</value></Data>`
            : "",
        featureData
            ? `<Data name="featureData"><value>${escapeXml(featureData)}</value></Data>`
            : "",
        contactsData
            ? `<Data name="contactsData"><value>${escapeXml(contactsData)}</value></Data>`
            : "",
    ]
        .filter(Boolean)
        .join("");
    const extendedKML = dataItems ? `<ExtendedData>${dataItems}</ExtendedData>` : "";
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

export function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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
//
// ALSO: roll every non-system property (KML <ExtendedData> fields like
// "NurseryName", "Division", "FG Contact") into a "Key: Value" block
// appended to featureDesc. Without this they'd be silently dropped — the
// data IS on each Feature.properties (the parser carries them through),
// but no UI reads them. Stuffing them into featureDesc makes the existing
// detail-sheet renderer surface them automatically. The skip list filters
// togeojson styling props + internal naming/keys so the description only
// shows real per-placemark data.
const PROP_SKIP = new Set([
    "name",
    "description",
    "featureDesc",
    "notes",
    "stroke",
    "stroke-opacity",
    "stroke-width",
    "fill",
    "fill-opacity",
    "icon",
    "icon-scale",
    "icon-color",
    "icon-heading",
    "icon-offset",
    "styleUrl",
    "styleHash",
    "styleMapHash",
    "visibility",
    "extrude",
    "altitudeMode",
    "tessellate",
    "drawOrder",
    "pinTypeKey",
    "featureType",
    "featureData",
    "contactsData",
    "featureSource",
    "isRetreever",
    "mapFeatureKey",
    "lastEditedBy",
    "lastTouched",
    "shareable",
]);

function normaliseProps(p: Feature["properties"]): Record<string, unknown> {
    const props: Record<string, unknown> = { ...(p ?? {}) };
    if (props.featureDesc == null && typeof props.description === "string") {
        props.featureDesc = props.description;
    }
    const lines: string[] = [];
    for (const [k, v] of Object.entries(props)) {
        if (PROP_SKIP.has(k)) continue;
        if (v == null || v === "") continue;
        if (typeof v === "object") continue;
        lines.push(`${k}: ${String(v)}`);
    }
    if (lines.length > 0) {
        const extras = lines.join("\n");
        // Append to the existing description (KML <description> wins as
        // the lead block; ExtendedData fields follow) so a placemark with
        // both a prose description AND structured ExtendedData keeps
        // everything visible.
        props.featureDesc =
            typeof props.featureDesc === "string" && props.featureDesc.trim()
                ? `${props.featureDesc}\n\n${extras}`
                : extras;
    }
    return props;
}
