import type { Map } from 'mapbox-gl';
import type { GeorefResult } from './georef';

const IMAGE_SOURCE_ID = 'pdf-overlay';
const RASTER_LAYER_ID = 'pdf-layer';

export function addPdfOverlay(map: Map, georef: GeorefResult): void {
	removePdfOverlay(map);

	if (!georef.mapboxCorners) {
		console.warn('[mapOverlay] georef has no mapboxCorners — cannot position PDF on map');
		return;
	}

	// Mapbox ImageSource coordinates: [topLeft, topRight, bottomRight, bottomLeft] as [lng, lat]
	map.addSource(IMAGE_SOURCE_ID, {
		type: 'image',
		url: georef.imageDataUrl,
		coordinates: georef.mapboxCorners,
	});

	// Insert PDF below draw layers so drawings always appear on top.
	// MapboxDraw doubles each style entry into layerId.cold + layerId.hot, so the
	// actual first draw layer is 'gl-draw-polygon-fill.cold', not 'gl-draw-polygon-fill'.
	const beforeId = map.getLayer('gl-draw-polygon-fill.cold') ? 'gl-draw-polygon-fill.cold' : undefined;
	map.addLayer(
		{
			id: RASTER_LAYER_ID,
			type: 'raster',
			source: IMAGE_SOURCE_ID,
			paint: { 'raster-opacity': 0.85 },
		},
		beforeId,
	);

	// Fit map to PDF bounding box
	const lngs = georef.mapboxCorners.map((c) => c[0]);
	const lats = georef.mapboxCorners.map((c) => c[1]);
	map.fitBounds(
		[
			[Math.min(...lngs), Math.min(...lats)],
			[Math.max(...lngs), Math.max(...lats)],
		],
		{ padding: 60, duration: 800 },
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

export function setPdfOpacity(map: Map, opacity: number): void {
	if (map.getLayer(RASTER_LAYER_ID)) {
		map.setPaintProperty(RASTER_LAYER_ID, 'raster-opacity', opacity);
	}
}
