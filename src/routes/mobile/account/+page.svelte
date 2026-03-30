<script lang="ts">
	import { Download } from "lucide-svelte";
	import { exportBackup } from "$lib/mobTally/backup.js";
	import { createMockStore } from "$lib/mobTally/mockStore.svelte.js";

	const store = createMockStore();
</script>

<div
	class="account-page"
	style="padding-top: calc(env(safe-area-inset-top) + 0.5rem);"
>
	<!-- Header with back nav -->
	<div class="page-header">
		<a href="/mobile/ezcache" class="back-link">← EZCache</a>
		<h1 class="page-title">Account</h1>
	</div>

	<!-- Backup section -->
	<div class="section">
		<h2 class="section-title">Data</h2>
		<button
			class="action-btn"
			onclick={() => exportBackup(store.activeRows, store.bagOuts)}
		>
			<Download class="size-5" />
			<span>Backup Tallies</span>
		</button>
		<p class="help-text">
			Save all your cache data and tally history to a file. You can email
			it to yourself or save to your cloud storage.
		</p>
	</div>
</div>

<style>
	.account-page {
		max-width: 100vw;
		min-height: 100vh;
		background: #1a1a1a;
		padding: 0 1rem 2rem;
		box-sizing: border-box;
	}

	.page-header {
		padding: 0.5rem 0 0.75rem;
		border-bottom: 1px solid #2a2a2a;
		margin-bottom: 1.5rem;
	}

	.back-link {
		font-size: 0.85rem;
		color: #6b7280;
		text-decoration: none;
		display: block;
		margin-bottom: 0.25rem;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #ffd700;
		line-height: 1;
	}

	.section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
		margin-bottom: 0.75rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 1rem;
		background: #222;
		border: 1px solid #3a3a3a;
		border-radius: 0.75rem;
		color: #fafafa;
		font-size: 1rem;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			background 120ms,
			transform 120ms;
	}

	.action-btn:active {
		background: #2e2e2e;
		transform: scale(0.98);
	}

	.help-text {
		font-size: 0.8rem;
		color: #6b7280;
		margin-top: 0.5rem;
		line-height: 1.4;
	}
</style>
