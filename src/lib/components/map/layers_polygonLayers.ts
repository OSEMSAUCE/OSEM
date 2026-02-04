import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Point,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import { PUBLIC_API_URL } from "$env/static/public";
import { MAP_CONFIG } from "../../config/mapConfig";
import {
    addClusteredPins,
    type ClusteredPinsConfig,
} from "./layers_clusteredPins";
import type { MapOptions } from "./types";

/**
 * Helper function to add markers layer for polygons
 */
export async function addMarkersLayer(
    map: mapboxgl.Map,
    options: MapOptions = {},
): Promise<void> {
    try {
        const apiBase = options.apiBaseUrl || PUBLIC_API_URL.replace(/\/$/, "");
        if (!apiBase) {
            throw new Error(
                "Missing apiBaseUrl. Refusing to fetch /api/where/polygons without an explicit API base. Set PUBLIC_API_URL in the environment and pass it into initializeMap().",
            );
        }
        // Fetch polygons from public API (returns GeoJSON FeatureCollection)
        const response = await fetch(`${apiBase}/api/where/polygons`);
        if (!response.ok) {
            console.error("Failed to fetch polygon markers:", response.status);
            return;
        }

        const polygonData = await response.json();

        // Add polygon shapes to map FIRST
        if (polygonData.features && polygonData.features.length > 0) {
            console.log(
                `🔷 Adding ${polygonData.features.length} polygon shapes to map`,
            );

            map.addSource("polygons", { type: "geojson", data: polygonData });

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

        // Then create pins from stored centroids (much faster!)
        const markers = (polygonData.features || [])
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
                            projectId: feature.properties?.projectId,
                            projectName: feature.properties?.projectName,
                            organizationLocalName:
                                feature.properties?.organizationLocalName,
                            hectaresCalc: feature.properties?.hectaresCalc,
                            polygonNotes: feature.properties?.polygonNotes,
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

        const sourceId = "hero-markers";

        console.log(`📍 Loaded ${geojson.features.length} polygon markers`);

        const pinConfig: ClusteredPinsConfig = {
            id: sourceId,
            data: geojson,
            maxZoom: undefined, // Keep pins visible at all zoom levels
            pointColor: "#11b4da",
            markerUrl: options.markerUrl,
            onPointClick: (feature) => {
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
