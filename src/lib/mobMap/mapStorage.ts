// OPFS persistence for PDF maps
// TODO: Implement in Step 6

export interface StoredMap {
	key: string;
	name: string;
	sizeBytes: number;
	savedAt: Date;
}

export async function saveMap(file: File): Promise<string> {
	throw new Error('Not implemented');
}

export async function listMaps(): Promise<StoredMap[]> {
	throw new Error('Not implemented');
}

export async function loadMap(key: string): Promise<File> {
	throw new Error('Not implemented');
}

export async function deleteMap(key: string): Promise<void> {
	throw new Error('Not implemented');
}
