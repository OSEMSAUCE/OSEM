<script lang="ts">
	import {
		ArrowLeft,
		ExternalLink,
		Globe,
		Mail,
		MapPin,
		TreeDeciduous,
	} from "lucide-svelte";
	import { Badge } from "../ui/badge";
	import { Button } from "../ui/button";
	import * as Card from "../ui/card";
	import { Separator } from "../ui/separator";

	let { org } = $props();

	let ogPreview: {
		title: string | null;
		description: string | null;
		image: string | null;
		siteName: string | null;
	} | null = $state(null);

	$effect(() => {
		if (org.displayWebsite) {
			fetch(
				`/api/og-preview?url=${encodeURIComponent(org.displayWebsite)}`,
			)
				.then((r) => (r.ok ? r.json() : null))
				.then((data) => {
					if (data) ogPreview = data.og;
				})
				.catch(() => {});
		}
	});
</script>

<div class="container mx-auto py-8 space-y-6 max-w-4xl">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/who" class="shrink-0">
			<ArrowLeft class="h-5 w-5" />
			<span class="sr-only">Back to Organizations</span>
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-foreground">
				{org.displayName}
			</h1>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-3">
		<!-- Main Info Column -->
		<div class="md:col-span-2 space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>About</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if org.description}
						<p class="text-muted-foreground">{org.description}</p>
					{:else}
						<p class="text-muted-foreground italic">
							No description available.
						</p>
					{/if}

					{#if org.organizationNotes}
						<div class="pt-4 border-t border-border">
							<p class="text-sm font-medium mb-1">Notes</p>
							<p class="text-muted-foreground text-sm">
								{org.organizationNotes}
							</p>
						</div>
					{/if}

					<div class="flex flex-wrap gap-2 mt-4">
						{#if org.organizationType}
							<Badge variant="secondary"
								>{org.organizationType}</Badge
							>
						{/if}
						{#if org.status}
							<Badge
								variant={org.status === "active"
									? "default"
									: "outline"}
							>
								{org.status}
							</Badge>
						{/if}
						{#if org.capacityPerYear}
							<Badge variant="outline"
								>Capacity: {org.capacityPerYear}/yr</Badge
							>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Claims & Impact</Card.Title>
					<Card.Description>Reforestation data</Card.Description>
				</Card.Header>
				<Card.Content>
					{@const bd = org.projectBreakdown ?? []}
					{@const bdScored = bd.reduce(
						(s: number, r: { pointsScored: number }) =>
							s + r.pointsScored,
						0,
					)}
					{@const bdAvail = bd.reduce(
						(s: number, r: { pointsAvailible: number }) =>
							s + r.pointsAvailible,
						0,
					)}
					{@const fieldScore =
						bdAvail > 0
							? Math.round((bdScored / bdAvail) * 100)
							: null}

					<!-- Hero row — the three big numbers -->
					<div class="grid grid-cols-3 gap-4 mb-5">
						<div class="text-center">
							{#if org.orgScore}
								<p
									class="text-5xl font-bold text-accent leading-none"
								>
									{Math.round(org.orgScore.orgScore * 100)}%
								</p>
							{:else if fieldScore != null}
								<p
									class="text-5xl font-bold text-accent leading-none"
								>
									{fieldScore}%
								</p>
							{:else}
								<p
									class="text-5xl font-bold leading-none text-muted-foreground/30"
								>
									—
								</p>
							{/if}
							<p
								class="text-xs text-muted-foreground mt-2 uppercase tracking-wider"
							>
								Transparency Score
							</p>
						</div>
						{#if org.orgScore?.orgPercentile != null}
							<div class="text-center">
								<p class="text-5xl font-bold leading-none">
									{org.orgScore.orgPercentile}<span
										class="text-2xl">th</span
									>
								</p>
								<p
									class="text-xs text-muted-foreground mt-2 uppercase tracking-wider"
								>
									ReTreeve Rank
								</p>
							</div>
						{/if}
						<div class="text-center">
							{#if org.orgScore?.orgPercentileByType != null}
								<p class="text-5xl font-bold leading-none">
									{org.orgScore.orgPercentileByType}<span
										class="text-2xl">th</span
									>
								</p>
							{:else}
								<p
									class="text-2xl font-semibold leading-none text-muted-foreground/50 capitalize pt-3"
								>
									{org.orgScore?.primaryStakeholderType ??
										"producer"}
								</p>
							{/if}
							<p
								class="text-xs text-muted-foreground mt-2 uppercase tracking-wider"
							>
								<span class="capitalize"
									>{org.orgScore?.primaryStakeholderType ??
										"Producer"}</span
								> Rank
							</p>
						</div>
					</div>

					<!-- Secondary stats row — always show, using orgScore when available, falling back to projectBreakdown -->
					<div
						class="grid grid-cols-4 gap-3 py-4 border-t border-b border-border/40 mb-6 text-center"
					>
						<div>
							<p class="font-semibold">
								{#if (org.orgScore?.treesClaimed ?? 0) > 0}
									{org.orgScore.treesClaimed.toLocaleString()}
								{:else}
									—
								{/if}
							</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Trees Claimed
							</p>
						</div>
						<div>
							<p class="font-semibold">
								{#if (org.orgScore?.treesDisclosed ?? 0) > 0}
									{org.orgScore.treesDisclosed.toLocaleString()}
								{:else}
									—
								{/if}
							</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Trees Disclosed
							</p>
						</div>
						<div>
							<p class="font-semibold">
								{#if org.orgScore}
									{org.orgScore.orgPointsScored} / {org
										.orgScore.orgPointsAvailible}
								{:else}
									{bdScored} / {bdAvail}
								{/if}
							</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Field Points
							</p>
						</div>
						<div>
							<p class="font-semibold">{bd.length}</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								Projects
							</p>
						</div>
					</div>
					{#if org.claims && org.claims.length > 0}
						<div class="space-y-4">
							{#each org.claims as claim}
								<div
									class="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
								>
									<div class="flex items-center gap-3">
										<div
											class="p-2 bg-accent/10 rounded-full text-accent"
										>
											<TreeDeciduous class="h-5 w-5" />
										</div>
										<div>
											<p class="font-medium">
												{claim.attributeName}
											</p>
											<p
												class="text-xs text-muted-foreground"
											>
												Source: {claim.sourceId ||
													"Unknown"}
											</p>
										</div>
									</div>
									<div class="text-right">
										<p
											class="text-lg font-bold text-accent"
										>
											{claim.attributeValue}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title class="text-lg">System Metadata</Card.Title>
				</Card.Header>
				<Card.Content
					class="text-sm text-muted-foreground grid grid-cols-2 gap-4"
				>
					<div>
						<p class="font-medium text-foreground">Created</p>
						<p>
							{org.createdAt
								? new Date(org.createdAt).toLocaleString()
								: "N/A"}
						</p>
					</div>
					<div>
						<p class="font-medium text-foreground">Last Edited</p>
						<p>
							{org.lastEditedAt
								? new Date(org.lastEditedAt).toLocaleString()
								: "N/A"}
						</p>
					</div>
					{#if org.editedBy}
						<div class="col-span-2">
							<p class="font-medium text-foreground">Edited By</p>
							<p>{org.editedBy}</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
			{#if org.projectBreakdown && org.projectBreakdown.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title>Project Breakdown</Card.Title>
						<Card.Description
							>All projects this organization is associated with</Card.Description
						>
					</Card.Header>
					<Card.Content>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr
										class="border-b border-border text-muted-foreground text-xs uppercase tracking-wide"
									>
										<th
											class="text-left py-2 pr-4 font-medium"
											>Platform</th
										>
										<th
											class="text-left py-2 pr-4 font-medium"
											>Project</th
										>
										<th
											class="text-right py-2 pr-4 font-medium"
											>Pts</th
										>
										<th
											class="text-right py-2 pr-4 font-medium"
											>Score</th
										>
										<th class="text-left py-2 font-medium"
											>Type</th
										>
									</tr>
								</thead>
								<tbody>
									{#each org.projectBreakdown as row}
										<tr
											class="border-b border-border/50 hover:bg-muted/30"
										>
											<td
												class="py-2 pr-4 text-muted-foreground text-xs"
												>{row.platformId ?? "—"}</td
											>
											<td class="py-2 pr-4">
												<a
													href="/what/{row.projectId}"
													class="hover:text-accent hover:underline"
													>{row.projectName}</a
												>
											</td>
											<td
												class="py-2 pr-4 text-right tabular-nums text-xs"
												>{row.pointsScored}/{row.pointsAvailible}</td
											>
											<td
												class="py-2 pr-4 text-right tabular-nums"
											>
												{#if row.scorePercent != null}{Math.round(
														row.scorePercent,
													)}%{:else}—{/if}
											</td>
											<td
												class="py-2 text-muted-foreground capitalize text-xs"
												>{row.stakeholderType ??
													"—"}</td
											>
										</tr>
									{/each}
								</tbody>
								{#if org.projectBreakdown.length > 1}
									{@const totalScored =
										org.projectBreakdown.reduce(
											(
												s: number,
												r: { pointsScored: number },
											) => s + r.pointsScored,
											0,
										)}
									{@const totalAvail =
										org.projectBreakdown.reduce(
											(
												s: number,
												r: { pointsAvailible: number },
											) => s + r.pointsAvailible,
											0,
										)}
									<tfoot>
										<tr
											class="border-t-2 border-border font-medium text-sm"
										>
											<td
												class="pt-3 pr-4 text-muted-foreground text-xs"
												>{org.projectBreakdown.length} projects</td
											>
											<td class="pt-3 pr-4"></td>
											<td
												class="pt-3 pr-4 text-right tabular-nums text-xs"
												>{totalScored}/{totalAvail}</td
											>
											<td
												class="pt-3 pr-4 text-right tabular-nums"
												>{totalAvail > 0
													? Math.round(
															(totalScored /
																totalAvail) *
																100,
														)
													: "—"}%</td
											>
											<td class="pt-3"></td>
										</tr>
									</tfoot>
								{/if}
							</table>
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>

		<!-- Sidebar Info -->
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>Contact & Location</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if org.contactName}
						<div class="flex items-center gap-3">
							<span class="font-medium text-sm">Contact:</span>
							<span class="text-sm">{org.contactName}</span>
						</div>
						<Separator />
					{/if}

					{#if org.contactPhone}
						<div class="flex items-center gap-3">
							<span class="font-medium text-sm">Phone:</span>
							<a
								href="tel:{org.contactPhone}"
								class="text-sm hover:text-accent hover:underline"
								>{org.contactPhone}</a
							>
						</div>
						<Separator />
					{/if}

					{#if org.displayAddress}
						<div class="flex items-start gap-3">
							<MapPin
								class="h-5 w-5 text-muted-foreground shrink-0 mt-0.5"
							/>
							<span class="text-sm">{org.displayAddress} </span>
						</div>
						<Separator />
					{/if}

					{#if org.gpsLat && org.gpsLon}
						<div
							class="flex items-start gap-3 text-xs text-muted-foreground pl-8"
						>
							<span
								>GPS: {Number(org.gpsLat).toFixed(6)}, {Number(
									org.gpsLon,
								).toFixed(6)}</span
							>
						</div>
						<Separator />
					{/if}

					{#if org.displayWebsite}
						<div class="flex items-start gap-3">
							<Globe
								class="h-5 w-5 text-muted-foreground shrink-0 mt-0.5"
							/>
							<div
								class="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0"
							>
								<a
									href={org.displayWebsite}
									target="_blank"
									rel="noopener noreferrer"
									class="text-sm hover:text-accent hover:underline break-all"
								>
									{org.displayWebsite}
								</a>
								{#if org.websiteIsCalculated}
									<Badge
										variant="outline"
										class="text-xs shrink-0"
										>derived from email</Badge
									>
								{/if}
							</div>
						</div>
						<Separator />
					{/if}

					{#if org.displayEmail}
						<div class="flex items-center gap-3">
							<Mail
								class="h-5 w-5 text-muted-foreground shrink-0"
							/>
							<a
								href="mailto:{org.displayEmail}"
								class="text-sm hover:text-accent hover:underline truncate"
							>
								{org.displayEmail}
							</a>
						</div>
					{/if}

					{#if !org.displayAddress && !org.displayWebsite && !org.displayEmail && !org.contactName}
						<p class="text-sm text-muted-foreground italic">
							No contact information available.
						</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	<!-- Website Preview (OG metadata, fetched server-side like Signal/Slack) -->
	{#if org.displayWebsite && ogPreview}
		<a
			href={org.displayWebsite}
			target="_blank"
			rel="noopener noreferrer"
			class="block"
		>
			<Card.Root
				class="overflow-hidden hover:border-accent transition-colors"
			>
				{#if ogPreview.image}
					<div class="w-full max-h-48 overflow-hidden bg-muted">
						<img
							src={ogPreview.image}
							alt=""
							class="w-full object-cover"
						/>
					</div>
				{/if}
				<Card.Content class="py-3 space-y-1">
					<div class="flex items-center justify-between gap-2">
						<p class="font-semibold truncate">
							{ogPreview.title ??
								ogPreview.siteName ??
								org.displayWebsite}
						</p>
						<ExternalLink
							class="h-4 w-4 text-muted-foreground shrink-0"
						/>
					</div>
					{#if ogPreview.description}
						<p class="text-sm text-muted-foreground line-clamp-2">
							{ogPreview.description}
						</p>
					{/if}
					<p class="text-xs text-muted-foreground">
						{org.displayWebsite}
						{#if org.websiteIsCalculated}
							<span class="italic"> · derived from email</span>
						{/if}
					</p>
				</Card.Content>
			</Card.Root>
		</a>
	{/if}
</div>
