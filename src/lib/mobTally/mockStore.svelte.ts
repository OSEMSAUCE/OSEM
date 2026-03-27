// Mock TallyStore — for OSS development and standalone OSEM demos.
// Data lives in memory only (no persistence). Implement TallyStore against
// your own planting data API to make it real.

import type { TallyRow, TallyStore } from './types.js';

function createEmptyRow(): TallyRow {
	return {
		id: crypto.randomUUID(),
		speciesCode: '',
		seedlot: '',
		treesPerBundle: null,
		bundleCount: null,
		count: null,
		total: null,
	};
}

function calcTotal(row: TallyRow): number {
	const trees = row.treesPerBundle ?? 0;
	const bundles = row.bundleCount ?? 0;
	const count = row.count ?? 0;
	return trees * bundles + count;
}

export function createMockStore(): TallyStore {
	let activeRows = $state<TallyRow[]>([createEmptyRow()]);
	let committedRows = $state<TallyRow[]>([]);

	return {
		get activeRows() { return activeRows; },
		get committedRows() { return committedRows; },

		addRow() {
			const last = activeRows[activeRows.length - 1];
			activeRows = [
				...activeRows,
				{
					...createEmptyRow(),
					treesPerBundle: last.treesPerBundle,
					bundleCount: last.bundleCount,
				},
			];
		},

		commitRow(index: number) {
			const row = activeRows[index];
			committedRows = [
				...committedRows,
				{ ...row, id: crypto.randomUUID(), total: calcTotal(row), committedAt: new Date().toISOString() },
			];
			activeRows = activeRows.filter((_, i) => i !== index);
			if (activeRows.length === 0) activeRows = [createEmptyRow()];
		},

		updateRow(index: number, patch: Partial<TallyRow>) {
			activeRows = activeRows.map((r, i) => (i === index ? { ...r, ...patch } : r));
		},
	};
}
