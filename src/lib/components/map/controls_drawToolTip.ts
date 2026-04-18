import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type mapboxgl from "mapbox-gl";
import { area, length, centroid } from "@turf/turf";
import type { Feature, Polygon, LineString } from "geojson";

function makeLabel(text: string): HTMLElement {
    const el = document.createElement("div");
    el.className =
        "px-2 py-1 rounded bg-black/75 text-white text-xs font-mono whitespace-nowrap pointer-events-none";
    el.textContent = text;
    return el;
}

function formatArea(sqMetres: number): string {
    const ha = sqMetres / 10000;
    return ha >= 1 ? `${ha.toFixed(2)} ha` : `${Math.round(sqMetres)} m²`;
}

function formatLength(km: number): string {
    return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}

function buildStyles(accent: string) {
    return [
        // Polygon fill — faint accent tint
        {
            id: "gl-draw-polygon-fill",
            type: "fill",
            filter: [
                "all",
                ["==", "$type", "Polygon"],
                ["!=", "mode", "static"],
            ],
            paint: { "fill-color": accent, "fill-opacity": 0.15 },
        },
        // Polygon stroke — white halo (subtle)
        {
            id: "gl-draw-polygon-stroke-halo",
            type: "line",
            filter: [
                "all",
                ["==", "$type", "Polygon"],
                ["!=", "mode", "static"],
            ],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
                "line-color": "#ffffff",
                "line-width": 5,
                "line-opacity": 0.7,
            },
        },
        // Polygon stroke — accent line (dominant)
        {
            id: "gl-draw-polygon-stroke",
            type: "line",
            filter: [
                "all",
                ["==", "$type", "Polygon"],
                ["!=", "mode", "static"],
            ],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": accent, "line-width": 3 },
        },
        // Line string — white halo (subtle)
        {
            id: "gl-draw-line-halo",
            type: "line",
            filter: [
                "all",
                ["==", "$type", "LineString"],
                ["!=", "mode", "static"],
            ],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
                "line-color": "#ffffff",
                "line-width": 5,
                "line-opacity": 0.7,
            },
        },
        // Line string — accent line (dominant)
        {
            id: "gl-draw-line",
            type: "line",
            filter: [
                "all",
                ["==", "$type", "LineString"],
                ["!=", "mode", "static"],
            ],
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": accent, "line-width": 3.5 },
        },
        // Vertex — white ring
        {
            id: "gl-draw-vertex-halo",
            type: "circle",
            filter: [
                "all",
                ["==", "meta", "vertex"],
                ["==", "$type", "Point"],
                ["!=", "mode", "static"],
            ],
            paint: { "circle-radius": 7, "circle-color": "#ffffff" },
        },
        // Vertex — accent dot
        {
            id: "gl-draw-vertex",
            type: "circle",
            filter: [
                "all",
                ["==", "meta", "vertex"],
                ["==", "$type", "Point"],
                ["!=", "mode", "static"],
            ],
            paint: { "circle-radius": 4, "circle-color": accent },
        },
        // Midpoint handle
        {
            id: "gl-draw-polygon-midpoint",
            type: "circle",
            filter: [
                "all",
                ["==", "$type", "Point"],
                ["==", "meta", "midpoint"],
            ],
            paint: {
                "circle-radius": 4,
                "circle-color": "#ffffff",
                "circle-stroke-width": 2,
                "circle-stroke-color": accent,
            },
        },
    ];
}

export function addDrawControls(map: mapboxgl.Map): MapboxDraw {
    // Use --color-draw if defined, otherwise fall back to OSEM purple.
    // This keeps draw lines purple in ReTreever even though its --color-accent is gold.
    const accent =
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-draw")
            .trim() || "#8028DE";

    const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, line_string: true },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        styles: buildStyles(accent) as any,
    });

    map.addControl(draw, "top-left");

    // --- Custom undo + done buttons ---
    const drawContainer = map
        .getContainer()
        .querySelector(".mapbox-gl-draw_ctrl-draw-btn")
        ?.closest(".mapboxgl-ctrl-group");

    if (drawContainer) {
        const undoBtn = document.createElement("button");
        undoBtn.className = "mapbox-gl-draw_ctrl-draw-btn";
        undoBtn.title = "Undo";
        undoBtn.type = "button";
        undoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>`;

        const doneBtn = document.createElement("button");
        doneBtn.className = "mapbox-gl-draw_ctrl-draw-btn draw-done-btn";
        doneBtn.title = "Finish drawing";
        doneBtn.type = "button";
        doneBtn.style.display = "none";
        doneBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

        undoBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const mode = draw.getMode();
            if (mode === "draw_polygon" || mode === "draw_line_string") {
                const evt = new KeyboardEvent("keyup", {
                    key: "Backspace",
                    code: "Backspace",
                    bubbles: true,
                });
                Object.defineProperty(evt, "keyCode", { value: 8 });
                map.getContainer().dispatchEvent(evt);
            } else {
                draw.trash();
            }
        });

        doneBtn.addEventListener("click", (e) => {
            e.preventDefault();
            draw.changeMode("simple_select");
        });

        drawContainer.appendChild(undoBtn);
        drawContainer.appendChild(doneBtn);

        map.on("draw.modechange", (e: { mode: string }) => {
            const drawing =
                e.mode === "draw_polygon" || e.mode === "draw_line_string";
            doneBtn.style.display = drawing ? "" : "none";
        });
    }

    // Measurement labels keyed by feature id
    const labelMarkers = new Map<string, mapboxgl.Marker>();

    async function updateLabels() {
        const mapboxgl = (await import("mapbox-gl")).default;
        const features = draw.getAll().features as Feature[];

        for (const feat of features) {
            const id = feat.id as string;
            if (!feat.geometry) continue;

            if (feat.geometry.type === "Polygon") {
                const sqM = area(feat as Feature<Polygon>);
                const c = centroid(feat as Feature<Polygon>);
                const [lng, lat] = c.geometry.coordinates;
                labelMarkers.get(id)?.remove();
                const marker = new mapboxgl.Marker({
                    element: makeLabel(formatArea(sqM)),
                    anchor: "center",
                })
                    .setLngLat([lng, lat])
                    .addTo(map);
                labelMarkers.set(id, marker);
            } else if (feat.geometry.type === "LineString") {
                const coords = feat.geometry.coordinates;
                if (coords.length < 2) continue;
                const km = length(feat as Feature<LineString>, {
                    units: "kilometers",
                });
                const mid = coords[Math.floor(coords.length / 2)] as [
                    number,
                    number,
                ];
                labelMarkers.get(id)?.remove();
                const marker = new mapboxgl.Marker({
                    element: makeLabel(formatLength(km)),
                    anchor: "center",
                })
                    .setLngLat(mid)
                    .addTo(map);
                labelMarkers.set(id, marker);
            }
        }

        // Remove labels for deleted features
        const activeIds = new Set(features.map((f) => f.id as string));
        for (const [id, marker] of labelMarkers) {
            if (!activeIds.has(id)) {
                marker.remove();
                labelMarkers.delete(id);
            }
        }
    }

    map.on("draw.create", updateLabels);
    map.on("draw.update", updateLabels);
    map.on("draw.delete", updateLabels);

    // Clean up when map is removed
    map.once("remove", () => {
        map.off("draw.create", updateLabels);
        map.off("draw.update", updateLabels);
        map.off("draw.delete", updateLabels);
        for (const marker of labelMarkers.values()) marker.remove();
        labelMarkers.clear();
        try {
            map.removeControl(draw as unknown as mapboxgl.IControl);
        } catch {
            // ignore
        }
    });

    return draw;
}

export function addDrawHeadless(map: mapboxgl.Map): MapboxDraw {
    const accent =
        getComputedStyle(document.documentElement)
            .getPropertyValue("--color-draw")
            .trim() || "#8028DE";

    const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        styles: buildStyles(accent) as any,
    });

    map.addControl(draw, "top-left");

    const labelMarkers = new Map<string, mapboxgl.Marker>();

    async function updateLabels() {
        const mapboxgl = (await import("mapbox-gl")).default;
        const features = draw.getAll().features as Feature[];

        for (const feat of features) {
            const id = feat.id as string;
            if (!feat.geometry) continue;

            if (feat.geometry.type === "Polygon") {
                const sqM = area(feat as Feature<Polygon>);
                const c = centroid(feat as Feature<Polygon>);
                const [lng, lat] = c.geometry.coordinates;
                labelMarkers.get(id)?.remove();
                const marker = new mapboxgl.Marker({
                    element: makeLabel(formatArea(sqM)),
                    anchor: "center",
                })
                    .setLngLat([lng, lat])
                    .addTo(map);
                labelMarkers.set(id, marker);
            } else if (feat.geometry.type === "LineString") {
                const coords = feat.geometry.coordinates;
                if (coords.length < 2) continue;
                const km = length(feat as Feature<LineString>, {
                    units: "kilometers",
                });
                const mid = coords[Math.floor(coords.length / 2)] as [
                    number,
                    number,
                ];
                labelMarkers.get(id)?.remove();
                const marker = new mapboxgl.Marker({
                    element: makeLabel(formatLength(km)),
                    anchor: "center",
                })
                    .setLngLat(mid)
                    .addTo(map);
                labelMarkers.set(id, marker);
            }
        }

        const activeIds = new Set(features.map((f) => f.id as string));
        for (const [id, marker] of labelMarkers) {
            if (!activeIds.has(id)) {
                marker.remove();
                labelMarkers.delete(id);
            }
        }
    }

    map.on("draw.create", updateLabels);
    map.on("draw.update", updateLabels);
    map.on("draw.delete", updateLabels);

    map.once("remove", () => {
        map.off("draw.create", updateLabels);
        map.off("draw.update", updateLabels);
        map.off("draw.delete", updateLabels);
        for (const marker of labelMarkers.values()) marker.remove();
        labelMarkers.clear();
        try {
            map.removeControl(draw as unknown as mapboxgl.IControl);
        } catch {
            // ignore
        }
    });

    return draw;
}
