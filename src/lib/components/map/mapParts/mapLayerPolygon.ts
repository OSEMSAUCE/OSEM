import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import mapboxglRuntime from "mapbox-gl";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import {
    addClusteredPins,
    isMapAlive,
    type ClusteredPinsConfig,
} from "./mapMarker";
import type { MapOptions } from "./mapTypes";
import { safeFlyTo } from "./safeMap";

const PREVIEW_SOURCE_ID = "large-polygon-preview";
const PREVIEW_FILL_LAYER = "large-polygon-preview-fill";
const PREVIEW_OUTLINE_LAYER = "large-polygon-preview-outline";

// Thresholds mirrored from the API for display in popups.
const LARGE_POLYGON_HA = 1_000;
const ABSOLUTE_CAP_HA = 50_000;

function emptyFC(): FeatureCollection {
    return { type: "FeatureCollection", features: [] };
}

/** Show a small popup under the dog explaining why no polygon renders. */
function showLargePolygonPopup(
    map: mapboxgl.Map,
    lngLat: [number, number],
    hectares: number | null,
    isAbsolute: boolean,
): void {
    const limit = isAbsolute
        ? ABSOLUTE_CAP_HA.toLocaleString()
        : LARGE_POLYGON_HA.toLocaleString();
    const ha =
        hectares !== null ? Math.round(hectares).toLocaleString() : "unknown";

    new mapboxglRuntime.Popup({
        closeButton: false,
        closeOnClick: true,
        anchor: "top",
        offset: 8,
        className: "large-poly-popup",
    })
        .setLngLat(lngLat)
        .setHTML(
            `<div style="
                background:#1a1a1a;
                border:1px solid #555;
                border-radius:0.5rem;
                padding:0.75rem 1rem;
                max-width:220px;
                box-shadow:-0.25rem 0 1rem rgba(0,0,0,0.3);
            ">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                    <span style="color:#9ca3af;font-size:0.8rem;">Hectares:</span>
                    <span style="color:#e5e7eb;font-size:0.8rem;">${ha}</span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:#9ca3af;font-size:0.8rem;">Limit:</span>
                    <span style="color:#e5e7eb;font-size:0.8rem;">${limit} ha</span>
                </div>
                <p style="color:#d4d4d8;font-size:0.75rem;margin:0.5rem 0 0;line-height:1.3;border-top:1px solid #444;padding-top:0.4rem;">
                    Polygon exceeds limit. Not meaningful restoration data.
                </p>
            </div>`,
        )
        .addTo(map);
}

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

                            safeFlyTo(map, {
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

            safeFlyTo(map, {
                center: coordinates,
                zoom: MAP_CONFIG.cluster.clickZoom,
                essential: true,
            });

            const polygonId = properties.polygonId as string | undefined;

            // Absolute cap: polygon is too big to render. Dog + popup.
            if (properties.isAbsoluteTooLarge) {
                showLargePolygonPopup(
                    map,
                    coordinates,
                    properties.hectaresCalc as number | null,
                    true,
                );
                options.onFeatureSelect?.(properties);
                return;
            }

            // Large polygon (between LARGE_POLYGON_HECTARES and the absolute
            // cap): render as a transient preview. Replaces any previously
            // shown preview; cleared when the user clicks empty canvas.
            if (properties.isLargePolygon && polygonId) {
                try {
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
                            const previewSource = map.getSource(
                                PREVIEW_SOURCE_ID,
                            ) as mapboxgl.GeoJSONSource | undefined;
                            if (previewSource) {
                                previewSource.setData({
                                    type: "FeatureCollection",
                                    features: [featureData],
                                });
                                console.log(
                                    `🔷 Previewing large polygon: ${properties.landName ?? polygonId}`,
                                );
                            }
                        }
                    } else if (response.status === 413) {
                        // Backend enforced the absolute cap; show popup.
                        showLargePolygonPopup(
                            map,
                            coordinates,
                            properties.hectaresCalc as number | null,
                            true,
                        );
                    }
                } catch (err) {
                    console.error("Failed to fetch large polygon:", err);
                }
            }

            options.onFeatureSelect?.(properties);
        },
    };

    addClusteredPins(map, pinConfig);

    // ─── Large-polygon preview source + layers ──────────────────────────────
    // Transient: shows a single large polygon when its centroid is clicked,
    // clears when the user clicks empty canvas.
    if (!map.getSource(PREVIEW_SOURCE_ID)) {
        map.addSource(PREVIEW_SOURCE_ID, {
            type: "geojson",
            data: emptyFC(),
        });

        const beforeId = map.getLayer("hero-marker-cluster-glow")
            ? "hero-marker-cluster-glow"
            : undefined;

        map.addLayer(
            {
                id: PREVIEW_FILL_LAYER,
                type: "fill",
                source: PREVIEW_SOURCE_ID,
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
                id: PREVIEW_OUTLINE_LAYER,
                type: "line",
                source: PREVIEW_SOURCE_ID,
                minzoom: MAP_CONFIG.polygons.minZoom,
                paint: {
                    "line-color": MAP_CONFIG.polygons.outlineColor,
                    "line-width": MAP_CONFIG.polygons.outlineWidth,
                },
            },
            beforeId,
        );
    }

    // Dismiss the preview on clicks outside any interactive feature.
    // Canvas clicks that land on a polygon fill or cluster leave the preview
    // intact; DOM dog clicks never fire this because they don't bubble to the
    // canvas. Only truly empty-canvas clicks clear the preview.
    if (!(map as unknown as Record<string, unknown>).__previewDismissBound) {
        (map as unknown as Record<string, unknown>).__previewDismissBound =
            true;
        map.on("click", (e) => {
            const interactiveLayers = [
                PREVIEW_FILL_LAYER,
                "polygons-fill",
                "hero-marker-clusters",
            ].filter((id) => map.getLayer(id));
            if (interactiveLayers.length === 0) return;
            const hits = map.queryRenderedFeatures(e.point, {
                layers: interactiveLayers,
            });
            if (hits.length > 0) return;
            const src = map.getSource(PREVIEW_SOURCE_ID) as
                | mapboxgl.GeoJSONSource
                | undefined;
            if (src) src.setData(emptyFC());
        });
    }

    console.log("✅ Polygon centroid markers added (clustered)");
}
