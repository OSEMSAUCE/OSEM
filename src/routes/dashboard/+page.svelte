<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/dashboard/DataTable.svelte';
	import { columns as landColumns } from '$lib/components/dashboard/columns/landColumns';
	import { columns as projectColumns } from '$lib/components/dashboard/columns/projectColumns';
	import Breadcrumb from '$lib/components/dashboard/Breadcrumb.svelte';
	import * as Select from '$lib/components/ui/select';
	import type { Selected } from 'bits-ui';

	let { data }: { data: PageData } = $props();

	// Determine current view from URL
	const view = $derived($page.url.searchParams.get('view') || 'lands');
	const selectedProjectId = $derived(data.selectedProjectId);

	// Find selected project
	const selectedProject = $derived(
		data.projects.find((p) => p.projectId === selectedProjectId)
	);

	// Setup select component value as state
	let selectedValue = $state<Selected<string> | undefined>(undefined);

	// Sync selectedValue with URL changes
	$effect(() => {
		if (selectedProject) {
			selectedValue = {
				value: selectedProject.projectId,
				label: selectedProject.projectName
			};
		}
	});

	// Update URL when selection changes
	function handleProjectChange(newValue: Selected<string> | undefined) {
		if (newValue?.value && newValue.value !== selectedProjectId) {
			const url = new URL($page.url);
			url.searchParams.set('project', newValue.value);
			goto(url.toString(), { replaceState: false, keepFocus: true });
		}
	}

	// Watch for changes to selectedValue
	$effect(() => {
		if (selectedValue) {
			handleProjectChange(selectedValue);
		}
	});

	// Switch between views
	function switchView(newView: 'projects' | 'lands') {
		const url = new URL($page.url);
		url.searchParams.set('view', newView);
		goto(url.toString(), { replaceState: false, keepFocus: true });
	}

	// Update breadcrumb items based on current view
	const breadcrumbItems = $derived([
		{ label: 'Home', href: '/' },
		{ label: 'Dashboard', href: '/dashboard' },
		view === 'projects'
			? { label: 'All Projects' }
			: selectedProject
				? { label: selectedProject.projectName }
				: { label: 'Select a project' }
	]);

	// Prepare project table data with stats
	const projectsWithStats = $derived(
		data.projects.map((project) => {
			// Count lands for this project
			const projectLands = data.lands.filter((land) => land.projectId === project.projectId);
			const landCount = projectLands.length;
			const totalHectares = projectLands.reduce((sum, land) => sum + (land.hectares || 0), 0);

			return {
				projectId: project.projectId,
				projectName: project.projectName,
				landCount,
				totalHectares,
				platform: 'N/A' // API doesn't provide this in project list
			};
		})
	);
</script>

<div class="dashboard">
	<Breadcrumb items={breadcrumbItems} />

	<div class="content">
		{#if data.error}
			<div class="warning-banner">
				<strong>API Error:</strong> {data.error}
				<br />
				<small>Check browser console for details.</small>
			</div>
		{/if}

		<!-- Always show the UI, even if no data -->
		<!-- View toggle -->
		<div class="view-toggle">
			<button
				class="toggle-btn"
				class:active={view === 'projects'}
				onclick={() => switchView('projects')}
			>
				All Projects
			</button>
			<button
				class="toggle-btn"
				class:active={view === 'lands'}
				onclick={() => switchView('lands')}
			>
				Lands by Project
			</button>
		</div>

		{#if view === 'projects'}
			<!-- Projects table view -->
			<main class="table-container">
				<h2>All Projects</h2>
				{#if data.projects.length > 0}
					<DataTable
						data={projectsWithStats}
						columns={projectColumns}
						filterConfig={{ columnKey: 'projectName', placeholder: 'Filter by project name...' }}
					/>
				{:else}
					<p class="no-data-message">No projects available from API</p>
				{/if}
			</main>
		{:else}
			<!-- Lands table view with project selector -->
			<div class="project-selector">
				<label for="project-select" class="selector-label">Select Project:</label>
				<Select.Root bind:selected={selectedValue}>
					<Select.Trigger class="w-[300px]">
						{selectedProject?.projectName || 'Choose a project...'}
					</Select.Trigger>
					<Select.Content>
						{#each data.projects as project (project.projectId)}
							<Select.Item value={project.projectId} label={project.projectName}>
								{project.projectName}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<main class="table-container">
				<h2>Land Parcels {selectedProject ? `for ${selectedProject.projectName}` : ''}</h2>
				{#if data.lands.length > 0}
					<DataTable
						data={data.lands}
						columns={landColumns}
						filterConfig={{ columnKey: 'landName', placeholder: 'Filter by land name...' }}
					/>
				{:else if selectedProjectId}
					<p class="no-data-message">No land parcels found for this project</p>
				{:else}
					<p class="no-data-message">Please select a project to view its land parcels</p>
				{/if}
			</main>
		{/if}
	</div>
</div>

<style>
	.dashboard {
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	.content {
		margin-top: 2rem;
	}

	.warning-banner {
		padding: 1rem 1.5rem;
		background: rgba(255, 193, 7, 0.1);
		border: 1px solid rgba(255, 193, 7, 0.3);
		border-radius: 0.5rem;
		color: rgba(255, 193, 7, 0.9);
		margin-bottom: 1.5rem;
	}

	.warning-banner strong {
		font-weight: 600;
	}

	.view-toggle {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		width: fit-content;
	}

	.toggle-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.6);
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
	}

	.toggle-btn.active {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.95);
	}

	.project-selector {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.selector-label {
		font-size: 1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
	}

	.table-container {
		background: rgba(255, 255, 255, 0.03);
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.table-container h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.no-data-message {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1rem;
		padding: 2rem;
		text-align: center;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-align: center;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.empty-state p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.1rem;
		margin: 0;
	}

	@media (max-width: 1024px) {
		.dashboard {
			padding: 1rem;
		}

		.project-selector {
			flex-direction: column;
			align-items: flex-start;
		}

		.table-container h2 {
			font-size: 1.25rem;
		}
	}
</style>
