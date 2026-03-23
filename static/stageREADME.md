# ReTreever Animation Canvas — Technical Brief

This document explains how the animation canvas is structured for the ReTreever `/who` and `/what` stage pages, including how layers are stacked, how the canvas scales across devices, and what Nick needs to know when authoring assets.

---

## Key Concepts

### Cover Scaling
Cover scaling means a canvas (or image) is sized so it always fills its container completely, with no empty edges — even if the container has a different aspect ratio than the canvas. The canvas is cropped from the **center outward**, so whatever is in the center is always visible and the edges get cut off depending on the device. This is the same behaviour as CSS `background-size: cover` or `object-fit: cover`. On a wide desktop screen, the top and bottom may be cropped. On a narrow mobile screen, the left and right are cropped. The gradient/sky layer uses this approach.

### Uniform Scale-to-Width
The canvas is authored at a fixed pixel size. In the browser, it is scaled so its width always equals the full viewport width (`100vw`). The height shrinks or grows proportionally — no cropping, no distortion. Think of it like an image with `width: 100%`: it always fills the screen width and the height follows. All character and scenery layers use this approach, so everything stays in perfect alignment regardless of screen size.

### Parallax Layering
Parallax layering means stacking multiple visual layers at different depths, each moving at a different speed as the user scrolls or as the animation plays. Layers further away move slowly; layers closer to the viewer move faster. This creates the illusion of depth and makes the dog appear to be running *through* a scene rather than in front of a flat backdrop. Each layer is a separate asset positioned at the same canvas origin (`position: absolute`, `top: 0`, `left: 0`), stacked in z-order.

### Safe Zone
The safe zone is the region of the canvas guaranteed to be visible on all devices. Since all character/scenery layers scale uniformly to viewport width, the left and right edges are always in frame. The only potential crop is vertical — on very narrow mobile screens the canvas height in pixels is small, so the upper sky area may sit partially above the viewport. **All key dog action — expressions, main poses, important moments — should be kept in the lower 55% of the canvas height.** Upper areas are sky and distant scenery, which can be partially off-screen on mobile without any loss.

---

## The Hybrid System: Uniform Scale + Cover Crop

The canvas uses two techniques — one for the background, one for everything else.

**All character/scenery/ground layers use uniform scale-to-width.** The canvas scales so its width always equals the viewport width. The dog, the weeds, the trees — they all share the same canvas size and scale together as one unit. What you see in the authoring tool is what you get in the browser, just smaller or larger.

**The dog runs to the edges of the canvas, and off-screen on mobile is fine.** The canvas is authored wide enough to cover the widest desktop monitor. On mobile, the canvas scales down to viewport width — so the dog may run into the wings and off the left or right edge of the screen. This is intentional, like a theatre stage with wings. His main action, key poses, and expressions happen in the center region and are always visible. On desktop, the full run is visible. The animator should not compress or constrain the run path — just make sure key moments happen toward the center.

**The gradient/sky layer alone uses cover scaling.** It is authored larger than the other layers and cropped from center. On wide screens, the left/right edges are cropped. On tall narrow mobile, the top/bottom may be cropped. Because it is ambient background, this is always fine — the gradient never shows a hard edge at any screen size.

---

## Canvas Dimensions

### Author all layers at: **2560 × 960px**

This is the single canonical size for every layer — dog, weeds, scenery, ground. All layers must be exactly this size. Do not vary dimensions between layers. This is critical: all animation frames from all layers must be perfectly registered so sequences can be chained seamlessly in code.

**Why 2560 × 960px:**
- **2560px wide** covers the widest common desktop displays (1440p and scaled 4K). No desktop user will ever see a horizontal edge of the canvas.
- **960px tall** gives a wide cinematic 8:3 ratio. On a 1080p desktop it fills roughly 90% of the screen height, leaving room for the nav bar. On a typical mobile phone (390px wide, 844px tall), the canvas scales to 390px wide × ~146px tall — the ground strip and dog are clearly visible at the bottom. The sky area above is partially off screen, which is fine.
- A taller ratio (like 16:9) would waste too much vertical space on desktop and be even more cropped on mobile. The 8:3 ratio is the right balance for a cinematic ground-level scene.

**Gradient/sky layer only: author at 3200 × 1400px.** This gives roughly 320px of bleed beyond the canvas edge on all sides, so cover-scaling never reveals a hard edge on any device.

### What units does the developer use? (Not the animator's concern)
The canvas is sized in code using `vw` units — `100vw` means 100% of the viewport width. The browser handles all the scaling math. The animator works in pixels. The two never need to meet.

---

## Layer Stack

Listed back to front (bottom to top in z-order):

| # | Layer | Type | Canvas Size | Scaling | Notes |
|---|-------|------|-------------|---------|-------|
| 1 | **Gradient / Sky** | Static image | 3200 × 1400px | Cover scaling | Base layer. Expendable at all edges. Never shows a hard stop. |
| 2 | **Distant scenery** (far treeline, hills) | Static image | 2560 × 960px | Uniform scale | Slowest parallax. |
| 3 | **Mid scenery** (closer trees, bushes) | Static image | 2560 × 960px | Uniform scale | Medium parallax speed. |
| 4 | **Background weeds / ground** | Static image | 2560 × 960px | Uniform scale | Ground plane the dog runs on. |
| 5 | **Dog** | Animated | 2560 × 960px | Uniform scale | Runs full width. May exit screen on mobile — that's fine. |
| 6 | **Foreground weeds / grasses** | Static image | 2560 × 960px | Uniform scale | In front of dog. Creates depth. |

All layers except the gradient are the same pixel dimensions. This is non-negotiable — they must be identical so the dog and every environment element share the same coordinate space.

The dog running between weed layers (layer 4 behind, layer 6 in front) is what makes him feel grounded in the scene rather than pasted on top of it.

---

## Dog Sizing Reference

Measured from current implementation:

| Viewport | Dog on screen (approx) | Notes |
|----------|------------------------|-------|
| Mobile (350×611) | ~180 × 220px | Smallest common size. Expression still reads clearly. |
| Desktop (24–27" monitor) | ~400 × 460px | Full detail visible. |

- The dog scales proportionally with the canvas. These numbers will shift as we experiment — treat them as a baseline, not a spec.
- The ground strip (weeds, soil) should occupy roughly the **bottom 20–25% of canvas height.**
- Key poses and expressions should be authored with mobile legibility in mind — if it reads at 180px tall, it reads everywhere.

---

## Managing Art Files — Critical Rules for the Animator

All layers must be the same canvas size (2560 × 960px) and the same frame count for every animation sequence. This is what allows the developer to chain actions seamlessly in code: the idle ends on frame X, the run begins on frame X+1. If frame X of the scenery layer doesn't match frame X of the dog layer, the composite breaks.

**Rules:**
- Declare frame count and frame rate for every exported sequence (e.g. "run cycle: 24 frames at 24fps"). Stick to it across all layers.
- All layers for a given sequence export exactly that frame count — including static layers (just duplicate the single frame to fill the count).
- Name files consistently across layers: `dog_run_001.png`, `weeds_fg_run_001.png`, `scenery_run_001.png` — indexed identically.
- The dog's position on frame 1 and the final frame of any sequence must match the start position of the next chained sequence. This is how run → idle → sniff → run chains work without a visible jump.
- Never change canvas size mid-project. If more space is needed, all layers must update together — flag this before making any changes.

---

## Notes for the Animator

- Export format: PNG sequence preferred (lossless, easiest to debug). Sprite sheet or Lottie can be discussed.
- The gradient layer is the only one authored at a different (larger) size.
- The dog layer must have a transparent background.
- Foreground weed/grass elements that pass in front of the dog must be on a separate layer from background weeds.
- Parallax scroll speed per layer is assigned in code — animate only the character and environment content, not the scroll movement itself.
- The dog running off-screen to the left or right on mobile is expected behaviour. Do not compensate for this by keeping the run path artificially narrow.
- The upper sky region being partially cropped on mobile is also expected. Keep it ambient and don't put anything important up there.