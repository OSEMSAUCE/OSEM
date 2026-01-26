import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import mapboxgl from "mapbox-gl";

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
	const { id, data, onPointClick, clusterRadius = 50, maxZoom } = config;

	// Add Source with Clustering
	if (map.getSource(id)) {
		(map.getSource(id) as mapboxgl.GeoJSONSource).setData(data as any);
	} else {
		map.addSource(id, {
			type: "geojson",
			data: data as any,
			cluster: true,
			clusterMaxZoom: 14,
			clusterRadius: clusterRadius,
		});
	}

	// 1. Layer: Clusters (Circles)
	if (!map.getLayer(`${id}-clusters`)) {
		map.addLayer({
			id: `${id}-clusters`,
			type: "circle",
			source: id,
			filter: ["has", "point_count"],
			...(maxZoom ? { maxzoom: maxZoom } : {}),
			paint: {
				"circle-color": "#ffffff", // White core
				"circle-radius": 15,
				"circle-stroke-width": 10, // Thick stroke
				"circle-stroke-color": [
					"step",
					["get", "point_count"],
					"rgba(81, 187, 214, 0.6)", // Transparent Blue
					10,
					"rgba(241, 240, 117, 0.6)", // Transparent Yellow
					50,
					"rgba(242, 140, 177, 0.6)", // Transparent Pink
				],
			},
		});
	}

	// 2. Layer: Cluster Counts (Text)
	if (!map.getLayer(`${id}-cluster-count`)) {
		map.addLayer({
			id: `${id}-cluster-count`,
			type: "symbol",
			source: id,
			filter: ["has", "point_count"],
			...(maxZoom ? { maxzoom: maxZoom } : {}),
			layout: {
				"text-field": "{point_count_abbreviated}",
				"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
				"text-size": 12,
			},
		});
	}

	// 3. Individual pins as Markers (for animations)
	const unclusteredPoints = data.features.filter((f) => !f.properties?.point_count);

	// Remove existing markers for this layer
	const existingMarkers = document.querySelectorAll(`[data-marker-layer="${id}"]`);
	existingMarkers.forEach((el) => {
		el.remove();
	});

	unclusteredPoints.forEach((feature) => {
		if (feature.geometry.type !== "Point") return;
		const coords = feature.geometry.coordinates as [number, number];
		const el = document.createElement("div");
		el.className = "retreever-marker";
		el.setAttribute("data-marker-layer", id);
		el.innerHTML = `
			<div class="marker-inner">
				<img src="/Retreever.svg" width="18" height="18" alt="Retreever" />
			</div>
		`;
		el.style.cssText = `
			background: transparent;
			border: none;
			cursor: pointer;
			transform: translate(-50%, -50%);
		`;

		new mapboxgl.Marker({
			element: el,
			anchor: "center",
		})
			.setLngLat(coords)
			.addTo(map);

		// Add click handler
		el.addEventListener("click", () => {
			if (onPointClick) {
				onPointClick(feature as mapboxgl.MapboxGeoJSONFeature);
			}
		});
	});

	// Interaction: Click on Cluster -> Zoom
	map.on("click", `${id}-clusters`, (e) => {
		const features = map.queryRenderedFeatures(e.point, {
			layers: [`${id}-clusters`],
		});
		if (features.length === 0) return;
		const clusterId = features[0].properties?.cluster_id;
		if (typeof clusterId !== "number") return;
		(map.getSource(id) as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
			if (err || zoom == null) return;

			const geometry = features[0].geometry;
			if (geometry.type !== "Point") return;
			const center = geometry.coordinates as [number, number];

			map.easeTo({
				center,
				zoom,
			});
		});
	});

	console.log(`✅ Clustered pins added for layer: ${id}`);
}
