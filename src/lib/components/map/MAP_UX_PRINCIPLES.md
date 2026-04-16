# Map UX Principles

Guidelines for how our map interactions should feel, distilled from observed
comparison with reference maps (notably OpenGridWorks). These apply wherever
we render a Mapbox GL map — `/where`, `/who/map`, the homepage globe, the
mobile PDF overlay.

---

## 1. Gesture feedback beats hard limits

**Problem:** When a pinch/scroll/pan hits a max/min limit with a hard stop,
the user can't tell whether:
  (a) their input is registering but the map refuses to move further, or
  (b) their input isn't being detected at all.

Users default to assumption (b), start fighting the trackpad, try again
harder, and get frustrated.

**Principle:** Every gesture should produce *some* visible motion while the
user's fingers are moving, even if it's subtle and the map snaps back.

**Reference:** OpenGridWorks' power-plants map lets you pinch past the actual
zoom limit — the view shifts a little, then eases back when you release. You
always know your gesture is being detected, even when you've hit the edge of
what the map can show.

**Applies to:**
- Zoom in past `maxZoom` — allow a small elastic overshoot, snap back on release.
- Zoom out past `minZoom` — same.
- Pan past world edges (globe projection usually wraps, but mercator can clamp).
- Any future "bounded viewport" interaction.

**Implementation sketch (not yet built):**
Mapbox GL doesn't ship elastic zoom out of the box. To add it, the pattern is
to set the map's real `maxZoom` / `minZoom` slightly outside the "soft" limit,
then in a `zoomend` handler, ease back to the soft limit if the user's last
zoom landed in the overshoot zone. The user sees their gesture move the view
past the soft limit, then watch it settle back. If we add this, encapsulate it
in a small helper in `mapOrchestrator.ts`.

---

## 2. No main-thread work during gestures

**Problem:** Any synchronous work triggered by `move`/`zoom` events runs on
the same thread that's trying to animate the gesture. If that work takes more
than ~10ms, the animation stutters or cancels, and the gesture feels
"unresponsive" — even though technically nothing is blocked, the browser
just can't keep up with 60fps while we're recomputing.

**Principle:** Defer all non-essential recomputation until the map is `idle`.
Don't trust `moveend` or `zoomend` — those fire repeatedly during continuous
gestures. Use `idle` (fires once, after everything has settled) as the signal
that it's safe to do expensive work.

**Applies to:**
- DOM marker updates (currently: `map.on('idle', updateDogMarkers)` in `map-marker.ts`).
- Viewport-dependent data fetches (lazy polygon load triggers on `zoomend` but
  fetch is debounced via an in-flight lock).
- Any future "recalculate visible features" work.

---

## 3. Hide, don't re-render, during gestures

**Problem:** Even if we don't *recompute*, DOM markers still re-position their
`transform` on every `move` frame. For N markers, that's N DOM writes per
frame. At high densities this alone causes jank.

**Principle:** When a gesture starts, drop DOM overlays from the render tree
entirely (`display: none`). Restore them when the gesture ends. The browser
skips layout and paint while they're hidden, so the main thread is free.

**Current implementation (`map-marker.ts`):** A global CSS rule
`.map-busy .retreever-marker { display: none !important; }` is toggled on
the map container via `movestart`/`zoomstart` → add, `moveend`/`zoomend` → remove.

**Trade-off:** Dogs visually disappear during zoom. Acceptable because no one
looks at individual dogs *while* zooming — they're changing context, not
reading data.

---

## 4. Data volume > rendering speed

For perceived performance, the ceiling is set by how much data we ship in the
initial payload, not by how fast we can draw what we have.

**Principle:** The globe view should download only what it needs at globe
zoom (centroids as `Point` features, no polygon geometry). Defer everything
else until the user asks for it by zooming in or clicking a feature.

**Current implementation:**
- `/api/where/polygons?mode=centroids` — lightweight endpoint, Point features only, no `geometry` column fetched from Postgres.
- Full polygon geometries lazy-load on `zoomend` past `polygons.minZoom - 1`.
- Polygons ≥ `LARGE_POLYGON_HECTARES` (1000) render only when their centroid
  is clicked, as a transient preview.
- Polygons ≥ `ABSOLUTE_POLYGON_HECTARES_CAP` (50000) never render at all.

**Reference ceiling:** OpenGridWorks uses vector tiles (MVT/PMTiles) served
as static files. Pan/zoom fetches only the tiles in the viewport at the
current zoom, all handled client-side by Mapbox's vector tile source. This
is the ultimate "ship only what you need" model. Phase 3 of the map
performance plan targets this architecture.

---

## 5. Mobile ≠ Web map

The mobile Capacitor app (`/mobile/map`) is a different use case: single-user
PDF overlay with draw tools, flat mercator projection, no clusters, no
markers, no polygons. The `mapOrchestrator` is shared but **preset options
must be passed explicitly** from each call site so mobile isn't accidentally
affected by web-map tuning.

**Principle:** Each `initializeMap()` call declares its own basemap style,
projection, and data layers. No "inherit the web map's defaults." The
`defaultOptions` preset exists as a safety net, but real call sites should
not rely on it — mobile explicitly passes `style: MAP_CONFIG.styles.defaultSat`,
web presets explicitly pass `style: MAP_CONFIG.styles.defaultDark`.

This decoupling is what makes it safe to iterate on the web map without
shipping regressions to mobile.
