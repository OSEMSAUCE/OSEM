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

			{#if org.orgScore}
				<Card.Root>
					<Card.Header>
						<Card.Title>Organization Score</Card.Title>
						<Card.Description
							>Transparency & data quality rating</Card.Description
						>
					</Card.Header>
					<Card.Content>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
							<div class="text-center">
								<p class="text-3xl font-bold text-accent">
									{org.orgScore.orgSubScore.toFixed(1)}%
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									Data Quality
								</p>
							</div>
							<div class="text-center">
								<p class="text-3xl font-bold">
									{org.orgScore.orgPercentile}<span
										class="text-lg">th</span
									>
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									Percentile
								</p>
							</div>
							<div class="text-center">
								<p class="text-3xl font-bold">
									{org.orgScore.claimCounted.toLocaleString()}
								</p>
								<p class="text-xs text-muted-foreground mt-1">
									Trees Counted
								</p>
							</div>
						</div>
						<Separator class="my-4" />
						<div class="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p class="text-muted-foreground">Points</p>
								<p class="font-medium">
									{org.orgScore.orgPointsScored.toLocaleString()}
									/ {org.orgScore.orgPointsAvailible.toLocaleString()}
								</p>
							</div>
							{#if org.orgScore.stakeholderType}
								<div>
									<p class="text-muted-foreground">
										Category
									</p>
									<p class="font-medium capitalize">
										{org.orgScore.stakeholderType}
									</p>
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}

			<Card.Root>
				<Card.Header>
					<Card.Title>Claims & Impact</Card.Title>
					<Card.Description>Reforestation data</Card.Description>
				</Card.Header>
				<Card.Content>
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
					{:else}
						<div class="text-center py-8 text-muted-foreground">
							<TreeDeciduous
								class="h-12 w-12 mx-auto mb-3 opacity-20"
							/>
							<p>No claims recorded yet.</p>
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
					<div class="w-full max-h-[12rem] overflow-hidden bg-muted">
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
