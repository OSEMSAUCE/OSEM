<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const { org } = data;
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-5xl mx-auto">
		<!-- Breadcrumb -->
		<nav class="mb-8">
			<a href="/who" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center">
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
				Back to Organizations
			</a>
		</nav>

		<!-- Header Card -->
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
			<div class="p-8">
				<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div>
						<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{org.displayName}</h1>
						<div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
							{#if org.displayAddress}
								<div class="flex items-center">
									<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
									{org.displayAddress}
								</div>
							{/if}
							{#if org.displayWebsite}
								<a href={org.displayWebsite} target="_blank" rel="noopener noreferrer" class="flex items-center text-blue-600 hover:underline">
									<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
									Website
								</a>
							{/if}
						</div>
					</div>
					<div class="flex gap-2">
						{#if org.organizationMasterId}
							<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
								Verified Entity
							</span>
						{:else}
							<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
								Unverified
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-8">

				<!-- Claims Section -->
				<section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
					<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
						<svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
						Impact Claims
					</h2>

					{#if org.claims.length > 0}
						<div class="space-y-4">
							{#each org.claims as claim}
								<div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
									<div class="flex justify-between items-start">
										<div>
											<h3 class="font-semibold text-gray-900 dark:text-white capitalize">{claim.claimType?.replace(/_/g, ' ') || 'General Claim'}</h3>
											<p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{claim.claimValue}</p>
											{#if claim.notes}
												<p class="text-sm text-gray-500 mt-2">{claim.notes}</p>
											{/if}
										</div>
										<div class="text-right text-xs text-gray-400">
											{#if claim.claimDate}
												<p>Date: {new Date(claim.claimDate).toLocaleDateString()}</p>
											{/if}
											{#if claim.sourceId}
												<button class="text-blue-500 hover:underline mt-1 block text-left">View Source (ID: {claim.sourceId})</button>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p>No claims recorded for this organization yet.</p>
						</div>
					{/if}
				</section>

				<!-- Projects Section -->
				<section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
					<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Linked Projects</h2>
					{#if org.projects.length > 0}
						<div class="grid gap-4">
							{#each org.projects as project}
								<a href="/what?project={project.projectId}" class="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
									<h3 class="font-medium text-gray-900 dark:text-white">{project.projectName}</h3>
									<p class="text-xs text-gray-500 mt-1">ID: {project.projectId}</p>
								</a>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500">No direct projects linked.</p>
					{/if}
				</section>
			</div>

			<!-- Sidebar Info -->
			<div class="space-y-8">
				<!-- Map Preview (Placeholder for now, could be a mini-map) -->
				{#if org.gpsLat && org.gpsLon}
					<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
						<div class="h-48 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
							<span class="text-gray-400">Map Location: {org.gpsLat.toFixed(4)}, {org.gpsLon.toFixed(4)}</span>
							<!-- TODO: Add mini-map here -->
						</div>
					</div>
				{/if}

				<!-- Metadata -->
				<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
					<h3 class="font-semibold text-gray-900 dark:text-white mb-4">Metadata</h3>
					<dl class="space-y-3 text-sm">
						<div>
							<dt class="text-gray-500">Local ID</dt>
							<dd class="font-mono text-gray-900 dark:text-gray-300 break-all">{org.id}</dd>
						</div>
						<div>
							<dt class="text-gray-500">Master ID</dt>
							<dd class="font-mono text-gray-900 dark:text-gray-300 break-all">{org.organizationMasterId || 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-gray-500">Last Updated</dt>
							<dd class="text-gray-900 dark:text-gray-300">{new Date(org.lastEditedAt || Date.now()).toLocaleDateString()}</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	</div>
</div>
