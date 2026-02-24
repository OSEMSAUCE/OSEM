<script lang="ts">
	import {
		ArrowLeft,
		ExternalLink,
		Globe,
		Mail,
		MapPin,
		Phone,
		TreeDeciduous,
	} from "lucide-svelte";
	import DotMatrix from "../score/DotMatrix.svelte";
	import { Badge } from "../ui/badge";
	import { Button } from "../ui/button";
	import * as Card from "../ui/card";
	import { Separator } from "../ui/separator";

	let { org } = $props();

	const bd = $derived(
		(org.projectBreakdown ?? []) as Array<{
			pointsScored: number;
			pointsAvailible: number;
			platformId: string | null;
			projectId: string;
			projectName: string;
			scorePercent: number | null;
			stakeholderType: string | null;
		}>,
	);
	const bdScored = $derived(bd.reduce((s, r) => s + r.pointsScored, 0));
	const bdAvail = $derived(bd.reduce((s, r) => s + r.pointsAvailible, 0));
	const fieldScore = $derived(
		bdAvail > 0 ? Math.round((bdScored / bdAvail) * 100) : null,
	);

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
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/who" class="shrink-0">
			<ArrowLeft class="h-5 w-5" />
			<span class="sr-only">Back to Organizations</span>
		</Button>
		<div class="flex flex-wrap items-center gap-3">
			<h1 class="text-3xl font-bold tracking-tight text-foreground">
				{org.displayName}
			</h1>
			{#if org.organizationType}
				<Badge variant="secondary">{org.organizationType}</Badge>
			{/if}
			{#if org.status}
				<Badge
					variant={org.status === "active" ? "default" : "outline"}
				>
					{org.status}
				</Badge>
			{/if}
		</div>
	</div>

	<!-- Score Hero -->
	<div>
		<br />

		<Card.Root class="my-4">
			<div
				class="px-8 pt-4 pb-4"
				style="--dot-size: 2; --dot-spacing: 3.1;"
			>
				<DotMatrix text="RETREEVER SCORE" />
			</div>
			<Card.Content class="pt-0 pb-4">
				<!-- Score columns: ReTreever Score (gold, first) + Data Completeness (white) -->
				<div class="flex items-start divide-x divide-border mb-6">
					<!-- Column 1: ReTreever Score — primary ranking, shown in accent/gold -->
					<div class="flex-1 text-center px-4">
						<div class="flex justify-center"></div>
						<p
							class="text-2xl font-bold text-muted-foreground mb-2 tracking-wider"
						>
							RETREEVER SCORE
						</p>
						{#if org.orgScore?.orgPercentile != null}
							<p
								class="text-8xl py-2 pb-4 font-bold text-accent tabular-nums leading-none"
							>
								{org.orgScore.orgPercentile}
							</p>
							{#if org.orgScore.orgPercentile <= 34}
								<p class="text-xl mt-1">🔴 Opaque</p>
							{:else if org.orgScore.orgPercentile <= 69}
								<p class="text-xl mt-1">🟡 Partial</p>
							{:else if org.orgScore.orgPercentile <= 89}
								<p class="text-xl mt-1">🟢 Open</p>
							{:else}
								<p class="text-xl mt-1">🏆 Transparent</p>
							{/if}
						{:else}
							<p
								class="text-6xl font-bold text-muted-foreground/20 leading-none"
							>
								—
							</p>
						{/if}
					</div>

					<!-- Column 2: Data Completion — raw transparency score -->
					<div class="flex-1 text-center px-4">
						<p
							class="text-2xl font-bold text-muted-foreground mb-2 tracking-wider"
						>
							DATA COMPLETION
						</p>
						{#if org.orgScore}
							<p
								class="text-8xl py-2 pb-4 font-bold tabular-nums leading-none"
							>
								{Math.round(org.orgScore.orgScore * 100)}%
							</p>
						{:else if fieldScore != null}
							<p
								class="text-6xl py-2 pb-4 font-bold tabular-nums leading-none"
							>
								{fieldScore}%
							</p>
						{:else}
							<p
								class="text-6xl py-2 pb-4 font-bold text-muted-foreground/20 leading-none"
							>
								—
							</p>
						{/if}
					</div>
				</div>

				<!-- Secondary stats row -->
				<div
					class="grid grid-cols-4 gap-3 pt-4 border-t border-border/40 text-center"
				>
					<div>
						<p class="font-semibold">
							{#if (org.orgScore?.treesClaimed ?? 0) > 0}
								{org.orgScore.treesClaimed.toLocaleString()}
							{:else}—{/if}
						</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Trees Claimed
						</p>
					</div>
					<div>
						<p class="font-semibold">
							{#if (org.orgScore?.treesDisclosed ?? 0) > 0}
								{org.orgScore.treesDisclosed.toLocaleString()}
							{:else}—{/if}
						</p>
						<p class="text-xs text-muted-foreground mt-0.5">
							Trees Disclosed
						</p>
					</div>
					<div>
						<p class="font-semibold">
							{#if org.orgScore}
								{org.orgScore.orgPointsScored} / {org.orgScore
									.orgPointsAvailible}
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

				<!-- Scoring legend — collapsible, below the fold -->
				<p class="mt-4 pt-3 border-t border-border/40"></p>
				<p class="text-xs text-muted-foreground leading-relaxed mt-2">
					This score reflects our best efforts to find publicly
					available data. Missing data? Help us improve this score at
					<a
						href="mailto:info@ReTreever.org"
						class="text-accent hover:underline"
						>info@ReTreever.org</a
					>.
				</p>
				<details class="mt-2 pt-1">
					<summary
						class="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none list-none flex items-center gap-1"
					>
						<span>How the ReTreever Score works</span>
						<span class="text-muted-foreground/50">↓</span>
					</summary>
					<div class="mt-3 space-y-3">
						<div
							class="grid grid-cols-4 gap-1.5 text-center text-xs"
						>
							<div
								class="rounded-lg p-2 bg-red-500/10 border border-red-500/20"
							>
								<p class="font-bold text-red-500">0–34</p>
								<p class="font-semibold text-red-500">
									🔴 Opaque
								</p>
								<p
									class="text-muted-foreground mt-0.5 leading-tight"
								>
									Little to no data
								</p>
							</div>
							<div
								class="rounded-lg p-2 bg-muted/20 border border-border"
							>
								<p class="font-bold">35–69</p>
								<p class="font-semibold">🟡 Partial</p>
								<p
									class="text-muted-foreground mt-0.5 leading-tight"
								>
									Some data, gaps remain
								</p>
							</div>
							<div
								class="rounded-lg p-2 bg-muted/20 border border-border"
							>
								<p class="font-bold">70–89</p>
								<p class="font-semibold">🟢 Open</p>
								<p
									class="text-muted-foreground mt-0.5 leading-tight"
								>
									Most info accessible
								</p>
							</div>
							<div
								class="rounded-lg p-2 bg-accent/10 border border-accent/20"
							>
								<p class="font-bold text-accent">90–100</p>
								<p class="font-semibold text-accent">
									🏆 Transparent
								</p>
								<p
									class="text-muted-foreground mt-0.5 leading-tight"
								>
									Top 10%. Full disclosure
								</p>
							</div>
						</div>
						<p
							class="text-xs text-muted-foreground leading-relaxed"
						>
							The ReTreever Score (percentile 0–100) measures data
							availability across organizational project
							attributes. Score reflects how much information is
							publicly accessible relative to their total
							production claims, measured against other
							organizations in the database. For more info see the
							data below, and the associated <a
								href="http://localhost:5173/what"
								>project pages</a
							>. Or check out the open source repository at
							<a href="https://github.com/OSEMSAUCE/OSEM"
								>github.com/OSEMSAUCE/OSEM🤘🌲</a
							>.
						</p>
					</div>
				</details>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Main content grid -->
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Left: About + Project Breakdown -->
		<div class="md:col-span-2 space-y-6">
			{#if org.description || org.organizationNotes || org.capacityPerYear}
				<Card.Root>
					<Card.Header>
						<Card.Title>About</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						{#if org.description}
							<p class="text-muted-foreground">
								{org.description}
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

						{#if org.capacityPerYear}
							<Badge variant="outline"
								>Capacity: {org.capacityPerYear}/yr</Badge
							>
						{/if}
					</Card.Content>
				</Card.Root>
			{/if}

			{#if org.claims && org.claims.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title>Claims</Card.Title>
						<Card.Description
							>Reforestation data points</Card.Description
						>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
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
									<p class="text-lg font-bold text-accent">
										{claim.attributeValue}
									</p>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}

			{#if bd.length > 0}
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
									{#each bd as row}
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
								{#if bd.length > 1}
									<tfoot>
										<tr
											class="border-t-2 border-border font-medium text-sm"
										>
											<td
												class="pt-3 pr-4 text-muted-foreground text-xs"
												>{bd.length} projects</td
											>
											<td class="pt-3 pr-4"></td>
											<td
												class="pt-3 pr-4 text-right tabular-nums text-xs"
												>{bdScored}/{bdAvail}</td
											>
											<td
												class="pt-3 pr-4 text-right tabular-nums"
											>
												{bdAvail > 0
													? Math.round(
															(bdScored /
																bdAvail) *
																100,
														)
													: "—"}%
											</td>
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

		<!-- Right: Contact & Location (primary + alternates inline) -->
		<div class="space-y-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>Address</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3 contact-section">
					{#if org.contactName}
						<div class="flex items-center gap-3">
							<span class="font-medium text-sm">Contact:</span>
							<span class="text-sm">{org.contactName}</span>
						</div>
						<Separator />
					{/if}

					{#if org.contactPhone}
						<div class="flex items-center gap-3">
							<Phone
								class="h-4 w-4 text-muted-foreground shrink-0"
							/>
							<a
								href="tel:{org.contactPhone}"
								class="text-sm hover:text-accent hover:underline"
							>
								{org.contactPhone}
							</a>
						</div>
						<Separator />
					{/if}

					{#if org.displayAddress}
						<div class="flex items-start gap-3">
							<MapPin
								class="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
							/>
							<span class="text-sm">{org.displayAddress}</span>
						</div>
						<Separator />
					{/if}

					{#if org.gpsLat && org.gpsLon}
						<div
							class="flex items-start gap-3 text-xs text-muted-foreground pl-7"
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
								class="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
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
								class="h-4 w-4 text-muted-foreground shrink-0"
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

					<!-- Alternate Locations — inline expansion, one per linked local org -->
					{#if org.alternates && org.alternates.length > 0}
						<div class="pt-2">
							<p
								class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
							>
								Alternate Locations ({org.alternates.length})
							</p>
							<div class="space-y-4">
								{#each org.alternates as alt}
									<div
										class="pl-0 space-y-2 border-l-2 border-border "
									>
										<p
											class="text-xs font-semibold text-foreground"
										>
											{alt.organizationLocalName}
										</p>
										{#if alt.address}
											<div class="flex items-start gap-2">
												<MapPin
													class="h-3 w-3 text-muted-foreground shrink-0 mt-0.5"
												/>
												<span
													class="text-xs text-muted-foreground"
													>{alt.address}</span
												>
											</div>
										{/if}
										{#if alt.contactEmail}
											<div
												class="flex items-center gap-2"
											>
												<Mail
													class="h-3 w-3 text-muted-foreground shrink-0"
												/>
												<a
													href="mailto:{alt.contactEmail}"
													class="text-xs hover:text-accent hover:underline truncate"
												>
													{alt.contactEmail}
												</a>
											</div>
										{/if}
										{#if alt.contactPhone}
											<div
												class="flex items-center gap-2"
											>
												<Phone
													class="h-3 w-3 text-muted-foreground shrink-0"
												/>
												<a
													href="tel:{alt.contactPhone}"
													class="text-xs hover:text-accent hover:underline"
												>
													{alt.contactPhone}
												</a>
											</div>
										{/if}
										{#if alt.website}
											<div
												class="flex items-center gap-2"
											>
												<Globe
													class="h-3 w-3 text-muted-foreground shrink-0"
												/>
												<a
													href={alt.website}
													target="_blank"
													rel="noopener noreferrer"
													class="text-xs hover:text-accent hover:underline truncate"
												>
													{alt.website}
												</a>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- System Metadata -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm">System Metadata</Card.Title>
				</Card.Header>
				<Card.Content
					class="text-sm text-muted-foreground grid grid-cols-2 gap-4"
				>
					<div>
						<p class="font-medium text-foreground text-xs">
							Created
						</p>
						<p class="text-xs">
							{org.createdAt
								? new Date(org.createdAt).toLocaleString()
								: "N/A"}
						</p>
					</div>
					<div>
						<p class="font-medium text-foreground text-xs">
							Last Edited
						</p>
						<p class="text-xs">
							{org.lastEditedAt
								? new Date(org.lastEditedAt).toLocaleString()
								: "N/A"}
						</p>
					</div>
					{#if org.editedBy}
						<div class="col-span-2">
							<p class="font-medium text-foreground text-xs">
								Edited By
							</p>
							<p class="text-xs">{org.editedBy}</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	<!-- Website Preview (OG metadata) -->
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
