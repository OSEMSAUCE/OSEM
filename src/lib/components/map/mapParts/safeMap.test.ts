import { describe, expect, it, vi } from "vitest";
import { safeFitBounds } from "./safeMap";

// safeFitBounds is the ONLY sanctioned fitBounds. Its contract: a NaN must
// never reach Mapbox's camera. The historic gap was that it validated the
// corners but not the *computed* zoom — and fitBounds derives zoom as
// log2(viewport / bounds), which goes NaN when padding exceeds the viewport
// or the canvas is unsized. NaN then survives Mapbox's min/max clamp and
// corrupts the camera permanently. These tests pin the cameraForBounds
// pre-flight that closes that gap.

type FitArg = Parameters<typeof safeFitBounds>[0];

function makeMap(over: Record<string, unknown> = {}) {
    return {
        getCenter: () => ({ lng: 0, lat: 0 }),
        getZoom: () => 2,
        stop: vi.fn(),
        flyTo: vi.fn(),
        jumpTo: vi.fn(),
        easeTo: vi.fn(),
        fitBounds: vi.fn(),
        cameraForBounds: vi.fn(() => ({ zoom: 10 })),
        ...over,
    };
}

const SW: [number, number] = [-122, 37];
const NE: [number, number] = [-121, 38];

describe("safeFitBounds — zoom pre-flight", () => {
    it("commits the fit when cameraForBounds yields a finite zoom", () => {
        const m = makeMap();
        safeFitBounds(m as unknown as FitArg, SW, NE);
        expect(m.fitBounds).toHaveBeenCalledTimes(1);
    });

    it("rejects (no fitBounds) when computed zoom is NaN — padding exceeds viewport", () => {
        const m = makeMap({ cameraForBounds: vi.fn(() => ({ zoom: NaN })) });
        safeFitBounds(m as unknown as FitArg, SW, NE);
        expect(m.fitBounds).not.toHaveBeenCalled();
    });

    it("rejects (no fitBounds) when cameraForBounds returns undefined — unsized canvas", () => {
        const m = makeMap({ cameraForBounds: vi.fn(() => undefined) });
        safeFitBounds(m as unknown as FitArg, SW, NE);
        expect(m.fitBounds).not.toHaveBeenCalled();
    });

    it("rejects (no fitBounds) when computed zoom is Infinity", () => {
        const m = makeMap({ cameraForBounds: vi.fn(() => ({ zoom: Infinity })) });
        safeFitBounds(m as unknown as FitArg, SW, NE);
        expect(m.fitBounds).not.toHaveBeenCalled();
    });

    it("stays back-compatible: older map without cameraForBounds still fits", () => {
        const m = makeMap({ cameraForBounds: undefined });
        safeFitBounds(m as unknown as FitArg, SW, NE);
        expect(m.fitBounds).toHaveBeenCalledTimes(1);
    });
});

describe("safeFitBounds — corner + degenerate guards (unchanged contract)", () => {
    it("rejects a non-finite corner without touching the camera", () => {
        const m = makeMap();
        safeFitBounds(m as unknown as FitArg, [NaN, 37], NE);
        expect(m.fitBounds).not.toHaveBeenCalled();
        expect(m.flyTo).not.toHaveBeenCalled();
    });

    it("delegates a zero-area (sw === ne) box to flyTo, never fitBounds", () => {
        const m = makeMap();
        safeFitBounds(m as unknown as FitArg, SW, [...SW] as [number, number]);
        expect(m.fitBounds).not.toHaveBeenCalled();
        expect(m.flyTo).toHaveBeenCalledTimes(1);
    });
});
