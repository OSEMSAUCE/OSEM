<script lang="ts">
	import { createSvelteTable, getCoreRowModel, FlexRender } from '$lib/table';
	import type { ColumnDef } from '$lib/table';

	// Define the data structure
	type Project = {
		landName: string;
		projectName: string;
		platform: string;
		area: number;
	};

	// Sample data
	let data = $state<Project[]>([
		{
			landName: 'Bumbuli2',
			projectName: 'Tree planting for biodiversity conservation',
			platform: 'plant-for-the-planet.org',
			area: 23661.6
		}
	]);

	// Define columns
	const columns: ColumnDef<Project>[] = [
		{
			accessorKey: 'landName',
			header: 'Land Name',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'projectName',
			header: 'Project Name',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'platform',
			header: 'Platform',
			cell: (info) => info.getValue()
		},
		{
			accessorKey: 'area',
			header: 'Area',
			cell: (info) => `${info.getValue()} ha`
		}
	];

	// Create table instance
	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel()
	});
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

			<div class="table-container">
				<table>
					<thead>
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<tr>
								{#each headerGroup.headers as header (header.id)}
									<th>
										{#if !header.isPlaceholder}
											<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
										{/if}
									</th>
								{/each}
							</tr>
						{/each}
					</thead>
					<tbody>
						{#each table.getRowModel().rows as row (row.id)}
							<tr>
								{#each row.getVisibleCells() as cell (cell.id)}
									<td>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
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

	.table-container {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th {
		text-align: left;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border-bottom: 2px solid rgba(255, 255, 255, 0.2);
		font-weight: 600;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	tbody tr:hover {
		background: rgba(255, 255, 255, 0.05);
	}
</style>
