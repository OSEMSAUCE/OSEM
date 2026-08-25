/**
 * The worker switch must be UNSHIPPABLE, not merely discouraged.
 *
 * tilesHost.ts's own warning: "a runtime toggle can be left switched on, and
 * then a shipped build quietly depends on a Worker nobody promised to keep
 * alive." A comment cannot enforce that. `import.meta.env.DEV` can: it is a
 * compile-time constant, so the override branch is dead code Vite drops from a
 * production build. These tests pin that property down.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_TARGET,
	LOCAL_DEV_HOST,
	PRODUCTION_HOST,
	getWorkerTarget,
	packUrl,
	setWorkerTarget,
	firesUrl,
	tilesHost,
} from "./tilesHost";

beforeEach(() => {
	sessionStorage.clear();
});

describe("worker target", () => {
	it("defaults to production, with no stored override", () => {
		expect(DEFAULT_TARGET).toBe("production");
		expect(getWorkerTarget()).toBe("production");
		expect(tilesHost()).toBe(PRODUCTION_HOST);
	});

	it("switches every URL together — no split-brain", () => {
		// The failure this prevents: roads from one target, fires from another.
		setWorkerTarget("localDev");
		expect(tilesHost()).toBe(LOCAL_DEV_HOST);
		expect(packUrl()).toBe(`${LOCAL_DEV_HOST}/pack`);
		expect(firesUrl()).toBe(`${LOCAL_DEV_HOST}/fires`);

		setWorkerTarget("production");
		expect(packUrl()).toBe(`${PRODUCTION_HOST}/pack`);
		expect(firesUrl()).toBe(`${PRODUCTION_HOST}/fires`);
	});

	it("URLs are read per call, so a switch takes effect without a reload", () => {
		// These used to be module-load consts. A const cannot see a later choice,
		// so the toggle would look broken — and "the switch does nothing" is how
		// you end up testing production while believing you are on local.
		setWorkerTarget("production");
		const before = packUrl();
		setWorkerTarget("localDev");
		expect(packUrl()).not.toBe(before);
	});

	it("ignores a corrupt or hostile stored value", () => {
		sessionStorage.setItem("rt_worker_target", "https://evil.example.com");
		expect(getWorkerTarget()).toBe(DEFAULT_TARGET);
		expect(tilesHost()).toBe(PRODUCTION_HOST);
	});

	it("the override is gated on import.meta.env.DEV in BOTH directions", () => {
		// The real proof is that Vite drops the branch from a prod build, which a
		// DEV-mode test cannot observe. What it CAN prove is that both the reader
		// and the writer are gated — if either loses its guard, a production build
		// becomes switchable and the shipped app can point at a dev Worker.
		const src = readSource();
		const reader = src.slice(src.indexOf("export function getWorkerTarget"));
		expect(reader.slice(0, 200)).toContain("import.meta.env.DEV");
		const writer = src.slice(src.indexOf("export function setWorkerTarget"));
		expect(writer.slice(0, 200)).toContain("import.meta.env.DEV");
	});
});

function readSource(): string {
	return readFileSync(
		fileURLToPath(new URL("./tilesHost.ts", import.meta.url)),
		"utf8",
	);
}
