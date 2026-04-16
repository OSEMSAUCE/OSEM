import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import {
    addClusteredPins,
    isMapAlive,
    type ClusteredPinsConfig,
} from "./map-marker.ts";
import type { MapOptions } from "./mapTypes";

/** Track which large polygons have been fetched and rendered */
const loadedLargePolygons = new Set<string>();

/**
 * Load polygon centroids as clustered pins + lazy-load full polygon geometries
 * the first time the user zooms past `MAP_CONFIG.polygons.minZoom`.
 *
 * This keeps the initial payload tiny (Points, no polygon geometry) so the globe
 * loads fast. The expensive geometry fetch only happens when the user is actually
 * zoomed in far enough to see individual polygon fills.
 */
export async function addMarkersLayer(
    map: mapboxgl.Map,
    options: MapOptions = {},
): Promise<void> {
    const apiBase = (options.apiBaseUrl ?? "").replace(/\/$/, "");

    // ─── Phase 2a: fetch lightweight centroids ──────────────────────────────
    let centroidsData: {
        features?: Feature<Point, GeoJsonProperties>[];
    } | null = null;
    try {
        const response = await fetch(
            `${apiBase}/api/where/polygons?mode=centroids`,
        );
        if (!isMapAlive(map)) return;
        if (!response.ok) {
            console.error(
                "Failed to fetch polygon centroids:",
                response.status,
            );
            return;
        }
        centroidsData = await response.json();
        if (!isMapAlive(map)) return;
    } catch (err) {
        console.error("Error fetching polygon centroids:", err);
        return;
    }

    const rawFeatures = centroidsData?.features ?? [];
    const centroidFeatures: Feature<Point, GeoJsonProperties>[] =
        rawFeatures.filter((f) => {
            const coords = f.geometry?.coordinates;
            return (
                Array.isArray(coords) &&
                coords.length === 2 &&
                Number.isFinite(coords[0]) &&
                Number.isFinite(coords[1]) &&
                Math.abs(coords[0]) >= 1 &&
                Math.abs(coords[1]) >= 1
            );
        });

    console.log(
        `📍 Loaded ${centroidFeatures.length} polygon centroids (lightweight)`,
    );

    const centroidCollection: FeatureCollection<Point, GeoJsonProperties> = {
        type: "FeatureCollection",
        features: centroidFeatures,
    };

    // ─── Phase 2b: lazy loader for full polygon geometries ──────────────────
    let fullPolygonsLoaded = false;
    let fullPolygonsInflight: Promise<void> | null = null;

    async function ensureFullPolygons(): Promise<void> {
        if (fullPolygonsLoaded) return;
        if (fullPolygonsInflight) return fullPolygonsInflight;

        fullPolygonsInflight = (async () => {
            try {
                console.log("🔄 Fetching full polygon geometries...");
                const response = await fetch(`${apiBase}/api/where/polygons`);
                if (!isMapAlive(map)) return;
                if (!response.ok) {
                    console.error(
                        "Failed to fetch polygon geometries:",
                        response.status,
                    );
                    return;
                }

                const polygonData = await response.json();
                if (!isMapAlive(map)) return;
                const allFeatures = polygonData.features ?? [];
                const withGeometry = allFeatures.filter(
                    (f: { geometry: unknown }) => f.geometry !== null,
                );

                console.log(
                    `🔷 Adding ${withGeometry.length} polygon shapes (${
                        allFeatures.length - withGeometry.length
                    } deferred as large)`,
                );

                if (withGeometry.length === 0) return;

                const polygonFC: FeatureCollection = {
                    type: "FeatureCollection",
                    features: withGeometry,
                };

                if (!map.getSource("polygons")) {
                    map.addSource("polygons", {
                        type: "geojson",
                        data: polygonFC,
                    });

                    // Insert polygon layers BELOW the cluster visualization
                    // so the gold glow + white ring aren't tinted purple by
                    // the polygon fill. Dogs (DOM markers) stay on top via
                    // HTML layering.
                    const beforeId = map.getLayer("hero-marker-cluster-glow")
                        ? "hero-marker-cluster-glow"
                        : undefined;

                    map.addLayer(
                        {
                            id: "polygons-fill",
                            type: "fill",
                            source: "polygons",
                            minzoom: MAP_CONFIG.polygons.minZoom,
                            paint: {
                                "fill-color": MAP_CONFIG.polygons.fillColor,
                                "fill-opacity": MAP_CONFIG.polygons.fillOpacity,
                            },
                        },
                        beforeId,
                    );

                    map.addLayer(
                        {
                            id: "polygons-outline",
                            type: "line",
                            source: "polygons",
                            minzoom: MAP_CONFIG.polygons.minZoom,
                            paint: {
                                "line-color": MAP_CONFIG.polygons.outlineColor,
                                "line-width": MAP_CONFIG.polygons.outlineWidth,
                            },
                        },
                        beforeId,
                    );

                    if (!options.compact) {
                        map.on("click", "polygons-fill", (e) => {
                            const features = map.queryRenderedFeatures(
                                e.point,
                                { layers: ["polygons-fill"] },
                            );
                            if (features.length === 0) return;

                            const feature = features[0];
                            const properties = feature.properties;
                            if (!properties) return;

                            let coordinates: [number, number];
                            if (
                                properties.centroid &&
                                typeof properties.centroid === "object" &&
                                "coordinates" in properties.centroid
                            ) {
                                coordinates = (
                                    properties.centroid as {
                                        coordinates: [number, number];
                                    }
                                ).coordinates;
                            } else {
                                coordinates = e.lngLat.toArray() as [
                                    number,
                                    number,
                                ];
                            }

                            map.flyTo({
                                center: coordinates,
                                zoom: MAP_CONFIG.cluster.clickZoom,
                                essential: true,
                            });

                            options.onFeatureSelect?.(properties);
                        });

                        map.on("mouseenter", "polygons-fill", () => {
                            map.getCanvas().style.cursor = "pointer";
                        });

                        map.on("mouseleave", "polygons-fill", () => {
                            map.getCanvas().style.cursor = "";
                        });
                    }
                } else {
                    (
                        map.getSource("polygons") as mapboxgl.GeoJSONSource
                    ).setData(polygonFC);
                }

                fullPolygonsLoaded = true;
            } catch (err) {
                console.error("Error fetching polygon geometries:", err);
            } finally {
                fullPolygonsInflight = null;
            }
        })();

        return fullPolygonsInflight;
    }

    // Start loading when zoom approaches the threshold (one step early so the
    // fetch is usually complete by the time fills would be visible).
    const loadTriggerZoom = Math.max(MAP_CONFIG.polygons.minZoom - 1, 4);
    function maybeLoadOnZoom() {
        if (map.getZoom() >= loadTriggerZoom) {
            ensureFullPolygons();
        }
    }
    map.on("zoomend", maybeLoadOnZoom);
    maybeLoadOnZoom();

    // ─── Clustered pins from centroid source ────────────────────────────────
    const pinConfig: ClusteredPinsConfig = {
        id: "hero-marker",
        data: centroidCollection,
        maxZoom: undefined,
        pointColor: "#11b4da",
        markerUrl: options.markerUrl,
        onPointClick: async (feature) => {
            if (options.compact) return;

            const coordinates = (
                feature.geometry as GeoJSON.Point
            ).coordinates.slice() as [number, number];
            const properties = feature.properties;
            if (!properties) return;

            map.flyTo({
                center: coordinates,
                zoom: MAP_CONFIG.cluster.clickZoom,
                essential: true,
            });

            // Large polygons: make sure the polygons source exists, then fetch
            // the single feature and inject it.
            const polygonId = properties.polygonId as string | undefined;
            if (
                properties.isLargePolygon &&
                polygonId &&
                !loadedLargePolygons.has(polygonId)
            ) {
                try {
                    await ensureFullPolygons();
                    if (!isMapAlive(map)) return;
                    const response = await fetch(
                        `${apiBase}/api/where/polygons?id=${encodeURIComponent(polygonId)}`,
                    );
                    if (!isMapAlive(map)) return;
                    if (response.ok) {
                        const featureData = (await response.json()) as Feature<
                            Polygon | MultiPolygon,
                            GeoJsonProperties
                        >;
                        if (!isMapAlive(map)) return;
                        if (featureData.geometry) {
                            const source = map.getSource("polygons") as
                                | mapboxgl.GeoJSONSource
                                | undefined;
                            if (source) {
                                const currentData = (
                                    source as unknown as {
                                        _data: FeatureCollection;
                                    }
                                )._data;
                                currentData.features.push(featureData);
                                source.setData(currentData);
                                loadedLargePolygons.add(polygonId);
                                console.log(
                                    `🔷 Loaded large polygon on demand: ${properties.landName ?? polygonId}`,
                                );
                            }
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch large polygon:", err);
                }
            }

            options.onFeatureSelect?.(properties);
        },
    };

    addClusteredPins(map, pinConfig);
    console.log("✅ Polygon centroid markers added (clustered)");
}
