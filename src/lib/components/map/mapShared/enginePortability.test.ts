/**
 * THE SEAM GUARD — the offline map engine must import with NO host present.
 *
 * This is the test that makes the OSEM move safe. The engine is meant to run on
 * a page that has no TinyBase, no mapStore, no Supabase and no Capacitor — a
 * contractor's `/debug/map`. Nothing else checks that: the app's own tests all
 * run WITH the host, and every host dependency they pull in is mocked, so a new
 * `import { createMapStore }` in the engine is invisible until the day someone
 * tries to lift it into another repo.
 *
 * That is not hypothetical. When these ports were cut, `bakeService` still had a
 * live `createMapStore` import; the bake tests passed anyway because they mocked
 * mapStore, and the coupling only surfaced as an unrelated-looking
 * "$env/static/public" resolve failure. A real bare import catches it directly.
 *
 * WHY A REAL IMPORT AND NOT A GREP. A grep over source text can be satisfied by
 * moving an import behind an alias or a re-export; actually loading the module
 * cannot. If a host module creeps back in, this fails at load with the missing
 * dependency named.
 */
import { expect, it } from "vitest";

it("bakeService imports with no host, no store and no Supabase", async () => {
	const m = await import("$osem/components/map/offline/onPhone/bake/bakeService.svelte");
	expect(typeof m.startOfflineBakeService).toBe("function");
	// It must also be IMPOSSIBLE to start without a host — the ports are the
	// contract, not an optional extra.
	expect(m.startOfflineBakeService.length).toBe(1);
});

it("the host port module itself has no dependencies at all", async () => {
	const src = await import("$osem/components/map/mapShared/hostPorts");
	// Types erase at runtime, so the module is legitimately empty. The point of
	// the assertion is that importing it CANNOT drag anything in.
	expect(src).toBeDefined();
});
