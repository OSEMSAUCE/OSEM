<script lang="ts">
/**
 * THE ONLINE MAP'S OWN DEMO — the org globe.
 *
 * Relative, not $harness: the path stays correct when this child is lifted into
 * its own repo. The shell's src/routes/who/map/+page.svelte is a two-line
 * mount naming the URL this answers on.
 */
import MapPage from "../../lib/mapPage.svelte";
</script>

<MapPage variant="org" />
