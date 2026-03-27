// Mock CacheStore — for OSS development and standalone OSEM demos.
// Data lives in memory only (no persistence). Implement CacheStore against
// your own data layer to make it real.

import type { CacheRow, CacheStore, BagOut, SeedlotSpec } from './types.js';

function createEmptyRow(): CacheRow {
	return {
		id: crypto.randomUUID(),
		speciesCode: '',
		seedlot: '',
		containerSize: null,
		isBox: false,
		count: null,
		pricePerTree: null,
		total: null,
		bagged: false,
	};
}

function calcTotal(row: Pick<CacheRow, 'containerSize' | 'count'>): number {
	return Math.floor((row.containerSize ?? 0) * (row.count ?? 0));
}

export function createMockStore(): CacheStore {
	let activeRows = $state<CacheRow[]>([createEmptyRow()]);
	let bagOuts = $state<BagOut[]>([]);

	return {
		get activeRows() { return activeRows; },
		get bagOuts() { return bagOuts; },

		removeLastRow() {
			if (activeRows.length > 1) activeRows = activeRows.slice(0, -1);
		},

		addRow() {
			const last = activeRows[activeRows.length - 1];
			activeRows = [
				...activeRows,
				{
					...createEmptyRow(),
					containerSize: last.containerSize,
					isBox: last.isBox,
					pricePerTree: last.pricePerTree,
				},
			];
		},

		bagUpRow(index: number) {
			activeRows = activeRows.map((r, i) =>
				i === index ? { ...r, bagged: !r.bagged } : r
			);
		},

		bagOut() {
			const baggedRows = activeRows.filter(r => r.bagged);
			if (baggedRows.length === 0) return;

			const rows = baggedRows.map(({ bagged: _bagged, ...r }) => ({
				...r,
				total: calcTotal(r),
			}));
			const totalTrees = rows.reduce((sum, r) => sum + (r.total ?? 0), 0);
			const totalValue = rows.reduce((sum, r) => sum + (r.total ?? 0) * (r.pricePerTree ?? 0), 0);

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
			activeRows = activeRows.map(r => ({ ...r, bagged: false }));
		},

		updateRow(index: number, patch: Partial<CacheRow>) {
			activeRows = activeRows.map((r, i) => (i === index ? { ...r, ...patch } : r));
		},

		importSeedlots(seedlots: SeedlotSpec[]) {
			activeRows = seedlots.length > 0
				? seedlots.map(s => ({
					...createEmptyRow(),
					speciesCode: s.speciesCode,
					seedlot: s.seedlot,
					containerSize: s.containerSize,
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
