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
                  runtime: "nodejs20.x",
              }),
        alias: {
            $lib: "./src/lib",
            "$lib/*": "./src/lib/*",
            $osem: "./src/lib",
            "$osem/*": "./src/lib/*",
            $generated: "../src/lib/generated",
            "$generated/*": "../src/lib/generated/*",
        },
    },
};

export default config;
