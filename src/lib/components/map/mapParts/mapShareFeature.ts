import { toast } from "svelte-sonner";
import type { Feature, Position } from "geojson";

export async function shareFeatureGeoJSON(feature: Feature): Promise<void> {
    const geojson = JSON.stringify(feature, null, 2);
    const file = new File([geojson], "feature.geojson", {
        type: "application/geo+json",
    });

    try {
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Map Feature", files: [file] });
            return;
        }
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
    }

    try {
        await navigator.clipboard.writeText(geojson);
        toast.success("GeoJSON copied to clipboard");
    } catch {
        toast.error("Could not share or copy feature");
    }
}

function coordsToKML(coords: Position[]): string {
    return coords
        .map((c) => `${c[0]},${c[1]}${c[2] != null ? `,${c[2]}` : ""}`)
        .join(" ");
}

function featureToKML(feature: Feature): string {
    const name = (feature.properties?.name as string) || "Feature";
    const desc = (feature.properties?.notes as string) || "";
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

export async function shareFeatureKML(feature: Feature): Promise<void> {
    const kml = featureToKML(feature);
    const name = (feature.properties?.name as string) || "feature";
    const file = new File([kml], `${name}.kml`, {
        type: "application/vnd.google-earth.kml+xml",
    });

    try {
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: name, files: [file] });
            return;
        }
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
    }

    try {
        await navigator.clipboard.writeText(kml);
        toast.success("KML copied to clipboard");
    } catch {
        toast.error("Could not share or copy KML");
    }
}

export async function shareFeaturesKML(features: Feature[]): Promise<void> {
    const placemarks = features
        .map((f) => {
            const inner = featureToKML(f);
            const match = inner.match(/<Placemark>[\s\S]*<\/Placemark>/);
            return match ? match[0] : "";
        })
        .join("\n    ");

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Map Layers</name>
    ${placemarks}
  </Document>
</kml>`;

    const file = new File([kml], "layers.kml", {
        type: "application/vnd.google-earth.kml+xml",
    });

    try {
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Map Layers", files: [file] });
            return;
        }
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
    }

    try {
        await navigator.clipboard.writeText(kml);
        toast.success("KML copied to clipboard");
    } catch {
        toast.error("Could not share or copy KML");
    }
}
