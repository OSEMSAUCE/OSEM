// Slider toggle things.
import type mapboxgl from 'mapbox-gl';
import type { PolygonConfig } from '../mapParent';
import OpacityControl from 'mapbox-gl-opacity';

function setupOpacityControl(map: mapboxgl.Map, polygons: PolygonConfig[]): void {
	// Configure OpacityControl with all layers
	const mapOverLayer: { [key: string]: string } = {};
	polygons.forEach((p) => {
		mapOverLayer[`${p.id}-fill`] = p.name;
	});

	try {
		// First, ensure all layers are visible
		polygons.forEach((p) => {
			const fillLayerId = `${p.id}-fill`;
			if (map.getLayer(fillLayerId)) {
				map.setLayoutProperty(fillLayerId, 'visibility', 'visible');
			}
		});

		// Create the opacity control with all layers initially visible
		const opacityControl = new OpacityControl({
			overLayers: mapOverLayer,
			opacityControl: true
		});
		map.addControl(opacityControl, 'top-right');

		// After adding the control, find and check all checkboxes
		setTimeout(() => {
			const opacityControlElement = document.getElementById('opacity-control');
			if (opacityControlElement) {
				const checkboxes = opacityControlElement.querySelectorAll('input[type="checkbox"]');
				checkboxes.forEach((checkbox) => {
					(checkbox as HTMLInputElement).checked = true;
					// Trigger a change event to ensure the control updates
					const event = new Event('change', { bubbles: true });
					checkbox.dispatchEvent(event);
				});
			}
		}, 100); // Small delay to ensure the control is in the DOM

		console.log('OpacityControl added successfully with combined layers.');
	} catch (e) {
		console.error('Failed to add OpacityControl:', e);
	}
}

function syncOutlineLayers(map: mapboxgl.Map, polygons: PolygonConfig[]): void {
	// Listen for changes and sync outline layers
	map.on('styledata', () => {
		polygons.forEach((p) => {
			const fillLayerId = `${p.id}-fill`;
			const outlineLayerId = `${p.id}-outline`;

			// Ensure both layers exist before trying to sync them
			if (map.getLayer(fillLayerId) && map.getLayer(outlineLayerId)) {
				const fillVisibility = map.getLayoutProperty(fillLayerId, 'visibility');

				// Force the outline to match the fill's visibility but keep full opacity
				map.setPaintProperty(outlineLayerId, 'line-opacity', 1); // Always fully opaque
				map.setLayoutProperty(outlineLayerId, 'visibility', fillVisibility);
			}
		});
	});
}

/**
 * Adds polygon toggle functionality to the map
 */
export function addPolygonToggle(map: mapboxgl.Map, polygons: PolygonConfig[]): void {
	// Setup opacity control for polygon layers
	setupOpacityControl(map, polygons);

	// Sync outline layers with fill visibility
	syncOutlineLayers(map, polygons);

	console.log('Polygon toggle plugin initialized for:', polygons.map((p) => p.name).join(', '));
}