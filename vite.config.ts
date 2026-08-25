import { sveltekit } from "@sveltejs/kit/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { noEscapeHatch } from "./src/lib/guards/noEscapePlugin";

// No PWA plugin here on purpose. Get Cache is a Capacitor native app — no
// service worker, no web manifest (see ReTreever/CLAUDE.md). The VitePWA block
// that used to sit here was the map-only era's mobile config stranded in OSEM:
// nothing ever imported `virtual:pwa-register`, its `navigateFallback: "/offline"`
// route doesn't exist, and `start_url: "/mobile"` points at a deleted prefix.
// It silently emitted an unused service worker until a 3 MB chunk crossed
// workbox's 2 MiB precache limit and turned it into a hard build failure.

export default defineConfig({
	plugins: [
		// THE DOOR — the same one ReTreever arms, on the other side of the
		// house. Both parents mount the same children, so an escape a child
		// makes is only caught by whichever parent happens to build it. With
		// the guard on one side only, `npm run dev` here was the unpoliced
		// route: a child could reach into ReTreever and this server would
		// serve it happily, because on this machine the path resolves.
		//
		// The root is the WORKSPACE (fetch/), not rapper/: the children are
		// SIBLINGS of the two parents, so the plugin has to see the whole flat
		// layout to find which child a file belongs to. It then scopes each
		// file to ITS OWN child — see childRootOf in the plugin. Passing
		// rapper/ here would make every child look "outside", which is the
		// mirror of the bug that made this vacuous in ReTreever all of
		// 25 Aug 2026.
		noEscapeHatch(fileURLToPath(new URL("..", import.meta.url))),
		sveltekit(),
	],

	/**
	 * WHO THE OTHER TIER IS — injected by RAPPER, never written in a child.
	 *
	 * The dev pill links to the same page under the other parent, so something
	 * has to know that parent's name and origin. A child may not: it has two
	 * possible parents and is published on its own, so any such name is a fact
	 * about THIS machine that would ship inside the open-source repo.
	 * `noParentNames.test.ts` enforces that, and it caught two attempts on
	 * 25 Aug 2026 — first in the pill, then in the shell layout — because the
	 * shell has to live inside the child's routes/ (SvelteKit resolves layouts
	 * only from kit.files.routes, so rapper cannot hold the file itself).
	 *
	 * So the knowledge goes in the one place that is unambiguously RAPPER: this
	 * config. `define` substitutes at build time, so the child reads a name it
	 * does not contain, and a child cloned alone reads `undefined` and simply
	 * renders no pill.
	 *
	 * Dev addresses only, and the whole bar is compiled out of a production
	 * build (`import.meta.env.DEV`), so nothing here reaches a shipped bundle.
	 *
	 * THE KEYS ARE `import.meta.env.VITE_*`, NOT BARE GLOBALS, and that shape
	 * is load-bearing. `define` is a literal text substitution, so a bare
	 * `__X__` throws ReferenceError in a child cloned WITHOUT rapper — the very
	 * checkout the child exists to support — while wrapping it in
	 * `typeof __X__ === "string"` makes Vite skip the substitution entirely and
	 * the value never arrives. `import.meta.env` is always a real object, so a
	 * missing key is simply `undefined`. Both failures were MEASURED.
	 */
	define: {
		"import.meta.env.VITE_RAPPER_TIER": JSON.stringify("rapper"),
		"import.meta.env.VITE_OTHER_TIER": JSON.stringify("retreever"),
		"import.meta.env.VITE_OTHER_ORIGIN": JSON.stringify(
			"http://retreever.localhost:5173",
		),
		// Where the OTHER parent mounts this child. The two need not agree:
		// rapper serves one page at "/", ReTreever serves /who and /what from
		// one dynamic route. Carrying the path across verbatim was MEASURED
		// landing on a 404.
		"import.meta.env.VITE_OTHER_MOUNT": JSON.stringify("/who"),
		// Which half of the pill this tier occupies. FIXED per tier —
		// retreever left, rapper right — so the control renders identically on
		// both servers and only the HIGHLIGHT moves. It used to render "me"
		// first, so the halves swapped sides between :5173 and :5174 and the
		// control moved under the cursor.
		"import.meta.env.VITE_TIER_SLOT": JSON.stringify("right"),
	},
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
});
