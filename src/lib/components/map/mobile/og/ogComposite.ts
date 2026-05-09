/**
 * Compose the cached blob tiles into one PNG.
 *
 * Honesty rules — this is a debugging tool first, decoration second:
 *   • Transparent backdrop. Where no tile was cached, the canvas
 *     stays transparent so the dark world-floor shows through. We do
 *     NOT paint black to "fill in" missing tiles — that would lie
 *     about coverage.
 *   • No circular mask. The cache is a rectangular set of tile coords
 *     (each tile is a square Mercator slice). We paint each cached
 *     tile at its actual lat/lng position. The result IS rectangular,
 *     possibly with holes — that's what's truthfully on the device.
 *   • One zoom level. The composite paints every cached tile at the
 *     chosen `zoom` (default z=12). The tile pyramid layer above the
 *     composite covers other zoom levels.
 *
 * Mounted as a Mapbox `image` source over the union of cached tiles
 * so it renders at every view zoom (PDF-style). Visible at z=2,
 * still visible at z=18 (just stretched there — that's where the
 * pyramid kicks in).
 */

import type { OgBounds } from "./types";
import {
    bboxToTileRange,
    tileRangeBounds,
} from "./ogGeometry";

const TILE_PX = 256;

export type ComposeOptions = {
    bbox: OgBounds;
    cachedTiles: Set<string>;
    /** Reads a PNG blob from IDB by tile key, or null if missing. */
    getTile: (z: number, x: number, y: number) => Promise<Blob | null>;
    zoom?: number;
};

export type ComposeResult = {
    blob: Blob;
    bounds: OgBounds;
    tileCount: number;
    skipped: number;
};

export async function composeBlobComposite(
    opts: ComposeOptions,
): Promise<ComposeResult> {
    const { bbox, cachedTiles, getTile, zoom = 12 } = opts;
    const { xMin, xMax, yMin, yMax } = bboxToTileRange(bbox, zoom);
    const widthTiles = xMax - xMin + 1;
    const heightTiles = yMax - yMin + 1;
    const widthPx = widthTiles * TILE_PX;
    const heightPx = heightTiles * TILE_PX;

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("composeBlobComposite: 2D context unavailable");
    // Transparent backdrop on purpose. We never paint pixels we don't
    // have data for. Where a tile is missing, the dark world-floor
    // shows through — honest about coverage gaps.

    let drawn = 0;
    let skipped = 0;

    const drawOne = async (x: number, y: number): Promise<void> => {
        const key = `${zoom}/${x}/${y}`;
        if (!cachedTiles.has(key)) {
            skipped++;
            return;
        }
        const blob = await getTile(zoom, x, y);
        if (!blob) {
            skipped++;
            return;
        }
        const url = URL.createObjectURL(blob);
        try {
            const img = await loadImage(url);
            const dx = (x - xMin) * TILE_PX;
            const dy = (y - yMin) * TILE_PX;
            ctx.drawImage(img, dx, dy);
            drawn++;
        } catch {
            skipped++;
        } finally {
            URL.revokeObjectURL(url);
        }
    };

    const jobs: Promise<void>[] = [];
    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            jobs.push(drawOne(x, y));
        }
    }
    await Promise.all(jobs);

    const outBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (b) =>
                b ? resolve(b) : reject(new Error("toBlob returned null")),
            "image/png",
        );
    });

    const bounds = tileRangeBounds(zoom, xMin, xMax, yMin, yMax);

    return {
        blob: outBlob,
        bounds,
        tileCount: drawn,
        skipped,
    };
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = url;
    });
}
