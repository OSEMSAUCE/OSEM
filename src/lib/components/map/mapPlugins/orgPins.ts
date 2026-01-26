import mapboxgl from 'mapbox-gl';
import { addClusteredPins, type ClusteredPinsConfig } from './clusteredPins';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

export interface OrgPinConfig {
	id: string;
	data: any[]; // The list of organizations
	onPinClick: (orgId: string) => void;
}

export async function addOrgPins(map: mapboxgl.Map, config: OrgPinConfig): Promise<void> {
	const { id, data, onPinClick } = config;

	console.log('📍 Adding Org Pins...');
	console.log('📍 Org data received:', data.length, 'organizations');

	// Convert data to GeoJSON
	// Filter out organizations with missing GPS OR Null Island coordinates (0,0)
	const orgsWithValidGps = data.filter((org) => {
		const lat = Number(org.gpsLat);
		const lon = Number(org.gpsLon);
		// Exclude if null/undefined, or if within 1 degree of Null Island (0,0)
		return org.gpsLat && org.gpsLon && Math.abs(lat) >= 1 && Math.abs(lon) >= 1;
	});
	console.log(
		'📍 Orgs with valid GPS:',
		orgsWithValidGps.length,
		`(filtered ${data.length - orgsWithValidGps.length} Null Island coords)`
	);

	const features = orgsWithValidGps.map((org) => ({
		type: 'Feature',
		properties: {
			id: org.id,
			name: org.displayName,
			website: org.displayWebsite,
			claimCount: org.claimCount
		},
		geometry: {
			type: 'Point',
			coordinates: [Number(org.gpsLon), Number(org.gpsLat)]
		}
	}));

	const geojson: FeatureCollection<Geometry, GeoJsonProperties> = {
		type: 'FeatureCollection',
		features: features as any
	};

	const pinConfig: ClusteredPinsConfig = {
		id: id,
		data: geojson,
		onPointClick: (feature) => {
			const orgId = feature.properties?.id;
			const name = feature.properties?.name;
			const website = feature.properties?.website;

			// Trigger navigation callback
			if (orgId) {
				onPinClick(orgId);
			}

			// Show Popup
			const coordinates = (feature.geometry as any).coordinates.slice();
			new mapboxgl.Popup()
				.setLngLat(coordinates)
				.setHTML(`<strong>${name}</strong><br>${website || ''}`)
				.addTo(map);
		},
		pointColor: '#11b4da', // Match original orgPins color
		clusterRadius: 50
	};

	addClusteredPins(map, pinConfig);
	console.log('✅ Org Pins added via shared clusteredPins utility');
}
