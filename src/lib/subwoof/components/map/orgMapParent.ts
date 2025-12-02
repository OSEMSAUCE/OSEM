import mapboxgl from 'mapbox-gl';
import { addOrgPins, type OrgPinConfig } from './mapPlugins/orgPins';

const defaultSatStyle = 'mapbox://styles/mapbox/satellite-streets-v12';

export function initializeOrgMap(
	container: HTMLDivElement,
	orgData: any[],
	onPinClick: (orgId: string) => void
): () => void {
	const mapboxAccessToken = import.meta.env.VITE_MAPBOX_TOKEN;

	if (!mapboxAccessToken) {
		console.error('Mapbox access token is required');
		return () => {};
	}

	mapboxgl.accessToken = mapboxAccessToken;

	const map = new mapboxgl.Map({
		container,
		style: defaultSatStyle,
		center: [0, 20], // Global view
		zoom: 1.5,
		projection: 'globe' // Enable globe projection
	});

	// Add navigation control
	const nc = new mapboxgl.NavigationControl();
	map.addControl(nc, 'top-right');

	map.on('style.load', () => {
		map.setFog({
			color: 'rgb(186, 210, 235)', // Lower atmosphere
			'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
			'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
			'space-color': 'rgb(11, 11, 25)', // Background color
			'star-intensity': 0.6 // Background star brightness (default 0.35 at low zoooms )
		});
	});

	map.on('load', async () => {
		console.log('🗺️ Org Map loaded');

		const pinConfig: OrgPinConfig = {
			id: 'org-pins',
			data: orgData,
			onPinClick
		};

		await addOrgPins(map, pinConfig);
	});

	return () => map.remove();
}
