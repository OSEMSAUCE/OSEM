<script lang="ts">
/**
 * The child's OWN demo page — the harness mounts this at /search.
 *
 * ReTreever's own /retreeve, /who and /what pass their `endpoints` and
 * `AppRoutes`. This one passes NEITHER, on purpose: it is what the search page
 * looks like with no parent behind it. The dropdown lists come back empty
 * (there is no /api/who to fetch), the tab stickers render without links, and
 * selecting a result goes nowhere. The layout, the mascot and the grass are
 * all still there.
 *
 * That is the trailer unhitched — plainer, fewer features, still standing.
 */
import SearchRoute from "../lib/SearchRoute.svelte";
</script>

<SearchRoute tab="orgs" title="Search" />
