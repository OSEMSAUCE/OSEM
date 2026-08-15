import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

// No PWA plugin here on purpose. Get Cache is a Capacitor native app — no
// service worker, no web manifest (see ReTreever/CLAUDE.md). The VitePWA block
// that used to sit here was the map-only era's mobile config stranded in OSEM:
// nothing ever imported `virtual:pwa-register`, its `navigateFallback: "/offline"`
// route doesn't exist, and `start_url: "/mobile"` points at a deleted prefix.
// It silently emitted an unused service worker until a 3 MB chunk crossed
// workbox's 2 MiB precache limit and turned it into a hard build failure.

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ["src/**/*.{test,spec}.{js,ts}"],
    },
});
