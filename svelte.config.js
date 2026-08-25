import adapterVercel from "@sveltejs/adapter-vercel";
import adapterStatic from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const isCapacitor = process.env.BUILD_TARGET === "cap";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
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
            // THE CHILDREN ARE FLAT — siblings of rapper in fetch/, not nested
            // inside src/lib any more (moved 25 Aug 2026). The wall is still an
            // ABSENCE: no $lib, no $generated, so a child reaching for a parent
            // still fails to build. Only the children's own location changed.
            $harness: "../",
            "$harness/*": "../*",
        },
        /**
         * THE MOUNTED CHILD'S ROUTES ARE THE APP'S ROUTES.
         *
         * SvelteKit serves whatever is under `kit.files.routes`, and that used
         * to be rapper's own `src/routes/` holding a shell layout plus a
         * two-line mount page per view — pages whose whole job was to import
         * the child's real page from `src/lib/<child>/routes/`.
         *
         * That indirection is deleted. The child already carries its own
         * `routes/` so it can be lifted into its own repo whole; pointing
         * SvelteKit straight at it removes the only reason rapper needed a
         * `src/routes/` at all. One child, one route tree, no forwarding pages
         * that can drift out of sync with what they forward to.
         *
         * THIS LINE IS WHAT THE INSTALLER WRITES. A rapper install carries
         * exactly one child, chosen at install time; this path names it. A
         * second child means a second install, in a second folder.
         *
         * If rapper builds and emits NO pages, this path is wrong — SvelteKit
         * does not error on a missing route tree, it silently serves nothing.
         */
        files: {
            routes: "../ReTreever_who_what/routes",
        },
    },
};

export default config;
