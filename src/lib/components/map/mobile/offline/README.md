# Offline map (air-gapped instance)

A second, independent `mapboxgl.Map` that **cannot reach the internet by
construction**. It backs the `/mobile/offline` route and renders only bytes
already on the device. It shares nothing live with the online `/mobile/map`.

> **First principles + the full download/budget design live in**
> [`src/lib/mobile/docs/OFFLINE_BASEMAP_PLAN.md`](../../../../../../../src/lib/mobile/docs/OFFLINE_BASEMAP_PLAN.md).
> This README is just the engine in *this* directory.

Reached via the **crow** switch (`CrowSwitch` in `MapTopControls`). Gated behind
`OFFLINE_MAP_ENABLED` (`src/lib/mobile/offlineMapFlag.ts`): when off, the crow is
hidden and `/mobile/offline` redirects to `/mobile/map` without mounting.

---

## The air-gap, in one diagram

```
                           ┌─────────────────────────────┐
                           │  /mobile/map  (online map)  │
                           │  Mapbox tiles, geocoding,   │
                           │  telemetry, etc.            │
                           └─────────────┬───────────────┘
                                         │  (the USER, on request, downloads
                                         │   bytes onto the device. The DATA
                                         │   crosses; the network never does.)
                                         ▼
   ╔═══════════════════════════════════════════════════════════════════╗
   ║  On-device storage (bundled world floor + downloaded tiles)        ║
   ╚═══════════════════════════════════════════════════════════════════╝
                                         │  reads only — never the network
                                         ▼
                           ┌─────────────────────────────┐
                           │  /mobile/offline            │
                           │  AIR-GAPPED                 │
                           │  transformRequest rejects   │
                           │  every URL not starting in: │
                           │    /  blob:  data:          │
                           │    capacitor://  file://    │
                           │  No mapbox:// styles.       │
                           │  No internet hosts. Ever.   │
                           └─────────────────────────────┘
```

## Design rule: jagged tile boundary, never a smooth circle

The downloaded region renders with its **real, raw, tile-edge-aligned boundary** —
jagged and stair-stepped. We **never** alpha-mask it to a smooth circle, clip
partial tiles, or otherwise tidy the layout. The imperfection is the point: it
proves the on-screen coverage is real data on the device, not a pretty shape over
gaps. Do not "improve" this with smoothing or partial-tile clipping.

---

## Files in this directory

| File | Role |
|------|------|
| `OfflineMap.svelte` | The air-gapped `mapboxgl.Map`. Built once with a hand-made local-only style + locked `transformRequest`. |
| `OfflineMapChrome.svelte` | Bundled Mapbox chrome (attribution + scale bar) as one unit. |
| `offlineStyle.ts` | Builds the local-only style object (no `mapbox://` URLs). Currently the CartoDB Dark world floor (`/offlineTiles/`, z0–7). |
| `offlineTransformRequest.ts` | The air-gap guard — rejects any URL that isn't local. |
| `offlineBlobUrlCache.ts` | Serves locally-cached tiles back to the map by URL. |
| `offlineStorage.ts` | IndexedDB read/write helpers + `purgeLegacyKeys()`. Sole owner of the DB. |
| `types.ts` | Shared types. |

## World floor

`/static/offlineTiles/{z}/{x}/{y}.png` — CartoDB Dark Matter, z0–7, ships **inside
the app binary** (not a download). It is the always-present base the offline map
falls back to everywhere. The per-feature detail tiers (small/big/linework) that
get downloaded on top are the subject of `OFFLINE_BASEMAP_PLAN.md`.

## Verify the air-gap

1. DevTools → Network, filter `https://`.
2. Open `/mobile/offline`, pan/zoom, exercise every tool.
3. The HTTPS panel stays empty (a few blocked `events.mapbox.com` attempts logged
   as `[offline] blocked non-local request: …` are the guard working, not a bug).
4. Airplane-mode the device and reload — the world floor still renders.
