// CacheStore interface — implement this to connect EZCache to your data layer.
// The ReTreever implementation lives in ReTreever/src/lib/stores/ezcacheStore.svelte.ts (proprietary).
// A stub for OSS use is in ./mockStore.svelte.ts.

// Seedlot spec — the shareable subset of CacheRow (no runtime state).
// Used in .retreever package files.
export interface SeedlotSpec {
    speciesCode: string;
    seedlot: string;
    boxSize: number | null;
    bundleSize: number | null;
    isBox: boolean;
    pricePerTree: number | null;
}

export interface CacheRow {
    id: string;
    speciesCode: string;
    seedlot: string;
    boxSize: number | null; // trees per box (e.g. 270). Sticky.
    bundleSize: number | null; // trees per bundle (e.g. 15). Sticky.
    isBox: boolean; // true = display box values, false = display bundle values. Toggle via type-circle.
    boxCount: number | null; // number of boxes. 0.5 increments allowed.
    bundleCount: number | null; // number of bundles. Integers only.
    pricePerTree: number | null; // $/tree — sticky, carries forward to new rows
    bagged: boolean; // true = bagged up, awaiting bag-out
}

export interface BagOut {
    id: string;
    baggedOutAt: string; // ISO timestamp (device local time)
    rows: Omit<CacheRow, "bagged">[];
    totalTrees: number;
    totalValue: number; // sum of row.total * (row.pricePerTree ?? 0)
}

export interface CacheStore {
    activeRows: CacheRow[];
    bagOuts: BagOut[];
    addRow: () => void;
    removeLastRow: () => void;
    bagUpRow: (index: number) => void; // toggle bagged on/off
    bagOut: () => void; // flush all bagged rows → bagOuts history
    updateRow: (index: number, patch: Partial<CacheRow>) => void;
    importSeedlots: (seedlots: SeedlotSpec[]) => void; // replace cache with incoming package
    clearCache: () => void; // reset to a single empty row
}
