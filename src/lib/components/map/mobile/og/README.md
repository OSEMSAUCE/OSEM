# Offline Gopher (OG)

Air-gapped second Mapbox instance. By construction, never reaches the
internet — only renders bytes already on the device.

> Status: scaffolded, gated behind `VITE_OG_ENABLED`. World floor
> renders. Country fill, blob composite, blob tile pyramid, gopher
> character, and hole transition are all TODO — see the plan at
> `~/.claude/plans/image-1-i-want-sprightly-corbato.md`.

---

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
