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
import { buildOgStyle } from "./ogStyle";
import { ogTransformRequest } from "./ogTransformRequest";
import { purgeLegacyKeys } from "./ogStorage";

let {
    initialCenter = [-123.12, 49.28],
    initialZoom = 9,
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
    const m = new mapboxgl.Map({
        container,
        style: buildOgStyle(),
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 0,
        maxZoom: 16,
        interactive: true,
        pitch: 0,
        bearing: 0,
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

<style>
.og-map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: #000;
}
</style>
