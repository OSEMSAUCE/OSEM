<script lang="ts">
import { cn } from "./cn";

let {
	class: className = "",
	// `/who/map`, NOT `/retreeve/who/map`. ReTreever's pages moved to the top
	// level; the old prefix only survives as a legacy 301 in hooks.server.ts.
	// Linking to it still WORKS, which is why this went unnoticed — but the
	// client router cannot resolve a path that is not in its manifest, so it
	// hands off to the browser and the 301 turns an in-app link into a FULL
	// PAGE LOAD. Same defect that made every land click on /where reload the
	// whole Mapbox page.
	href = "/who/map",
}: { class?: string; href?: string } = $props();
</script>

<!-- 3fps rotating-globe sprite (6-frame, 3x2 grid), spinning continuously —
     "Maps_page_redirect_animation" in Desktop layout. -->
<a {href} aria-label="Explore the map" class={cn("globe-spin-link", className)}>
	<div class="globe-spin"></div>
</a>

<style>
	/* Hover: grow and tilt, matching the search bar's glyphs and the tab
	   stickers. A dip to 0.85 opacity was the old signal and it read as nothing
	   — fading something OUT is a strange way to say "this is live". Lifting it
	   off the page is the same gesture every other sticker on this page makes.
	   The overshoot easing gives it the small bounce of a picked-up cutout. */
	.globe-spin-link {
		display: inline-flex;
		transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.globe-spin-link:hover,
	.globe-spin-link:focus-visible {
		transform: scale(1.14) rotate(-5deg);
	}

	.globe-spin {
		width: 100%;
		aspect-ratio: 213 / 160;
		background-image: url("/pub-Rtvr/animations/globe-spin-sprite.webp");
		background-repeat: no-repeat;
		background-size: 300% 200%;
		animation: globeRotate 2s step-end infinite;
	}

	@keyframes globeRotate {
		0% {
			background-position: 0% 0%;
		}
		16.6667% {
			background-position: 50% 0%;
		}
		33.3333% {
			background-position: 100% 0%;
		}
		50% {
			background-position: 0% 100%;
		}
		66.6667% {
			background-position: 50% 100%;
		}
		83.3333% {
			background-position: 100% 100%;
		}
	}

	/* NO prefers-reduced-motion gate. These are commissioned brand animations
	   and the machine this site is authored on has Reduce Motion ON, so a gate
	   here means the author never sees his own artwork. Repo law — see the
	   "no reduced-motion gate" rule. Do not re-add it. */
</style>
