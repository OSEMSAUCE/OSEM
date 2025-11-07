// drawToolTip - Mapbox GL Draw plugin for drawing and editing features
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type mapboxgl from 'mapbox-gl';
import type { Feature, Polygon } from 'geojson';

interface DrawEvent {
	type: string;
	features?: Feature[];
}

/**
 * Adds Mapbox GL Draw controls to the map for drawing and editing features
 */
export function addDrawControls(map: mapboxgl.Map): MapboxDraw {
	// Initialize the draw control
	const draw = new MapboxDraw({
		displayControlsDefault: false,
		controls: {
			polygon: true,
			line_string: true,
			point: false,
			trash: true
		}
	});

	// Add the draw control to the map
	map.addControl(draw, 'top-left');

	// Listen to draw events
	map.on('draw.create', updateArea);
	map.on('draw.delete', updateArea);
	map.on('draw.update', updateArea);

	function updateArea(e: DrawEvent) {
		const data = draw.getAll();
		console.log('Draw event:', e.type);
		console.log('Current features:', data.features);

		// Calculate area if there are any polygons
		if (data.features.length > 0) {
			const areas = data.features
				.filter((feature: Feature): feature is Feature<Polygon> => feature.geometry.type === 'Polygon')
				.map((feature: Feature<Polygon>) => {
					// Calculate area in square meters (rough approximation)
					const area = calculateArea(feature.geometry.coordinates[0]);
					return {
						id: feature.id,
						area: (area / 1000000).toFixed(2) + ' km²'
					};
				});

			if (areas.length > 0) {
				console.log('Polygon areas:', areas);
			}
		}
	}

	console.log('Draw controls initialized');
	return draw;
}

/**
 * Calculate approximate area of a polygon using the Shoelace formula
 * Note: This is a rough approximation and doesn't account for Earth's curvature
 */
function calculateArea(coords: number[][]): number {
	let area = 0;
	const numPoints = coords.length;

	for (let i = 0; i < numPoints - 1; i++) {
		const [x1, y1] = coords[i];
		const [x2, y2] = coords[i + 1];
		area += x1 * y2 - x2 * y1;
	}

	// Convert to square meters (rough approximation: 1 degree ≈ 111km at equator)
	const metersPerDegree = 111000;
	return Math.abs(area / 2) * metersPerDegree * metersPerDegree;
}
