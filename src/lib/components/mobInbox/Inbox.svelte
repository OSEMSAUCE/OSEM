<script lang="ts" module>
export type InboxItemKind = "tallies" | "map" | "cache" | "backup";

export type InboxItem = {
    id: string;
    filename: string; // e.g. "2026-04-24_Chris.tallies.retreever"
    kind: InboxItemKind;
    sender: string;
    receivedAt: string; // ISO
    meta?: string; // short summary line, e.g. "3,790 trees · 2 seedlots"
};

const KIND_LABEL: Record<InboxItemKind, string> = {
    tallies: "tallies",
    map: "map",
    cache: "cache",
    backup: "backup",
};

const FILTER_PILLS: Array<"all" | InboxItemKind> = [
    "all",
    "tallies",
    "map",
    "cache",
];
</script>

<script lang="ts">
let {
	title,
	items,
	onOpen,
	onDelete,
	initialFilter = "all",
}: {
	title: string;
	items: InboxItem[];
	onOpen?: (item: InboxItem) => void;
	onDelete?: (item: InboxItem) => void;
	initialFilter?: "all" | InboxItemKind;
} = $props();

let activeFilter = $state<"all" | InboxItemKind>(initialFilter);

const filtered = $derived(
	activeFilter === "all" ? items : items.filter((i) => i.kind === activeFilter),
);

const RECENT_LIMIT = 5;

const recent = $derived(
	[...filtered]
		.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
		.slice(0, RECENT_LIMIT),
);

const allSorted = $derived(
	[...filtered].sort((a, b) => b.filename.localeCompare(a.filename)),
);

function formatTimestamp(iso: string): string {
	try {
		const d = new Date(iso);
		return d.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

function prettyName(filename: string): string {
	// "2026-04-24_Chris.tallies.retreever" → "2026-04-24 · Chris"
	const match = filename.match(/^(\d{4}-\d{2}-\d{2})_([^.]+)\./);
	if (!match) return filename;
	return `${match[1]} · ${match[2]}`;
}
</script>

<section class="inbox">
	<header class="inbox-header">
		<h1>{title}</h1>
		<span class="count">{filtered.length}</span>
	</header>

	<nav class="inbox-pills">
		{#each FILTER_PILLS as pill}
			<button
				class="pill"
				class:pill--active={activeFilter === pill}
				onclick={() => (activeFilter = pill)}
			>
				{pill}
			</button>
		{/each}
	</nav>

	{#if filtered.length === 0}
		<p class="empty">Nothing here yet.</p>
	{:else}
		<section class="block">
			<h2 class="block-title">Recently arrived</h2>
			{#if recent.length === 0}
				<p class="empty">—</p>
			{:else}
				<ul class="row-list row-list--stack">
					{#each recent as item (item.id)}
						<li class="row row--recent">
							<div class="row-main">
								<span class="row-name">{prettyName(item.filename)}</span>
								<span class="kind-badge kind-{item.kind}">
									{KIND_LABEL[item.kind]}
								</span>
							</div>
							<div class="row-meta">
								<span class="meta-time">
									{formatTimestamp(item.receivedAt)}
								</span>
								{#if item.meta}
									<span class="meta-detail">· {item.meta}</span>
								{/if}
							</div>
							<div class="row-actions">
								<button
									type="button"
									class="open-btn"
									onclick={() => onOpen?.(item)}
								>
									Open
								</button>
								{#if onDelete}
									<button
										type="button"
										class="delete-btn"
										onclick={() => onDelete?.(item)}
										aria-label="Delete"
									>
										✕
									</button>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="block">
			<h2 class="block-title">All files</h2>
			<ul class="row-list">
				{#each allSorted as item (item.id)}
					<li class="row">
						<div class="row-main">
							<span class="row-name row-name--mono">{item.filename}</span>
							<span class="kind-badge kind-{item.kind}">
								{KIND_LABEL[item.kind]}
							</span>
						</div>
						<div class="row-meta">
							<span class="meta-time">from {item.sender}</span>
							{#if item.meta}
								<span class="meta-detail">· {item.meta}</span>
							{/if}
						</div>
						<div class="row-actions">
							<button
								type="button"
								class="open-btn"
								onclick={() => onOpen?.(item)}
							>
								Open
							</button>
							{#if onDelete}
								<button
									type="button"
									class="delete-btn"
									onclick={() => onDelete?.(item)}
									aria-label="Delete"
								>
									✕
								</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>

<style>
	.inbox {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: calc(env(safe-area-inset-top) + 0.75rem) 0.75rem 2rem;
		min-height: 100%;
		background: #1a1a1a;
		color: #fafafa;
		box-sizing: border-box;
	}

	.inbox-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		border-bottom: 1px solid #2a2a2a;
		padding-bottom: 0.5rem;
	}

	.inbox-header h1 {
		font-size: 1.25rem;
		font-weight: 800;
		color: #ffd700;
		margin: 0;
	}

	.count {
		font-size: 0.75rem;
		color: #6b7280;
		font-variant-numeric: tabular-nums;
	}

	.inbox-pills {
		display: flex;
		gap: 0.35rem;
	}

	.pill {
		padding: 0.3rem 0.7rem;
		border-radius: 1rem;
		border: 1px solid #444;
		background: transparent;
		color: #9ca3af;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
	}

	.pill--active {
		background: #ffd700;
		color: #111;
		border-color: #ffd700;
	}

	.empty {
		color: #6b7280;
		font-size: 0.85rem;
		margin: 0.5rem 0;
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.block-title {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #6b7280;
		margin: 0 0 0.25rem;
		font-weight: 700;
	}

	.row-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.row-list--stack {
		gap: 0.3rem;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			"main actions"
			"meta actions";
		gap: 0.15rem 0.5rem;
		padding: 0.6rem 0.75rem;
		background: #222;
		border: 1px solid #333;
		border-radius: 0.5rem;
	}

	.row--recent {
		background: #242422;
		border-color: #3a372a;
	}

	.row-main {
		grid-area: main;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		min-width: 0;
	}

	.row-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: #fafafa;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-name--mono {
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.7rem;
		font-weight: 500;
		color: #d1d5db;
	}

	.kind-badge {
		font-size: 0.55rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.1rem 0.35rem;
		border-radius: 0.25rem;
		color: #111;
		font-weight: 700;
		flex-shrink: 0;
	}

	.kind-tallies {
		background: #ffd700;
	}

	.kind-map {
		background: #60a5fa;
	}

	.kind-cache {
		background: #4ade80;
	}

	.kind-backup {
		background: #f87171;
	}

	.row-meta {
		grid-area: meta;
		display: flex;
		gap: 0.35rem;
		font-size: 0.7rem;
		color: #9ca3af;
		min-width: 0;
	}

	.meta-time {
		white-space: nowrap;
	}

	.meta-detail {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row-actions {
		grid-area: actions;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.open-btn {
		background: #111;
		border: 1px solid #ffd700;
		color: #ffd700;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.35rem 0.75rem;
		border-radius: 0.35rem;
		cursor: pointer;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.open-btn:active {
		background: #ffd700;
		color: #111;
	}

	.delete-btn {
		background: none;
		border: 1px solid #444;
		color: #6b7280;
		font-size: 0.8rem;
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 0.3rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
