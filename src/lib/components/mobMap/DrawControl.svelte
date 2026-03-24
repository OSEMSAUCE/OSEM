<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Map as MapboxMap } from 'mapbox-gl';
	import mapboxgl from 'mapbox-gl';
	import MapboxDraw from '@mapbox/mapbox-gl-draw';
	import { area, length, centroid, midpoint } from '@turf/turf';
	import type { Feature, Polygon, LineString, Point } from 'geojson';
	import { drawnFeatures } from '../../stores/drawings';

	let { map }: { map: MapboxMap } = $props();

	const draw = new MapboxDraw({
		displayControlsDefault: false,
		controls: {
			polygon: true,
			line_string: true,
			trash: true,
		},
	});

	// Measurement labels keyed by feature id
	const labelMarkers = new Map<string, mapboxgl.Marker>();

	function formatArea(sqMetres: number): string {
		const ha = sqMetres / 10000;
		return ha >= 1 ? `${ha.toFixed(2)} ha` : `${Math.round(sqMetres)} m²`;
	}

	function formatLength(km: number): string {
		return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
	}

	function makeLabel(text: string): HTMLElement {
		const el = document.createElement('div');
		el.className =
			'px-2 py-1 rounded bg-black/75 text-white text-xs font-mono whitespace-nowrap pointer-events-none';
		el.textContent = text;
		return el;
	}

	function removeLabel(id: string) {
		labelMarkers.get(id)?.remove();
		labelMarkers.delete(id);
	}

	function updateLabels() {
		const features = draw.getAll().features as Feature<Polygon | LineString | Point>[];
		drawnFeatures.set(features as Feature[]);

		for (const feat of features) {
			const id = feat.id as string;
			if (!feat.geometry) continue;

			if (feat.geometry.type === 'Polygon') {
				const sqM = area(feat as Feature<Polygon>);
				const c = centroid(feat as Feature<Polygon>);
				const [lng, lat] = (c.geometry as Point).coordinates;
				removeLabel(id);
				const marker = new mapboxgl.Marker({ element: makeLabel(formatArea(sqM)), anchor: 'center' })
					.setLngLat([lng, lat])
					.addTo(map);
				labelMarkers.set(id, marker);
			} else if (feat.geometry.type === 'LineString') {
				const coords = feat.geometry.coordinates;
				if (coords.length < 2) continue;
				const km = length(feat as Feature<LineString>, { units: 'kilometers' });
				const mid = coords[Math.floor(coords.length / 2)] as [number, number];
				removeLabel(id);
				const marker = new mapboxgl.Marker({ element: makeLabel(formatLength(km)), anchor: 'center' })
					.setLngLat(mid)
					.addTo(map);
				labelMarkers.set(id, marker);
			}
		}

		// Remove labels for deleted features
		const activeIds = new Set(features.map((f) => f.id as string));
		for (const [id] of labelMarkers) {
			if (!activeIds.has(id)) removeLabel(id);
		}
	}

	// Mount draw control and bind events
	map.addControl(draw as unknown as mapboxgl.IControl, 'top-right');
	map.on('draw.create', updateLabels);
	map.on('draw.update', updateLabels);
	map.on('draw.delete', updateLabels);

	function clearAll() {
		draw.deleteAll();
		for (const [id] of labelMarkers) removeLabel(id);
		drawnFeatures.set([]);
	}

	onDestroy(() => {
		map.off('draw.create', updateLabels);
		map.off('draw.update', updateLabels);
		map.off('draw.delete', updateLabels);
		for (const [id] of labelMarkers) removeLabel(id);
		try {
			map.removeControl(draw as unknown as mapboxgl.IControl);
		} catch {
			// ignore if already removed
		}
	});
</script>

<!-- Clear drawings button — only visible when there are features -->
{#if $drawnFeatures.length > 0}
	<button
		onclick={clearAll}
		class="absolute top-16 right-3 z-10 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-medium shadow-lg backdrop-blur-sm active:scale-95 transition-transform"
	>
		Clear drawings
	</button>
{/if}
