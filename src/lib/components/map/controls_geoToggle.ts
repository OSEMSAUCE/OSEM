// Geographic layer toggle control with lazy loading
import type mapboxgl from "mapbox-gl";
import type { PolygonConfig } from "./types";

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
        this.container = document.createElement("div");
        this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        this.container.style.background = "white";
        this.container.style.borderRadius = "4px";
        this.container.style.padding = "8px";
        this.container.style.marginBottom = "10px";

        this.geoLayers.forEach((polygon) => {
            const wrapper = document.createElement("div");
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.marginBottom = "6px";
            wrapper.style.position = "relative";
            wrapper.style.cursor = "pointer";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `toggle-${polygon.id}`;
            checkbox.checked = polygon.initiallyVisible !== false;
            checkbox.style.cursor = "pointer";
            checkbox.style.marginRight = "6px";

            const label = document.createElement("label");
            label.htmlFor = `toggle-${polygon.id}`;
            label.textContent = polygon.name;
            label.style.cursor = "pointer";
            label.style.fontSize = "13px";
            label.style.fontFamily = "system-ui, sans-serif";

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);

            // Toggle layer visibility
            checkbox.addEventListener("change", async () => {
                if (checkbox.checked) {
                    await this.loadLayer(polygon);
                } else {
                    this.hideLayer(polygon.id);
                }
            });

            this.container?.appendChild(wrapper);

            // Load initially visible layers
            if (polygon.initiallyVisible !== false) {
                this.loadLayer(polygon);
            }
        });

        return this.container;
    }

    private async loadLayer(polygon: PolygonConfig): Promise<void> {
        if (!this.map || this.loadingLayers.has(polygon.id)) return;

        this.loadingLayers.add(polygon.id);

        try {
            // Check if layer already exists
            if (this.map.getLayer(polygon.id)) {
                this.map.setLayoutProperty(polygon.id, "visibility", "visible");
                return;
            }

            // Load GeoJSON data
            const response = await fetch(polygon.path);
            if (!response.ok) {
                console.error(
                    `Failed to load geographic layer ${polygon.id}:`,
                    response.status,
                );
                return;
            }

            const geoJsonData = await response.json();

            // Add source
            const sourceId = `${polygon.id}-source`;
            if (!this.map.getSource(sourceId)) {
                this.map.addSource(sourceId, {
                    type: "geojson",
                    data: geoJsonData,
                });
            }

            // Add fill layer
            this.map.addLayer({
                id: polygon.id,
                type: "fill",
                source: sourceId,
                layout: {},
                paint: {
                    "fill-color": polygon.fillColor,
                    "fill-opacity": polygon.opacity,
                },
            });

            // Add outline layer
            this.map.addLayer({
                id: `${polygon.id}-outline`,
                type: "line",
                source: sourceId,
                layout: {},
                paint: {
                    "line-color": polygon.outlineColor,
                    "line-width": 1,
                },
            });

            console.log(`✅ Loaded geographic layer: ${polygon.name}`);
        } catch (error) {
            console.error(
                `Error loading geographic layer ${polygon.id}:`,
                error,
            );
        } finally {
            this.loadingLayers.delete(polygon.id);
        }
    }

    private hideLayer(layerId: string): void {
        if (!this.map) return;

        if (this.map.getLayer(layerId)) {
            this.map.setLayoutProperty(layerId, "visibility", "none");
        }
        if (this.map.getLayer(`${layerId}-outline`)) {
            this.map.setLayoutProperty(
                `${layerId}-outline`,
                "visibility",
                "none",
            );
        }
    }

    onRemove(): void {
        this.container?.parentNode?.removeChild(this.container);
        this.map = undefined;
    }
}

export { GeoLayerToggleControl };
