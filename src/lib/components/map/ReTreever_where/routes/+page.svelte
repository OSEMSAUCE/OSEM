<script lang="ts">
/**
 * The child's OWN demo page — the harness mounts this at /where.
 *
 * ReTreever has its own mount at src/routes/(retreever)/where/, which passes
 * the real localStorage persistence, its AppRoutes and the mapbox guards. This
 * one passes NONE of that, on purpose: it is what the page looks like with no
 * parent behind it. Drawings do not persist, favourites do not persist, the
 * marker box's links do not render. The map still works.
 *
 * That is the trailer unhitched — plainer, fewer features, still standing.
 */
import WherePage from "../lib/WherePage.svelte";
import type { FavouriteLocation } from "../lib/whereTypes";

// Session-only, in memory. A child owns no storage: persistence is a host
// concern, and inventing a localStorage key here would put a child's data in
// whichever product happened to mount it.
let favourites = $state<FavouriteLocation[]>([]);

function toggleFavourite(loc: FavouriteLocation) {
	favourites = favourites.some((f) => f.landKey === loc.landKey)
		? favourites.filter((f) => f.landKey !== loc.landKey)
		: [...favourites, loc];
}
</script>

<WherePage {favourites} ontogglefavourite={toggleFavourite} />
