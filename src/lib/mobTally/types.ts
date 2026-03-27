// CacheStore interface — implement this to connect CacheApp to your data layer.
// The ReTreever implementation lives in ReTreever/src/lib/stores/cacheStore.svelte.ts (proprietary).
// A stub for OSS use is in ./mockStore.svelte.ts.

export interface CacheRow {
	id: string;
	speciesCode: string;
	seedlot: string;
	containerSize: number | null;  // trees per bundle OR per box (e.g. 15 or 270). Sticky.
	isBox: boolean;                 // true = box mode: count allows 0.5 steps. false = bundle: integers only.
	count: number | null;           // number of bundles or boxes. 0.5 increments if isBox.
	pricePerTree: number | null;   // $/tree — sticky, carries forward to new rows
	total: number | null;          // calculated: containerSize * count
	bagged: boolean;               // true = bagged up, awaiting bag-out
}

export interface BagOut {
	id: string;
	baggedOutAt: string;           // ISO timestamp (device local time)
	rows: Omit<CacheRow, 'bagged'>[];
	totalTrees: number;
	totalValue: number;            // sum of row.total * (row.pricePerTree ?? 0)
}

export interface CacheStore {
	activeRows: CacheRow[];
	bagOuts: BagOut[];
	addRow: () => void;
	removeLastRow: () => void;
	bagUpRow: (index: number) => void;   // toggle bagged on/off
	bagOut: () => void;                   // flush all bagged rows → bagOuts history
	updateRow: (index: number, patch: Partial<CacheRow>) => void;
}
