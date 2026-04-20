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
| `mapStyleNatural.ts` | Base Mapbox style (natural earth tones). |
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
Flagship feature — upload and view georeferenced PDF maps as a layer. WIP; layers‑panel UI coming from Claude Design. **Do not delete when not in use** — this is the seed for the layers feature.

| File | Purpose |
|------|---------|
| `mobMapPdfViewer.svelte` | PDF rendering on canvas + bounds extraction. |
| `mobMapLoadButton.svelte` | File picker button (native iOS document picker in Capacitor). |
| `mobMapLibrary.svelte` | Stored‑PDF drawer (list + select + delete). |
| `mobMapGeoref.ts` | PDF georeference extraction. |
| `mobMapOverlay.ts` | Adds the PDF as a Mapbox image overlay source. |
| `mobMapStorage.ts` | OPFS persistence for uploaded PDFs. |
| `mobMapBrandConfig.ts` | Branding config (used when OSEM is deployed standalone). |

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
- `completed-features` (fill + line) — persisted features.

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

**iOS** (`ios/App/App/Info.plist`):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>ReTreever Map uses your location to show where you are on the planting map.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>ReTreever Map uses your location to track your position in the field.</string>
```

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

### Loading PDF maps

On iOS, `<input type="file">` in a Capacitor WebView opens the native document picker. Sources: iCloud Drive, Dropbox, Google Drive, Files app. No extra config.

**iOS storage:** OPFS supported on iOS 16.4+.

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
- **No nav chrome in map.** `TabBarMobile.svelte`, `TopBarMobile.svelte`, `NavMobile.svelte` live at the top of `ReTreever/src/lib/components/`, not here.
- **No separate Capacitor build per sub‑app.** Map, Cache, Stats, Survey all ship in one bundle, one App Store listing.

---

## Link out

- **Cache App / SQLite:** `ReTreever/mobileGetCacheApp.md`
- **704 Survey:** `ReTreever/mobile704App.md`
- **Monorepo conventions:** `agents/agents.md` + `CLAUDE.md`
