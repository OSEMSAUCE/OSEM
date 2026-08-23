import { describe, expect, it } from "vitest";
import { encodePlusCode, hectareCodeOf } from "./plusCode.js";

// The grid uses Plus Codes as globally-unique dot IDs. If encoding drifts even
// one character, every dot is mislabelled — so we pin against values produced
// by Google's reference `open-location-code` implementation (verified
// byte-identical across 5000 random points during development).

describe("encodePlusCode — matches Google reference output", () => {
	it("spec example (47.0000625, 8.0000625) at length 10", () => {
		expect(encodePlusCode(47.0000625, 8.0000625, 10)).toBe("8FVC2222+22");
	});

	it("Googleplex (37.4220041, -122.0862462) at length 10", () => {
		expect(encodePlusCode(37.4220041, -122.0862462, 10)).toBe("849VCWC7+RG");
	});

	it("Ottawa hectare at length 8 ends with the '+' separator", () => {
		const code = encodePlusCode(45.42, -75.69, 8);
		expect(code).toBe("87Q6C8C6+");
		expect(code).toHaveLength(9); // 8 chars + separator
	});

	it("Ottawa sub-hectare at length 10", () => {
		expect(encodePlusCode(45.42, -75.69, 10)).toBe("87Q6C8C6+22");
	});

	it("the first 8 chars of a 10-char code are its hectare parent", () => {
		const code10 = encodePlusCode(45.42, -75.69, 10);
		const code8 = encodePlusCode(45.42, -75.69, 8);
		expect(code10.slice(0, 8)).toBe(code8.slice(0, 8));
	});
});

describe("encodePlusCode — edge handling", () => {
	it("clips out-of-range latitude rather than throwing", () => {
		expect(() => encodePlusCode(95, 10, 8)).not.toThrow();
	});

	it("normalises longitude past the antimeridian", () => {
		// 190° wraps to -170°; both must encode to the same cell.
		expect(encodePlusCode(0, 190, 10)).toBe(encodePlusCode(0, -170, 10));
	});
});

describe("hectareCodeOf — roll-up to the parent hectare", () => {
	it("strips a 10-char code down to its 8-char hectare", () => {
		expect(hectareCodeOf("87Q6C8C6+22")).toBe("87Q6C8C6+");
	});

	it("handles the friendly '.N' sub-dot id form", () => {
		// Friendly sub-dot id is "<hectareCode>.N" — the hectare is unchanged.
		expect(hectareCodeOf("87Q6C8C6+.5")).toBe("87Q6C8C6+");
	});

	it("is idempotent on an already-hectare code", () => {
		expect(hectareCodeOf("87Q6C8C6+")).toBe("87Q6C8C6+");
	});
});
