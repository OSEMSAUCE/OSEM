/**
 * The soft cellular download gate: never prompts on WiFi; on cellular it prompts at
 * each +100 MB; Continue raises the bar; "per feature only" latches the session flag.
 * Module state is sequential, so this runs as one monotonic flow (bytes only grow).
 */
import { beforeAll, describe, expect, it, vi } from "vitest";

let connType: "wifi" | "cellular" = "wifi";
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capacitor/network", () => ({
	Network: { getStatus: () => Promise.resolve({ connectionType: connType }) },
}));

import {
	checkDownloadGate,
	isPerFeatureOnly,
	noteDownloadedBytes,
	registerDownloadPrompt,
} from "./offlineDownloadGate";

const MB = 1024 * 1024;
let nextChoice: "continue" | "per-feature" = "continue";
const prompt = vi.fn(() => Promise.resolve(nextChoice));

describe("offlineDownloadGate (soft cellular brake)", () => {
	beforeAll(() => registerDownloadPrompt(prompt));

	it("WiFi never prompts, even past 100 MB", async () => {
		connType = "wifi";
		noteDownloadedBytes(150 * MB);
		expect(await checkDownloadGate()).toBe(false);
		expect(prompt).not.toHaveBeenCalled();
	});

	it("cellular + over the bar → prompts; Continue keeps going and raises the bar", async () => {
		connType = "cellular";
		nextChoice = "continue";
		noteDownloadedBytes(120 * MB); // now ~270 MB, past the bumped ~250 MB bar
		expect(await checkDownloadGate()).toBe(false);
		expect(prompt).toHaveBeenCalledTimes(1);
		expect(isPerFeatureOnly()).toBe(false);
	});

	it("does NOT re-prompt until the next +100 MB", async () => {
		expect(await checkDownloadGate()).toBe(false);
		expect(prompt).not.toHaveBeenCalled(); // still under the bumped bar
	});

	it("per feature only → stops the bulk pass and latches the flag", async () => {
		nextChoice = "per-feature";
		noteDownloadedBytes(120 * MB); // cross the next bar
		expect(await checkDownloadGate()).toBe(true);
		expect(prompt).toHaveBeenCalledTimes(1);
		expect(isPerFeatureOnly()).toBe(true);
	});
});
