<!--
    OgMap — air-gapped Mapbox instance for Offline Gopher.

    Distinct from the regular /mobile/map mapboxgl.Map: separate
    DOM container, separate Map object, hand-built local-only style,
    locked-down transformRequest. Constructed so it cannot ever
    reach the internet — see ogTransformRequest.ts for the guarantee.

    v1 renders just the world floor (CartoDB Dark Matter z0-7).
    Country fill + blob layers come in subsequent passes.
-->
<script lang="ts">
import { onMount } from "svelte";
import mapboxgl from "mapbox-gl";
import { buildOgStyle } from "./offlineStyle";
import { ogTransformRequest } from "./offlineTransformRequest";
import { purgeLegacyKeys } from "./offlineStorage";
import { isCoord } from "../../mapParts/coord";
import OgMapChrome from "./OfflineMapChrome.svelte";

const OG_FALLBACK_CENTER: [number, number] = [-123.12, 49.28];
const OG_FALLBACK_ZOOM = 9;

let {
    initialCenter = OG_FALLBACK_CENTER,
    initialZoom = OG_FALLBACK_ZOOM,
    map = $bindable(null),
}: {
    initialCenter?: [number, number];
    initialZoom?: number;
    map?: mapboxgl.Map | null;
} = $props();

let container: HTMLDivElement;

onMount(() => {
    purgeLegacyKeys();
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    // Construction-time NaN guard — same reason as mapInit.ts. Stale-store
    // or garbage props must not reach mapbox's constructor or its internal
    // mousemove handler will throw "Invalid LngLat object: (NaN, NaN)".
    const safeCenter: [number, number] = isCoord(initialCenter)
        ? ([initialCenter[0], initialCenter[1]] as [number, number])
        : OG_FALLBACK_CENTER;
    const safeZoom = Number.isFinite(initialZoom)
        ? initialZoom
        : OG_FALLBACK_ZOOM;
    if (safeCenter !== initialCenter || safeZoom !== initialZoom) {
        console.warn("[OgMap] degenerate initial camera — using defaults", {
            got: { center: initialCenter, zoom: initialZoom },
            using: { center: safeCenter, zoom: safeZoom },
        });
    }
    const m = new mapboxgl.Map({
        container,
        style: buildOgStyle(),
        center: safeCenter,
        zoom: safeZoom,
        minZoom: 0,
        maxZoom: 16,
        interactive: true,
        pitch: 0,
        bearing: 0,
        // Default attribution control is off — OgMapChrome mounts a
        // bundled attribution + scale bar as a unit so chrome stays
        // together as one feature, not two scattered ones.
        attributionControl: false,
        transformRequest: (url) => ogTransformRequest(url) ?? { url },
    });
    m.dragRotate.disable();
    m.touchZoomRotate.disableRotation();
    // Don't expose the map upward until the style has finished loading.
    // Consumers (MapDrawControls, blob composite mount) call addSource
    // immediately on receipt — calling that before style.load throws
    // "Style is not done loading."
    const onLoad = () => {
        map = m;
    };
    if (m.isStyleLoaded()) onLoad();
    else m.once("load", onLoad);
    return () => {
        // Don't null the bound prop here — child cleanups run before
        // the parent's $effect teardowns, and consumers (MapDrawControls)
        // call map.off() in their teardown. Reading `null.off` crashes.
        // m.remove() is enough; the parent unmounts immediately after.
        m.remove();
    };
});
</script>

<div bind:this={container} class="og-map"></div>
<OgMapChrome {map} />

<style>
.og-map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: #000;
}
</style>
