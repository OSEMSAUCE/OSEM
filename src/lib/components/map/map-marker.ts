import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";

/**
 * True once a map has been removed (Svelte component unmounted, style swap,
 * hot reload). Post-await code should bail on removed maps to avoid
 * `Cannot read properties of undefined (reading 'getOwnSource')`.
 */
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
 * Prerender the animated SVG into N bitmap frames by letting the SMIL
 * animation play in an off-screen <img> and snapping it into a canvas at
 * regular intervals. See MAP_UX_PRINCIPLES.md §3 — this is what moves dogs
 * off DOM markers and onto a WebGL symbol layer while preserving the wag.
 */
async function prerenderWagFrames(
    url: string,
    sizePx: number,
    frameCount: number,
    totalDurationMs: number,
): Promise<ImageData[]> {
    const img = new Image(sizePx, sizePx);
    img.crossOrigin = "anonymous";
    img.style.cssText = `position:absolute;left:-9999px;top:-9999px;width:${sizePx}px;height:${sizePx}px;`;
    document.body.appendChild(img);
    try {
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () =>
                reject(new Error(`Failed to load wag SVG: ${url}`));
            img.src = url;
        });
        await new Promise((r) => setTimeout(r, 16));

        const frames: ImageData[] = [];
        const gap = totalDurationMs / frameCount;
        for (let i = 0; i < frameCount; i++) {
            const canvas = document.createElement("canvas");
            canvas.width = sizePx;
            canvas.height = sizePx;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("2d context unavailable");
            ctx.drawImage(img, 0, 0, sizePx, sizePx);
            frames.push(ctx.getImageData(0, 0, sizePx, sizePx));
            if (i < frameCount - 1)
                await new Promise((r) => setTimeout(r, gap));
        }
        return frames;
    } finally {
        img.remove();
    }
}

const WAG_FRAME_COUNT = 8;
const WAG_DURATION_MS = 1333; // matches the SMIL dur="1.3333333s" on the SVG

/**
 * Add the unclustered-point dogs as a Mapbox symbol layer (GPU-rendered,
 * zero DOM cost) and cycle its icon every (WAG_DURATION_MS / WAG_FRAME_COUNT)ms
 * so the dogs wag in sync. All dogs share one cycle — intentionally
 * simpler than per-marker phase, and cheap.
 */
async function addAnimatedDogLayer(
    map: mapboxgl.Map,
    sourceId: string,
    markerUrl: string,
    onPointClick?: (feature: mapboxgl.MapboxGeoJSONFeature) => void,
): Promise<void> {
    const iconPrefix = `${sourceId}-dog-frame`;
    const layerId = `${sourceId}-dogs`;
    const mapRecord = map as unknown as Record<string, unknown>;

    // Rasterize frames once per source; they're keyed on the source id so
    // different markerUrls (org vs polygon) don't collide.
    if (!map.hasImage(`${iconPrefix}-0`)) {
        const pxSize = MAP_CONFIG.marker.iconPixelSize;
        const frames = await prerenderWagFrames(
            markerUrl,
            pxSize,
            WAG_FRAME_COUNT,
            WAG_DURATION_MS,
        );
        if (!isMapAlive(map)) return;
        for (let i = 0; i < frames.length; i++) {
            const imageId = `${iconPrefix}-${i}`;
            if (!map.hasImage(imageId)) {
                map.addImage(imageId, frames[i], { pixelRatio: 2 });
            }
        }
    }

    if (!isMapAlive(map)) return;

    if (!map.getLayer(layerId)) {
        map.addLayer({
            id: layerId,
            type: "symbol",
            source: sourceId,
            filter: ["!", ["has", "point_count"]],
            layout: {
                "icon-image": `${iconPrefix}-0`,
                "icon-size": 0.5,
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

    const cycleKey = `__dogCycleStarted:${layerId}`;
    if (!mapRecord[cycleKey]) {
        mapRecord[cycleKey] = true;
        let idx = 0;
        const tick = () => {
            if (!isMapAlive(map) || !map.getLayer(layerId)) {
                clearInterval(handle);
                return;
            }
            idx = (idx + 1) % WAG_FRAME_COUNT;
            map.setLayoutProperty(
                layerId,
                "icon-image",
                `${iconPrefix}-${idx}`,
            );
        };
        const handle = setInterval(tick, WAG_DURATION_MS / WAG_FRAME_COUNT);
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

    const existing = map.getSource(id) as mapboxgl.GeoJSONSource | undefined;
    if (existing) {
        existing.setData(data);
    } else {
        map.addSource(id, {
            type: "geojson",
            data,
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

    // Fire-and-forget: dogs appear when frames finish rasterizing (~100ms).
    const markerUrl = config.markerUrl || MAP_CONFIG.markers.default;
    addAnimatedDogLayer(map, id, markerUrl, onPointClick).catch((err) =>
        console.error("Failed to add animated dog layer:", err),
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
            const center = geometry.coordinates as [number, number];
            const nextZoom = Math.min(
                map.getZoom() + 3,
                MAP_CONFIG.cluster.clickZoom,
            );
            map.easeTo({ center, zoom: nextZoom });
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
