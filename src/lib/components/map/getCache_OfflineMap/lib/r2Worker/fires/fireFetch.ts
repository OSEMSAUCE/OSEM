/**
 * v4FireFetch — pull one area's hotspots from our Worker.
 *
 * Deliberately thin. The phone asks our own /fires endpoint for a disc and gets
 * back trimmed GeoJSON; every hard part (three-satellite fan-out, CSV parsing,
 * dedupe, the FIRMS key) lives on the Worker. The phone never talks to NASA and
 * never holds the key.
 *
 * ── Two rules this file exists to enforce ──
 * 1. A FAILURE MUST THROW. Returning an empty list on a network error would
 *    render as "no fires near you" — the single most dangerous lie this layer
 *    can tell. The caller catches, backs off, and KEEPS the last good cache.
 * 2. NEVER hang. A field phone on lie-fi (connected, no throughput) will leave
 *    a bare fetch pending forever; an un-timed fetch is a documented cause of
 *    past field failures here. Hence the explicit AbortController timeout.
 */

import { guardPackDownload } from "$osem/components/map/getCache_OfflineMap/lib/onPhone/store/downloadGuard";
import { firesUrl } from "$osem/components/map/getCache_OfflineMap/lib/r2Worker/tilesHost";
import {
	FIRE_RADIUS_KM,
	type FireHotspot,
} from "$osem/components/map/mapShared/fireContract";

// firesUrl() (and which Worker it points at) lives in r2Worker/tilesHost.

/**
 * Wall-clock cap for one fire fetch. Generous enough for a cold Worker doing
 * three upstream NASA calls on a slow link, short enough that a wedged request
 * can't stall the bake pass behind it.
 */
const FIRE_TIMEOUT_MS = 20_000;

export interface FireFetchResult {
	hotspots: FireHotspot[];
	/** Server's fetch time (X-Fetched-At) — the edge may serve a cached slice, so
	 *  trusting our own clock would overstate freshness by up to the cache TTL. */
	fetchedAt: number;
	/** How many of the three satellites reported (X-Sources-Ok). */
	sourcesOk: number;
	/** Response size, for the cellular-gate tally. */
	bytes: number;
}

/** Minimal shape we require back; anything else is a malformed response. */
interface FireGeoJSON {
	type: string;
	features?: Array<{
		geometry?: { coordinates?: [number, number] };
		properties?: {
			t?: number;
			c?: string;
			frp?: number;
			/** Pixel footprint km + day/night pass — optional, popup-only. */
			px?: number;
			dn?: string;
		};
	}>;
}

function toConfidence(raw: unknown): FireHotspot["c"] {
	// Unknown codes fall to the WEAKEST reading — never silently promoted.
	return raw === "high" ? "high" : raw === "nominal" ? "nominal" : "low";
}

/**
 * Fetch hotspots for one area. Throws on any failure (see rule 1 above).
 *
 * `guardPackDownload` is the same session circuit-breaker the tile downloader
 * trips against, so a runaway bake loop can't hammer this endpoint either.
 */
export async function fetchAreaFires(
	lng: number,
	lat: number,
	radiusKm: number = FIRE_RADIUS_KM,
): Promise<FireFetchResult> {
	guardPackDownload({ route: "fires", lng, lat, km: radiusKm });

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FIRE_TIMEOUT_MS);
	let res: Response;
	let text: string;
	try {
		res = await fetch(
			`${firesUrl()}?lng=${lng}&lat=${lat}&km=${Math.round(radiusKm)}`,
			{ signal: controller.signal },
		);
		if (!res.ok) {
			throw new Error(`fires endpoint responded ${res.status}`);
		}
		text = await res.text();
	} finally {
		clearTimeout(timer);
	}

	let parsed: FireGeoJSON;
	try {
		parsed = JSON.parse(text) as FireGeoJSON;
	} catch {
		throw new Error("fires endpoint returned a non-JSON body");
	}
	if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
		throw new Error("fires endpoint returned a malformed FeatureCollection");
	}

	const hotspots: FireHotspot[] = [];
	for (const f of parsed.features) {
		const c = f.geometry?.coordinates;
		const t = f.properties?.t;
		if (!Array.isArray(c) || c.length !== 2) continue;
		if (!Number.isFinite(c[0]) || !Number.isFinite(c[1])) continue;
		if (typeof t !== "number" || !Number.isFinite(t)) continue;
		hotspots.push({
			coordinates: [c[0], c[1]],
			t,
			c: toConfidence(f.properties?.c),
			frp: Number.isFinite(f.properties?.frp) ? (f.properties?.frp as number) : 0,
			// Optional context for the tap popup. Carried through as undefined
			// when absent — never defaulted to a number, because "we don't know
			// the footprint" and "the footprint is 0" are different claims and
			// only one of them is honest.
			...(Number.isFinite(f.properties?.px)
				? { px: f.properties?.px as number }
				: {}),
			...(f.properties?.dn === "D" || f.properties?.dn === "N"
				? { dn: f.properties.dn as "D" | "N" }
				: {}),
		});
	}

	// Prefer the server's stamp; fall back to ours only if the header is missing
	// (the CORS expose-headers trap makes a custom header read as null when it
	// isn't explicitly exposed — the route exposes it, but don't crash if not).
	const headerAt = Number(res.headers.get("X-Fetched-At"));
	const sourcesOk = Number(res.headers.get("X-Sources-Ok"));

	return {
		hotspots,
		fetchedAt: Number.isFinite(headerAt) && headerAt > 0 ? headerAt : Date.now(),
		sourcesOk: Number.isFinite(sourcesOk) && sourcesOk > 0 ? sourcesOk : 3,
		bytes: text.length,
	};
}
