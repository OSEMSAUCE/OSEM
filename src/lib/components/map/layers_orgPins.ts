import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import mapboxgl from "mapbox-gl";
import { addClusteredPins, type ClusteredPinsConfig } from "./layers_clusteredPins";

export interface OrgPinConfig {
	id: string;
	data: OrganizationData[]; // The list of organizations
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
	const { id, data } = config;

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
			const name = feature.properties?.name;
			const address = feature.properties?.address;
			const website = feature.properties?.website;

			// Show Popup with name as link and address
			const coordinates = (feature.geometry as any).coordinates.slice();
			const popupHtml = `
				<div class="tooltip-container">
					<div class="marker-popup-title">
						<a href="/who/${encodeURIComponent(orgId || "")}" class="tooltip-link">${name || "Unknown Organization"}</a>
					</div>
					${address ? `<div class="marker-popup-subtitle">${address}</div>` : ""}
					${website ? `<div class="marker-popup-subtitle" style="margin-top: 4px;"><a href="${website}" target="_blank" class="tooltip-link" style="font-size: 11px;">${website}</a></div>` : ""}
				</div>
			`;
			new mapboxgl.Popup().setLngLat(coordinates).setHTML(popupHtml).addTo(map);
		},
		pointColor: "#a78bfa", // Purple accent to match theme
	};

	addClusteredPins(map, pinConfig);
	console.log("✅ Org Pins added via shared clusteredPins utility");
}
