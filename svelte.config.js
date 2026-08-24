import adapterVercel from "@sveltejs/adapter-vercel";
import adapterStatic from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const isCapacitor = process.env.BUILD_TARGET === "cap";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess({ postcss: true }),
    kit: {
        adapter: isCapacitor
            ? adapterStatic({
                  pages: "build-cap",
                  assets: "build-cap",
                  fallback: "index.html",
                  precompress: false,
                  strict: false,
              })
            : adapterVercel({
                  runtime: "nodejs24.x",
              }),
        /**
         * THE LINCHPIN — the harness defines NO alias that leaves it.
         *
         * A child is a trailer. Hitched to ReTreever it gets app.css, the
         * utils, the whole parent app. Unhitched it must still STAND — plainer,
         * fewer features, but running. What it must never do is collapse.
         *
         * It used to collapse silently the other way. `$lib` was defined here
         * pointing at ./src/lib — the SAME directory as `$harness`. So a child
         * importing `$lib/anything` resolved into the harness's own lib and
         * "worked", on this machine, where ReTreever happens to sit next door.
         * On a contractor's laptop it dies. `$generated` was worse: it pointed
         * at "../src/lib/generated", reaching up out of the harness and into
         * ReTreever itself.
         *
         * So the wall is an ABSENCE, not a check. With no `$lib` defined, a
         * child that reaches for ReTreever fails to BUILD — here, on your
         * machine, in the harness — which is the same failure a contractor
         * would hit, found by you first. childBoundary.test.ts states this rule
         * in test form; this is what makes it TRUE rather than merely asserted.
         *
         * Do NOT re-add `$lib` or `$generated` to make an import resolve. That
         * is unhitching the trailer and bolting the truck back on.
         */
        alias: {
            $harness: "./src/lib",
            "$harness/*": "./src/lib/*",
        },
    },
};

export default config;
