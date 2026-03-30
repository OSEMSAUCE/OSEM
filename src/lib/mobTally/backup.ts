// Full backup/restore for EZCache data using Capacitor Share + Filesystem APIs.
// Falls back to Web APIs when running in browser (not native app).

import type { CacheRow, BagOut } from "./types.js";

export interface BackupData {
    v: 2; // version 2 = full backup (vs v1 = seedlot package)
    exportedAt: string;
    activeRows: CacheRow[];
    bagOuts: BagOut[];
}

export function buildBackupJson(
    activeRows: CacheRow[],
    bagOuts: BagOut[],
): string {
    const backup: BackupData = {
        v: 2,
        exportedAt: new Date().toISOString(),
        activeRows,
        bagOuts,
    };
    return JSON.stringify(backup, null, 2);
}

export function parseBackupJson(json: string): BackupData {
    let data: unknown;
    try {
        data = JSON.parse(json);
    } catch {
        throw new Error("Not valid JSON");
    }
    if (
        !data ||
        typeof data !== "object" ||
        (data as BackupData).v !== 2 ||
        !Array.isArray((data as BackupData).activeRows) ||
        !Array.isArray((data as BackupData).bagOuts)
    ) {
        throw new Error("Not a valid EZCache backup file");
    }
    return data as BackupData;
}

function generateFilename(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    return `ezcache-backup-${date}.json`;
}

export async function exportBackup(
    activeRows: CacheRow[],
    bagOuts: BagOut[],
): Promise<void> {
    const json = buildBackupJson(activeRows, bagOuts);
    const filename = generateFilename();

    // Try Capacitor native share first
    try {
        const { Filesystem, Directory, Encoding } = await import(
            "@capacitor/filesystem"
        );
        const { Share } = await import("@capacitor/share");

        // Write to cache directory
        await Filesystem.writeFile({
            path: filename,
            data: json,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
        });

        // Get the file URI
        const fileUri = await Filesystem.getUri({
            path: filename,
            directory: Directory.Cache,
        });

        // Open native share sheet
        await Share.share({
            title: "EZCache Backup",
            files: [fileUri.uri],
            dialogTitle: "Save your backup",
        });
        return;
    } catch (e) {
        // Not running in Capacitor or share was cancelled
        if ((e as Error).name === "AbortError") return;
        console.log("Capacitor share not available, falling back to web", e);
    }

    // Fallback: Web Share API with file
    const file = new File([json], filename, { type: "application/json" });
    try {
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file] });
            return;
        }
    } catch (e) {
        if ((e as Error).name === "AbortError") return;
    }

    // Final fallback: download the file
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
