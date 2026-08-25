import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
} from "geojson";
import type * as mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "./MAP_CONFIG";
import { safeEase } from "./safeEase";
import { toCoordFromArray, isCoord, type Coord } from "./coord";

/**
 * True once a map has been removed (Svelte component unmounted, style swap,
 * hot reload). Post-await code should bail on removed maps to avoid
 * `Cannot read properties of undefined (reading 'getOwnSource')`.
 */
// Drop features whose Point geometry has NaN/Infinity/out-of-range
// coordinates. Mapbox crashes during render (`_evaluateOpacity` →
// `unproject`) when even one such feature reaches its sources. This is
// the source-data boundary; validate here so internal pipeline code
// can trust feature coordinates without re-checking.
/** Last reported drop count, so an unchanged one doesn't re-warn. */
let lastDroppedCount = 0;

function filterFiniteFeatures(
    fc: FeatureCollection<Geometry, GeoJsonProperties>,
): FeatureCollection<Geometry, GeoJsonProperties> {
    let dropped = 0;
    const safeFeatures = fc.features.filter((f) => {
        if (!f.geometry) return false;
        if (f.geometry.type !== "Point") return true;
        const ok = isCoord(f.geometry.coordinates);
        if (!ok) dropped++;
        return ok;
    });
    // ONCE PER COUNT, not once per rebuild. The marker layer is rebuilt on
    // every data change, and the same bad rows fail the same way each time —
    // so this warned identically on a loop and buried everything else. The
    // count is the whole signal: seeing "19" twice says nothing "19" once
    // didn't. A changed count is genuinely new, so that still speaks up.
    if (dropped > 0 && dropped !== lastDroppedCount) {
        lastDroppedCount = dropped;
        console.warn(
            `[mapMarker] dropped ${dropped} feature(s) with non-finite coordinates`,
        );
    }
    if (safeFeatures.length === fc.features.length) return fc;
    return { ...fc, features: safeFeatures };
}

export function isMapAlive(map: mapboxgl.Map | undefined | null): boolean {
    if (!map) return false;
    const internal = map as unknown as { _removed?: boolean; style?: unknown };
    return !internal._removed && internal.style != null;
}

export interface ClusteredPinsConfig {
    id: string;
    data: FeatureCollection<Geometry, GeoJsonProperties>;
    onPointClick?: (feature: mapboxgl.MapboxGeoJSONFeature) => void;
    pointColor?: string;
    clusterRadius?: number;
    maxZoom?: number;
    markerUrl?: string;
}

export interface OrgMarkerConfig {
    id: string;
    data: OrganizationData[];
    onMarkerClick?: (orgId: string) => void;
    markerUrl?: string;
}

interface OrganizationData {
    organizationKey?: string;
    id?: string;
    organizationName?: string;
    displayName?: string;
    organizationAddress?: string;
    address?: string;
    organizationWebsite?: string;
    displayWebsite?: string;
    website?: string;
    claimQty?: number;
    latitude?: string | number;
    longitude?: string | number;
}

function circleRadiusExpression(scale = 1): mapboxgl.Expression {
    const stops = MAP_CONFIG.cluster.circleStops;
    const expr: (string | number | unknown[])[] = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "point_count"], 1],
    ];
    for (const s of stops) {
        expr.push(s.count, Math.round(s.radius * scale));
    }
    return expr as unknown as mapboxgl.Expression;
}

function circleColorExpression(): mapboxgl.Expression {
    const stops = MAP_CONFIG.cluster.circleStops;
    const expr: (string | number | unknown[])[] = [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "point_count"], 1],
    ];
    for (const s of stops) {
        expr.push(s.count, s.color);
    }
    return expr as unknown as mapboxgl.Expression;
}

function heatmapColorExpression(): mapboxgl.Expression {
    const expr: (string | number | unknown[])[] = [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
    ];
    for (const s of MAP_CONFIG.cluster.heatmap.ramp) {
        expr.push(s.stop, s.color);
    }
    return expr as unknown as mapboxgl.Expression;
}

/**
 * Rasterize an SVG into an ImageData at the given pixel size, via canvas.
 * Mapbox's loadImage doesn't decode SVGs, so we do it ourselves.
 */
async function rasterizeSvg(url: string, sizePx: number): Promise<ImageData> {
    const img = new Image(sizePx, sizePx);
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
            reject(new Error(`Failed to load marker SVG: ${url}`));
        img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = sizePx;
    canvas.height = sizePx;
    // Read-back canvas: every draw here exists to be sampled by
    // getImageData. Declaring that up front keeps the surface on the CPU
    // instead of round-tripping from the GPU per read — which is what
    // Chrome's "Multiple readback operations" warning is asking for.
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(img, 0, 0, sizePx, sizePx);
    return ctx.getImageData(0, 0, sizePx, sizePx);
}

/** Parse a SMIL `dur` ("2s", "1.3333333s", "800ms") into milliseconds. */
export function parseSmilDur(raw: string | null): number | null {
    if (!raw) return null;
    const t = raw.trim();
    const ms = t.endsWith("ms")
        ? Number.parseFloat(t)
        : t.endsWith("s")
          ? Number.parseFloat(t) * 1000
          : Number.NaN;
    return Number.isFinite(ms) && ms > 0 ? ms : null;
}

/**
 * Length of the shortest strip that lands EVERY animation in the rig back on
 * its own frame 0, expressed in whole frames at `fps`.
 *
 * WHY this exists: this marker's tail rotation is `dur="2s"` while its
 * scale/translate and both ear/leg `animateMotion` groups are
 * `dur="1.3333333s"`. Baking a flat 2s strip — the old hard-coded constant —
 * cuts the 1.3333s animations mid-cycle, so every time the strip wraps, the
 * ears and legs SNAP back to a pose they weren't heading for. That is the
 * visible "freezes / jumps" symptom, and no amount of extra frames fixes it.
 *
 * WHY the LCM is taken in FRAMES, not milliseconds: 1333ms and 2000ms are
 * coprime, so an LCM in raw milliseconds is 2,666,000ms — 44 minutes, ~64k
 * frames. Quantising the milliseconds first doesn't rescue it either; coprime
 * pairs keep reappearing on every grid (1335/2000, 1325/2000, …). The fix is to
 * reconcile them on the grid the bake actually samples on: snap each duration
 * to a whole number of frames FIRST, then take the LCM there. 1.3333s and 2s
 * become 32 and 48 frames, which reconcile at 96 frames = exactly 4.0s.
 */
export function loopFrameCountFor(
    durationsMs: readonly number[],
    fps: number,
    fallbackMs: number,
): number {
    const frameMs = 1000 / fps;
    const toFrames = (ms: number): number =>
        Math.max(1, Math.round(ms / frameMs));

    const counts = new Set(durationsMs.filter((d) => d > 0).map(toFrames));
    if (counts.size === 0) return toFrames(fallbackMs);

    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    let lcm = 1;
    for (const c of counts) lcm = (lcm / gcd(lcm, c)) * c;

    // Backstop: a rig whose parts genuinely don't reconcile shouldn't bake a
    // multi-megabyte strip. Falling back to the longest single cycle still
    // loops that part cleanly and only seams the others.
    const maxFrames = Math.round((MAX_LOOP_MS / 1000) * fps);
    return lcm > maxFrames ? Math.max(...counts) : lcm;
}

/**
 * Every looping `dur` declared in a rig, in milliseconds. `fill="freeze"`
 * one-shots (the intro fade) are excluded — they don't define the loop.
 */
export function loopingDurationsMs(svg: SVGSVGElement): number[] {
    const out: number[] = [];
    for (const el of Array.from(
        svg.querySelectorAll("animateTransform, animateMotion, animate"),
    )) {
        if (el.getAttribute("repeatCount") !== "indefinite") continue;
        const ms = parseSmilDur(el.getAttribute("dur"));
        if (ms) out.push(ms);
    }
    return out;
}

/** DOM-side convenience: the frame count for a live rig. */
function svgLoopFrameCount(
    svg: SVGSVGElement,
    fps: number,
    fallbackMs: number,
): number {
    return loopFrameCountFor(loopingDurationsMs(svg), fps, fallbackMs);
}

/**
 * Bake a SMIL-animated SVG into a strip of ImageData frames — the tail wag.
 *
 * WHY this exists: the marker SVG animates via <animateTransform>, but Mapbox
 * icons are PIXELS (`addImage` takes ImageData, there is no animated-icon
 * input). Loading the file through `new Image()` and drawImage — what
 * rasterizeSvg above does — snapshots frame 0 forever, which is exactly why
 * the dogs sat frozen with their tails stuck out.
 *
 * SMIL only runs inside a live document, so we inline the SVG into one
 * (off-screen, but attached and laid out — a detached or display:none subtree
 * never starts its clock), then drive `svg.setCurrentTime()` to each sample
 * point and screenshot it. The result is a plain frame array; `addDogLayer`
 * cycles it through `map.updateImage()`, which IS how Mapbox does animated
 * icons.
 *
 * Serializing back out per frame (rather than canvas-drawing the live node)
 * is deliberate: drawImage cannot take an SVG element, and re-serializing
 * bakes the current animated transform values into static attributes.
 */
async function rasterizeSvgFrames(
    url: string,
    sizePx: number,
    targetFps: number,
    fallbackDurationMs: number,
): Promise<{ frames: ImageData[]; frameMs: number }> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch marker SVG: ${url}`);
    const markup = await res.text();

    // Off-screen but REAL: positioned far outside the viewport rather than
    // hidden, because visibility:hidden / display:none stop the SMIL clock.
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
        `position:absolute;left:-10000px;top:0;width:${sizePx}px;` +
        `height:${sizePx}px;pointer-events:none;opacity:0;`;
    host.innerHTML = markup;
    document.body.appendChild(host);

    try {
        const svg = host.querySelector("svg");
        if (!svg) throw new Error(`No <svg> root in marker: ${url}`);
        svg.setAttribute("width", String(sizePx));
        svg.setAttribute("height", String(sizePx));

        // Re-home the animation elements. The marker (exported from Lottie)
        // parks every <animateTransform>/<animateMotion> inside <defs> and
        // points it at its target with xlink:href="#id". That's legal SMIL,
        // but Chrome does not run animation elements from inside <defs> —
        // the target's transform.animVal never leaves identity, which is the
        // real reason the dogs' tails were frozen. Moving each animation to
        // be a CHILD of the node it animates (and dropping the now-redundant
        // href) is what actually makes the clock drive the tail.
        const animatedTargets = new Set<Element>();
        for (const anim of Array.from(
            svg.querySelectorAll(
                "defs > animateTransform, defs > animateMotion, defs > animate",
            ),
        )) {
            const href =
                anim.getAttribute("xlink:href") ?? anim.getAttribute("href");
            if (!href?.startsWith("#")) continue;
            const target = svg.querySelector(href);
            if (!target) continue;
            anim.removeAttribute("xlink:href");
            anim.removeAttribute("href");
            target.appendChild(anim);
            animatedTargets.add(target);
        }

        const canvas = document.createElement("canvas");
        canvas.width = sizePx;
        canvas.height = sizePx;
        // Read-back canvas — see the note on the single-frame path above.
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("2d context unavailable");

        const animated = svg as SVGSVGElement;
        // Freeze the clock so a frame can't advance between seek and capture.
        animated.pauseAnimations?.();

        // Loop length comes from the RIG, not a constant — see
        // svgLoopFrameCount. Every frame is one tick of the target rate, so the
        // strip is as long as the rig needs and always plays at `targetFps`.
        const frameMs = 1000 / targetFps;
        const frameCount = Math.max(
            2,
            svgLoopFrameCount(animated, targetFps, fallbackDurationMs),
        );
        const durationMs = frameCount * frameMs;

        /**
         * The element's CURRENT animated pose, as one matrix.
         *
         * Two sources have to be combined, and missing the second is a bug this
         * had: `<animateTransform>` writes into `transform.animVal`, but
         * `<animateMotion>` does NOT — it contributes a separate translation
         * that only shows up in the element's CTM. Reading animVal alone left
         * every motion-driven part (this marker's ears and legs) pinned at its
         * authored position while the tail swung, which is part of why the
         * whole dog read as stiff.
         *
         * So: take the CTM relative to the SVG root (which includes motion),
         * and fall back to multiplying animVal by hand when the CTM is
         * unavailable. `transform.animVal` is read-only, so `consolidate()`
         * throws on it — the items must be multiplied manually.
         */
        function animatedMatrix(el: Element): DOMMatrix {
            const g = el as SVGGraphicsElement;
            const parent = g.parentNode as SVGGraphicsElement | null;
            // CTM-relative-to-parent isolates THIS element's own contribution
            // (transform + motion) without re-applying its ancestors', which
            // the clone still carries.
            const own = g.getCTM?.();
            const up = parent?.getCTM?.();
            if (own && up) {
                try {
                    return DOMMatrix.fromMatrix(up)
                        .inverse()
                        .multiply(DOMMatrix.fromMatrix(own));
                } catch {
                    // Non-invertible (degenerate scale) — fall through.
                }
            }
            const list = g.transform.animVal;
            let m = animated.createSVGMatrix();
            for (let i = 0; i < list.numberOfItems; i++) {
                m = m.multiply(list.getItem(i).matrix);
            }
            return m as unknown as DOMMatrix;
        }

        const frames: ImageData[] = [];
        for (let i = 0; i < frameCount; i++) {
            animated.setCurrentTime?.((i / frameCount) * (durationMs / 1000));

            // Serializing the live node would export the AUTHORED attributes
            // (baseVal), not the pose the clock is currently holding — which
            // is why an earlier cut of this produced 12 identical frames even
            // though the DOM was animating correctly. So: clone, write each
            // animated node's current matrix onto the clone as a static
            // `transform`, and drop the animation elements. The snapshot is
            // then a plain posed SVG that rasterizes to the right frame.
            const clone = animated.cloneNode(true) as SVGSVGElement;
            const liveEls = Array.from(animated.querySelectorAll("*"));
            const cloneEls = Array.from(clone.querySelectorAll("*"));
            liveEls.forEach((el, idx) => {
                if (!animatedTargets.has(el)) return;
                const m = animatedMatrix(el);
                cloneEls[idx]?.setAttribute(
                    "transform",
                    `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`,
                );
            });
            for (const n of Array.from(
                clone.querySelectorAll(
                    "animateTransform, animateMotion, animate",
                ),
            )) {
                n.remove();
            }

            const snapshot = new XMLSerializer().serializeToString(clone);
            const blobUrl = URL.createObjectURL(
                new Blob([snapshot], { type: "image/svg+xml" }),
            );
            try {
                const img = new Image(sizePx, sizePx);
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () =>
                        reject(new Error(`Frame ${i} failed to decode: ${url}`));
                    img.src = blobUrl;
                });
                ctx.clearRect(0, 0, sizePx, sizePx);
                ctx.drawImage(img, 0, 0, sizePx, sizePx);
                frames.push(ctx.getImageData(0, 0, sizePx, sizePx));
            } finally {
                URL.revokeObjectURL(blobUrl);
            }
        }
        return { frames, frameMs };
    } finally {
        host.remove();
    }
}

/**
 * Playback rate for baked marker animations, and the fallback loop length for a
 * rig that declares no usable `dur`.
 *
 * 24fps, not the 6fps this used to run at. The tail swings ~78° per beat, so at
 * 6fps each frame jumped ~26° of tail — that's what read as choppy/strobing
 * rather than wagging. 24fps is the film-motion floor and puts the step under
 * 7°, which reads as continuous.
 *
 * Cost stays modest because the frames are SHARED: `updateImage` swaps the
 * pixels behind ONE icon id that every dog on the map references, so this is a
 * single rAF loop and a single strip regardless of how many dogs are on screen.
 * For this marker that's 96 frames (4.0s) at 56×56 — about 1.2 MB, paid once.
 * MAX_LOOP_MS caps what a pathological rig could ask for.
 */
const WAG_FPS = 24;
const WAG_FALLBACK_DURATION_MS = 2000;
const MAX_LOOP_MS = 8000;

/**
 * Cycle baked frames through a Mapbox image so every symbol using it animates.
 *
 * `updateImage` swaps the pixels behind ONE icon id, and every dog on the map
 * references that same id — so this is a single timer for the whole layer, no
 * matter how many dogs are on screen.
 *
 * Driven by rAF, not setInterval — and that swap is half the smoothness fix.
 * setInterval free-runs against the compositor: at 24fps its 41.67ms tick and
 * the 16.67ms frame boundary drift in and out of phase, so the icon updates
 * land unevenly and some ticks paint twice within one frame while others are
 * skipped. That beat-frequency judder is exactly the "freezes and stutters"
 * symptom. rAF is phase-locked to paint, so each swap lands on its own frame.
 *
 * The elapsed-time index (rather than frame++) keeps the wag on the wall clock:
 * if the tab throttles or a slow paint eats a frame, the wag resumes at the
 * pose it should be at, instead of playing back in slow motion.
 *
 * Each pose swap is paired with `triggerRepaint()`, and that pairing is load
 * bearing: `updateImage` writes pixels and flags the atlas dirty but never
 * schedules a render, so on an idle map the new pose is never uploaded. That
 * is what froze the dog after a zoom settled — see the comment at the call.
 *
 * Cancelled only when the map DIES (`isMapAlive`); a stray tick after removal
 * would throw inside GL. A merely-missing image is transient (style swaps drop
 * the sprite atlas) and must not retire the loop.
 */
function startIconAnimation(
    map: mapboxgl.Map,
    iconId: string,
    frames: ImageData[],
    frameMs: number,
): void {
    const mapRecord = map as unknown as Record<string, unknown>;
    const timerKey = `__iconAnimTimer:${iconId}`;
    // Guard against a second layer re-arming the same icon (both /where and
    // the org layer can call addDogLayer for one map).
    if (mapRecord[timerKey]) return;

    const loopMs = frameMs * frames.length;
    let startedAt: number | null = null;
    let lastFrame = -1;
    let raf = 0;

    const stop = (): void => {
        cancelAnimationFrame(raf);
        delete mapRecord[timerKey];
    };

    const tick = (now: number): void => {
        // A dead map is terminal — bail for good. But a MISSING IMAGE is not:
        // Mapbox drops the sprite atlas mid-`setStyle`, so `hasImage` goes
        // false for a few frames during a basemap swap. Treating that as
        // terminal (the first cut did) retired the wag permanently on a
        // transient condition. Keep spinning and pick the icon back up when it
        // returns; the rAF is idle-cheap while it's gone.
        if (!isMapAlive(map)) {
            stop();
            return;
        }
        if (!map.hasImage(iconId)) {
            raf = requestAnimationFrame(tick);
            return;
        }
        if (startedAt === null) startedAt = now;
        const elapsed = (now - startedAt) % loopMs;
        const frame = Math.min(
            frames.length - 1,
            Math.floor(elapsed / frameMs),
        );
        // Only touch GL when the pose actually changes — at 24fps on a 60Hz
        // display that's ~2 of every 5 frames.
        if (frame !== lastFrame) {
            lastFrame = frame;
            map.updateImage(iconId, frames[frame]);
            // …and ASK FOR THE FRAME. `updateImage` only writes pixels into the
            // image manager and flags the sprite atlas dirty; it does NOT
            // schedule a render. On an idle map — nothing easing, globe-spin
            // stopped, which is exactly the state a zoom settles into — there
            // is no next frame to consume that flag, so the new pose is never
            // uploaded and the dog freezes on whatever pose was last painted
            // (often mid-blink). It only looked fine before because the globe
            // was auto-spinning and the wag was riding along on SOMEONE ELSE'S
            // repaints. `triggerRepaint` makes the wag drive its own.
            map.triggerRepaint();
        }
        raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    mapRecord[timerKey] = true;

    map.once("remove", stop);
}

/**
 * Animated dog symbol layer — the tail wags. Zoom-dependent icon-size so dogs
 * read as small accents at globe zoom and grow to a legible size when zoomed
 * in to look at individual land parcels.
 */
async function addDogLayer(
    map: mapboxgl.Map,
    sourceId: string,
    markerUrl: string,
    onPointClick?: (feature: mapboxgl.MapboxGeoJSONFeature) => void,
): Promise<void> {
    const iconId = `${sourceId}-dog`;
    const layerId = `${sourceId}-dogs`;
    const mapRecord = map as unknown as Record<string, unknown>;

    if (!map.hasImage(iconId)) {
        const sizePx = MAP_CONFIG.marker.iconPixelSize;
        // Try the animated bake first; a marker with no SMIL in it (or a
        // browser that won't seek the clock) falls back to the single static
        // frame, so a plain SVG marker still works exactly as before.
        let frames: ImageData[];
        let frameMs = WAG_FALLBACK_DURATION_MS;
        try {
            const baked = await rasterizeSvgFrames(
                markerUrl,
                sizePx,
                WAG_FPS,
                WAG_FALLBACK_DURATION_MS,
            );
            frames = baked.frames;
            frameMs = baked.frameMs;
        } catch (err) {
            console.warn(
                "[map] animated marker bake failed, using a static icon:",
                err,
            );
            frames = [await rasterizeSvg(markerUrl, sizePx)];
        }
        if (!isMapAlive(map)) return;
        if (!map.hasImage(iconId)) {
            map.addImage(iconId, frames[0], { pixelRatio: 2 });
            if (frames.length > 1) {
                startIconAnimation(map, iconId, frames, frameMs);
            }
        }
    }

    if (!isMapAlive(map)) return;

    if (!map.getLayer(layerId)) {
        const base = MAP_CONFIG.marker.iconSize;
        map.addLayer({
            id: layerId,
            type: "symbol",
            source: sourceId,
            filter: ["!", ["has", "point_count"]],
            layout: {
                "icon-image": iconId,
                // Zoom-adaptive size — smaller on the globe, bigger up close.
                "icon-size": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    2,
                    base * 0.55,
                    8,
                    base * 0.85,
                    14,
                    base * 1.15,
                ],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-anchor": "center",
            },
        });
    }

    const clickBoundKey = `__dogClickBound:${layerId}`;
    if (!mapRecord[clickBoundKey]) {
        mapRecord[clickBoundKey] = true;
        if (onPointClick) {
            map.on("click", layerId, (e) => {
                const feature = e.features?.[0];
                if (feature)
                    onPointClick(feature as mapboxgl.MapboxGeoJSONFeature);
            });
        }
        map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
        });
    }
}

/**
 * Add a clustered pin source + layers to the map.
 *
 * Rendering stack (bottom → top, all WebGL):
 *   1. Heatmap layer (zoom 0 – heatmap.maxZoom): density glow at globe zoom
 *   2. Cluster glow halo: soft oversized gold underlay
 *   3. Cluster core circles (graduated): transparent fill, white ring
 *   4. Animated dog symbol layer: unclustered points, frame-cycled wag
 */
export function addClusteredPins(
    map: mapboxgl.Map,
    config: ClusteredPinsConfig,
): void {
    if (!isMapAlive(map)) return;

    const {
        id,
        data,
        onPointClick,
        clusterRadius = MAP_CONFIG.cluster.radius,
    } = config;
    const mapRecord = map as unknown as Record<string, unknown>;

    // Filter NaN/non-Point features at the source boundary. A single
    // bad coord in a clustered source causes Mapbox to crash inside
    // _evaluateOpacity during render — and the stack trace points at
    // mapbox-gl internals, not the offending feature. Drop them here.
    const safeData = filterFiniteFeatures(data);

    const existing = map.getSource(id) as mapboxgl.GeoJSONSource | undefined;
    if (existing) {
        existing.setData(safeData);
    } else {
        map.addSource(id, {
            type: "geojson",
            data: safeData,
            generateId: true,
            cluster: true,
            clusterMaxZoom: MAP_CONFIG.cluster.maxZoom,
            clusterRadius,
        });
    }

    const heatMinZoom = MAP_CONFIG.cluster.heatmap.minZoom;
    const heatMaxZoom = MAP_CONFIG.cluster.heatmap.maxZoom;

    const heatLayerId = `${id}-heat`;
    if (!map.getLayer(heatLayerId)) {
        map.addLayer({
            id: heatLayerId,
            type: "heatmap",
            source: id,
            minzoom: heatMinZoom,
            maxzoom: heatMaxZoom + 1,
            paint: {
                "heatmap-weight": [
                    "interpolate",
                    ["linear"],
                    ["coalesce", ["get", "point_count"], 1],
                    1,
                    0.2,
                    50,
                    0.7,
                    200,
                    1,
                ],
                "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    0.6,
                    heatMaxZoom,
                    2.2,
                ],
                "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    14,
                    heatMaxZoom,
                    38,
                ],
                "heatmap-color": heatmapColorExpression(),
                "heatmap-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    heatMaxZoom - 2,
                    0.9,
                    heatMaxZoom,
                    0,
                ],
            },
        });
    }

    const glowLayerId = `${id}-cluster-glow`;
    if (!map.getLayer(glowLayerId)) {
        map.addLayer({
            id: glowLayerId,
            type: "circle",
            source: id,
            filter: ["has", "point_count"],
            paint: {
                "circle-color": MAP_CONFIG.cluster.glow.color,
                "circle-radius": circleRadiusExpression(
                    MAP_CONFIG.cluster.glow.radiusScale,
                ),
                "circle-blur": MAP_CONFIG.cluster.glow.blur,
            },
        });
    }

    const clusterLayerId = `${id}-clusters`;
    if (!map.getLayer(clusterLayerId)) {
        map.addLayer({
            id: clusterLayerId,
            type: "circle",
            source: id,
            filter: ["has", "point_count"],
            paint: {
                "circle-color": circleColorExpression(),
                "circle-radius": circleRadiusExpression(),
                "circle-stroke-width": MAP_CONFIG.cluster.stroke.width,
                "circle-stroke-color": MAP_CONFIG.cluster.stroke.color,
                "circle-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    heatMaxZoom - 3,
                    0,
                    heatMaxZoom - 1,
                    1,
                ],
            },
        });
    }

    // Fire-and-forget: dogs appear as soon as the SVG finishes rasterizing.
    const markerUrl = config.markerUrl || MAP_CONFIG.markers.default;
    addDogLayer(map, id, markerUrl, onPointClick).catch((err) =>
        console.error("Failed to add dog layer:", err),
    );

    const boundClusterKey = `__clusteredPinsClusterClickBound:${id}`;
    if (!mapRecord[boundClusterKey]) {
        mapRecord[boundClusterKey] = true;
        map.on("click", clusterLayerId, (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: [clusterLayerId],
            });
            if (features.length === 0) return;
            const geometry = features[0].geometry;
            if (geometry.type !== "Point") return;
            const center: Coord | null = toCoordFromArray(geometry.coordinates);
            if (!center) return;
            const nextZoom = Math.min(
                map.getZoom() + 3,
                MAP_CONFIG.cluster.clickZoom,
            );
            safeEase(map, { center, zoom: nextZoom });
        });
        map.on("mouseenter", clusterLayerId, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", clusterLayerId, () => {
            map.getCanvas().style.cursor = "";
        });
    }
}

export async function addOrgMarkers(
    map: mapboxgl.Map,
    config: OrgMarkerConfig,
): Promise<void> {
    const { id, data, onMarkerClick, markerUrl } = config;

    const features = data
        .filter((org) => {
            const lat = Number(org.latitude);
            const lon = Number(org.longitude);
            return (
                org.latitude &&
                org.longitude &&
                Math.abs(lat) >= 1 &&
                Math.abs(lon) >= 1
            );
        })
        .map((org) => ({
            type: "Feature",
            properties: {
                id: org.organizationKey || org.id,
                name: org.organizationName || org.displayName,
                address: org.organizationAddress || org.address,
                website:
                    org.organizationWebsite ||
                    org.displayWebsite ||
                    org.website,
                claimQty: org.claimQty,
            },
            geometry: {
                type: "Point",
                coordinates: [Number(org.longitude), Number(org.latitude)],
            },
        }));

    const geojson: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: "FeatureCollection",
        features: features as Feature<Geometry, GeoJsonProperties>[],
    };

    addClusteredPins(map, {
        id,
        data: geojson,
        markerUrl,
        onPointClick: (feature) => {
            const orgId = feature.properties?.id;
            if (onMarkerClick && orgId) onMarkerClick(orgId);
        },
    });
}
