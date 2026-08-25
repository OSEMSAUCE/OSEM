<script lang="ts">
/**
 * /debug/map — the offline map WITH its debug rails.
 *
 * Same page as /offline, same engine, same fixtures; `rails` defaults on.
 * Deliberately NOT a second copy of the page: the engine wiring is the part
 * that drifts, and two copies of it would drift apart the first time either
 * one is touched.
 *
 * THE PAGE ITSELF lives with the code it demonstrates, at ../../demo/. This
 * file exists only to give that page a URL — SvelteKit builds routes from the
 * folder tree, so the folder IS the URL.
 */
import Demo from "../../demo/+page.svelte";
</script>

<Demo />
