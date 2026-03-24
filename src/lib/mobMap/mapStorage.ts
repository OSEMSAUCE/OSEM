const MAPS_DIR = 'maps';
const META_FILE = 'maps-meta.json';
const MAX_STORED_MAPS = 20;

export interface StoredMap {
	key: string;
	name: string;
	sizeBytes: number;
	savedAt: Date;
}

interface MetaRecord {
	key: string;
	name: string;
	sizeBytes: number;
	savedAt: string; // ISO string for JSON serialisation
}

// ── OPFS helpers ────────────────────────────────────────────────────────────

async function getMapsDir(): Promise<FileSystemDirectoryHandle> {
	const root = await navigator.storage.getDirectory();
	return root.getDirectoryHandle(MAPS_DIR, { create: true });
}

async function readMeta(root: FileSystemDirectoryHandle): Promise<MetaRecord[]> {
	try {
		const fh = await root.getFileHandle(META_FILE);
		const file = await fh.getFile();
		return JSON.parse(await file.text()) as MetaRecord[];
	} catch {
		return [];
	}
}

async function writeMeta(root: FileSystemDirectoryHandle, records: MetaRecord[]): Promise<void> {
	const fh = await root.getFileHandle(META_FILE, { create: true });
	const writable = await fh.createWritable();
	await writable.write(JSON.stringify(records));
	await writable.close();
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Save a PDF file to OPFS. Returns the storage key (sanitised filename). */
export async function saveMap(file: File): Promise<string> {
	const dir = await getMapsDir();
	const key = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

	// Write the PDF bytes
	const fh = await dir.getFileHandle(key, { create: true });
	const writable = await fh.createWritable();
	await writable.write(await file.arrayBuffer());
	await writable.close();

	// Update metadata
	let records = await readMeta(dir);
	// Remove existing entry with same key if re-saving
	records = records.filter((r) => r.key !== key);
	records.push({ key, name: file.name, sizeBytes: file.size, savedAt: new Date().toISOString() });

	// Enforce max 20 maps — drop oldest first
	if (records.length > MAX_STORED_MAPS) {
		records.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
		const toRemove = records.splice(0, records.length - MAX_STORED_MAPS);
		for (const r of toRemove) {
			try {
				await dir.removeEntry(r.key);
			} catch {
				// ignore missing files
			}
		}
	}

	await writeMeta(dir, records);
	return key;
}

/** List all stored maps, sorted newest first. */
export async function listMaps(): Promise<StoredMap[]> {
	const dir = await getMapsDir();
	const records = await readMeta(dir);
	return records
		.map((r) => ({ ...r, savedAt: new Date(r.savedAt) }))
		.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
}

/** Load a stored map by key, returning it as a File. */
export async function loadMap(key: string): Promise<File> {
	const dir = await getMapsDir();
	const fh = await dir.getFileHandle(key);
	const file = await fh.getFile();
	// Reconstruct with original name from metadata
	const records = await readMeta(dir);
	const meta = records.find((r) => r.key === key);
	return new File([await file.arrayBuffer()], meta?.name ?? key, { type: 'application/pdf' });
}

/** Delete a stored map by key. */
export async function deleteMap(key: string): Promise<void> {
	const dir = await getMapsDir();
	try {
		await dir.removeEntry(key);
	} catch {
		// already gone
	}
	const records = await readMeta(dir);
	await writeMeta(
		dir,
		records.filter((r) => r.key !== key),
	);
}

/** Returns { used, quota } in bytes. */
export async function storageEstimate(): Promise<{ used: number; quota: number }> {
	const estimate = await navigator.storage.estimate();
	return { used: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}
