<script lang="ts">
    let { selectedFeature }: { selectedFeature: any } = $props();
</script>

{#if selectedFeature.organizationName}
    <div class="info-row">
        <span class="label">Organization:</span>
        <a
            href="/who?organizationKey={selectedFeature.organizationKey}"
            class="link">{selectedFeature.organizationName}</a
        >
    </div>
{/if}

{#if selectedFeature.address}
    <div class="info-row">
        <span class="label">Address:</span>
        <span class="value">{selectedFeature.address}</span>
    </div>
{/if}

{#if selectedFeature.primaryStakeholderCategory}
    <div class="info-row">
        <span class="label">Category:</span>
        <span class="value">{selectedFeature.primaryStakeholderCategory}</span>
    </div>
{/if}

{#if selectedFeature.scoreRankOverall != null}
    <div class="info-row">
        <span class="label">Rank:</span>
        <span class="value">Top {100 - selectedFeature.scoreRankOverall}%</span>
    </div>
{/if}

<style>
    .info-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
    }

    .label {
        color: var(--color-muted-foreground, #e6e6e6);
        min-width: 6rem;
        flex-shrink: 0;
    }

    .link {
        color: var(--color-accent, #a78bfa);
        text-decoration: underline;
        text-decoration-color: var(--color-accent, #a78bfa);
        text-underline-offset: 0.125rem;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .link:hover {
        color: var(--color-accent-foreground, #8b5cf6);
        text-decoration-thickness: 0.125rem;
    }

    .value {
        color: var(--color-foreground, #fafafa);
        word-wrap: break-word;
        overflow-wrap: break-word;
    }
</style>
