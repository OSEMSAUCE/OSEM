import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Point,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "$osem/core/config/mapConfig.js";
import { addClusteredPins, type ClusteredPinsConfig } from "./map-marker.ts";
import type { MapOptions } from "./mapTypes";

/**
 * Helper function to add organization markers layer
 */
export async function addOrgMarkersLayer(
    map: mapboxgl.Map,
    options: MapOptions = {},
): Promise<void> {
    try {
        const apiBase = (options.apiBaseUrl ?? "").replace(/\/$/, "");
        // Fetch organizations from API (returns GeoJSON FeatureCollection)
        const response = await fetch(`${apiBase}/apiEndpoints/who/organizations`);
        if (!response.ok) {
            console.error("Failed to fetch organization markers:", response.status);
            return;
        }

        const orgData = await response.json();

        // Create pins from organization centroids
        const markers = (orgData.features || [])
            .map(
                (feature: {
                    id: string;
                    geometry: { type: string; coordinates: [number, number] };
                    properties: Record<string, unknown>;
                }) => {
                    const coords = feature.geometry?.coordinates;
                    if (!coords || coords.length < 2) return null;

                    return {
                        type: "Feature",
                        geometry: { type: "Point", coordinates: coords },
                        properties: {
                            organizationKey: feature.id,
                            organizationName: feature.properties?.organizationName,
                            address: feature.properties?.address,
                            website: feature.properties?.website,
                            primaryStakeholderCategory: feature.properties?.primaryStakeholderCategory,
                            scoreRankOverall: feature.properties?.scoreRankOverall,
                            scoreOrgFinal: feature.properties?.scoreOrgFinal,
                            organizationDesc: feature.properties?.organizationDesc,
                        },
                    } satisfies Feature<Point, GeoJsonProperties>;
                },
            )
            .filter(
                (
                    marker: Feature<Point, GeoJsonProperties> | null,
                ): marker is Feature<Point, GeoJsonProperties> => {
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

        const sourceKey = "org-markers";

        console.log(`🏢 Loaded ${geojson.features.length} organization markers`);

        const pinConfig: ClusteredPinsConfig = {
            id: sourceKey,
            data: geojson,
            maxZoom: undefined,
            pointColor: "#9333ea", // Purple for organizations
            markerUrl: options.markerUrl,
            onPointClick: (feature) => {
                if (!options.compact) {
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

                    options.onFeatureSelect?.(properties);
                }
            },
        };

        addClusteredPins(map, pinConfig);
        console.log(
            "✅ Organization markers layer added successfully",
        );
    } catch (error) {
        console.error("Error adding organization markers layer:", error);
    }
}
