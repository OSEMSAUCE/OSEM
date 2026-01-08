import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

export interface ClusteredPinsConfig {
	id: string;
	data: FeatureCollection<Geometry, GeoJsonProperties>;
	onPointClick?: (feature: mapboxgl.MapboxGeoJSONFeature) => void;
	pointColor?: string;
	clusterRadius?: number;
	maxZoom?: number;
}

/**
 * A reusable function to add clustered pins to a Mapbox map.
 * Used by both "Where" page (Project Polygons) and "Who" page (Organization Pins).
 */
export function addClusteredPins(map: mapboxgl.Map, config: ClusteredPinsConfig): void {
	const { id, data, onPointClick, pointColor = '#11b4da', clusterRadius = 50, maxZoom } = config;

	// Add Source with Clustering
	if (map.getSource(id)) {
		(map.getSource(id) as mapboxgl.GeoJSONSource).setData(data as any);
	} else {
		map.addSource(id, {
			type: 'geojson',
			data: data as any,
			cluster: true,
			clusterMaxZoom: 14,
			clusterRadius: clusterRadius
		});
	}

	// 1. Layer: Clusters (Circles)
	if (!map.getLayer(`${id}-clusters`)) {
		map.addLayer({
			id: `${id}-clusters`,
			type: 'circle',
			source: id,
			filter: ['has', 'point_count'],
			...(maxZoom ? { maxzoom: maxZoom } : {}),
			paint: {
				'circle-color': '#ffffff', // White core
				'circle-radius': 15,
				'circle-stroke-width': 10, // Thick stroke
				'circle-stroke-color': [
					'step',
					['get', 'point_count'],
					'rgba(81, 187, 214, 0.6)', // Transparent Blue
					10,
					'rgba(241, 240, 117, 0.6)', // Transparent Yellow
					50,
					'rgba(242, 140, 177, 0.6)' // Transparent Pink
				]
			}
		});
	}

	// 2. Layer: Cluster Counts (Text)
	if (!map.getLayer(`${id}-cluster-count`)) {
		map.addLayer({
			id: `${id}-cluster-count`,
			type: 'symbol',
			source: id,
			filter: ['has', 'point_count'],
			...(maxZoom ? { maxzoom: maxZoom } : {}),
			layout: {
				'text-field': '{point_count_abbreviated}',
				'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
				'text-size': 12
			}
		});
	}

	// 3. Layer: Unclustered Points (Individual Pins)
	const unclusteredId = `${id}-unclustered-point`;
	if (!map.getLayer(unclusteredId)) {
		map.addLayer({
			id: unclusteredId,
			type: 'circle',
			source: id,
			filter: ['!', ['has', 'point_count']],
			...(maxZoom ? { maxzoom: maxZoom } : {}),
			paint: {
				'circle-color': pointColor,
				'circle-radius': 8,
				'circle-stroke-width': 1,
				'circle-stroke-color': '#fff'
			}
		});
	}

	// Interaction: Click on Cluster -> Zoom
	map.on('click', `${id}-clusters`, (e) => {
		const features = map.queryRenderedFeatures(e.point, {
			layers: [`${id}-clusters`]
		});
		if (features.length === 0) return;
		const clusterId = features[0].properties?.cluster_id;
		if (typeof clusterId !== 'number') return;
		(map.getSource(id) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
			clusterId,
			(err, zoom) => {
				if (err || zoom == null) return;

				const geometry = features[0].geometry;
				if (geometry.type !== 'Point') return;
				const center = geometry.coordinates as [number, number];

				map.easeTo({
					center,
					zoom
				});
			}
		);
	});

	// Interaction: Click on Unclustered Pin -> Callback
	map.on('click', unclusteredId, (e) => {
		if (!e.features || e.features.length === 0) return;
		if (onPointClick) {
			onPointClick(e.features[0]);
		}
	});

	// Cursors
	const layers = [`${id}-clusters`, unclusteredId];
	layers.forEach((layer) => {
		map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
		map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
	});

	console.log(`✅ Clustered pins added for layer: ${id}`);
}
