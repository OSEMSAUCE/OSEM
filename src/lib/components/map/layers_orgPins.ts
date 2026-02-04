import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import mapboxgl from "mapbox-gl";
import { addClusteredPins, type ClusteredPinsConfig } from "./layers_clusteredPins";

export interface OrgPinConfig {
	id: string;
	data: OrganizationData[]; // The list of organizations
	onPinClick?: (orgId: string) => void;
}

interface OrganizationData {
	organizationLocalId?: string;
	id?: string;
	organizationLocalName?: string;
	displayName?: string;
	organizationLocalAddress?: string;
	address?: string;
	organizationLocalWebsite?: string;
	displayWebsite?: string;
	website?: string;
	claimCount?: number;
	gpsLat?: string | number;
	gpsLon?: string | number;
}

export async function addOrgPins(map: mapboxgl.Map, config: OrgPinConfig): Promise<void> {
	const { id, data, onPinClick } = config;

	// Convert data to GeoJSON
	// Filter out organizations with missing GPS OR Null Island coordinates (0,0)
	const orgsWithValidGps = data.filter((org) => {
		const lat = Number(org.gpsLat);
		const lon = Number(org.gpsLon);
		// Exclude if null/undefined, or if within 1 degree of Null Island (0,0)
		return org.gpsLat && org.gpsLon && Math.abs(lat) >= 1 && Math.abs(lon) >= 1;
	});

	const features = orgsWithValidGps.map((org) => ({
		type: "Feature",
		properties: {
			id: org.organizationLocalId || org.id,
			name: org.organizationLocalName || org.displayName,
			address: org.organizationLocalAddress || org.address,
			website: org.organizationLocalWebsite || org.displayWebsite || org.website,
			claimCount: org.claimCount,
		},
		geometry: {
			type: "Point",
			coordinates: [Number(org.gpsLon), Number(org.gpsLat)],
		},
	}));

	const geojson: FeatureCollection<Geometry, GeoJsonProperties> = {
		type: "FeatureCollection",
		features: features as Feature<Geometry, GeoJsonProperties>[],
	};

	const pinConfig: ClusteredPinsConfig = {
		id: id,
		data: geojson,
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
