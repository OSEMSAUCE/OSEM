import mapboxgl from 'mapbox-gl';

export interface OrgPinConfig {
	id: string;
	data: any[]; // The list of organizations
	onPinClick: (orgId: string) => void;
}

export async function addOrgPins(map: mapboxgl.Map, config: OrgPinConfig): Promise<void> {
	const { id, data, onPinClick } = config;

	console.log('📍 Adding Org Pins...');
	console.log('📍 Org data received:', data.length, 'organizations');
	console.log('📍 Sample org:', data[0]);

	// Convert data to GeoJSON
	// Filter out organizations with missing GPS OR Null Island coordinates (0,0)
	const orgsWithValidGps = data.filter((org) => {
		const lat = Number(org.gpsLat);
		const lon = Number(org.gpsLon);
		// Exclude if null/undefined, or if within 1 degree of Null Island (0,0)
		return org.gpsLat && org.gpsLon && Math.abs(lat) >= 1 && Math.abs(lon) >= 1;
	});
	console.log('📍 Orgs with valid GPS:', orgsWithValidGps.length, `(filtered ${data.length - orgsWithValidGps.length} Null Island coords)`);

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

	const geojson = {
		type: 'FeatureCollection',
		features
	};

	// Add Source with Clustering
	map.addSource(id, {
		type: 'geojson',
		data: geojson as any,
		cluster: true,
		clusterMaxZoom: 14, // Max zoom to cluster points on
		clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
	});

	// Layer: Clusters (Circles)
	map.addLayer({
		id: `${id}-clusters`,
		type: 'circle',
		source: id,
		filter: ['has', 'point_count'],
		paint: {
			'circle-color': [
				'step',
				['get', 'point_count'],
				'#51bbd6', // Blue for small clusters
				10,
				'#f1f075', // Yellow for medium
				50,
				'#f28cb1' // Pink for large
			],
			'circle-radius': [
				'step',
				['get', 'point_count'],
				20, // Radius 20px
				10,
				30, // Radius 30px
				50,
				40 // Radius 40px
			]
		}
	});

	// Layer: Cluster Counts (Text)
	map.addLayer({
		id: `${id}-cluster-count`,
		type: 'symbol',
		source: id,
		filter: ['has', 'point_count'],
		layout: {
			'text-field': '{point_count_abbreviated}',
			'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
			'text-size': 12
		}
	});

	// Layer: Unclustered Points (Individual Pins)
	map.addLayer({
		id: `${id}-unclustered-point`,
		type: 'circle',
		source: id,
		filter: ['!', ['has', 'point_count']],
		paint: {
			'circle-color': '#11b4da',
			'circle-radius': 8,
			'circle-stroke-width': 1,
			'circle-stroke-color': '#fff'
		}
	});

	// Interaction: Click on Cluster -> Zoom
	map.on('click', `${id}-clusters`, (e) => {
		const features = map.queryRenderedFeatures(e.point, {
			layers: [`${id}-clusters`]
		});
		const clusterId = features[0].properties?.cluster_id;
		(map.getSource(id) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
			clusterId,
			(err, zoom) => {
				if (err) return;

				map.easeTo({
					center: (features[0].geometry as any).coordinates,
					zoom: zoom
				});
			}
		);
	});

	// Interaction: Click on Pin -> Callback (Navigate or Open Modal)
	map.on('click', `${id}-unclustered-point`, (e) => {
		if (!e.features || e.features.length === 0) return;
		const feature = e.features[0];
		const orgId = feature.properties?.id;

		// Show tooltip first? Or just navigate?
		// For now, let's just trigger the callback
		if (orgId) {
			onPinClick(orgId);
		}

		// Optional: Add a popup
		const coordinates = (feature.geometry as any).coordinates.slice();
		const name = feature.properties?.name;
		const website = feature.properties?.website;

		new mapboxgl.Popup()
			.setLngLat(coordinates)
			.setHTML(`<strong>${name}</strong><br>${website || ''}`)
			.addTo(map);
	});

	// Cursor pointer
	map.on('mouseenter', `${id}-clusters`, () => {
		map.getCanvas().style.cursor = 'pointer';
	});
	map.on('mouseleave', `${id}-clusters`, () => {
		map.getCanvas().style.cursor = '';
	});
	map.on('mouseenter', `${id}-unclustered-point`, () => {
		map.getCanvas().style.cursor = 'pointer';
	});
	map.on('mouseleave', `${id}-unclustered-point`, () => {
		map.getCanvas().style.cursor = '';
	});

	console.log('✅ Org Pins added');
}
