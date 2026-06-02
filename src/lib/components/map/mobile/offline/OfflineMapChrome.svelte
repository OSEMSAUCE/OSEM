<!--
    OgMapChrome — bundles the standard Mapbox chrome controls so they
    stay together as a unit: attribution (the Mapbox logo + © pill) and
    the scale bar. Mounted inside OgMap.svelte once the map is ready.

    Reason this is its own component: the chrome controls are a
    visual quartet that always belong together; wiring them inline
    keeps getting them dropped or mis-positioned. One component, one
    place to find them.
-->
<script lang="ts">
import { onMount } from "svelte";
import mapboxgl from "mapbox-gl";

let { map }: { map: mapboxgl.Map | null } = $props();

let attributionControl: mapboxgl.AttributionControl | null = null;
let scaleControl: mapboxgl.ScaleControl | null = null;

$effect(() => {
    if (!map) return;
    const m = map; // capture — see MapDrawControls.svelte for why
    attributionControl = new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: "© OpenStreetMap contributors © CARTO · Esri",
    });
    scaleControl = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
    });
    m.addControl(attributionControl, "bottom-right");
    m.addControl(scaleControl, "bottom-left");
    return () => {
        try {
            if (attributionControl) m.removeControl(attributionControl);
        } catch {
            /* map already removed — ignore */
        }
        try {
            if (scaleControl) m.removeControl(scaleControl);
        } catch {
            /* ignore */
        }
        attributionControl = null;
        scaleControl = null;
    };
});
</script>
