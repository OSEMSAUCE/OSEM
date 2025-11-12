<script lang="ts">
	import type { PageData } from './$types';
	import DataTable from '$lib/components/dashboard/DataTable.svelte';
	import { columns } from '$lib/components/dashboard/columns/projectColumns';
	import Breadcrumb from '$lib/components/dashboard/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Dashboard', href: '/dashboard' },
		{ label: 'Projects' }
	];
</script>

<div class="dashboard">
	<Breadcrumb items={breadcrumbItems} />
<!-- 
	<header>
		<h1>Restoration Projects Dashboard</h1>
	</header> -->

	<div class="content">
	
		<main class="projects">
			<DataTable
				data={data.projects}
				{columns}
				filterConfig={{ columnKey: 'projectName', placeholder: 'Filter by project name...' }}
			/>
		</main>
	</div>
</div>

<style>
	.dashboard {
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
/* 
	header p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.1rem;
	} */

	/* .content {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2rem;
	}

	.filters {
		background: rgba(255, 255, 255, 0.03);
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		height: fit-content;
	}

	.projects {
		background: rgba(255, 255, 255, 0.03);
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		min-height: 400px;
	}

	h2 {
		font-size: 1.25rem;
		margin-bottom: 0;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	} */

	

	@media (max-width: 1024px) {
		.content {
			grid-template-columns: 1fr;
		}

		.dashboard {
			padding: 1rem;
		}

		h1 {
			font-size: 2rem;
		}
	}
</style>
