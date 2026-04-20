<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { PUBLIC_API_URL } from "$env/static/public";
import "mapbox-gl/dist/mapbox-gl.css";
import InfoPanel from "./mapParts/mapInfoPanel.svelte";
import MapNavButtons from "./mapParts/mapNavButtons.svelte";
import { fullMapOptions, initializeMap } from "./mapParts/mapInit";
import PanelLand from "./mapParts/mapPanelLand.svelte";

// Block browser page zoom from trackpad pinch gestures.
// Without this, pinching anywhere on the page (including over overlays) zooms
// the entire browser page instead of the map.
function blockBrowserZoom() {
    const blockWheel = (e: WheelEvent) => {
        // ctrlKey is set during trackpad pinch-to-zoom on macOS
        if (e.ctrlKey) e.preventDefault();
    };
    const blockGesture = (e: Event) => e.preventDefault();

    document.addEventListener("wheel", blockWheel, {
        capture: true,
        passive: false,
    });
    document.addEventListener("gesturestart", blockGesture, {
        capture: true,
        passive: false,
    });
    document.addEventListener("gesturechange", blockGesture, {
        capture: true,
        passive: false,
    });
    document.addEventListener("gestureend", blockGesture, {
        capture: true,
        passive: false,
    });

    return () => {
        document.removeEventListener("wheel", blockWheel, { capture: true });
        document.removeEventListener("gesturestart", blockGesture, {
            capture: true,
        });
        document.removeEventListener("gesturechange", blockGesture, {
            capture: true,
        });
        document.removeEventListener("gestureend", blockGesture, {
            capture: true,
        });
    };
}

// ─── OVERRIDE PATTERN ───────────────────────────────────────────────────────
// OSEM defaults to its own assets. ReTreever (or any consumer) passes props
// to swap them. To add a new overrideable asset, add an `export let` here.
//
// Where these props are passed in from:
//   ReTreever:  src/routes/where/+page.svelte  →  <WherePage markerUrl="..." />
// ────────────────────────────────────────────────────────────────────────────
export let markerUrl: string | undefined = undefined;

let mapContainer: HTMLDivElement;
let selectedFeature: any = null;
let splashVisible = true;

// These two may resolve in either order — coordinate with pendingFeature
let mapInstance: import("mapbox-gl").Map | null = null;
let pendingFeature: any = null;

function flyToAndSelect(map: import("mapbox-gl").Map, feature: any) {
    selectedFeature = feature;
    // centroid may be a parsed object or a JSON string (Mapbox serializes properties)
    let coords: [number, number] | null = null;
    if (feature?.centroid?.coordinates) {
        coords = feature.centroid.coordinates;
    } else if (typeof feature?.centroid === "string") {
        try {
            coords = JSON.parse(feature.centroid)?.coordinates ?? null;
        } catch {}
    }
    if (coords) {
        map.flyTo({ center: coords, zoom: 14, essential: true });
        console.log("🎯 Flew to feature from URL:", feature.landName);
    }
}

onMount(() => {
    const landParam = $page.url.searchParams.get("land");
    const projectNameParam = $page.url.searchParams.get("projectName");
    const hasTarget = !!(landParam || projectNameParam);

    fullMapOptions.autoRotate = !hasTarget;

    const isMobile = window.innerWidth < 768;

    const cleanup = initializeMap(mapContainer, {
        ...fullMapOptions,
        enableHash: true,
        ...(isMobile && { showDrawTools: false, initialZoom: 3.5 }),
        apiBaseUrl: PUBLIC_API_URL.replace(/\/$/, ""),
        ...(markerUrl && { markerUrl }),
        onFeatureSelect: (feature) => {
            selectedFeature = feature;
            if (feature?.landKey) {
                goto(`/where?land=${encodeURIComponent(feature.landKey)}`, {
                    replaceState: true,
                    noScroll: true,
                });
            }
        },
        onMapReady: (map) => {
            mapInstance = map;
            // Hide the splash once the map has drawn a real frame.
            map.once("idle", () => {
                splashVisible = false;
            });
            // Belt-and-suspenders: never leave the splash up longer than ~3s.
            setTimeout(() => {
                splashVisible = false;
            }, 3000);
            // Data fetch may have already found the feature — fly now
            if (pendingFeature) {
                flyToAndSelect(map, pendingFeature);
                pendingFeature = null;
            }
        },
    });

    // Fetch polygon data in parallel with map load
    if (hasTarget) {
        (async () => {
            try {
                // Only need properties for landKey/projectName match — use
                // the lightweight centroids endpoint instead of full bulk fetch.
                const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, "")}/api/where/polygons?mode=centroids`;
                const response = await fetch(apiUrl);
                if (!response.ok) return;

                const polygonData = await response.json();
                let targetFeature: any = null;

                if (landParam) {
                    // Match by landKey
                    targetFeature = polygonData.features?.find(
                        (f: any) =>
                            f.properties?.landKey === landParam ||
                            f.id === landParam,
                    );
                } else if (projectNameParam) {
                    // Take first polygon in the project
                    targetFeature = polygonData.features?.find(
                        (f: any) =>
                            f.properties?.projectName === projectNameParam,
                    );
                }

                if (!targetFeature?.properties) return;

                if (mapInstance) {
                    // Map already loaded — fly immediately
                    flyToAndSelect(mapInstance, targetFeature.properties);
                } else {
                    // Map not ready yet — store for onMapReady to pick up
                    pendingFeature = targetFeature.properties;
                }
            } catch (error) {
                console.error("Error pre-loading feature:", error);
            }
        })();
    }

    // Block browser page zoom — must be cleaned up on unmount
    const cleanupZoomBlock = blockBrowserZoom();

    return () => {
        cleanup();
        cleanupZoomBlock();
    };
});
</script>

<div class="viewport-layout">
	<main class="demo-map-area">
		<div bind:this={mapContainer} class="mapbox-map"></div>
		{#if splashVisible}
			<div class="map-splash" aria-hidden="true">
				<span class="orb orb-a"></span>
				<span class="orb orb-b"></span>
				<span class="orb orb-c"></span>
				<span class="orb orb-d"></span>
				<span class="orb orb-e"></span>
			</div>
		{/if}
		<MapNavButtons />
		<InfoPanel
			bind:selectedFeature
			panel={PanelLand}
			onClose={() => (selectedFeature = null)}
		/>
	</main>
</div>

<style>
	/* Push map controls down to avoid navbar overlap */
	:global(.mapboxgl-ctrl-top-left) {
		top: 60px;
	}

	/* Strip Mapbox default popup chrome — our HTML provides its own card */
	:global(.large-poly-popup .mapboxgl-popup-content) {
		background: transparent;
		box-shadow: none;
		padding: 0;
		border-radius: 0;
	}
	:global(.large-poly-popup .mapboxgl-popup-tip) {
		border-bottom-color: #555;
	}

	/* Give the InfoPanel a more prominent border */
	:global(.info-panel) {
		border-color: #555 !important;
	}

	/* Splash: placeholder orbs so users don't stare at a dark globe while
	   the map style + centroids load. Fades out on first map idle. */
	.map-splash {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 5;
		animation: splashFadeOut 0.8s ease-out 2s forwards;
		/* Clip orbs to a circle approximating the globe at initial zoom */
		clip-path: circle(38% at 50% 50%);
	}

	.orb {
		position: absolute;
		display: block;
		border-radius: 9999px;
		background: radial-gradient(
			circle,
			rgba(255, 200, 0, 0.55) 0%,
			rgba(255, 200, 0, 0.25) 45%,
			rgba(255, 200, 0, 0) 70%
		);
		filter: blur(0.5px);
		transform: translate(-50%, -50%);
		animation: orbPulse 1.6s ease-in-out infinite;
	}

	/* Orbs clustered toward center so they stay on the globe */
	.orb-a { top: 40%; left: 38%; width: 64px; height: 64px; animation-delay: 0s; }
	.orb-b { top: 50%; left: 52%; width: 96px; height: 96px; animation-delay: 0.25s; }
	.orb-c { top: 58%; left: 42%; width: 48px; height: 48px; animation-delay: 0.5s; }
	.orb-d { top: 38%; left: 58%; width: 72px; height: 72px; animation-delay: 0.15s; }
	.orb-e { top: 62%; left: 55%; width: 56px; height: 56px; animation-delay: 0.35s; }

	@keyframes orbPulse {
		0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(0.92); }
		50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.08); }
	}

	@keyframes splashFadeOut {
		to { opacity: 0; }
	}
</style>
