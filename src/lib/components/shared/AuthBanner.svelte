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
