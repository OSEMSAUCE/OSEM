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
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
});
