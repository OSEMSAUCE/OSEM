// Mock CacheStore — for OSS development and standalone OSEM demos.
// Data lives in memory only (no persistence). Implement CacheStore against
// your own data layer to make it real.

import type { CacheRow, CacheStore, BagOut } from './types.js';

function createEmptyRow(): CacheRow {
	return {
		id: crypto.randomUUID(),
		speciesCode: '',
		seedlot: '',
		treesPerBundle: null,
		bundleCount: null,
		count: null,
		pricePerTree: null,
		total: null,
		bagged: false,
	};
}

function calcTotal(row: Pick<CacheRow, 'treesPerBundle' | 'bundleCount' | 'count'>): number {
	const trees = row.treesPerBundle ?? 0;
	const bundles = row.bundleCount ?? 0;
	const count = row.count ?? 0;
	return trees * bundles + count;
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
					treesPerBundle: last.treesPerBundle,
					bundleCount: last.bundleCount,
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
	};
}
