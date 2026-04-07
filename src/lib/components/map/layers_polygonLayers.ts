import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Point,
    Polygon,
    MultiPolygon,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { addClusteredPins, type ClusteredPinsConfig } from "./map-marker.ts";
import type { MapOptions } from "./mapTypes";

/** Track which large polygons have been fetched and rendered */
const loadedLargePolygons = new Set<string>();

/**
 * Helper function to add markers layer for polygons
 */
export async function addMarkersLayer(
    map: mapboxgl.Map,
    options: MapOptions = {},
): Promise<void> {
    try {
        const apiBase = (options.apiBaseUrl ?? "").replace(/\/$/, "");
        // Fetch polygons from public API (returns GeoJSON FeatureCollection)
        const response = await fetch(`${apiBase}/apiEndpoints/where/polygons`);
        if (!response.ok) {
            console.error("Failed to fetch polygon markers:", response.status);
            return;
        }

        const polygonData = await response.json();

        // API strips geometry from large polygons (≥1000 ha) — filter to those with geometry
        const allFeatures = polygonData.features ?? [];
        const polygonsWithGeometry = allFeatures.filter(
            (f: { geometry: unknown; properties: Record<string, unknown> }) =>
                f.geometry !== null,
        );
        const largeCount = allFeatures.length - polygonsWithGeometry.length;
        if (largeCount > 0) {
            console.log(
                `⚠️ ${largeCount} large polygon(s) deferred (geometry loads on pin click)`,
            );
        }

        const polygonData_withGeometry = {
            ...polygonData,
            features: polygonsWithGeometry,
        };

        // Add polygon shapes to map FIRST (large polygons load on demand when pin clicked)
        if (polygonsWithGeometry.length > 0) {
            console.log(
                `🔷 Adding ${polygonsWithGeometry.length} polygon shapes to map`,
            );

            map.addSource("polygons", {
                type: "geojson",
                data: polygonData_withGeometry,
            });

            map.addLayer({
                id: "polygons-fill",
                type: "fill",
                source: "polygons",
                paint: {
                    "fill-color": MAP_CONFIG.polygons.fillColor,
                    "fill-opacity": MAP_CONFIG.polygons.fillOpacity,
                },
            });

            map.addLayer({
                id: "polygons-outline",
                type: "line",
                source: "polygons",
                paint: {
                    "line-color": MAP_CONFIG.polygons.outlineColor,
                    "line-width": MAP_CONFIG.polygons.outlineWidth,
                },
            });

            // Add click handler for polygon shapes (only in non-compact mode)
            if (!options.compact) {
                map.on("click", "polygons-fill", (e) => {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: ["polygons-fill"],
                    });

                    if (features.length === 0) return;

                    const feature = features[0];
                    const properties = feature.properties;

                    if (!properties) return;

                    // Use centroid if available, otherwise use click coordinates
                    let coordinates: [number, number];
                    if (
                        properties.centroid &&
                        typeof properties.centroid === "object" &&
                        "coordinates" in properties.centroid
                    ) {
                        const centroidData = properties.centroid as {
                            coordinates: [number, number];
                        };
                        coordinates = centroidData.coordinates;
                    } else {
                        coordinates = e.lngLat.toArray() as [number, number];
                    }

                    // Fly to location and trigger callback
                    map.flyTo({
                        center: coordinates,
                        zoom: MAP_CONFIG.cluster.clickZoom,
                        essential: true,
                    });

                    options.onFeatureSelect?.(properties);
                });

                // Change cursor on hover
                map.on("mouseenter", "polygons-fill", () => {
                    map.getCanvas().style.cursor = "pointer";
                });

                map.on("mouseleave", "polygons-fill", () => {
                    map.getCanvas().style.cursor = "";
                });
            }
        }

        // Then create pins from stored centroids — ALL features including large ones
        const markers = allFeatures
            .map(
                (feature: {
                    id: string;
                    properties: Record<string, unknown>;
                }) => {
                    const props = feature.properties || {};

                    // Use stored centroid from database (GeoJSON Point)
                    let centroid: [number, number] | null = null;
                    if (
                        props.centroid &&
                        typeof props.centroid === "object" &&
                        "coordinates" in props.centroid
                    ) {
                        const centroidData = props.centroid as {
                            coordinates: [number, number];
                        };
                        centroid = centroidData.coordinates;
                    }

                    // If no centroid, we can't create a marker
                    if (!centroid) {
                        console.log("🌏️ No centteroid founnd for ... prop?");
                        return null;
                    }

                    return {
                        type: "Feature",
                        geometry: { type: "Point", coordinates: centroid },
                        properties: {
                            polygonId: feature.id,
                            landName: feature.properties?.landName,
                            projectKey: feature.properties?.projectKey,
                            projectName: feature.properties?.projectName,
                            organizationName:
                                feature.properties?.organizationName,
                            hectaresCalc: feature.properties?.hectaresCalc,
                            polygonNotes: feature.properties?.polygonNotes,
                            isLargePolygon: feature.properties?.isLargePolygon,
                        },
                    } satisfies Feature<Point, GeoJsonProperties>;
                },
            )
            .filter(
                (
                    marker: Feature<Point, GeoJsonProperties> | null,
                ): marker is Feature<Point, GeoJsonProperties> => {
                    // Filter out null markers and validate coordinates
                    if (!marker) return false;
                    const coords = marker.geometry.coordinates;
                    return (
                        Array.isArray(coords) &&
                        coords.length === 2 &&
                        Number.isFinite(coords[0]) &&
                        Number.isFinite(coords[1]) &&
                        Math.abs(coords[0]) >= 1 &&
                        Math.abs(coords[1]) >= 1
                    );
                },
            );

        const geojson: FeatureCollection<Point, GeoJsonProperties> = {
            type: "FeatureCollection",
            features: markers,
        };

        const sourceKey = "hero-marker";

        console.log(`📍 Loaded ${geojson.features.length} polygon markers`);

        const pinConfig: ClusteredPinsConfig = {
            id: sourceKey,
            data: geojson,
            maxZoom: undefined, // Keep pins visible at all zoom levels
            pointColor: "#11b4da",
            markerUrl: options.markerUrl,
            onPointClick: async (feature) => {
                // Only enable click actions in non-compact (full map) mode
                if (!options.compact) {
                    const coordinates = (
                        feature.geometry as GeoJSON.Point
                    ).coordinates.slice() as [number, number];
                    const properties = feature.properties;

                    if (!properties) return;

                    // Fly to the marker location
                    map.flyTo({
                        center: coordinates,
                        zoom: MAP_CONFIG.cluster.clickZoom,
                        essential: true,
                    });

                    // If this is a large polygon, fetch and render its geometry on demand
                    const polygonId = properties.polygonId as
                        | string
                        | undefined;
                    if (
                        properties.isLargePolygon &&
                        polygonId &&
                        !loadedLargePolygons.has(polygonId)
                    ) {
                        try {
                            const response = await fetch(
                                `${apiBase}/apiEndpoints/where/polygons?id=${encodeURIComponent(polygonId)}`,
                            );
                            if (response.ok) {
                                const featureData =
                                    (await response.json()) as Feature<
                                        Polygon | MultiPolygon,
                                        GeoJsonProperties
                                    >;
                                if (featureData.geometry) {
                                    // Add to the existing polygons source
                                    const source = map.getSource("polygons") as
                                        | mapboxgl.GeoJSONSource
                                        | undefined;
                                    if (source) {
                                        const currentData = (source as any)
                                            ._data as FeatureCollection;
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
                            console.error(
                                "Failed to fetch large polygon:",
                                err,
                            );
                        }
                    }

                    options.onFeatureSelect?.(properties);
                }
            },
        };

        addClusteredPins(map, pinConfig);
        console.log(
            "✅ Polygon markers layer added successfully (Clustered via Shared Utility)",
        );
    } catch (error) {
        console.error("Error adding markers layer:", error);
    }
}
