<script lang="ts">
/**
 * /who/map — a two-line mount for the child's own demo page.
 *
 * THE PAGE ITSELF lives with the code it demonstrates:
 *   $harness/components/map/getCache_OnlineMap/routes/demo/+page.svelte
 *
 * WHY THE INDIRECTION: SvelteKit only serves pages found under src/routes,
 * but a child must carry its own routes/ so it can be lifted into its own
 * repo whole. So the child owns the page and the shell owns one line naming
 * the URL it answers on. Moving the child later touches this file only.
 */
import Demo from "$harness/components/map/getCache_OnlineMap/routes/demo/+page.svelte";
</script>

<Demo />
