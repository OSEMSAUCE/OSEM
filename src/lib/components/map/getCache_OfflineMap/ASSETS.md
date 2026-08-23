# Assets this child needs

The demo at `routes/demo/+page.svelte` renders a real offline basemap. That
basemap is **not in this repo** — it is ~50 MB of tiles, glyphs and imagery,
which does not belong in git.

Four assets are required, all served from `/mobileAssets/`:

| Asset | Size | What breaks without it |
|---|---|---|
| `worldBase/` | 49 MB | the map renders blank — this IS the basemap (tiles + glyphs) |
| `getcache_DT_bg.webp` | 1.2 MB | demo page background |
| `pin_library_small/` | 348 KB | pin sprites |
| `hand_phoneV3.webp` | 164 KB | the phone bezel around the demo |

## Getting them

Run `./fetchAssets.sh`. It looks for a local ReTreever checkout first, and
falls back to telling you what to ask for if there isn't one.

These are **not** AGPL — they are Ground Truth Data's own imagery and
derived basemap data, distributed separately. The code in this repo is AGPL;
the assets are not part of it.
