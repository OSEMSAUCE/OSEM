# Map — index

**This file is an index. It owns two things and points at the rest.**

It used to be a 405-line file map of a flat `mapParts/` folder. That folder no
longer exists: the map engine was split into two **children** plus the shared
seam, and the Get Cache map UI moved into its own route. Every file path in the
old version was dead, so the file map is gone rather than re-written — a file
map is exactly the kind of thing that rots, and `ls` never lies.

---

## Where the map actually lives

| What | Where |
|---|---|
| The Get Cache map UI (`MobMapPage`, `MapDrawControls`, layers, plot drop, tracking) | `/Users/chrisharris/DEV/fetch/ReTreever/src/routes/(getcache)/map/` |
| Offline basemap engine — a **child** | `getCache_OfflineMap/` (this folder) |
| Online Mapbox map — a **child** | `getCache_OnlineMap/` (this folder) |
| The shared seam — `safeMap`, `coord`, `hostPorts`, `kmGeo`, … | `mapShared/` (this folder) |
| The boundary guards | `childBoundary.test.ts`, `harnessIsolation.test.ts`, `harnessAssets.test.ts` |

**Architecture — tiers, harness, children, the feature flag, the linchpin:**
[`/Users/chrisharris/DEV/fetch/agents/memories/three_tier_architecture.md`](../../../../../../agents/memories/three_tier_architecture.md).
That file wins over this one. Do not restate it here.

| Topic | Owner |
|---|---|
| Offline map | [`src/lib/mobile/docs/OFFLINE_PLAN.md`](../../../../../src/lib/mobile/docs/OFFLINE_PLAN.md) |
| PDF / KML / KMZ / GeoTIFF imports | [`src/lib/mobile/docs/MAP_IMPORTS_UNIFIED.md`](../../../../../src/lib/mobile/docs/MAP_IMPORTS_UNIFIED.md) |
| Repo conventions, route groups, mini-apps | [`ReTreever/CLAUDE.md`](../../../../../CLAUDE.md) |
| Mobile file map | [`src/lib/mobile/CLAUDE.md`](../../../../../src/lib/mobile/CLAUDE.md) |
| Cache app | [`src/lib/mobile/docs/mobileGetCacheApp.md`](../../../../../src/lib/mobile/docs/mobileGetCacheApp.md) |

---

## 1. Camera mutations — the safeMap rule

**Every camera mutation goes through `mapShared/safeMap.ts`. No exceptions.**
Direct `map.flyTo`, `fitBounds`, `easeTo`, `jumpTo`, `setCenter`, `setZoom` are
banned by `scripts/check-direct-mapbox-camera.sh`, which runs in CI.

### Current known violations — triaged 2026-08-23, don't re-panic

The guard had been scanning only `src/`, because it grepped a folder renamed to
`harness/` and swallowed the error (`2>/dev/null || true`). Repointed, it
reports **7** sites, not 4. **Triaged: six are guarded, one is not.**

| site | verdict |
|---|---|
| `src/routes/(getcache)/map/mapFramer.ts:290` | `Number.isFinite` on both coords **plus** a null-island `(0,0)` reject. Safest of the seven. |
| `src/lib/mobile/components/mobMap/pinMarkers.ts:441` | guarded by `isFiniteCoord` on the line above |
| `getCache_OnlineMap/lib/mapDraw.ts:736` | guarded by `.every(Number.isFinite)` above |
| `getCache_OnlineMap/lib/mapDraw.ts:746` | `parseBbox` returns early on a bad bbox |
| `src/lib/mobile/stores/mapViewport.ts:211-212` | `setBearing(0)` / `setPitch(0)` — literals, cannot be NaN |
| **`getCache_OnlineMap/lib/mapGrid.ts:1094`** | ⚠️ **the real one.** Feeds an unvalidated `cam.unproject()` result straight into `easeTo`. Unproject on a mid-gesture or degenerate camera is exactly the NaN source §"NaN can also enter through SOURCES and MARKERS" describes. |

So the guard is doing its job — it forbids the *pattern*, and the pattern is
what rots. But only `mapGrid.ts:1094` is a live NaN risk; the rest want a
mechanical swap to `safeEaseTo`/`safeFlyTo` (or a documented allow), not a
rescue. Fix `mapGrid` first.

### Why

Mapbox's `_calcMatrices` is the choke point of the render pipeline. One NaN
reaching it (lng, lat, zoom, bearing, padding, offset) corrupts the camera's
internal state, and once corrupt **every subsequent call** — even a valid one —
crashes with `Cannot read properties of null (reading '3')`. Fixing one call
site does not help; the next call inherits the corruption.

`safeMap.ts` does three things at every entry:

1. Validate inputs are finite (reject + log if not).
2. Detect already-corrupt camera state and `jumpTo` a clean one first.
3. `map.stop()` to cancel in-flight animations, preventing stacked transitions.

```ts
import { safeFlyTo, safeFitBounds }
    from "$harness/components/map/mapShared/safeMap";

safeFlyTo(map, { center: [lng, lat], zoom: 14, duration: 1200 });
```

`safeFitBounds` falls back to `safeFlyTo` for degenerate single-point bounds —
no `if (sw === ne)` branching at call sites.

Wanting to add an inline `Number.isFinite` guard before a camera call means
extending `safeMap.ts`, not duplicating the guard.

### NaN also enters through SOURCES and MARKERS

`safeMap.ts` guards camera inputs only. A NaN still crashes Mapbox if it lands
in a GeoJSON source's `coordinates`, a `Marker.setLngLat()`, or a
`map.project()` / `unproject()` argument.

That crash **looks different**: typically `Invalid LngLat object: (NaN, NaN)`
from inside Mapbox's render pass (`_evaluateOpacity`, `pointLocation3D`) with
no user code in the trace. That's the tell — a render-time unproject of bad
data, not a camera call.

Common upstream sources: `e.lngLat` from `touchmove` during a pinch (Mapbox
emits `(NaN, NaN)` mid-gesture), math on drawn vertices before the second
exists, malformed imported KML/GeoJSON, geolocation before the first fix.

**Rule:** validate before writing to a source or marker, reusing the helpers
`safeMap.ts` already exports, so the gate stays one piece of code:

```ts
import { isFiniteCoord, isFiniteLngLat }
    from "$harness/components/map/mapShared/safeMap";

if (!isFiniteLngLat(e.lngLat)) return;
const safe = coords.filter(isFiniteCoord);
```

Never patch the symptom inside Mapbox internals — find the upstream write.

---

## 2. Map UX principles

Applies wherever a map renders.

1. **Elastic limits over hard stops.** Every gesture should produce visible
   motion while fingers move, even if it snaps back. A pinch that hits
   `maxZoom` with a hard stop leaves the user unsure the gesture registered at
   all. Set real min/max slightly outside the soft limits, then ease back on
   `zoomend`.
2. **No main-thread work during gestures.** Defer recomputation to `idle`,
   which fires once after everything settles. Don't trust `moveend` /
   `zoomend` — they fire repeatedly during a continuous gesture.
3. **Hide, don't re-render, during gestures.** On `movestart`, add `.map-busy`;
   CSS hides markers via `display: none`. The browser skips layout and paint
   for them, keeping the main thread free.
4. **Data volume beats rendering speed.** Load centroids first and lazy-load
   full polygons past a zoom threshold. Very large polygons render only on
   demand.
5. **Mobile ≠ web map.** Each map declares its own style, projection and
   layers — no inheritance. That is what makes it safe to iterate on one
   without shipping a regression to the other.

---

## What NOT to do

- **No MapboxDraw.** The shared draw code replaces it; don't re-add
  `@mapbox/mapbox-gl-draw`.
- **No PWA.** Mobile is Capacitor native — no service worker, no manifest.
- **No second map folder.**
- **No nav chrome in the map layer.** Tab and top bars live in
  `src/lib/mobile/components/ui/`.
- **No separate Capacitor build per mini-app.** One bundle, one listing.
- **Never mix the two renderers.** Offline is MapLibre, online is Mapbox;
  sharing a Marker, Popup or CSS between them produces a black map.
