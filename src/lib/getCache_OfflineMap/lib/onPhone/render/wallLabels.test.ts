/**
 * TIP ON THE SPOT — a teardrop pin's anchor must be its POINT, not its middle.
 *
 * THE BUG: these POI layers set no `icon-anchor`, so MapLibre defaulted to
 * `center`. A teardrop centred on its coordinate puts the TIP — the part that
 * means "here" — half an icon-height away. `icon-size` is in PIXELS, so that
 * fixed pixel gap covers metres-tiny distances zoomed in and kilometre-scale
 * distances zoomed out: the pin visibly raced across the ground while zooming,
 * with its lng/lat never changing. Reported as pins "shooting across the land
 * at 1200 km/h".
 *
 * The DOM markers already had this right (pinMarkers.ts PIN_ANCHOR = "bottom");
 * the symbol layers never got the same fix. This test covers the symbol path so
 * the third recurrence is a red test rather than a field report.
 */
import { describe, expect, it } from "vitest";

import { addWallPois, POI_LAYER_IDS } from "./wallLabels";

/** Minimal map double: records addLayer specs, pretends every image exists. */
function fakeMap() {
	const layers: Record<string, any> = {};
	return {
		layers,
		hasImage: () => true,
		addImage: () => {},
		getLayer: (id: string) => layers[id],
		addLayer: (spec: any) => {
			layers[spec.id] = spec;
		},
	};
}

describe("offline POI pins are anchored at the tip", () => {
	it("every teardrop POI layer sets icon-anchor: bottom", async () => {
		const map = fakeMap();
		await addWallPois(map as never);

		// Guard the guard: if the layers stop being created, the assertions below
		// would vacuously pass.
		expect(Object.keys(map.layers).sort()).toEqual([...POI_LAYER_IDS].sort());

		for (const id of POI_LAYER_IDS) {
			expect(map.layers[id].layout["icon-anchor"], `${id} must hang from its tip`).toBe(
				"bottom",
			);
		}
	});

	it("never leaves icon-anchor unset — the default is `center`, which is the bug", async () => {
		const map = fakeMap();
		await addWallPois(map as never);
		for (const id of POI_LAYER_IDS) {
			expect(map.layers[id].layout["icon-anchor"]).toBeDefined();
		}
	});
});
