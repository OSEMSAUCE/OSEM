<script lang="ts">
	export let message = 'Sign in to access more features';
	export let projectCount: number | undefined = undefined;
</script>

<div class="auth-banner">
	<p>
		{#if projectCount}
			Viewing limited data ({projectCount} projects).
		{/if}
		{message}
	</p>
	<button>Sign In</button>
</div>

<style>
	.auth-banner {
		background: rgba(255, 165, 0, 0.1);
		border: 1px solid rgba(255, 165, 0, 0.3);
		border-radius: 0.5rem;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	p {
		margin: 0;
		color: rgba(255, 165, 0, 0.9);
	}

	button {
		background: rgba(255, 165, 0, 0.2);
		border: 1px solid rgba(255, 165, 0, 0.5);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover {
		background: rgba(255, 165, 0, 0.3);
	}
</style>
