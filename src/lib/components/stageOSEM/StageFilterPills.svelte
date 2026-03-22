<script lang="ts">
    import { Checkbox } from "$lib/components/ui/checkbox";
    import Check from "lucide-svelte/icons/check";

    type FilterOption = {
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

<div class="flex flex-wrap gap-2">
    {#each filters as filter (filter.id)}
        <button
            type="button"
            class="filter-pill flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-150"
            class:checked={filter.checked}
            onclick={() => toggle(filter.id)}
        >
            {#if filter.checked}
                <Check class="size-4" />
            {/if}
            <span>{filter.label}</span>
        </button>
    {/each}
</div>

<style>
    .filter-pill {
        border-color: var(--border);
        background-color: transparent;
        color: var(--muted-foreground);
    }

    .filter-pill:hover {
        border-color: var(--foreground);
        color: var(--foreground);
    }

    .filter-pill.checked {
        border-color: #d4a017;
        background-color: #d4a01720;
        color: #d4a017;
    }

    .filter-pill.checked:hover {
        background-color: #d4a01730;
    }
</style>
