/**
 * Compose the cached blob tiles into one PNG.
 *
 * Why: a Mapbox raster tile source has fixed minzoom/maxzoom and
 * disappears outside that range. The composite, mounted as a Mapbox
 * `image` source over the blob's bbox, scales at every view zoom
 * (PDF-style) so the user always sees their downloaded imagery.
 *
 * v1 limitation: at deep zoom this PNG gets stretched. The plan calls
 * for a tile-pyramid layer above the composite that serves crisp
 * z=14 tiles from IDB — that's a follow-up. For now the composite is
 * the only blob layer.
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
    // Black backdrop — anything we couldn't load shows black, matching
    // the dark world-floor and making missing tiles visible (no lying).
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, widthPx, heightPx);

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
