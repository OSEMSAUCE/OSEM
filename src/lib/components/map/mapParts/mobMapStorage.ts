// Map overlay storage — small WebP files (~250 KB each, hundreds of KB max)
// produced server-side by the GDAL container. Per CLAUDE.md the storage
// substrate differs by runtime:
//   - native     → @capacitor/filesystem (real disk, no quota issues)
//   - dt-web /   → OPFS (Origin Private File System) — backed by IndexedDB
//     mob-web      in WebKit; Safari has a known bug where writing a large
//                  blob via writable.write(arrayBuffer) throws "operation
//                  failed for an unknown transient reason (e.g. out of
//                  memory)". The fix is to write the Blob directly so the
//                  browser can stream it.
//
// WebPs replaced the old PDF blobs in Phase 2 of the GDAL rewrite. The on-
// device PDF.js stack is gone; the only thing that lives here now is the
// post-GDAL overlay image. ~20× smaller than the source PDF.

import { Capacitor } from "@capacitor/core";

const MAPS_DIR = "maps";
const META_FILE = "maps-meta.json";
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
	savedAt: string;
}

/** URL for a stored overlay + a revoke callback the caller MUST invoke when
 * done. On native the callback is a no-op (`convertFileSrc` URLs are static).
 * On web it revokes the blob URL created by `URL.createObjectURL`. */
export interface OverlayHandle {
	url: string;
	revoke: () => void;
}

const isNative = () => Capacitor.isNativePlatform();

function safeKey(filename: string): string {
	return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// ── Native (Capacitor Filesystem) ────────────────────────────────────────────

async function nativeFs() {
	const { Filesystem, Directory, Encoding } = await import(
		"@capacitor/filesystem"
	);
	return { Filesystem, Directory, Encoding };
}

async function nativeReadMeta(): Promise<MetaRecord[]> {
	const { Filesystem, Directory, Encoding } = await nativeFs();
	try {
		const res = await Filesystem.readFile({
			path: `${MAPS_DIR}/${META_FILE}`,
			directory: Directory.Data,
			encoding: Encoding.UTF8,
		});
		return JSON.parse(res.data as string) as MetaRecord[];
	} catch {
		return [];
	}
}

async function nativeWriteMeta(records: MetaRecord[]): Promise<void> {
	const { Filesystem, Directory, Encoding } = await nativeFs();
	await Filesystem.writeFile({
		path: `${MAPS_DIR}/${META_FILE}`,
		directory: Directory.Data,
		encoding: Encoding.UTF8,
		data: JSON.stringify(records),
		recursive: true,
	});
}

async function nativeSave(file: File): Promise<string> {
	const { Filesystem, Directory } = await nativeFs();
	const key = safeKey(file.name);
	// base64 is the only way to ship binary through the Capacitor bridge.
	const buf = new Uint8Array(await file.arrayBuffer());
	let binary = "";
	const chunk = 0x8000;
	for (let i = 0; i < buf.length; i += chunk) {
		binary += String.fromCharCode(...buf.subarray(i, i + chunk));
	}
	const base64 = btoa(binary);
	await Filesystem.writeFile({
		path: `${MAPS_DIR}/${key}`,
		directory: Directory.Data,
		data: base64,
		recursive: true,
	});
	return key;
}

async function nativeLoad(key: string): Promise<File> {
	const { Filesystem, Directory } = await nativeFs();
	const res = await Filesystem.readFile({
		path: `${MAPS_DIR}/${key}`,
		directory: Directory.Data,
	});
	const base64 = res.data as string;
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	const records = await nativeReadMeta();
	const meta = records.find((r) => r.key === key);
	return new File([bytes], meta?.name ?? key, { type: "image/webp" });
}

async function nativeDelete(key: string): Promise<void> {
	const { Filesystem, Directory } = await nativeFs();
	try {
		await Filesystem.deleteFile({
			path: `${MAPS_DIR}/${key}`,
			directory: Directory.Data,
		});
	} catch {
		// already gone
	}
}

async function nativeGetUrl(key: string): Promise<OverlayHandle> {
	const { Filesystem, Directory } = await nativeFs();
	const { uri } = await Filesystem.getUri({
		path: `${MAPS_DIR}/${key}`,
		directory: Directory.Data,
	});
	// Capacitor file:// URLs fail in WKWebView/Android WebView — must rewrite
	// to capacitor://localhost/_capacitor_file_/... See MAP_IMPORT_HANDOFF.md gotcha 3.
	return { url: Capacitor.convertFileSrc(uri), revoke: () => {} };
}

// ── Web (OPFS) ───────────────────────────────────────────────────────────────

async function getMapsDir(): Promise<FileSystemDirectoryHandle> {
	const root = await navigator.storage.getDirectory();
	return root.getDirectoryHandle(MAPS_DIR, { create: true });
}

async function webReadMeta(
	root: FileSystemDirectoryHandle,
): Promise<MetaRecord[]> {
	try {
		const fh = await root.getFileHandle(META_FILE);
		const file = await fh.getFile();
		return JSON.parse(await file.text()) as MetaRecord[];
	} catch {
		return [];
	}
}

async function webWriteMeta(
	root: FileSystemDirectoryHandle,
	records: MetaRecord[],
): Promise<void> {
	const fh = await root.getFileHandle(META_FILE, { create: true });
	const writable = await fh.createWritable();
	await writable.write(JSON.stringify(records));
	await writable.close();
}

async function webSave(file: File): Promise<string> {
	const dir = await getMapsDir();
	const key = safeKey(file.name);
	const fh = await dir.getFileHandle(key, { create: true });
	const writable = await fh.createWritable();
	try {
		// Pass the Blob directly — the browser streams it. Materialising via
		// file.arrayBuffer() first OOMed Safari on the old multi-MB PDFs;
		// WebPs are smaller but the streaming write is still the right idea.
		await writable.write(file);
		await writable.close();
	} catch (e) {
		try {
			await writable.close();
		} catch {
			/* ignore */
		}
		const msg = (e as Error).message ?? "";
		if (
			msg.includes("unknown transient") ||
			msg.includes("memory") ||
			msg.includes("quota")
		) {
			throw new Error(
				`Browser ran out of storage saving "${file.name}". Try a smaller map, or use the installed app.`,
			);
		}
		throw e;
	}

	let records = await webReadMeta(dir);
	records = records.filter((r) => r.key !== key);
	records.push({
		key,
		name: file.name,
		sizeBytes: file.size,
		savedAt: new Date().toISOString(),
	});
	if (records.length > MAX_STORED_MAPS) {
		records.sort(
			(a, b) =>
				new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime(),
		);
		const toRemove = records.splice(0, records.length - MAX_STORED_MAPS);
		for (const r of toRemove) {
			try {
				await dir.removeEntry(r.key);
			} catch {
				/* ignore missing files */
			}
		}
	}
	await webWriteMeta(dir, records);
	return key;
}

async function webLoad(key: string): Promise<File> {
	const dir = await getMapsDir();
	const fh = await dir.getFileHandle(key);
	const file = await fh.getFile();
	const records = await webReadMeta(dir);
	const meta = records.find((r) => r.key === key);
	return new File([file], meta?.name ?? key, { type: "image/webp" });
}

async function webDelete(key: string): Promise<void> {
	const dir = await getMapsDir();
	try {
		await dir.removeEntry(key);
	} catch {
		/* already gone */
	}
}

async function webGetUrl(key: string): Promise<OverlayHandle> {
	const dir = await getMapsDir();
	const fh = await dir.getFileHandle(key);
	const file = await fh.getFile();
	const url = URL.createObjectURL(file);
	return { url, revoke: () => URL.revokeObjectURL(url) };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function saveMap(file: File): Promise<string> {
	if (isNative()) {
		const key = await nativeSave(file);
		let records = await nativeReadMeta();
		records = records.filter((r) => r.key !== key);
		records.push({
			key,
			name: file.name,
			sizeBytes: file.size,
			savedAt: new Date().toISOString(),
		});
		if (records.length > MAX_STORED_MAPS) {
			records.sort(
				(a, b) =>
					new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime(),
			);
			const toRemove = records.splice(0, records.length - MAX_STORED_MAPS);
			for (const r of toRemove) await nativeDelete(r.key);
		}
		await nativeWriteMeta(records);
		return key;
	}
	return webSave(file);
}

export async function listMaps(): Promise<StoredMap[]> {
	const records = isNative()
		? await nativeReadMeta()
		: await webReadMeta(await getMapsDir());
	return records
		.map((r) => ({ ...r, savedAt: new Date(r.savedAt) }))
		.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
}

export async function loadMap(key: string): Promise<File> {
	return isNative() ? nativeLoad(key) : webLoad(key);
}

/** Returns a URL suitable for Mapbox `ImageSource`. The handle MUST be
 * revoked by the caller (no-op on native, frees the blob URL on web). */
export async function getMapUrl(key: string): Promise<OverlayHandle> {
	return isNative() ? nativeGetUrl(key) : webGetUrl(key);
}

export async function deleteMap(key: string): Promise<void> {
	if (isNative()) {
		await nativeDelete(key);
		const records = (await nativeReadMeta()).filter((r) => r.key !== key);
		await nativeWriteMeta(records);
		return;
	}
	await webDelete(key);
	const dir = await getMapsDir();
	const records = (await webReadMeta(dir)).filter((r) => r.key !== key);
	await webWriteMeta(dir, records);
}

export async function storageEstimate(): Promise<{
	used: number;
	quota: number;
}> {
	if (isNative()) {
		return { used: 0, quota: Number.POSITIVE_INFINITY };
	}
	const estimate = await navigator.storage.estimate();
	return { used: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}

// ── Per-map directory root (shared with vector tile package below) ──────────
//
// Previously housed both raster tile pyramids (Phase 4, reverted 2026-05-24)
// and vector tile pyramids (Phase 5, current). Only the vector path still
// uses this directory — the raster API (`saveTilePackage`, `readTileSidecar`,
// `hasTilesOnDisk`, `getTileUrlTemplate`, `getThumbUrl`, `deleteTilePackage`)
// was deleted in the revert. PDFs are back on the single-WebP path above.

function tileDir(mapKey: string): string {
	return `${MAPS_DIR}/${safeKey(mapKey)}`;
}

// ── Vector-tile-package API (Phase 5 — vector tile pyramid) ─────────────────
//
// The server (gdalConvert / tippecanoe, Phase 5) returns a ZIP containing:
//   vtiles/{z}/{x}/{y}.pbf  +  vsidecar.json
//
// Lets multi-thousand-feature KMLs render without flooding the synced
// TinyBase DB ([[big-map-storage-split]]); tiles are mounted via a Mapbox
// VectorSource against the on-disk tree. The sidecar is named
// `vsidecar.json` (a separate name was chosen back when a raster sibling
// `sidecar.json` lived in the same per-map directory; the raster pyramid was
// reverted 2026-05-24 — PDFs are back on the single-WebP path above — but
// the `vsidecar.json` name stayed because changing it would orphan any
// existing on-device bakes).
//
// NATIVE ONLY for v1 — web (OPFS) tile serving needs a Service Worker that
// maps tile URL fetches to local storage, which is a separate slice of work.
// Per MAP_IMPORTS_UNIFIED.md §1.3 we fail loudly with a clear error rather
// than silently degrade ([[no-silent-fallbacks]]).

const VTILES_SUBDIR = "vtiles";
const VSIDECAR_FILE = "vsidecar.json";

export interface VectorTileSidecar {
	schemaVersion: number;
	bounds: { n: number; s: number; e: number; w: number };
	epsg: number;
	minzoom: number;
	maxzoom: number;
	bakedAt: number;
	/** Total feature count baked into the pyramid — surfaced in the inbox
	 * card subtitle ("412 features") without re-reading any tile. */
	featureCount?: number;
	/** Tile body format. Today: `"mvt"` (Mapbox Vector Tile, gzip-compressed
	 *  protobuf) — what tippecanoe emits. Reserved for future variants. */
	vtileFormat?: string;
	sourceFile?: string;
}

/** Unpack a baked vector-tile-package ZIP into mobMapStorage/{mapKey}/vtiles/.
 * Returns the parsed sidecar so the caller can stamp the mapTable cells
 * (vtilesMinZoom etc.). NATIVE ONLY — throws on web for now. */
export async function saveVectorTilePackage(
	mapKey: string,
	zipFile: File,
): Promise<VectorTileSidecar> {
	if (!isNative()) {
		throw new Error(
			"[mobMapStorage] vector tile pyramid is native-only in v1; web has no OPFS tile-serving path",
		);
	}
	const { Filesystem, Directory, Encoding } = await nativeFs();
	const { unzipSync, strFromU8 } = await import("fflate");
	const root = tileDir(mapKey);
	const vtilesRoot = `${root}/${VTILES_SUBDIR}`;

	// Wipe any previous vector bake for this map — idempotent re-import per
	// [[idempotent-import-principle]]. Only nuke the vtiles subdir, NOT the
	// whole map directory: a sibling raster tile package may live alongside
	// (e.g. a KMZ with both vector features and a GroundOverlay) and we
	// don't want to nuke that.
	try {
		await Filesystem.rmdir({
			path: vtilesRoot,
			directory: Directory.Data,
			recursive: true,
		});
	} catch {
		// not present — first bake for this map
	}
	// Also remove a previous sidecar so a half-written package can't survive.
	try {
		await Filesystem.deleteFile({
			path: `${root}/${VSIDECAR_FILE}`,
			directory: Directory.Data,
		});
	} catch {
		// not present
	}

	const buf = new Uint8Array(await zipFile.arrayBuffer());
	const entries = unzipSync(buf);

	let sidecar: VectorTileSidecar | null = null;
	for (const [name, bytes] of Object.entries(entries)) {
		if (name.endsWith("/")) continue; // directory entry
		const path = `${root}/${name}`;
		// base64 encode for the Capacitor bridge — same trick as nativeSave.
		let binary = "";
		const chunk = 0x8000;
		for (let i = 0; i < bytes.length; i += chunk) {
			binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
		}
		const base64 = btoa(binary);
		await Filesystem.writeFile({
			path,
			directory: Directory.Data,
			data: base64,
			recursive: true,
		});
		if (name === VSIDECAR_FILE) {
			sidecar = JSON.parse(strFromU8(bytes)) as VectorTileSidecar;
		}
	}

	if (!sidecar) {
		throw new Error(
			`[mobMapStorage] vector tile package for ${mapKey} missing ${VSIDECAR_FILE}`,
		);
	}
	// Re-write the sidecar as canonical JSON so a downstream read parses
	// cleanly regardless of how the bake serialized it.
	await Filesystem.writeFile({
		path: `${root}/${VSIDECAR_FILE}`,
		directory: Directory.Data,
		encoding: Encoding.UTF8,
		data: JSON.stringify(sidecar),
		recursive: false,
	});
	return sidecar;
}

/** Read the vector-tile sidecar for a map. Returns null if no vector tile
 * package is on disk (cloud-restored device case → caller surfaces
 * TILES_NOT_ON_DEVICE). NATIVE ONLY. */
export async function readVectorTileSidecar(
	mapKey: string,
): Promise<VectorTileSidecar | null> {
	if (!isNative()) return null;
	const { Filesystem, Directory, Encoding } = await nativeFs();
	try {
		const res = await Filesystem.readFile({
			path: `${tileDir(mapKey)}/${VSIDECAR_FILE}`,
			directory: Directory.Data,
			encoding: Encoding.UTF8,
		});
		return JSON.parse(res.data as string) as VectorTileSidecar;
	} catch {
		return null;
	}
}

/** True if a vector tile pyramid is on disk for this mapKey. Used by the
 * renderer to decide between mounting a VectorSource and surfacing
 * TILES_NOT_ON_DEVICE (per §11 of MAP_IMPORTS_UNIFIED.md). */
export async function hasVectorTilesOnDisk(mapKey: string): Promise<boolean> {
	if (!isNative()) return false;
	return (await readVectorTileSidecar(mapKey)) !== null;
}

/** Mapbox VectorSource `tiles` template for the on-disk pyramid. The
 * `{z}/{x}/{y}` placeholders are interpolated by Mapbox per tile request.
 * NATIVE ONLY — web doesn't expose Filesystem URIs as fetchable URLs. */
export async function getVectorTileUrlTemplate(
	mapKey: string,
): Promise<string> {
	if (!isNative()) {
		throw new Error(
			"[mobMapStorage] getVectorTileUrlTemplate is native-only",
		);
	}
	const { Filesystem, Directory } = await nativeFs();
	const { uri } = await Filesystem.getUri({
		path: `${tileDir(mapKey)}/${VTILES_SUBDIR}`,
		directory: Directory.Data,
	});
	// Capacitor.convertFileSrc rewrites file:// → capacitor://localhost/...
	// .pbf is the conventional MVT extension; tippecanoe emits gzip-
	// compressed protobuf with this name.
	return `${Capacitor.convertFileSrc(uri)}/{z}/{x}/{y}.pbf`;
}

/** Wipe a map's vector tile package (vtiles subdir + sidecar) — idempotent.
 * Leaves any sibling raster tile package intact. */
export async function deleteVectorTilePackage(mapKey: string): Promise<void> {
	if (!isNative()) return;
	const { Filesystem, Directory } = await nativeFs();
	const root = tileDir(mapKey);
	try {
		await Filesystem.rmdir({
			path: `${root}/${VTILES_SUBDIR}`,
			directory: Directory.Data,
			recursive: true,
		});
	} catch {
		// already gone
	}
	try {
		await Filesystem.deleteFile({
			path: `${root}/${VSIDECAR_FILE}`,
			directory: Directory.Data,
		});
	} catch {
		// already gone
	}
}
