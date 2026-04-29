<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { PUBLIC_API_URL } from "$env/static/public";
import "mapbox-gl/dist/mapbox-gl.css";
import InfoPanel from "./mapParts/mapInfoPanel.svelte";
import MapNavButtons from "./mapParts/mapNavButtons.svelte";
import { fullMapOptions, initializeMap } from "./mapParts/mapInit";
import { addOrgMarkersLayer } from "./mapParts/mapLayerOrg";
import MapDrawControls from "./mapParts/mapDrawOSEM.svelte";
import PanelLand from "./mapParts/mapPanelLand.svelte";
import PanelOrg from "./mapParts/mapPanelOrg.svelte";

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
//   ReTreever:  src/routes/where/+page.svelte      →  <MapPage markerUrl="..." />
//   ReTreever:  src/routes/who/map/+page.svelte    →  <MapPage variant="org" />
// ────────────────────────────────────────────────────────────────────────────
export let markerUrl: string | undefined = undefined;
export let variant: "land" | "org" = "land";

let mapContainer: HTMLDivElement;
let selectedFeature: any = null;
let splashVisible = true;

// These two may resolve in either order — coordinate with pendingFeature
let mapInstance: import("mapbox-gl").Map | null = null;
let pendingFeature: any = null;

function flyToAndSelect(map: import("mapbox-gl").Map, feature: any) {
    selectedFeature = feature;
    // centroid may be parsed object or JSON string (Mapbox serializes properties).
    // Org features carry geometry.coordinates directly.
    let coords: [number, number] | null = null;
    if (feature?.geometry?.coordinates) {
        coords = feature.geometry.coordinates;
    } else if (feature?.centroid?.coordinates) {
        coords = feature.centroid.coordinates;
    } else if (typeof feature?.centroid === "string") {
        try {
            coords = JSON.parse(feature.centroid)?.coordinates ?? null;
        } catch {}
    }
    if (coords) {
        map.flyTo({
            center: coords,
            zoom: variant === "org" ? 10 : 14,
            essential: true,
        });
    }
}

onMount(() => {
    const isOrg = variant === "org";
    const apiBase = PUBLIC_API_URL.replace(/\/$/, "");
    const paramName = isOrg ? "org" : "land";
    const redirectPath = isOrg ? "/who/map" : "/where";

    const landParam = isOrg ? null : $page.url.searchParams.get("land");
    const projectNameParam = isOrg
        ? null
        : $page.url.searchParams.get("projectName");
    const orgParam = isOrg ? $page.url.searchParams.get("org") : null;
    const hasTarget = !!(landParam || projectNameParam || orgParam);

    fullMapOptions.autoRotate = !hasTarget;

    const isMobile = window.innerWidth < 768;

    const handleFeatureSelect = (feature: any) => {
        selectedFeature = feature;
        const key = isOrg ? feature?.organizationKey : feature?.landKey;
        if (key) {
            goto(`${redirectPath}?${paramName}=${encodeURIComponent(key)}`, {
                replaceState: true,
                noScroll: true,
            });
        }
    };

    const cleanup = initializeMap(mapContainer, {
        ...fullMapOptions,
        enableHash: !isOrg,
        // Org view disables polygon marker loading; org markers come from addOrgMarkersLayer below.
        ...(isOrg && { loadMarkers: false }),
        ...(isMobile && { showDrawTools: false, initialZoom: 3.5 }),
        apiBaseUrl: apiBase,
        ...(markerUrl && { markerUrl }),
        onFeatureSelect: handleFeatureSelect,
        onMapReady: async (map) => {
            mapInstance = map;

            if (isOrg) {
                await addOrgMarkersLayer(map, {
                    apiBaseUrl: apiBase,
                    onFeatureSelect: handleFeatureSelect,
                });
            } else {
                // Splash is land-view only.
                map.once("idle", () => {
                    splashVisible = false;
                });
                setTimeout(() => {
                    splashVisible = false;
                }, 3000);
            }

            if (pendingFeature) {
                flyToAndSelect(map, pendingFeature);
                pendingFeature = null;
            }
        },
    });

    // Fetch target feature in parallel with map load
    if (hasTarget) {
        (async () => {
            try {
                const apiUrl = isOrg
                    ? `${apiBase}/api/who/organizations`
                    : `${apiBase}/api/where/polygons?mode=centroids`;
                const response = await fetch(apiUrl);
                if (!response.ok) return;

                const data = await response.json();
                let targetFeature: any = null;

                if (isOrg && orgParam) {
                    const match = data.features?.find(
                        (f: any) =>
                            f.id === orgParam ||
                            f.properties?.organizationKey === orgParam,
                    );
                    if (match) {
                        targetFeature = {
                            ...match.properties,
                            geometry: match.geometry,
                        };
                    }
                } else if (landParam) {
                    const match = data.features?.find(
                        (f: any) =>
                            f.properties?.landKey === landParam ||
                            f.id === landParam,
                    );
                    targetFeature = match?.properties ?? null;
                } else if (projectNameParam) {
                    const match = data.features?.find(
                        (f: any) =>
                            f.properties?.projectName === projectNameParam,
                    );
                    targetFeature = match?.properties ?? null;
                }

                if (!targetFeature) return;

                if (mapInstance) {
                    flyToAndSelect(mapInstance, targetFeature);
                } else {
                    pendingFeature = targetFeature;
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
		{#if splashVisible && variant !== "org"}
			<div class="map-splash" aria-hidden="true">
				<span class="orb orb-a"></span>
				<span class="orb orb-b"></span>
				<span class="orb orb-c"></span>
				<span class="orb orb-d"></span>
				<span class="orb orb-e"></span>
			</div>
		{/if}
		<MapNavButtons />
		<MapDrawControls map={mapInstance} />
		<InfoPanel
			bind:selectedFeature
			panel={variant === "org" ? PanelOrg : PanelLand}
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
