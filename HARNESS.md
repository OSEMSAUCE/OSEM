# The harness

This repo is a **harness**: a SvelteKit app whose job is to hold ONE piece of
map code so it can be worked on without the rest of the product around it.

A harness holds a thing so it can be worked or moved, and comes off. That is
the whole idea. Nothing you are hired to change lives in this repo — it lives
in a **child** repo, and the harness is what makes it runnable.

---

## The three tiers

```
ReTreever          tier 1   the real product. Private. You will not see it,
                            and you do not need it.
  └── harness      tier 2   THIS REPO. A SvelteKit app that runs one child.
      └── children tier 3   flat  lib/ + routes/  folders. No framework,
                            no package.json, no node_modules. Cargo.
```

A child is not a standalone project and is not meant to be. It has no
`package.json` and nothing to `npm install`. It is source code that runs
**inside** the harness. Clone the harness first, always.

---

## Running a child

```bash
git clone https://github.com/Ground-Truth-Data/harness.git
cd harness
npm install
```

The children already live under `src/lib/components/map/`. To work on one, run
the harness and open that child's demo route:

| Child | Demo route | What it is |
|---|---|---|
| `getCache_OfflineMap` | `/debug/map` | the offline basemap engine + its debugger |
| `getCache_OnlineMap` | `/who/map` | the online (Mapbox) map |

```bash
npm run dev        # http://localhost:5174
```

Then open <http://localhost:5174/debug/map>.

### The offline map needs ~50 MB of assets first

The basemap tiles, glyphs and demo imagery are **not in git** — they are too
big, and they are not AGPL. Without them the map renders blank, and the BUILD
fails outright (SvelteKit walks `static/` and dies on the dangling symlinks).

```bash
src/lib/components/map/getCache_OfflineMap/fetchAssets.sh
```

See `src/lib/components/map/getCache_OfflineMap/ASSETS.md`. If you have no
local source for them, ask Ground Truth Data for the asset bundle.

---

## The rules that keep a child liftable

`src/lib/components/map/childBoundary.test.ts` enforces these, and it discovers
children by folder name — a new one is governed the day it is created.

1. **A child never names itself through `$osem`.** Inside a child, imports are
   relative. `$osem` only exists because the harness's vite config defines it.
2. **A child never imports another child.** Two children that import each other
   are one child wearing two folders.
3. **A child never touches `$lib` / `$tinyStore` / `$mobRoutes`.** Those are
   ReTreever's proprietary side.
4. **`mapShared/` is the seam BETWEEN consumers, not a second home.** A child
   may import a `mapShared` module only if something else uses it too. A module
   only one child imports is that child's own code sitting outside it — move it
   in.
5. **No relative path climbs out of the child.**

```bash
npx vitest run src/lib/components/map/childBoundary.test.ts
```

If you are moving code and that test goes red, it is telling you the child just
stopped being liftable. Fix the shape, don't loosen the rule.

---

## Where changes go

You work in the harness, but a child's code belongs to the child's repo. The
maintainer re-derives and publishes each child from here with
`gitEr/syncChildren.sh` (not in this repo). Send changes as a PR against the
harness unless told otherwise.

Children currently published:

- <https://github.com/Ground-Truth-Data/getCache_offlineMap>
- <https://github.com/Ground-Truth-Data/getCache_OnlineMap>

---

## Known rough edges

- `/what` and `/where` reference `lib/components/score/DotMatrix.svelte`, which
  does not exist in this repo. Those routes fail the build. Delete them locally
  if they get in your way — they are not part of any child.
- The repo's history carries three ~95 MB geojson files that were later
  deleted, so a clone is larger than the working tree suggests.
