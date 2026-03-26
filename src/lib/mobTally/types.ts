// TallyStore interface — implement this to connect TallyPage to your data layer.
// The ReTreever implementation lives in ReTreever/src/lib/stores/tallyStore.ts (proprietary).
// A stub for local development / OSS use is in ./mockStore.ts.

export interface TallyRow {
	id: string;
	speciesCode: string;
	seedlot: string;
	treesPerBundle: number | null;
	bundleCount: number | null;
	count: number | null;
	total: number | null;
	committedAt?: string; // ISO timestamp
}

export interface TallyData {
	activeRows: TallyRow[];
	committedRows: TallyRow[];
}

export interface TallyStore {
	activeRows: TallyRow[];
	committedRows: TallyRow[];
	addRow: () => void;
	commitRow: (index: number) => void;
	updateRow: (index: number, patch: Partial<TallyRow>) => void;
}
