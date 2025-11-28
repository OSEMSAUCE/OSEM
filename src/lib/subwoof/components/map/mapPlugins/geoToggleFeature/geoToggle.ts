// Geographic layer toggle control with tooltips and lazy loading
import type mapboxgl from 'mapbox-gl';
import type { PolygonConfig } from '../../mapParent';
import { loadGeographicLayer } from './geographicLayers';

class GeoLayerToggleControl {
	private map: mapboxgl.Map | undefined;
	private container: HTMLDivElement | undefined;
	private geoLayers: PolygonConfig[];
	private loadingLayers: Set<string> = new Set(); // Track layers currently being loaded

	constructor(geoLayers: PolygonConfig[]) {
		this.geoLayers = geoLayers;
	}

	onAdd(map: mapboxgl.Map): HTMLElement {
		this.map = map;
		this.container = document.createElement('div');
		this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this.container.style.background = 'white';
		this.container.style.borderRadius = '4px';
		this.container.style.padding = '8px';
		this.container.style.marginBottom = '10px';

		this.geoLayers.forEach((polygon) => {
			const wrapper = document.createElement('div');
			wrapper.style.display = 'flex';
			wrapper.style.alignItems = 'center';
			wrapper.style.marginBottom = '6px';
			wrapper.style.position = 'relative';
			wrapper.style.cursor = 'pointer';

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.id = `toggle-${polygon.id}`;
			checkbox.checked = polygon.initiallyVisible !== false;
			checkbox.style.cursor = 'pointer';
			checkbox.style.marginRight = '6px';

			const label = document.createElement('label');
			label.htmlFor = `toggle-${polygon.id}`;
			label.textContent = polygon.name;
			label.style.cursor = 'pointer';
			label.style.fontSize = '12px';
			label.style.userSelect = 'none';
			label.style.color = 'black';

			// Create tooltip
			const tooltip = document.createElement('div');
			tooltip.textContent = `Toggle ${polygon.name} layer`;
			tooltip.style.position = 'absolute';
			tooltip.style.left = '-10px';
			tooltip.style.transform = 'translateX(-100%)';
			tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
			tooltip.style.color = 'white';
			tooltip.style.padding = '4px 8px';
			tooltip.style.borderRadius = '4px';
			tooltip.style.fontSize = '11px';
			tooltip.style.whiteSpace = 'nowrap';
			tooltip.style.pointerEvents = 'none';
			tooltip.style.opacity = '0';
			tooltip.style.transition = 'opacity 0.2s';
			tooltip.style.zIndex = '1000';

			// Show/hide tooltip on hover
			wrapper.addEventListener('mouseenter', () => {
				tooltip.style.opacity = '1';
			});
			wrapper.addEventListener('mouseleave', () => {
				tooltip.style.opacity = '0';
			});

			// Toggle layer visibility on checkbox change (with lazy loading)
			checkbox.addEventListener('change', async () => {
				if (checkbox.checked) {
					// User wants to show the layer - load it if not already loaded
					if (!map.getSource(polygon.id) && !this.loadingLayers.has(polygon.id)) {
						// Layer not loaded yet, need to fetch data
						this.loadingLayers.add(polygon.id);
						checkbox.disabled = true;
						label.textContent = `${polygon.name} (loading...)`;

						try {
							await loadGeographicLayer(map, polygon);
							console.log(`✅ ${polygon.name} loaded and visible`);
						} catch (error) {
							console.error(`❌ Failed to load ${polygon.name}:`, error);
							checkbox.checked = false; // Uncheck on error
							alert(`Failed to load ${polygon.name} layer`);
						} finally {
							this.loadingLayers.delete(polygon.id);
							checkbox.disabled = false;
							label.textContent = polygon.name;
						}
					} else {
						// Layer already loaded, just show it
						map.setLayoutProperty(`${polygon.id}-fill`, 'visibility', 'visible');
						map.setLayoutProperty(`${polygon.id}-outline`, 'visibility', 'visible');
					}
				} else {
					// User wants to hide the layer
					if (map.getSource(polygon.id)) {
						map.setLayoutProperty(`${polygon.id}-fill`, 'visibility', 'none');
						map.setLayoutProperty(`${polygon.id}-outline`, 'visibility', 'none');
					}
				}
			});

			wrapper.appendChild(checkbox);
			wrapper.appendChild(label);
			wrapper.appendChild(tooltip);
			this.container?.appendChild(wrapper);
		});

		return this.container;
	}

	onRemove(): void {
		this.container?.parentNode?.removeChild(this.container);
		this.map = undefined;
	}
}

function setupGeoLayerToggleControl(map: mapboxgl.Map, geoLayers: PolygonConfig[]): void {
	const control = new GeoLayerToggleControl(geoLayers);
	map.addControl(control, 'bottom-right');
	console.log('Geographic layer toggle control added successfully.');
}

function syncOutlineLayers(map: mapboxgl.Map, geoLayers: PolygonConfig[]): void {
	// Listen for changes and sync outline layers
	map.on('styledata', () => {
		geoLayers.forEach((p) => {
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
 * Adds geographic layer toggle functionality to the map
 * Only for geographic reference layers, not claim layers
 */
export function addgeoToggle(map: mapboxgl.Map, geoLayers: PolygonConfig[]): void {
	// Setup geographic layer toggle control
	setupGeoLayerToggleControl(map, geoLayers);

	// Sync outline layers with fill visibility
	syncOutlineLayers(map, geoLayers);

	console.log('Geographic layer toggle initialized for:', geoLayers.map((p) => p.name).join(', '));
}
