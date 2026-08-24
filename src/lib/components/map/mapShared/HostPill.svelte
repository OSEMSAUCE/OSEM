<script lang="ts">
/**
 * HostPill — THE ONE COMPONENT every child mounts, everywhere. Flips the
 * PARENT, not the page — no navigation, no URL change. "retreever" = real
 * host data; "harness" = the child's own empty fixture, the honest state a
 * checkout with no host gives.
 *
 * Bound two-way: the host page owns a `hitched` boolean (its own
 * hitchState.svelte.ts, proprietary, living beside that child's *Ports.ts)
 * and reads it to decide what THIS page's data source is. This component
 * only renders the pill and flips the bit — it never decides what "hitched"
 * means for any particular child's data.
 */
let {
	hitched = $bindable(true),
}: {
	hitched?: boolean;
} = $props();
</script>

<button
	type="button"
	class="host-pill"
	onclick={() => (hitched = !hitched)}
	title="Which parent this page's data comes from — real host data, or an empty harness fixture."
>
	<span class:on={hitched}>retreever</span><span class:on={!hitched}>harness</span>
</button>

<style>
	.host-pill {
		position: fixed;
		bottom: calc(env(safe-area-inset-bottom, 0px) + 5rem);
		right: 0.6rem;
		z-index: 9999;
		display: inline-flex;
		border: 1px solid #333;
		border-radius: 999px;
		overflow: hidden;
		background: #111;
		cursor: pointer;
		font: inherit;
		padding: 0;
	}
	.host-pill span {
		padding: 0.35rem 0.8rem;
		color: #888;
		font-size: 0.75rem;
	}
	.host-pill span.on {
		background: var(--color-gold-bar, #f5a119);
		color: #111;
		font-weight: 600;
	}
</style>
