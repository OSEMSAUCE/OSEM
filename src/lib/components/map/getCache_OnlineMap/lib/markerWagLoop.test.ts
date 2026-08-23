/**
 * The tail-wag loop math.
 *
 * The wag looked choppy and "froze" periodically because the baker sampled a
 * hard-coded 2000ms window, while most of the rig (ears, legs, the tail's own
 * scale/translate) runs on a 1.3333s cycle. Every wrap of the 2s strip cut
 * those mid-cycle and snapped them back. These tests pin the loop length to
 * something derived from the rig, so a future marker with different durations
 * can't silently reintroduce the seam.
 *
 * Vitest runs in the `node` environment here (see vitest.config.ts), so these
 * exercise the pure math — `loopFrameCountFor` — and read the shipped marker's
 * durations off the file text rather than standing up a DOM.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loopFrameCountFor, parseSmilDur } from "./mapMarker";

const FPS = 24;
const FALLBACK_MS = 2000;

const frameCount = (durs: number[]): number =>
    loopFrameCountFor(durs, FPS, FALLBACK_MS);

describe("parseSmilDur", () => {
    it("reads seconds and milliseconds", () => {
        expect(parseSmilDur("2s")).toBe(2000);
        expect(parseSmilDur("1.3333333s")).toBeCloseTo(1333.3333, 3);
        expect(parseSmilDur("800ms")).toBe(800);
        expect(parseSmilDur(" 2s ")).toBe(2000);
    });

    it("rejects junk, zero, and negatives rather than returning NaN", () => {
        for (const bad of [null, "", "indefinite", "0s", "-1s", "abc"]) {
            expect(parseSmilDur(bad)).toBeNull();
        }
    });
});

describe("loopFrameCountFor", () => {
    it("returns the single cycle when the rig has one duration", () => {
        expect(frameCount([2000])).toBe(48); // 2s at 24fps
    });

    it("reconciles 1.3333s against 2s at 96 frames (4.0s) — the real bug", () => {
        // THE REGRESSION. 1333ms and 2000ms are coprime, so an LCM taken in
        // milliseconds is 2,666,000ms (~64k frames, ~780 MB) and blows the cap,
        // silently falling back to the broken 2s window. Snapping to whole
        // frames FIRST gives 32 and 48, which reconcile at 96.
        const frames = frameCount([1333.3333, 2000]);
        expect(frames).toBe(96);
        expect((frames / FPS) * 1000).toBe(4000);
    });

    it("lands every declared cycle exactly on frame 0 — no seam", () => {
        const durs = [1333.3333, 2000];
        const total = frameCount(durs);
        for (const ms of durs) {
            const cycleFrames = Math.round(ms / (1000 / FPS));
            // The whole point: the strip is a whole number of every cycle, so
            // nothing gets cut mid-swing when the strip wraps.
            expect(total % cycleFrames).toBe(0);
        }
    });

    it("dedupes repeated durations instead of inflating the loop", () => {
        expect(frameCount([2000, 2000, 2000])).toBe(48);
    });

    it("falls back when the rig declares no looping animation", () => {
        expect(frameCount([])).toBe(48); // FALLBACK_MS at 24fps
    });

    it("ignores non-positive durations", () => {
        expect(frameCount([2000, 0, -5])).toBe(48);
    });

    it("caps a non-reconcilable rig instead of baking a giant strip", () => {
        // MAX_LOOP_MS is 8s = 192 frames at 24fps. A rig whose parts don't
        // reconcile inside that must degrade to the longest single cycle,
        // never allocate past the cap.
        const frames = frameCount([1291, 1375, 1458]);
        expect(frames).toBeLessThanOrEqual(192);
    });

    it("scales the strip with fps rather than fixing the frame budget", () => {
        // Same rig, higher rate -> proportionally more frames, same 4.0s loop.
        expect(loopFrameCountFor([1333.3333, 2000], 12, FALLBACK_MS)).toBe(48);
        expect(loopFrameCountFor([1333.3333, 2000], 24, FALLBACK_MS)).toBe(96);
    });
});

describe("the shipped dog marker", () => {
    const markup = readFileSync(
        fileURLToPath(
            new URL(
                "../../../../../../../static/pub-Rtvr/map-marker-tailWag-ReTreever.svg",
                import.meta.url,
            ),
        ),
        "utf8",
    );

    /** Looping `dur` values, read off the file text (node env, no DOM). */
    const durations = (): number[] =>
        (markup.match(/<(?:animateTransform|animateMotion|animate)\b[^>]*>/g) ?? [])
            .filter((tag) => tag.includes('repeatCount="indefinite"'))
            .map((tag) => parseSmilDur(/dur="([^"]+)"/.exec(tag)?.[1] ?? null))
            .filter((ms): ms is number => ms !== null);

    it("still declares the two durations this fix was built around", () => {
        // If the artwork is re-exported with different timings, this fails
        // loudly rather than the wag quietly going choppy again.
        const distinct = [...new Set(durations().map(Math.round))].sort(
            (a, b) => a - b,
        );
        expect(distinct).toEqual([1333, 2000]);
    });

    it("bakes to a 96-frame / 4.0s seamless loop at 24fps", () => {
        const frames = frameCount(durations());
        expect(frames).toBe(96);
        expect(frames / FPS).toBe(4);
    });

    it("is a big enough jump in smoothness to matter", () => {
        // The old strip was 12 frames over 2s = 6fps, stepping the tail's ~78
        // degree swing about 26 degrees at a time — that is the choppiness.
        const frames = frameCount(durations());
        expect(frames).toBeGreaterThan(12 * 4);
    });

    it("stays within a sane memory budget at the icon's raster size", () => {
        // 56x56 RGBA, shared by every dog on the map via one icon id.
        const bytes = frameCount(durations()) * 56 * 56 * 4;
        expect(bytes).toBeLessThan(4 * 1024 * 1024);
    });
});
