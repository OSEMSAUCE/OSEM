<script lang="ts">
	// Dashboard page - displays project data in table/chart format
	// TODO: Add project list, filters, data visualization
</script>

<div class="dashboard">
	<header>
		<h1>Restoration Projects Dashboard</h1>
		<p>Explore and filter restoration project data</p>
	</header>

	<div class="content">
		<aside class="filters">
			<h2>Filters</h2>
			<p>Coming soon: Filter by region, project type, size, etc.</p>
		</aside>

		<main class="projects">
			<h2>Projects</h2>
			<p>Coming soon: Project list with pagination</p>
		</main>
	</div>
</div>

<style>
	.dashboard {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.content {
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: 2rem;
	}

	.filters {
		background: rgba(255, 255, 255, 0.05);
		padding: 1rem;
		border-radius: 0.5rem;
		height: fit-content;
	}

	.projects {
		background: rgba(255, 255, 255, 0.05);
		padding: 1rem;
		border-radius: 0.5rem;
		min-height: 400px;
	}

	h2 {
		font-size: 1.2rem;
		margin-bottom: 1rem;
	}
</style>
