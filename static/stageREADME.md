# ReTreever Stage Animation — Technical Brief
*Pages: `/who` and `/what` — Animator: Nick*

---

## Concepts

**Cover scaling** — the canvas always fills its container completely, no letterboxing, no empty edges. Whatever overflows the container edge gets cropped. The canvas stays centered so the crop is always symmetrical. This is the single scaling method used for all layers on all devices.

**Breakpoint scale + crop** — at each breakpoint, the canvas is scaled to a specific size (zoom in or out slightly), then cover-cropped to fill the stage. This lets us tune how much of the scene is visible and how large the dog appears at each screen size. The scaling is set by eye per breakpoint, not calculated — we adjust until the dog reads well.

**Safe zone** — the center band of the canvas where all key dog action must stay. Anything outside this zone may be cropped depending on the device. Nick keeps all important poses, expressions, and action inside this region.

---

## Canvas Size

**All layers: 2560 × 960px.** Every layer — dog frames, scenery, ground, weeds — must be exactly this size. This is what makes animation sequences chain: frame 1 of the dog registers exactly with frame 1 of every other layer. If canvas sizes differ, the composite breaks.

**Gradient/sky layer only: 3200 × 1400px.** Extra bleed so cover scaling never reveals a hard edge on any device.

---

## How It Fills the Screen

The stage fills the full screen below the nav on every device. The canvas is always centered, always cover-cropped. At each breakpoint we scale the canvas slightly to tune the dog's apparent size, then let the crop handle the rest.

**Desktop (1440px+)**
Canvas scales to fill stage width. A sliver of sky crops off the top. Full canvas width is visible — no side cropping. Dog renders at roughly **400 × 460px** on screen.

**Tablet (~768px)**
Canvas scales down slightly from desktop. Mild side cropping begins. Dog still clearly visible.

**Mobile (iPhone SE: 375×667, stage ~350×550 after nav)**
Canvas scales so the dog reads well — likely scaled so stage height is filled, sides crop heavily. The dog may run off-screen left and right during animation sequences — this is intentional. Dog renders at roughly **180 × 220px** on screen. Nick should verify expression legibility at this size.

The exact scale values per breakpoint are tuned in code by eye. Nick doesn't need to worry about this — he just keeps action in the safe zone.

---

## Layer Stack

| # | Layer | Size | Notes |
|---|-------|------|-------|
| 1 | Gradient / sky | 3200 × 1400px | Extra bleed, cover scaled |
| 2 | Distant scenery | 2560 × 960px | Static image |
| 3 | Mid scenery | 2560 × 960px | Static image |
| 4 | Ground + background weeds | 2560 × 960px | Static image |
| 5 | Dog | 2560 × 960px | Animated WebP frames |
| 6 | Foreground weeds | 2560 × 960px | Static image, in front of dog |

Dog runs between layers 4 and 6 — weeds behind and in front — so he feels grounded in the scene.

---

## Performance: Serving the Right Image Per Breakpoint

Loading a 2560px image on a 390px phone wastes ~6× more data than needed. The fix is to export pre-cropped versions per breakpoint and serve the right one. The browser never downloads both.

**Static layers** — export three sizes, serve via `<picture>`:

```html
<picture>
  <source media="(max-width: 480px)"  srcset="scenery-mobile.webp">
  <source media="(max-width: 1024px)" srcset="scenery-tablet.webp">
  <img src="scenery-desktop.webp" alt="">
</picture>
```

| Version | Dimensions | Crop |
|---------|-----------|------|
| Desktop | 2560 × 960px | Full canvas |
| Tablet  | 1400 × 960px | Center crop |
| Mobile  | 700 × 960px  | Center crop |

Mobile static layers are ~73% smaller in data than desktop. Zero JS required.

**Dog animation frames** — export three folder sets, one per breakpoint. Code picks the folder at load time based on viewport, never loads from more than one:

```
/animations/dog/
  desktop/
    idle/idle_001.webp, idle_002.webp ...
    run/run_001.webp ...
  tablet/
    idle/idle_001.webp ...
  mobile/
    idle/idle_001.webp ...
```

---

## Lazy Loading

**On page load** — static layers + idle sequence only (~1–2MB mobile, ~3MB desktop). Nothing else.

**While idle loops** — silently preload the `run` sequence in the background.

**All other sequences** — loaded on demand, ~500ms before triggered:

```js
function preloadSequence(path, frameCount) {
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = `${path}/${String(i).padStart(3, '0')}.webp`;
  }
}
```

Static layer `<img>` tags below the fold get `loading="lazy"`.

---

## Rules for Nick

- All layers **2560 × 960px** (gradient: 3200 × 1400px)
- Export as **WebP** — ~25–35% smaller than PNG at equivalent quality
- Export **desktop, tablet, and mobile center-crop** versions of every frame and static layer
- Follow the folder structure above exactly — code constructs paths from it
- **Zero-padded frame numbers**: `001`, `002`, `003`
- Declare **frame count + frame rate** for every sequence before exporting
- All layers for a sequence must have **identical frame counts** — including static layers (duplicate the frame to fill the count)
- Dog's **start and end position must match** across chained sequences for seamless transitions
- **All key action in the safe zone** — center width, lower 55% of canvas height
- Dog layer has **transparent background**
- Foreground weeds on a **separate layer** from background weeds
- Never change canvas dimensions without flagging first — all layers must update together