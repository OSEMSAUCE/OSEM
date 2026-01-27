import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "../../../config/mapConfig";

export interface ClusteredPinsConfig {
	id: string;
	data: FeatureCollection<Geometry, GeoJsonProperties>;
	onPointClick?: (feature: mapboxgl.MapboxGeoJSONFeature) => void;
	pointColor?: string;
	clusterRadius?: number;
	maxZoom?: number;
	markerUrl?: string;
}

/**
 * A reusable function to add clustered pins to a Mapbox map.
 * Used by both "Where" page (Project Polygons) and "Who" page (Organization Pins).
 */
export function addClusteredPins(map: mapboxgl.Map, config: ClusteredPinsConfig): void {
	const { id, data, onPointClick, clusterRadius = 50, maxZoom } = config;

	// Add Source with Clustering
	if (map.getSource(id)) {
		(map.getSource(id) as mapboxgl.GeoJSONSource).setData(data);
	} else {
		map.addSource(id, {
			type: "geojson",
			data,
			generateId: true,
			cluster: true,
			clusterMaxZoom: MAP_CONFIG.cluster.maxZoom,
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
				"circle-color": MAP_CONFIG.cluster.colors.whiteCore, // White core
				"circle-radius": MAP_CONFIG.cluster.colors.radius,
				"circle-stroke-width": MAP_CONFIG.cluster.colors.strokeWidth, // Thick stroke
				"circle-stroke-color": [
					"step",
					["get", "point_count"],
					MAP_CONFIG.cluster.colors.strokeColors[0].color, // Transparent Blue
					MAP_CONFIG.cluster.colors.strokeColors[0].threshold,
					MAP_CONFIG.cluster.colors.strokeColors[1].color, // Transparent Yellow
					MAP_CONFIG.cluster.colors.strokeColors[1].threshold,
					MAP_CONFIG.cluster.colors.strokeColors[2].color, // Transparent Pink
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
				"text-font": MAP_CONFIG.cluster.text.font as unknown as string[],
				"text-size": MAP_CONFIG.cluster.text.size,
			},
		});
	}

	// 3. Individual pins as Markers (for animations) - ONLY for truly single points
	const updateDogMarkers = () => {
		const markerStoreKey = `__clusteredPinsDogMarkers:${id}`;
		const mapRecord = map as unknown as Record<string, unknown>;
		const markersById = (mapRecord[markerStoreKey] ?? new Map<string | number, mapboxgl.Marker>()) as Map<string | number, mapboxgl.Marker>;
		mapRecord[markerStoreKey] = markersById;

		const features = map.querySourceFeatures(id, {
			filter: ["!", ["has", "point_count"]],
		});
		const nextIds = new Set<string | number>();

		features.forEach((feature) => {
			if (feature.id == null) return;
			nextIds.add(feature.id);
			const geometry = feature.geometry;
			if (geometry.type !== "Point") return;
			const coords = geometry.coordinates as [number, number];

			const existingMarker = markersById.get(feature.id);
			if (existingMarker) {
				existingMarker.setLngLat(coords);
				return;
			}

			const el = document.createElement("div");
			el.className = "retreever-marker";
			el.setAttribute("data-marker-layer", id);
			const markerSrc = config.markerUrl || MAP_CONFIG.markers.default;
			console.log(`🖼️ Creating marker with src: ${markerSrc} (config.markerUrl: ${config.markerUrl})`);
			console.log(`🔧 Config object:`, config);

			// Create the image with error handling
			const img = document.createElement("img");
			img.src = markerSrc;
			img.width = MAP_CONFIG.marker.width;
			img.height = MAP_CONFIG.marker.height;
			img.alt = MAP_CONFIG.marker.alt;
			img.style.display = "block";

			img.onload = () => console.log(`✅ Loaded marker image: ${markerSrc}`);
			img.onerror = () => console.error(`❌ Failed to load marker image: ${markerSrc}`);

			const inner = document.createElement("div");
			inner.className = "marker-inner";
			inner.appendChild(img);

			el.appendChild(inner);
			el.style.cssText = `
				background: transparent;
				border: none;
				cursor: pointer;
				transform: translate(-50%, -50%);
			`;

			const marker = new mapboxgl.Marker({
				element: el,
				anchor: "center",
			})
				.setLngLat(coords)
				.addTo(map);

			// Add click event to the marker element
			const handleMarkerClick = (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				console.log("🖱️ Marker clicked:", feature.properties?.landName || feature.id);
				if (onPointClick) {
					onPointClick(feature);
				}
			};

			el.addEventListener("click", handleMarkerClick);
			el.addEventListener("touchend", handleMarkerClick);

			markersById.set(feature.id, marker);
		});

		for (const [featureId, marker] of markersById.entries()) {
			if (!nextIds.has(featureId)) {
				marker.remove();
				markersById.delete(featureId);
			}
		}
	};

	updateDogMarkers();
	const boundKey = `__clusteredPinsDogBound:${id}`;
	if (!(map as unknown as Record<string, unknown>)[boundKey]) {
		(map as unknown as Record<string, unknown>)[boundKey] = true;
		map.on("moveend", updateDogMarkers);
		map.on("zoomend", updateDogMarkers);
	}

	// Interaction: Click on Cluster -> Zoom
	const boundClusterClickKey = `__clusteredPinsClusterClickBound:${id}`;
	if (!(map as unknown as Record<string, unknown>)[boundClusterClickKey]) {
		(map as unknown as Record<string, unknown>)[boundClusterClickKey] = true;
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
	}

	console.log(`✅ Clustered pins added for layer: ${id}`);
}
