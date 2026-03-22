<script lang="ts">
    import Check from "lucide-svelte/icons/check";

    export type FilterOption = {
        id: string;
        label: string;
        checked: boolean;
    };

    let {
        filters = $bindable<FilterOption[]>([]),
    }: { filters: FilterOption[] } = $props();

    function toggle(id: string) {
        filters = filters.map((f) =>
            f.id === id ? { ...f, checked: !f.checked } : f,
        );
    }
</script>

<div class="stage-filter-pills-container">
    {#each filters as filter (filter.id)}
        <button
            type="button"
            class="stage-filter-pill {filter.checked
                ? 'stage-filter-pill--checked'
                : ''}"
            onclick={() => toggle(filter.id)}
        >
            {#if filter.checked}
                <Check class="stage-filter-pill__icon" />
            {/if}
            <span>{filter.label}</span>
        </button>
    {/each}
</div>
