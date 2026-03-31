// Mock CacheStore — for OSS development and standalone OSEM demos.
// Data lives in memory only (no persistence). Implement CacheStore against
// your own data layer to make it real.

import type { CacheRow, CacheStore, BagOut, SeedlotSpec } from "./types.js";

function createEmptyRow(): CacheRow {
    return {
        id: crypto.randomUUID(),
        speciesCode: "",
        seedlot: "",
        boxSize: null,
        bundleSize: null,
        isBox: true,
        boxCount: null,
        bundleCount: null,
        pricePerTree: null,
        bagged: false,
    };
}

function calcTotal(row: CacheRow): number {
    if (row.isBox) {
        return Math.floor((row.boxSize ?? 0) * (row.boxCount ?? 0));
    }
    return Math.floor((row.bundleSize ?? 0) * (row.bundleCount ?? 0));
}

export function createMockStore(): CacheStore {
    let activeRows = $state<CacheRow[]>([createEmptyRow()]);
    let bagOuts = $state<BagOut[]>([]);

    return {
        get activeRows() {
            return activeRows;
        },
        get bagOuts() {
            return bagOuts;
        },

        removeLastRow() {
            if (activeRows.length > 1) activeRows = activeRows.slice(0, -1);
        },

        addRow() {
            const last = activeRows[activeRows.length - 1];
            activeRows = [
                ...activeRows,
                {
                    ...createEmptyRow(),
                    boxSize: last.boxSize,
                    bundleSize: last.bundleSize,
                    isBox: last.isBox,
                    pricePerTree: last.pricePerTree,
                },
            ];
        },

        bagUpRow(index: number) {
            activeRows = activeRows.map((r, i) =>
                i === index ? { ...r, bagged: !r.bagged } : r,
            );
        },

        bagOut() {
            const baggedRows = activeRows.filter((r) => r.bagged);
            if (baggedRows.length === 0) return;

            const rows = baggedRows.map((r) => {
                const { bagged: _bagged, ...rest } = r;
                return rest;
            });
            const totalTrees = rows.reduce(
                (sum, r) => sum + calcTotal(r as CacheRow),
                0,
            );
            const totalValue = rows.reduce(
                (sum, r) =>
                    sum + calcTotal(r as CacheRow) * (r.pricePerTree ?? 0),
                0,
            );

            bagOuts = [
                {
                    id: crypto.randomUUID(),
                    baggedOutAt: new Date().toISOString(),
                    rows,
                    totalTrees,
                    totalValue,
                },
                ...bagOuts,
            ];
            activeRows = activeRows.map((r) => ({ ...r, bagged: false }));
        },

        updateRow(index: number, patch: Partial<CacheRow>) {
            activeRows = activeRows.map((r, i) => {
                if (i !== index) return r;
                const updated = { ...r, ...patch };
                if (updated.bagged && calcTotal(updated) === 0)
                    updated.bagged = false;
                return updated;
            });
        },

        importSeedlots(seedlots: SeedlotSpec[]) {
            activeRows =
                seedlots.length > 0
                    ? seedlots.map((s) => ({
                          ...createEmptyRow(),
                          speciesCode: s.speciesCode,
                          seedlot: s.seedlot,
                          boxSize: s.boxSize,
                          bundleSize: s.bundleSize,
                          isBox: s.isBox,
                          pricePerTree: s.pricePerTree,
                      }))
                    : [createEmptyRow()];
        },

        clearCache() {
            activeRows = [createEmptyRow()];
        },
    };
}
