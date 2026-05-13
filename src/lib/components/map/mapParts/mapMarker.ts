import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { safeEase } from "./safeEase";
import { toCoordFromArray, isCoord, type Coord } from "./coord";

/**
 * True once a map has been removed (Svelte component unmounted, style swap,
 * hot reload). Post-await code should bail on removed maps to avoid
 * `Cannot read properties of undefined (reading 'getOwnSource')`.
 */
// Drop features whose Point geometry has NaN/Infinity/out-of-range
// coordinates. Mapbox crashes during render (`_evaluateOpacity` →
// `unproject`) when even one such feature reaches its sources. This is
// the source-data boundary; validate here so internal pipeline code
// can trust feature coordinates without re-checking.
function filterFiniteFeatures(
    fc: FeatureCollection<Geometry, GeoJsonProperties>,
): FeatureCollection<Geometry, GeoJsonProperties> {
    let dropped = 0;
    const safeFeatures = fc.features.filter((f) => {
        if (!f.geometry) return false;
        if (f.geometry.type !== "Point") return true;
        const ok = isCoord(f.geometry.coordinates);
        if (!ok) dropped++;
        return ok;
    });
    if (dropped > 0) {
        console.warn(
            `[mapMarker] dropped ${dropped} feature(s) with non-finite coordinates`,
        );
    }
    if (safeFeatures.length === fc.features.length) return fc;
    return { ...fc, features: safeFeatures };
}

export function isMapAlive(map: mapboxgl.Map | undefined | null): boolean {
    if (!map) return false;
    const internal = map as unknown as { _removed?: boolean; style?: unknown };
    return !internal._removed && internal.style != null;
}

export interface ClusteredPinsConfig {
    id: string;
    data: FeatureCollection<Geometry, GeoJsonProperties>;
    onPointClick?: (feature: mapboxgl.MapboxGeoJSONFeature) => void;
    pointColor?: string;
    clusterRadius?: number;
    maxZoom?: number;
    markerUrl?: string;
}

export interface OrgMarkerConfig {
    id: string;
    data: OrganizationData[];
    onMarkerClick?: (orgId: string) => void;
    markerUrl?: string;
}

interface OrganizationData {
    organizationKey?: string;
    id?: string;
    organizationName?: string;
    displayName?: string;
    organizationAddress?: string;
    address?: string;
    organizationWebsite?: string;
    displayWebsite?: string;
    website?: string;
    claimQty?: number;
    latitude?: string | number;
    longitude?: string | number;
}

function circleRadiusExpression(scale = 1): mapboxgl.Expression {
    const stops = MAP_CONFIG.cluster.circleStops;
    const expr: (string | number | unknown[])[] = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "point_count"], 1],
    ];
    for (const s of stops) {
        expr.push(s.count, Math.round(s.radius * scale));
    }
    return expr as unknown as mapboxgl.Expression;
}

function circleColorExpression(): mapboxgl.Expression {
    const stops = MAP_CONFIG.cluster.circleStops;
    const expr: (string | number | unknown[])[] = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "point_count"], 1],
    ];
    for (const s of stops) {
        expr.push(s.count, s.color);
    }
    return expr as unknown as mapboxgl.Expression;
}

function heatmapColorExpression(): mapboxgl.Expression {
    const expr: (string | number | unknown[])[] = [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
    ];
    for (const s of MAP_CONFIG.cluster.heatmap.ramp) {
        expr.push(s.stop, s.color);
    }
    return expr as unknown as mapboxgl.Expression;
}

/**
 * Rasterize an SVG into an ImageData at the given pixel size, via canvas.
 * Mapbox's loadImage doesn't decode SVGs, so we do it ourselves.
 */
async function rasterizeSvg(url: string, sizePx: number): Promise<ImageData> {
    const img = new Image(sizePx, sizePx);
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
            reject(new Error(`Failed to load marker SVG: ${url}`));
        img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(img, 0, 0, sizePx, sizePx);
    return ctx.getImageData(0, 0, sizePx, sizePx);
}

/**
 * Static dog symbol layer. Zoom-dependent icon-size so dogs read as small
 * accents at globe zoom and grow to a legible size when zoomed in to look
 * at individual land parcels.
 */
async function addDogLayer(
    map: mapboxgl.Map,
    sourceId: string,
    markerUrl: string,
    onPointClick?: (feature: mapboxgl.MapboxGeoJSONFeature) => void,
): Promise<void> {
    const iconId = `${sourceId}-dog`;
    const layerId = `${sourceId}-dogs`;
    const mapRecord = map as unknown as Record<string, unknown>;

    if (!map.hasImage(iconId)) {
        const frame = await rasterizeSvg(
            markerUrl,
            MAP_CONFIG.marker.iconPixelSize,
        );
        if (!isMapAlive(map)) return;
        if (!map.hasImage(iconId)) {
            map.addImage(iconId, frame, { pixelRatio: 2 });
        }
    }

    if (!isMapAlive(map)) return;

    if (!map.getLayer(layerId)) {
        const base = MAP_CONFIG.marker.iconSize;
        map.addLayer({
            id: layerId,
            type: "symbol",
            source: sourceId,
            filter: ["!", ["has", "point_count"]],
            layout: {
                "icon-image": iconId,
                // Zoom-adaptive size — smaller on the globe, bigger up close.
                "icon-size": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    2,
                    base * 0.55,
                    8,
                    base * 0.85,
                    14,
                    base * 1.15,
                ],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-anchor": "center",
            },
        });
    }

    const clickBoundKey = `__dogClickBound:${layerId}`;
    if (!mapRecord[clickBoundKey]) {
        mapRecord[clickBoundKey] = true;
        if (onPointClick) {
            map.on("click", layerId, (e) => {
                const feature = e.features?.[0];
                if (feature)
                    onPointClick(feature as mapboxgl.MapboxGeoJSONFeature);
            });
        }
        map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
        });
    }
}

/**
 * Add a clustered pin source + layers to the map.
 *
 * Rendering stack (bottom → top, all WebGL):
 *   1. Heatmap layer (zoom 0 – heatmap.maxZoom): density glow at globe zoom
 *   2. Cluster glow halo: soft oversized gold underlay
 *   3. Cluster core circles (graduated): transparent fill, white ring
 *   4. Animated dog symbol layer: unclustered points, frame-cycled wag
 */
export function addClusteredPins(
    map: mapboxgl.Map,
    config: ClusteredPinsConfig,
): void {
    if (!isMapAlive(map)) return;

    const {
        id,
        data,
        onPointClick,
        clusterRadius = MAP_CONFIG.cluster.radius,
    } = config;
    const mapRecord = map as unknown as Record<string, unknown>;

    // Filter NaN/non-Point features at the source boundary. A single
    // bad coord in a clustered source causes Mapbox to crash inside
    // _evaluateOpacity during render — and the stack trace points at
    // mapbox-gl internals, not the offending feature. Drop them here.
    const safeData = filterFiniteFeatures(data);

    const existing = map.getSource(id) as mapboxgl.GeoJSONSource | undefined;
    if (existing) {
        existing.setData(safeData);
    } else {
        map.addSource(id, {
            type: "geojson",
            data: safeData,
            generateId: true,
            cluster: true,
            clusterMaxZoom: MAP_CONFIG.cluster.maxZoom,
            clusterRadius,
        });
    }

    const heatMinZoom = MAP_CONFIG.cluster.heatmap.minZoom;
    const heatMaxZoom = MAP_CONFIG.cluster.heatmap.maxZoom;

    const heatLayerId = `${id}-heat`;
    if (!map.getLayer(heatLayerId)) {
        map.addLayer({
            id: heatLayerId,
            type: "heatmap",
            source: id,
            minzoom: heatMinZoom,
            maxzoom: heatMaxZoom + 1,
            paint: {
                "heatmap-weight": [
                    "interpolate",
                    ["linear"],
                    ["coalesce", ["get", "point_count"], 1],
                    1,
                    0.2,
                    50,
                    0.7,
                    200,
                    1,
                ],
                "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    0.6,
                    heatMaxZoom,
                    2.2,
                ],
                "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    14,
                    heatMaxZoom,
                    38,
                ],
                "heatmap-color": heatmapColorExpression(),
                "heatmap-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    heatMaxZoom - 2,
                    0.9,
                    heatMaxZoom,
                    0,
                ],
            },
        });
    }

    const glowLayerId = `${id}-cluster-glow`;
    if (!map.getLayer(glowLayerId)) {
        map.addLayer({
            id: glowLayerId,
            type: "circle",
            source: id,
            filter: ["has", "point_count"],
            paint: {
                "circle-color": MAP_CONFIG.cluster.glow.color,
                "circle-radius": circleRadiusExpression(
                    MAP_CONFIG.cluster.glow.radiusScale,
                ),
                "circle-blur": MAP_CONFIG.cluster.glow.blur,
            },
        });
    }

    const clusterLayerId = `${id}-clusters`;
    if (!map.getLayer(clusterLayerId)) {
        map.addLayer({
            id: clusterLayerId,
            type: "circle",
            source: id,
            filter: ["has", "point_count"],
            paint: {
                "circle-color": circleColorExpression(),
                "circle-radius": circleRadiusExpression(),
                "circle-stroke-width": MAP_CONFIG.cluster.stroke.width,
                "circle-stroke-color": MAP_CONFIG.cluster.stroke.color,
                "circle-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    heatMaxZoom - 3,
                    0,
                    heatMaxZoom - 1,
                    1,
                ],
            },
        });
    }

    // Fire-and-forget: dogs appear as soon as the SVG finishes rasterizing.
    const markerUrl = config.markerUrl || MAP_CONFIG.markers.default;
    addDogLayer(map, id, markerUrl, onPointClick).catch((err) =>
        console.error("Failed to add dog layer:", err),
    );

    const boundClusterKey = `__clusteredPinsClusterClickBound:${id}`;
    if (!mapRecord[boundClusterKey]) {
        mapRecord[boundClusterKey] = true;
        map.on("click", clusterLayerId, (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: [clusterLayerId],
            });
            if (features.length === 0) return;
            const geometry = features[0].geometry;
            if (geometry.type !== "Point") return;
            const center: Coord | null = toCoordFromArray(geometry.coordinates);
            if (!center) return;
            const nextZoom = Math.min(
                map.getZoom() + 3,
                MAP_CONFIG.cluster.clickZoom,
            );
            safeEase(map, { center, zoom: nextZoom });
        });
        map.on("mouseenter", clusterLayerId, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", clusterLayerId, () => {
            map.getCanvas().style.cursor = "";
        });
    }
}

export async function addOrgMarkers(
    map: mapboxgl.Map,
    config: OrgMarkerConfig,
): Promise<void> {
    const { id, data, onMarkerClick, markerUrl } = config;

    const features = data
        .filter((org) => {
            const lat = Number(org.latitude);
            const lon = Number(org.longitude);
            return (
                org.latitude &&
                org.longitude &&
                Math.abs(lat) >= 1 &&
                Math.abs(lon) >= 1
            );
        })
        .map((org) => ({
            type: "Feature",
            properties: {
                id: org.organizationKey || org.id,
                name: org.organizationName || org.displayName,
                address: org.organizationAddress || org.address,
                website:
                    org.organizationWebsite ||
                    org.displayWebsite ||
                    org.website,
                claimQty: org.claimQty,
            },
            geometry: {
                type: "Point",
                coordinates: [Number(org.longitude), Number(org.latitude)],
            },
        }));

    const geojson: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: "FeatureCollection",
        features: features as Feature<Geometry, GeoJsonProperties>[],
    };

    addClusteredPins(map, {
        id,
        data: geojson,
        markerUrl,
        onPointClick: (feature) => {
            const orgId = feature.properties?.id;
            if (onMarkerClick && orgId) onMarkerClick(orgId);
        },
    });
}
