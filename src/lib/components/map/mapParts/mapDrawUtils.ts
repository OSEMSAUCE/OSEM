import { area, length, centroid } from "@turf/turf";
import type { Feature, Polygon, LineString } from "geojson";

export function formatArea(sqMetres: number): string {
    const ha = sqMetres / 10000;
    if (ha < 0.1) return `${Math.round(sqMetres).toLocaleString()} m²`;
    if (ha < 10) return `${ha.toFixed(1)} ha`;
    return `${Math.round(ha).toLocaleString()} ha`;
}

export function measureLabel(feature: Feature): "AREA" | "LENGTH" | null {
    const t = feature.geometry?.type;
    if (t === "Polygon" || t === "MultiPolygon") return "AREA";
    if (t === "LineString" || t === "MultiLineString") return "LENGTH";
    return null;
}

function formatLength(km: number): string {
    return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}

export function measureFeature(feature: Feature): string | null {
    if (!feature.geometry) return null;
    if (feature.geometry.type === "Polygon") {
        const sqM = area(feature as Feature<Polygon>);
        return formatArea(sqM);
    }
    if (feature.geometry.type === "LineString") {
        const km = length(feature as Feature<LineString>, {
            units: "kilometers",
        });
        return formatLength(km);
    }
    return null;
}

export function getFeatureAnchorLngLat(
    feature: Feature,
): [number, number] | null {
    if (!feature.geometry) return null;
    if (feature.geometry.type === "Polygon") {
        const c = centroid(feature as Feature<Polygon>);
        return c.geometry.coordinates as [number, number];
    }
    if (feature.geometry.type === "LineString") {
        const coords = (feature.geometry as LineString).coordinates;
        if (coords.length < 1) return null;
        const mid = coords[Math.floor(coords.length / 2)];
        return mid as [number, number];
    }
    if (feature.geometry.type === "Point") {
        return feature.geometry.coordinates as [number, number];
    }
    return null;
}
