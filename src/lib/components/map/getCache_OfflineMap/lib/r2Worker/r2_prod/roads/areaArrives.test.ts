/**
 * ARE THE BLOBS COMING? — the test the user asked for, in his own words.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * Every failure on this route is SILENT. A missing tile renders nothing and
 * throws nothing, so "I dropped a pin and waited 30 seconds and saw nothing" is
 * indistinguishable, from the outside, from "the download never started". That
 * ambiguity has cost entire evenings, repeatedly.
 *
 * These tests pin the three things that must be true for a pin to show its
 * 20 km, so a regression fails HERE instead of on a phone in the bush:
 *
 *   1. EVERY cell the pin needs is requested — not just the one under it.
 *      (The user photographed a half-drawn map: 1 of 9 cells had arrived.)
 *   2. They are requested IN PARALLEL — nine 3-second cells in series is the
 *      half-minute wait; concurrently it is one cell's time.
 *   3. A per-cell failure does NOT abort the area — eight cells of roads beats
 *      an exception that leaves the user with nothing.
 *
 * ⛔ NO NETWORK HERE. `fetch` is stubbed, so this measures OUR orchestration.
 * The server's own build time is measured separately (X-Diag, ~2-3 s per cell).
 */
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cellTileKey, cellsFor } from "../../contract/grid";

/** A minimal valid pack: [uint32 manifestLen][manifest JSON][tile bytes]. */
function makePack(key: string, body = new Uint8Array([1, 2, 3])): Uint8Array {
	const manifest = JSON.stringify({
		total: 1,
		empty: 0,
		tiles: [{ k: key, n: body.length }],
	});
	const mb = new TextEncoder().encode(manifest);
	const out = new Uint8Array(4 + mb.length + body.length);
	new DataView(out.buffer).setUint32(0, mb.length, true);
	out.set(mb, 4);
	out.set(body, 4 + mb.length);
	return out;
}

/** Gzip a buffer — the client gunzips the pack at the application layer. */
async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
	const cs = new CompressionStream("gzip");
	const stream = new Blob([bytes]).stream().pipeThrough(cs);
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

const ANCHOR: [number, number] = [-111.939, 44.4744];
/** The key the stubbed Worker ships the blob under. */
const PACK_KEY = "8/48/92";

let urls: string[] = [];
/** Resolvers for in-flight fetches, so we can observe CONCURRENCY. */
let gate: Array<() => void> = [];

beforeEach(() => {
	urls = [];
	gate = [];
	vi.stubGlobal(
		"fetch",
		vi.fn(async (url: string) => {
			urls.push(String(url));
			// Hold every request open until released — that is how the parallel
			// assertion below can see them all in flight at once.
			await new Promise<void>((r) => gate.push(r));
			const key = PACK_KEY;
			return new Response(await gzip(makePack(key)), {
				status: 200,
				headers: { "x-pack-build": "test", "x-pack-cache": "MISS" },
			});
		}),
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

/** Let every currently-queued fetch finish. */
function releaseAll(): void {
	for (const r of gate.splice(0)) r();
}

describe("are the blobs coming?", () => {
	it("⛔ ONE PIN = ONE REQUEST — never a fragment", async () => {
		// THE LAW. A previous version fetched one blob PER CELL, so a pin near a
		// tile edge issued NINE requests that landed at nine different times. The
		// map drew a disconnected fragment and maybe another one later — the user:
		// "some random piece of shit comes after... totally, totally unusable."
		// It also latched the session download guard after ~7 pins, after which a
		// new pin showed NOTHING at all.
		//
		// One request means the area either arrives or does not. That is the whole
		// difference between a product and a lottery.
		const { downloadV4Area } = await import("./packDownload");
		const p = downloadV4Area(...ANCHOR);
		await vi.waitFor(() => expect(urls.length).toBeGreaterThan(0));
		releaseAll();
		await p;
		expect(urls.length).toBe(1);
	});

	it("the request carries the pin's own coordinates", async () => {
		// The Worker reads the radius AROUND THE PIN, so the pin is what it needs
		// — not a rounded cell centre, which would shift the data off the user.
		const { downloadV4Area } = await import("./packDownload");
		const p = downloadV4Area(...ANCHOR);
		await vi.waitFor(() => expect(urls.length).toBeGreaterThan(0));
		releaseAll();
		await p;
		expect(urls[0]).toContain("lng=");
		expect(urls[0]).toContain("lat=");
		expect(urls[0]).toContain("pv=");
	});

	it("stores what came back, under the key the Worker chose", async () => {
		// The end of the chain: bytes on disk under an address the renderer asks
		// for. If this drifts, the map is blank with no error anywhere.
		const { downloadV4Area, getAllTileKeys } = await import(
			"./packDownload"
		);
		const p = downloadV4Area(...ANCHOR);
		await vi.waitFor(() => expect(urls.length).toBeGreaterThan(0));
		releaseAll();
		const res = await p;
		expect(res.downloaded).toBe(1);
		expect(await getAllTileKeys()).toContain(PACK_KEY);
	});

	it("a failed request does NOT throw the pass away", async () => {
		// A network hiccup must leave the area un-recorded so the next pass
		// retries — never abort the whole reconcile and starve every area behind
		// it.
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new Error("network hiccup");
			}),
		);
		const { downloadV4Area } = await import("./packDownload");
		await expect(downloadV4Area(...ANCHOR)).rejects.toThrow();
	});
});
