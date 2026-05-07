// Map PDF storage. Per CLAUDE.md the storage substrate differs by runtime:
//   - native     → @capacitor/filesystem (real disk, no quota issues)
//   - dt-web /   → OPFS (Origin Private File System) — backed by IndexedDB
//     mob-web      in WebKit; Safari has a known bug where writing a large
//                  blob via writable.write(arrayBuffer) throws "operation
//                  failed for an unknown transient reason (e.g. out of
//                  memory)". The fix is to write the Blob directly so the
//                  browser can stream it instead of materialising the whole
//                  buffer in memory.

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
    savedAt: string; // ISO string for JSON serialisation
}

const isNative = () => Capacitor.isNativePlatform();

function safeKey(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// ── Native (Capacitor Filesystem) ────────────────────────────────────────────

async function nativeFs() {
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
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
    return new File([bytes], meta?.name ?? key, { type: "application/pdf" });
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
        // Pass the Blob directly — the browser streams it. Materialising
        // via file.arrayBuffer() first OOMs Safari on PDFs over ~30MB.
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
                `Browser ran out of storage saving "${file.name}". Try a smaller PDF, or use the installed app for large maps.`,
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
    return new File([file], meta?.name ?? key, { type: "application/pdf" });
}

async function webDelete(key: string): Promise<void> {
    const dir = await getMapsDir();
    try {
        await dir.removeEntry(key);
    } catch {
        /* already gone */
    }
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
    const records = isNative() ? await nativeReadMeta() : await webReadMeta(await getMapsDir());
    return records
        .map((r) => ({ ...r, savedAt: new Date(r.savedAt) }))
        .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
}

export async function loadMap(key: string): Promise<File> {
    return isNative() ? nativeLoad(key) : webLoad(key);
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
        // Native disk is effectively unbounded relative to in-app blobs.
        return { used: 0, quota: Number.POSITIVE_INFINITY };
    }
    const estimate = await navigator.storage.estimate();
    return { used: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}
