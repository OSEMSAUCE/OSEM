import type { Map } from 'mapbox-gl';
import type { GeorefResult } from './georef';

const IMAGE_SOURCE_ID = 'pdf-overlay';
const RASTER_LAYER_ID = 'pdf-layer';

export function addPdfOverlay(map: Map, georef: GeorefResult): void {
	removePdfOverlay(map);

	// @ts-ignore – bounds will be re-added when Mapbox overlay is wired up again
	const [[west, south], [east, north]] = (georef as any).bounds;

	// Mapbox ImageSource coordinates: [topLeft, topRight, bottomRight, bottomLeft]
	map.addSource(IMAGE_SOURCE_ID, {
		type: 'image',
		url: georef.imageDataUrl,
		coordinates: [
			[west, north],
			[east, north],
			[east, south],
			[west, south],
		],
	});

	map.addLayer({
		id: RASTER_LAYER_ID,
		type: 'raster',
		source: IMAGE_SOURCE_ID,
		paint: {
			'raster-opacity': 0.85,
		},
	});

	map.fitBounds(
		[
			[west, south],
			[east, north],
		],
		{ padding: 40, duration: 800 },
	);
}

export function removePdfOverlay(map: Map): void {
	if (map.getLayer(RASTER_LAYER_ID)) {
		map.removeLayer(RASTER_LAYER_ID);
	}
	if (map.getSource(IMAGE_SOURCE_ID)) {
		map.removeSource(IMAGE_SOURCE_ID);
	}
}
