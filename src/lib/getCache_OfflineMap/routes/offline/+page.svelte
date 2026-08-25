<script lang="ts">
/**
 * /offline — the offline map WITHOUT the debug rails.
 *
 * Same page as /debug/map, same engine, same fixtures; `rails={false}` hides
 * the two debug panels. Deliberately NOT a second copy of the page: the engine
 * wiring is the part that drifts, and two copies of it would drift apart the
 * first time either one is touched.
 *
 * NOTE this is not ReTreever's real /offline. That one imports $lib in eleven
 * places — mapStore, MapTopControls, MapLegend, toast icons — which is tier-1
 * proprietary code a child must never carry. This is the fixture-backed view:
 * honest about being a demo, and it runs on nothing.
 */
import Demo from "../demo/+page.svelte";
</script>

<Demo rails={false} />
