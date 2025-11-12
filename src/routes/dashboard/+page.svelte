<script lang="ts">
	import { createSvelteTable, getCoreRowModel, FlexRender } from '$lib/table';
	import type { ColumnDef } from '$lib/table';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Define the data structure
	type Project = {
		landName: string;
		projectName: string;
		platform: string;
		area: number;
	};

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
			cell: (info) => {
				const value = info.getValue() as number;
				return value.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ha';
			}
		}
	];

	// Create table instance
	const table = createSvelteTable({
		get data() {
			return data.projects;
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
			<div class="projects-header">
				<h2>Projects</h2>
				<div class="stats">
					<div class="stat">
						<span class="stat-value">{data.projects.length}</span>
						<span class="stat-label">Total Projects</span>
					</div>
					<div class="stat">
						<span class="stat-value">
							{data.projects.reduce((sum, p) => sum + p.area, 0).toLocaleString('en-US', {
								maximumFractionDigits: 0
							})}
						</span>
						<span class="stat-label">Total Hectares</span>
					</div>
				</div>
			</div>

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

	header p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.1rem;
	}

	.content {
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
	}

	.projects-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.stats {
		display: flex;
		gap: 2rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-top: 0.25rem;
	}

	.table-container {
		overflow-x: auto;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95rem;
	}

	th {
		text-align: left;
		padding: 1rem 1.25rem;
		background: rgba(255, 255, 255, 0.08);
		border-bottom: 2px solid rgba(255, 255, 255, 0.15);
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
	}

	td {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.85);
	}

	td:first-child {
		font-weight: 500;
		color: rgba(255, 255, 255, 0.95);
	}

	tbody tr {
		transition: background-color 0.2s ease;
	}

	tbody tr:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

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
