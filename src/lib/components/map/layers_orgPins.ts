import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
} from "geojson";
import type mapboxgl from "mapbox-gl";
import { addClusteredPins, type ClusteredPinsConfig } from "./map-marker";

export interface OrgPinConfig {
    id: string;
    data: OrganizationData[]; // The list of organizations
    onPinClick?: (orgId: string) => void;
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

export async function addOrgPins(
    map: mapboxgl.Map,
    config: OrgPinConfig,
): Promise<void> {
    const { id, data, onPinClick, markerUrl } = config;

    // Convert data to GeoJSON
    // Filter out organizations with missing GPS OR Null Island coordinates (0,0)
    const orgsWithValidGps = data.filter((org) => {
        const lat = Number(org.latitude);
        const lon = Number(org.longitude);
        // Exclude if null/undefined, or if within 1 degree of Null Island (0,0)
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

    const pinConfig: ClusteredPinsConfig = {
        id: id,
        data: geojson,
        markerUrl,
        onPointClick: (feature) => {
            const orgId = feature.properties?.id;

            // Call the custom onPinClick callback if provided
            if (onPinClick && orgId) {
                onPinClick(orgId);
            }
        },
        pointColor: "#a78bfa", // Purple accent to match theme
    };

    addClusteredPins(map, pinConfig);
    console.log("✅ Org Pins added via shared clusteredPins utility");
}
