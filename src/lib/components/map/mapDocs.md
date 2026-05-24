# Map Docs

The map lives in one folder: `OSEM/src/lib/components/map/`. Two parents, one shared engine, one mobile‑only layer stack.

- **`mapPage.svelte`** — desktop full‑screen map. Used by `/where` (`variant="land"`) and `/who/map` (`variant="org"`).
- **`mobMapPage.svelte`** — mobile full‑screen map. Used by `/mobile/map` (Capacitor native).
- **`mapParts/`** — everything they share or mobile‑only parts, flat. `mob*` prefix marks mobile‑only files.
- Both pages render the same **`mapDrawControls.svelte`** — one draw UX across desktop and mobile.

---

## File index — `mapParts/`

### Shared engine
| File | Purpose |
|------|---------|
| `mapInit.ts` | `initializeMap()` + `fullMapOptions` / `compactGlobeOptions`. Entry point for both parents. |
| `mapTypes.ts` | `MapOptions`, `PolygonConfig`, and related types. |
| `mapConfig.ts` | Preset map option bundles (`fullMapOptions`, `compactGlobeOptions`). |
| `safeMap.ts` | **Mandatory** wrapper for every camera mutation. See §Camera mutations. |
| `safeEase.ts` | Globe-projection-safe easing helper (rAF + jumpTo). |
| `mapStyleNatural.ts` | Base Mapbox style (natural earth tones). |
| `mapStyleOffline.ts` | Offline PMTiles basemap (always-on bottom layer). See §Offline Basemap below. |
| `mapMarker.ts` | DOM marker clustering helpers. |
| `mapUtilsHash.ts` | URL hash sync for view state. |
| `mapControlBaseToggle.ts` | Satellite / dark basemap toggle control. |
| `mapControlGeoToggle.ts` | Geolocate control. |
| `mapLayerOrg.ts` | Org polygons + pins layer. |
| `mapLayerOrgPins.ts` | Org pin marker layer. |
| `mapLayerPolygon.ts` | Polygon rendering + lazy loading. |
| `mapInfoPanel.svelte` | Left‑side info panel (desktop). |
| `mapPanelLand.svelte` | Land ownership panel. |
| `mapPanelOrg.svelte` | Org info panel. |
| `mapNavButtons.svelte` | People / tree nav toggle buttons. |

### Draw engine (shared desktop + mobile)
| File | Purpose |
|------|---------|
| `mapDrawControls.svelte` | Draw UI + state: FAB, toolbar, draw popover, feature popover, edit sheet. Rendered by both `mapPage` and `mobMapPage`. |
| `mapDraw.ts` | Pure helpers: source/layer setup, GeoJSON builders (`buildDrawEdgesFC`, `buildCompletedFC`, …), hit test, pixel‑bbox projection, `finalizeFeature`. |
| `mapDrawUtils.ts` | `formatArea()`, `formatLength()`, `measureFeature()`. |
| `mapFeaturePopover.svelte` | Share/Edit/Delete/Close popover, bbox‑aware positioning. |
| `mapFeatureEditSheet.svelte` | Bottom sheet for renaming + adding notes to a drawn feature. |
| `mapShareFeature.ts` | Export feature as `.geojson` via Web Share API. |

### Mobile‑only (`mob*` prefix)

Overlay layer for georeferenced maps. **Mid-rewrite**: PDF.js path is being
torn out in favour of server-side GDAL → WebP, see
[`MAP_IMPORT_HANDOFF.md`](../../../../../src/lib/mobile/docs/MAP_IMPORT_HANDOFF.md).

| File | Purpose | Status |
|------|---------|--------|
| `mobMapOverlay.ts` | Mapbox `ImageSource` wiring for the overlay | **Keeps** — input swaps from PDF-canvas-dataURL to WebP file URL in Phase 2 |
| `mobMapStorage.ts` | Local filesystem persistence | **Keeps** — stores WebPs instead of PDFs after Phase 2 |
| `mobMapBrandConfig.ts` | Branding for OSEM-standalone builds | **Keeps** |
| `mobMapGeoref.ts` | All five PDF-georef strategies (GPTS/LPTS, LGIDict CTM, GDAL-text, XMP, raw streams) | **Deleted in Phase 4** — GDAL on the container does this now |
| `mobMapPdfViewer.svelte` | PDF.js canvas viewer | **Deleted in Phase 4** |
| `mobMapLoadButton.svelte` | PDF-specific file picker | **Deleted in Phase 4** |
| `mobMapLibrary.svelte` | Stored-PDF drawer | **Deleted in Phase 4** — replaced by inbox overlay browsing |

---

## Routes

| Route | Component | Notes |
|-------|-----------|-------|
| `/where` | `mapPage.svelte` | Desktop. Full map with polygons, pins, info panel. |
| `/who/map` | `mapPage.svelte` (different props) | Desktop. Org‑scoped view. |
| `/mobile/map` | `mobMapPage.svelte` | Capacitor native. |

`mapPage` lives in OSEM; ReTreever routes are thin 6‑line shells that import it and pass props.

---

## Draw engine (`mapDraw.ts`)

**State machine:**
- `drawIntent: "polygon" | "line" | null` — what the user wants to draw.
- `drawnVertices: [lng, lat][]` — vertices laid down so far.
- `completedFeatures: Feature[]` — finalised features.
- `selectedFeatureIndex: number | null` — tap to select, show popover.

**Sources / layers** (added once to the map):
- `draw-vertices` (circle layer) — in‑progress vertex dots.
- `draw-edges` (line layer) — in‑progress edges.
- `provisional-polygon` (fill) — closed preview of the shape being drawn.
- `completed-features` (fill + line + vertex handles) — persisted features.

**Vertex handles are editing-only.** The `completed-features` source carries a
synthesized Point per vertex of every polygon/line, but the `completed-vertices-*`
circle layers start hidden (filtered to `_idx = -1`, which matches nothing).
`setVertexHandlesForFeature(map, idx)` reveals just the selected feature's
handles; deselecting passes `null` and hides them all. Without this gate a map
of many shapes renders as a field of white-haloed orbs. Edit state
(`selectedFeatureIndex`) lives in `mapDrawControls.svelte`; `mapDraw.ts` only
translates an index into the two layer filters.

**Popover positioning** (`mapFeaturePopover.svelte`):
- Computed screen‑space bbox of the feature.
- Popover appears 15 px above or below the bbox, whichever side has more viewport room.
- On side‑flip, popover fades out/in (60 ms) instead of sliding — avoids feeling jumpy.
- Clamped to viewport padding so it never escapes the screen.

**Area / length formatting:**
- `>= 100 ha` → `1,234 ha` (0 decimals, comma thousands)
- `10–99.9 ha` → `45.3 ha` (1 decimal)
- `< 10 ha` → `3.14 ha` (2 decimals)
- `< 1 ha` → shown in m²: `4,500 m²`
- Length: `>= 1 km` → `1.23 km`, else `450 m`.

---

## Camera mutations — the safeMap rule

**Every camera mutation goes through `mapParts/safeMap.ts`. No exceptions.** Direct `map.flyTo`, `map.fitBounds`, `map.easeTo`, `map.jumpTo`, `map.setCenter`, `map.setZoom` etc. are banned by `scripts/check-direct-mapbox-camera.sh` (run in CI).

### Why
Mapbox's `_calcMatrices` is the choke point of the entire render pipeline. A single NaN reaching it (lng, lat, zoom, bearing, padding, offset) corrupts the camera's internal state. Once corrupt, **every subsequent call** — even valid ones — crashes with `Cannot read properties of null (reading '3')`. Spot fixes at one call site don't help: the next call inherits the corruption.

`safeMap.ts` does three things at every entry:
1. Validate inputs are finite (rejects + logs if not).
2. Detect already-corrupt camera state and `jumpTo` a clean state before the new call.
3. `map.stop()` to cancel in-flight animations (prevents stack-blow from stacked transitions).

### Use
```ts
import { safeFlyTo, safeFitBounds, safeJumpTo, safeEaseTo }
    from "$osem/components/map/mapParts/safeMap";

safeFlyTo(map, { center: [lng, lat], zoom: 14, duration: 1200 });
safeFitBounds(map, sw, ne, { padding: 60, duration: 800 });
```

`safeFitBounds` automatically falls back to `safeFlyTo` for degenerate single-point bounds — no manual `if (sw === ne)` branching needed at call sites.

### Adding a new camera helper
If you find yourself wanting to add inline NaN guards or `Number.isFinite` checks before a Mapbox camera call, the right move is to extend `safeMap.ts`, not duplicate the guards. The lint script will catch direct calls; if `safeMap` is missing a wrapper you need (e.g. `safePanTo`), add it there with the same validate-then-call pattern.

### NaN can also enter through SOURCES and MARKERS — not just the camera
`safeMap.ts` only guards camera inputs. A NaN can still crash Mapbox if it lands in:

- a GeoJSON source's `coordinates` (`map.getSource(id).setData(...)`)
- a `mapboxgl.Marker.setLngLat([lng, lat])` call
- any `map.unproject(...)` / `map.project(...)` argument

When this happens, the stack trace looks **different from a camera crash** — typically `Invalid LngLat object: (NaN, NaN)` originating inside Mapbox's render pass (e.g. `_evaluateOpacity`, `coordinateLocation`, `pointLocation3D`), with no user code in the trace. That's the tell: it's a render-time unproject of bad source/marker data, not a camera call.

**Common upstream sources of NaN coords:**
- `e.lngLat` from `touchmove` during multi-touch / pinch — Mapbox sometimes emits `(NaN, NaN)` mid-gesture.
- Math on user-drawn vertices (mid-point, length) before the second vertex exists.
- Imported KML/GeoJSON with malformed coordinates.
- Geolocation watchers before the first fix.

**Rule:** validate before writing to a source or marker, the same way `safeMap.ts` validates before a camera call. Re-use the helpers exported from `safeMap.ts` so the gate is one piece of code:

```ts
import { isFiniteCoord, isFiniteLngLat }
    from "$osem/components/map/mapParts/safeMap";

// touchmove / mousemove handlers
if (!isFiniteLngLat(e.lngLat)) return;

// before pushing into a source
const safe = coords.filter(isFiniteCoord);
if (safe.length < 2) return;
source.setData({ type: "LineString", coordinates: safe });

// before a marker
if (!isFiniteCoord(pos)) return;
new mapboxgl.Marker({ element }).setLngLat(pos).addTo(map);
```

If you spot a render-time crash with no user code in the trace, do **not** patch the symptom inside Mapbox internals or wrap the camera again — find the upstream write and add the guard there.

---

## Map UX principles

Applies wherever we render a Mapbox GL map — `/where`, `/who/map`, the homepage globe, the mobile PDF overlay.

### 1. Elastic limits over hard stops
Every gesture should produce some visible motion while fingers are moving — even if subtle and the map snaps back. If a pinch hits `maxZoom` with a hard stop, users can't tell whether the gesture registered at all. Set real `minZoom`/`maxZoom` slightly outside the soft limits, then in `zoomend` ease back to the soft limit. `mapInit.ts` already does this (`MAP_CONFIG.zoom.{softMin,softMax,overshoot,easeMs}`).

### 2. No main‑thread work during gestures
Defer non‑essential recomputation until `idle` (fires once after everything settles). Don't trust `moveend` / `zoomend` — those fire repeatedly during continuous gestures. DOM marker updates, viewport‑dependent fetches: all gated on `idle`.

### 3. Hide, don't re‑render, during gestures
On `movestart` / `zoomstart`, add `.map-busy` to the container; CSS rule hides `.retreever-marker` via `display: none`. Restore on `moveend` / `zoomend`. The browser skips layout/paint for hidden markers, keeping the main thread free.

### 4. Data volume > rendering speed
Globe view downloads centroid‑only Points. Full polygons lazy‑load on `zoomend` past a threshold. Polygons over `LARGE_POLYGON_HECTARES` (1000 ha) only render when their centroid is clicked. Polygons over `ABSOLUTE_POLYGON_HECTARES_CAP` (50 000 ha) never render. Phase 3 target: PMTiles / vector tiles.

### 5. Mobile ≠ Web map
Each `initializeMap()` call declares its own style, projection, and data layers — no inheritance. Mobile explicitly passes `style: MAP_CONFIG.styles.defaultSat`; desktop passes `defaultDark`. This is what makes it safe to iterate on the web map without shipping regressions to mobile.

---

## Capacitor build (ReTreever)

Run from `ReTreever/`:

```bash
BUILD_TARGET=cap vite build

# First-time platform setup
npx cap add ios
npx cap add android

# After any code change
npm run cap:sync     # builds + syncs both platforms
npm run cap:ios      # builds + opens Xcode
npm run cap:android  # builds + opens Android Studio
```

**App icon:** `ReTreever/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` — 1024×1024 PNG converted from `static/pub-Rtvr/retreever-logo_squooshed.webp`. Replace to update icon; Xcode picks it up automatically.

### iOS to a physical device

1. `npx cap open ios`
2. Select iPhone as target.
3. Xcode → Settings → Accounts → add Apple ID.
4. Select team in Signing & Capabilities.
5. On iPhone: Settings → Privacy & Security → Developer Mode → On (requires restart).
6. Hit Run.

TestFlight: requires Apple Developer Program ($99/yr). Archive → Distribute → TestFlight.

### Location permissions

**iOS** (`ios/App/App/Info.plist`) — see file for current copy.

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### Deep link (`retreever://`)

**iOS** — `Info.plist`, inside root `<dict>`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key><string>com.retreever.map</string>
    <key>CFBundleURLSchemes</key><array><string>retreever</string></array>
  </dict>
</array>
```

**Android** — `AndroidManifest.xml`, inside main `<activity>`:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="retreever" />
</intent-filter>
```

**Supabase** — Authentication → URL Configuration → Redirect URLs: `https://retreever.org/account/callback`.

### Loading map overlays (foreign formats)

PDF / KML / KMZ / TIF go server-side through `process-map-asset` (Supabase
Edge Function → Cloudflare Container running real GDAL). Returns
WebP + bounds; the WebP lands in `mobMapStorage` and Mapbox renders it via
`ImageSource`. The app never parses GeoPDFs on-device. Full architecture in
[`MAP_IMPORT_HANDOFF.md`](../../../../../src/lib/mobile/docs/MAP_IMPORT_HANDOFF.md).

`.retreever` files (peer-to-peer shares — Phase 5) bypass GDAL: they unzip
locally to `meta.json` + `features.kml` + `overlay.webp`.

---

## Adding a new mobile component

Aimed at Claude Design / future contributors:

1. Drop the new file into `mapParts/`, prefixed `mob*` if it's mobile‑only (e.g. `mobMapTracker.svelte`).
2. Import it from `mobMapPage.svelte`. Do not add a new `mobMap/` folder.
3. Don't touch `mapDraw.ts` unless adding a new vertex mode / feature type.
4. Keep business logic out of OSEM — stores, SQLite, API calls live in `ReTreever/src/lib/stores/` and `ReTreever/src/routes/`. OSEM is UI + geometry only.

---

## What NOT to do

- **No MapboxDraw.** The shared `mapDraw.ts` replaces it. Don't re‑add `@mapbox/mapbox-gl-draw`.
- **No PWA.** Mobile is Capacitor native. No service worker, no manifest. Updates ship via App Store / Play Store.
- **No second map folder.** `mobMap/` is gone; `map/` is the one map folder.
- **No duplicated draw logic.** Desktop and mobile both import from `mapParts/`.
- **No nav chrome in map.** `TabBarMobile.svelte`, `TopBarMobile.svelte`, `NavMobile.svelte` live in `ReTreever/src/lib/mobile/components/ui/`, not here.
- **No separate Capacitor build per sub‑app.** Map, Cache, Stats, Survey all ship in one bundle, one App Store listing.

---

## Offline Basemap (Tier 1)

The Capacitor app ships with a bundled PMTiles file so the map is **never black in airplane mode**. Implementation: `mapParts/mapStyleOffline.ts`, wired in `mapInit.ts` via a `style.load` handler.

**Coverage:** world minus Antarctica, zoom 0–6 (state/province-level detail).
**Size:** ~85 MB. Bundled at `static/mobileAssets/basemap.pmtiles` (gitignored, generated locally).
**Render order:** added as the *bottom* layer. Mapbox satellite/streets composite on top when online. Offline = bundled PMTiles is what the user sees.

### How it works
- Mapbox GL JS v3.21+ auto-detects `.pmtiles` URLs on a `vector` source. No protocol shim, no plugin.
- Layer specs come from `@protomaps/basemaps` (`namedFlavor("dark")` + palette overrides matching `mapStyleNatural`).
- Symbol/label layers are stripped — Get Cache uses a no-labels aesthetic.

### Refreshing the file
```bash
cd ReTreever/
./scripts/fetch-basemap.sh            # uses today's UTC build
./scripts/fetch-basemap.sh 20260301   # specific date
```
The script auto-downloads the `pmtiles` CLI into `node_modules/.bin/` if missing, then runs `pmtiles extract` against the Protomaps daily build with `--maxzoom=6 --bbox=-180,-60,180,85`. Takes 10–30 min over the network.

### Capacitor bundling
The file lives under `static/`, so SvelteKit copies it to the build output. `npx cap sync` then copies it into the iOS/Android app bundle. No extra config needed. PMTiles uses HTTP range requests; both WKWebView (iOS) and WebViewAssetLoader (Android) honor `Range` headers on bundled assets.

### Why z0–z6 only
- z5 (~25 MB) → countries, big rivers, coastlines
- **z6 (~85 MB) → state/province borders, regional rivers** ← we are here
- z7 (~300 MB) → would push over iOS cellular-download warning

For higher zoom offline detail in the user's working region, see Tier 2 (regional cache, 5-day swap) — separate feature, not yet implemented.

---

## Link out

- **Cache App / SQLite:** `ReTreever/src/lib/mobile/docs/mobileGetCacheApp.md`
- **Monorepo conventions:** `agents/agents.md` + `CLAUDE.md`
