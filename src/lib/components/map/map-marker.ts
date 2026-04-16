import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
} from "geojson";
import mapboxgl from "mapbox-gl";
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
 * Add a clustered pin source + layers to the map.
 *
 * Rendering stack (bottom → top):
 *   1. Heatmap layer (zoom 0 – heatmap.maxZoom): density glow at globe zoom
 *   2. Cluster glow halo: soft oversized gold underlay
 *   3. Cluster core circles (graduated): gold, no numbers, thicker border
 *   4. DOM Marker elements for unclustered points: preserves SVG tail-wag
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

    // Source (clustered GeoJSON). Update data if already present.
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

    // 1. Heatmap (density glow at low zoom)
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

    // 2. Glow halo (oversized, soft, no stroke) — visible at ALL zooms so the
    // glow always fills underneath the white ring.
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

    // 3. Cluster core circles (graduated radius, gold fill, thick border)
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

    // 4. Individual pins as DOM Markers (preserves animated SVG tail-wag)
    const updateDogMarkers = () => {
        const markerStoreKey = `__clusteredPinsDogMarkers:${id}`;
        const markersById = (mapRecord[markerStoreKey] ??
            new Map<string | number, mapboxgl.Marker>()) as Map<
            string | number,
            mapboxgl.Marker
        >;
        mapRecord[markerStoreKey] = markersById;

        const features = map.querySourceFeatures(id, {
            filter: ["!", ["has", "point_count"]],
        });
        const nextIds = new Set<string | number>();

        features.forEach((feature) => {
            if (feature.id == null) return;
            nextIds.add(feature.id);
            const geometry = feature.geometry;
            if (geometry.type !== "Point") return;
            const coords = geometry.coordinates as [number, number];

            const existingMarker = markersById.get(feature.id);
            if (existingMarker) {
                existingMarker.setLngLat(coords);
                return;
            }

            const markerSrc = config.markerUrl || MAP_CONFIG.markers.default;

            // Exact-sized wrappers so Mapbox's anchor:center calculation
            // lands on the true pixel center of the dog icon (no drift from
            // inline-block or padding). No CSS transform — Mapbox writes its
            // own transform on every frame, overriding anything we set here.
            const size = MAP_CONFIG.marker.width;
            const el = document.createElement("div");
            el.className = "retreever-marker";
            el.setAttribute("data-marker-layer", id);
            el.style.cssText = `width:${size}px;height:${size}px;display:block;background:transparent;border:none;padding:0;margin:0;cursor:pointer;`;

            const inner = document.createElement("div");
            inner.className = "marker-inner";
            inner.style.cssText = `width:${size}px;height:${size}px;display:block;padding:0;margin:0;`;

            const img = document.createElement("img");
            img.src = markerSrc;
            img.width = size;
            img.height = size;
            img.alt = MAP_CONFIG.marker.alt;
            img.style.cssText = `width:${size}px;height:${size}px;display:block;padding:0;margin:0;`;
            img.onerror = () =>
                console.error(`❌ Failed to load marker image: ${markerSrc}`);

            inner.appendChild(img);
            el.appendChild(inner);

            const marker = new mapboxgl.Marker({
                element: el,
                anchor: "center",
            })
                .setLngLat(coords)
                .addTo(map);

            const handleMarkerClick = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                onPointClick?.(feature);
            };
            el.addEventListener("click", handleMarkerClick);
            el.addEventListener("touchend", handleMarkerClick);

            markersById.set(feature.id, marker);
        });

        for (const [featureId, marker] of markersById.entries()) {
            if (!nextIds.has(featureId)) {
                marker.remove();
                markersById.delete(featureId);
            }
        }
    };

    map.once("idle", updateDogMarkers);
    const boundKey = `__clusteredPinsDogBound:${id}`;
    if (!mapRecord[boundKey]) {
        mapRecord[boundKey] = true;
        map.on("moveend", updateDogMarkers);
        map.on("zoomend", updateDogMarkers);
    }

    // Cluster click — ease in toward the cluster
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

    console.log(`✅ Clustered pins added for layer: ${id}`);
}

export async function addOrgMarkers(
    map: mapboxgl.Map,
    config: OrgMarkerConfig,
): Promise<void> {
    const { id, data, onMarkerClick, markerUrl } = config;

    const orgsWithValidGps = data.filter((org) => {
        const lat = Number(org.latitude);
        const lon = Number(org.longitude);
        return (
            org.latitude &&
            org.longitude &&
            Math.abs(lat) >= 1 &&
            Math.abs(lon) >= 1
        );
    });

    const features = orgsWithValidGps.map((org) => ({
        type: "Feature",
        properties: {
            id: org.organizationKey || org.id,
            name: org.organizationName || org.displayName,
            address: org.organizationAddress || org.address,
            website:
                org.organizationWebsite || org.displayWebsite || org.website,
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

    const markerConfig: ClusteredPinsConfig = {
        id,
        data: geojson,
        markerUrl,
        onPointClick: (feature) => {
            const orgId = feature.properties?.id;
            if (onMarkerClick && orgId) {
                onMarkerClick(orgId);
            }
        },
        pointColor: "#a78bfa",
    };

    addClusteredPins(map, markerConfig);
    console.log("✅ Org markers added via shared marker layer utility");
}
