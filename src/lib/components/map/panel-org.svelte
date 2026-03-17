<script lang="ts">
    let { selectedFeature }: { selectedFeature: any } = $props();
</script>

{#if selectedFeature.organizationName}
    <div class="info-row">
        <span class="label">Organization:</span>
        <a href="/who/{selectedFeature.organizationKey}" class="link"
            >{selectedFeature.organizationName}</a
        >
    </div>
{/if}

{#if selectedFeature.projectName}
    <div class="info-row">
        <span class="label">Project:</span>
        <a href="/what?projectKey={selectedFeature.projectKey}" class="link"
            >{selectedFeature.projectName}</a
        >
    </div>
{/if}

{#if selectedFeature.landName}
    <div class="info-row">
        <span class="label">Land:</span>
        <a
            href="/what?projectKey={selectedFeature.projectKey}&table=LandTable"
            class="link">{selectedFeature.landName}</a
        >
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
</style>
