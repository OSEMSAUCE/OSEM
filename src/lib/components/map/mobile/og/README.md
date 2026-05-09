# Offline Gopher (OG)

Air-gapped second Mapbox instance. By construction, never reaches the
internet — only renders bytes already on the device.

> Status: scaffolded, gated behind `VITE_OG_ENABLED`. World floor
> renders, blob download/composite/pyramid all working at z=12..15
> against Esri World Imagery. Country fill, gopher character, and
> hole transition are still TODO. Imagery source is **temporary
> dev-only** — see "Production direction" below for the actual
> ship-ready architecture.

---

## Production direction (planned migration)

> The current Esri-tiles-into-IDB pipeline is the dev/demo plumbing.
> Esri's free World Imagery TOS prohibits offline caching for
> commercial use — fine for prototyping, not fine for shipping a
> tree-planter app to many users. The plan below replaces the imagery
> source and the storage shape with a self-hosted, commercial-OK
> stack.

### Two-layer architecture (target)

| Layer | Source | Format | Zooms | Purpose |
|-------|--------|--------|-------|---------|
| **Vector** (navigation) | OpenStreetMap via Protomaps planet extract | **PMTiles** (single static file, byte-range requests) | z0–15 | Roads, FSRs, rivers, lakes, wetlands, contours, labels |
| **Imagery** (ground truth) | Sentinel-2 (free) **or** Mapbox Satellite (paid) | MBTiles or PMTiles raster | z0–13 (~18 m / px) | Satellite imagery for terrain reading |

Combined download for a 50 km radius work area: **~500 MB**.

### Hosting: Cloudflare R2

- One PMTiles file for the OSM vector layer (regional or planet
  extract, ~100 GB for full planet).
- One PMTiles or MBTiles file for imagery per region.
- Served from R2 with HTTP byte-range support (PMTiles' whole point).
- **R2 egress is free** — cost is storage only, ~$1.50 / month for
  the 100 GB planet file. No tile server, no compute, no per-request
  cost.

### On-device storage

- SQLite or MBTiles file via `@capacitor/filesystem`.
- PMTiles random access via the `pmtiles` JS library.
- The map (likely **MapLibre**, since Mapbox 3.23.1 doesn't expose
  `addProtocol` and PMTiles support there is brittle — see the
  `mapbox-pmtiles-not-supported.md` memory) points its source at the
  local file path.
- Zero tile requests leave the device when offline mode is active.

### Download UX requirements (target)

Before any download begins, the panel must show:

- Selected area (radius in km) drawn on the map
- Estimated tile count
- Estimated download size in MB
- Current free storage on device
- Warning if free space < 2× download size
- Layer toggles (vector only / imagery only / both)
- Radius slider that updates the size estimate in real time
- Small preview thumbnail showing imagery quality at the selected zoom

User must explicitly confirm before download starts.

### Zoom level reference (latitude ~55° N)

| Mapbox zoom | m / pixel | Use |
|---|---|---|
| z=13 | ~18 m | Imagery ceiling (free Sentinel-2 native) |
| z=14 | ~9 m | Sentinel-2 oversampled |
| z=15 | ~5 m | Vector detail ceiling |
| z=17 | ~1.2 m | Commercial imagery max |

### Area / storage reference (z=13 imagery + z=15 vector)

| Radius | Area | Total size |
|---|---|---|
| 10 km | 314 km² | ~25 MB |
| 25 km | 1,963 km² | ~150 MB |
| 50 km | 7,854 km² | ~500 MB |
| 100 km | 31,416 km² | ~2 GB |

### Open questions

- [ ] Imagery source: Sentinel-2 (free, requires a tile-processing
      pipeline — split L2A scenes into PMTiles/MBTiles) vs Mapbox
      (paid, plug-and-play).
- [ ] OSEM scope: could OSEM host processed Sentinel-2 tiles as open
      infrastructure for any field-ops app to consume?
- [ ] User-contributed OSM edits: allow field corrections to flow
      back to OpenStreetMap?
- [ ] Tile expiry: vector tiles should refresh periodically (OSM
      updates); imagery is essentially static.

### What in the current code carries forward

- `OgMap.svelte` — air-gapped construction; transformRequest pattern
  generalises directly. Engine swap (Mapbox→MapLibre) means changing
  the import + style schema, not the air-gap surface.
- `ogTransformRequest.ts` — the local-scheme allow-list is the same
  idiom regardless of engine.
- `ogStorage.ts` — gets replaced by an MBTiles/PMTiles handle on
  the filesystem rather than an IDB schema.
- `ogPrefetch.ts` + `ogActions.ts` + `ogComposite.ts` — these all go
  away. The new model is "download one PMTiles file, not 2,000
  individual tiles."
- `OgPanel.svelte` — the UI shape (idle / running / full / progress)
  generalises; just the size/source language updates.

---

## Design rule: jagged tile boundary, not a smooth circle

OG deliberately keeps the cached blob **shaped exactly like the union
of tiles that fit fully inside the user's radius**. That's a jagged,
stair-stepped boundary — visibly tile-edge-aligned at every zoom.

This is intentional. We considered three other options and rejected
each one:

1. **Alpha-mask the composite to a smooth circle.** Easy, but it hides
   real cached pixels — the user has tiles that the mask erases. The
   experience felt like a "fake circle painted over square data" and
   broke trust.
2. **Render the full square cached set.** Honest about what's on disk,
   but doesn't reflect the user's stated intent ("I asked for a 60 km
   radius"). The user can't tell at a glance how their request maps to
   what got downloaded.
3. **Clip the rendered tiles at draw time.** Mapbox 3.x clip layers
   don't apply to raster sources. Even when they did, this would still
   be the same kind of visual lie as option 1 — hiding pixels that are
   really on disk.

The jagged shape solves all of that. The visible boundary is **the
actual extent of cached data**, and the imperfection is the proof the
user is seeing reality. Trust the gopher only works when the
visualisation cannot lie.

So: tiles whose four corners all lie within `radiusKm` are downloaded;
tiles that straddle the circle are not. The result is honest by
construction. **Do not "improve" this with smoothing or partial-tile
clipping.** Code: `ogGeometry.tileFullyInCircle`,
`ogPrefetch.ts:circle` option.

A side-effect worth noting: zoom levels whose tile size exceeds the
diameter end up with zero qualifying tiles (e.g. z=8 tiles are
~155 km wide; none fits in a 60 km radius). Those zooms are simply
skipped — the OG world floor (CartoDB z=0..7) already covers the
overview.

## File map

```
fetch/                                                    (monorepo root)
│
├─ ReTreever/
│  ├─ .env                                                ← VITE_OG_ENABLED=true (dev)
│  ├─ .env.example                                        ← VITE_OG_ENABLED=false (prod template)
│  │
│  ├─ static/
│  │  ├─ offlineTiles/{z}/{x}/{y}.png                     ← bundled CartoDB Dark Matter
│  │  │                                                     world floor (z0-7, ~38 MB,
│  │  │                                                     5,977 files). Ships with
│  │  │                                                     the .ipa/.apk — not a download.
│  │  └─ mobileAssets/
│  │     └─ gopherIcon.webp                               ← the GOPHER tile icon
│  │
│  ├─ src/routes/mobile/                                  (proprietary)
│  │  ├─ map/MapDrawControls.svelte                       ← GOPHER tile (flag-gated) lives
│  │  │                                                     in the TOOLS grid here
│  │  └─ og/+page.svelte                                  ← /mobile/og route. Mounts OgMap
│  │                                                       + reuses MapDrawControls for
│  │                                                       drawer/tools. Redirects to
│  │                                                       /mobile/map when flag is off.
│  │
│  └─ OSEM/src/lib/components/map/mobile/og/              (open source — YOU ARE HERE)
│     ├─ README.md                                        ← this file
│     ├─ OgMap.svelte                                     ← the air-gapped mapboxgl.Map.
│     │                                                     Constructed once with a hand-built
│     │                                                     style + locked transformRequest.
│     ├─ ogStyle.ts                                       ← builds the local-only style
│     │                                                     object (no mapbox:// URLs).
│     ├─ ogTransformRequest.ts                            ← air-gap guard. Rejects every URL
│     │                                                     that doesn't start with /, blob:,
│     │                                                     data:, capacitor://, file://.
│     ├─ ogStorage.ts                                     ← IndexedDB read/write helpers.
│     │                                                     Single ownership module —
│     │                                                     nothing else opens this DB.
│     └─ types.ts                                         ← OgBlob, OgBounds, OgCountryMeta,
│                                                           LngLat
│
│     (TODO files, not yet created:)
│     ├─ ogWorldFloor.ts                                  ← (currently inline in ogStyle.ts;
│     │                                                     extract when country/blob layers
│     │                                                     are added)
│     ├─ ogCountryFill.ts                                 ← IDB-backed country tile source
│     ├─ ogBlob.ts                                        ← composite PNG + tile pyramid
│     ├─ OgGopher.svelte                                  ← gopher character + hunger states
│     └─ OgHoleTransition.svelte                          ← page-transition animation
```

---

## Data map

OG stores everything in **one IndexedDB database**: `retreever-og`.
Three stores. Owned exclusively by `ogStorage.ts`. Nothing else in the
codebase opens this DB.

```
IndexedDB: retreever-og
│
├─ og-blob                       (single row, key "current")
│  └─ value: {                   the active blob — there is only ever ONE.
│       id, center, radiusKm,    Replacing it deletes the row + every
│       bounds, composedAt,      blob-tile in one transaction.
│       tileCount,
│       compositeBlob: Blob      ← composite PNG. Mounted as a Mapbox
│     }                            `image` source so it's visible at
│                                  every view zoom (PDF-style).
│
├─ og-blob-tiles                 (keyed `${z}/${x}/${y}`)
│  └─ value: Blob (PNG)          per-tile imagery for the active blob.
│                                Served via transformRequest path
│                                lookup → at deep zoom, real tiles
│                                render ABOVE the composite for
│                                sharp detail.
│
└─ og-country-tiles              (keyed `${iso}/${z}/${x}/${y}`
                                  + meta row `${iso}/_meta`)
   └─ value: Blob (PNG)          country-level dark vector coverage
                                  downloaded once per device, on first
                                  OG entry, after geocoding GPS to ISO
                                  country code (online side).
```

### Where the bytes live, by runtime

| Runtime | IndexedDB physical location | Visible to |
|---------|----------------------------|------------|
| **dt-web** (laptop browser) | Browser profile (Chrome/Safari/Brave). DevTools → Application → IndexedDB → `retreever-og`. | The user, dev tools. |
| **mob-web** (phone browser) | Phone browser profile. Same as above on Safari Develop menu. | The user. |
| **native** (Capacitor iOS/Android) | App-sandboxed WebView storage. iOS: `~/Library/WebKit/com.retreever.map/...`. Android: `/data/data/com.retreever.map/app_webview/...`. | Only this app. Cleared on uninstall. |

The world floor (`/static/offlineTiles/`) ships **inside the app
binary** — it's not "downloaded data," it's bundled. Same on every
runtime; the path `/offlineTiles/...` is served by SvelteKit (web)
or by the Capacitor file bridge (native).

---

## The air-gap, in one diagram

```
                           ┌─────────────────────────────┐
                           │  /mobile/map  (regular map) │
                           │  online — Mapbox tiles,     │
                           │  geocoding, telemetry, etc. │
                           └─────────────┬───────────────┘
                                         │
                                         │  (worker / regular map writes
                                         │   bytes into IDB — country
                                         │   tiles, blob tiles. The DATA
                                         │   crosses; the network does not.)
                                         ▼
   ╔═══════════════════════════════════════════════════════════════════╗
   ║  IndexedDB: retreever-og                                          ║
   ║  (the one and only place OG keeps its data)                       ║
   ╚═══════════════════════════════════════════════════════════════════╝
                                         │
                                         │  reads only — never writes
                                         │  to the network
                                         ▼
                           ┌─────────────────────────────┐
                           │  /mobile/og  (OG map)       │
                           │  AIR-GAPPED                 │
                           │  ─────────────              │
                           │  transformRequest rejects   │
                           │  every URL that doesn't     │
                           │  start with one of:         │
                           │    /  blob:  data:          │
                           │    capacitor://  file://    │
                           │                             │
                           │  No mapbox:// styles.       │
                           │  No internet hosts.         │
                           │  Ever.                      │
                           └─────────────────────────────┘
```

---

## Build flag

```
VITE_OG_ENABLED=true   ← .env (dev): GOPHER tile visible, /mobile/og renders.
VITE_OG_ENABLED=false  ← .env.example (prod template): tile hidden,
                         route redirects to /mobile/map on entry.
```

Two gates, belt and braces:

1. `MapDrawControls.svelte` — the GOPHER tile is wrapped in
   `{#if import.meta.env.VITE_OG_ENABLED === "true"}`. Vite dead-code-
   eliminates the branch in production builds, so the icon import and
   the `goto` call don't ship.
2. `og/+page.svelte` — top-level `{#if}` + an `onMount` redirect.
   Direct navigation to `/mobile/og` bounces to `/mobile/map` when the
   flag is off.

To completely strip OG from a production bundle (optional):

```bash
rm -rf src/routes/mobile/og
rm -rf OSEM/src/lib/components/map/mobile/og
rm static/mobileAssets/gopherIcon.webp
```

The flag alone is sufficient for shipping; the `rm` step is only for
auditors who want zero OG code in the deployed artifact.

---

## How to verify the air-gap works

1. Open DevTools, Network tab, filter on `https://`.
2. Navigate to `/mobile/og`.
3. Pan, zoom, exercise every drawer tool.
4. The HTTPS panel should stay empty (or show a few blocked
   `events.mapbox.com` telemetry attempts logged with
   `[og] blocked non-local request: …` in the console — that's the
   air-gap working, not a bug).
5. Switch the device to airplane mode and reload. World floor still
   renders; nothing degrades.
