<script lang="ts">
/**
 * The child's OWN demo page — the harness mounts this at /where.
 *
 * ReTreever has its own mount at src/routes/(retreever)/where/, which passes
 * the real localStorage persistence, its AppRoutes and the mapbox guards. This
 * one passes NONE of that BY DEFAULT — it is what the page looks like with no
 * parent behind it. Drawings do not persist, favourites do not persist, the
 * marker box's links do not render. The map still works.
 *
 * That is the trailer unhitched — plainer, fewer features, still standing.
 *
 * `hostProps` is a real caller-supplied override — e.g. ReTreever's
 * /where/debug route passing the same localStorage-backed props the real
 * /where page uses. When omitted, the session-only fixture below stands: the
 * honest answer a checkout with no host gives. Same `?? fixture` pattern as
 * getCache_OfflineMap's demo/+page.svelte `hostPorts` prop.
 */
import WherePage from "../lib/WherePage.svelte";
import type { FavouriteLocation, WhereRoutes } from "../lib/whereTypes";
import type { Feature } from "geojson";

type HostProps = {
	initialFeatures?: Feature[];
	onFeatureComplete?: (feature: Feature) => void;
	onFeaturesCleared?: () => void;
	favourites?: FavouriteLocation[];
	ontogglefavourite?: (loc: FavouriteLocation) => void;
	routes?: WhereRoutes;
	ensureMapboxGuards?: () => Promise<void>;
};

let { hostProps }: { hostProps?: HostProps } = $props();

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

{#if hostProps}
	<WherePage {...hostProps} />
{:else}
	<WherePage {favourites} ontogglefavourite={toggleFavourite} />
{/if}
