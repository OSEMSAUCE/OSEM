/**
 * SubWoof Map API Client
 *
 * Shared API client for map polygon data access.
 * Used by both ReTreever (private) and OSEM (public).
 * RLS on the server controls data access.
 */

export interface PolygonData {
  polygonId: string;
  landId: string;
  landName: string;
  polygonNotes: string | null;
  coordinates: string; // JSON string of coordinate arrays
  type: string | null;
  lastEditedAt: Date | null;
  landTable?: {
    projectId: string;
    gpsLat: number | null;
    gpsLon: number | null;
  };
}

/**
 * Fetch polygon data for map display
 *
 * @param apiUrl - Base URL of the API server (e.g., 'http://localhost:3001')
 * @returns Array of polygon data with coordinates and metadata
 */
export async function fetchMapPolygons(apiUrl: string): Promise<PolygonData[]> {
  try {
    const url = new URL("/api/map/polygons", apiUrl);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data: PolygonData[] = await response.json();
    return data;
  } catch (error) {
    console.error("Map polygons API fetch error:", error);
    return [];
  }
}

/**
 * Transform polygon data to GeoJSON format for Mapbox
 *
 * @param polygons - Array of polygon data from API
 * @returns GeoJSON FeatureCollection
 */
export function polygonsToGeoJSON(polygons: PolygonData[]) {
  return {
    type: "FeatureCollection" as const,
    features: polygons.map((polygon) => {
      let coordinates;
      try {
        coordinates = polygon.coordinates
          ? JSON.parse(polygon.coordinates)
          : [];
      } catch {
        coordinates = [];
      }

      return {
        type: "Feature" as const,
        id: polygon.polygonId,
        geometry: {
          type: (polygon.type || "Polygon") as "Polygon",
          coordinates: coordinates,
        },
        properties: {
          polygonId: polygon.polygonId,
          landId: polygon.landId,
          landName: polygon.landName,
          polygonNotes: polygon.polygonNotes,
          lastEditedAt: polygon.lastEditedAt,
        },
      };
    }),
  };
}
