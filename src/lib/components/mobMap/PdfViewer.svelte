<script lang="ts">
	import type { GeorefResult } from '$lib/mobMap/georef';
	import { polygon as turfPolygon, lineString, area, length } from '@turf/turf';

	let {
		georef,
		drawMode,
		gpsPos
	}: {
		georef: GeorefResult | null;
		drawMode: 'none' | 'polygon' | 'line';
		gpsPos: { lat: number; lon: number; accuracy: number } | null;
	} = $props();

	// ── Pan / zoom state ──────────────────────────────────────────────────
	let scale = $state(1);
	let tx = $state(0);
	let ty = $state(0);

	const pointers = new Map<number, { x: number; y: number }>();
	let lastPinchDist = 0;
	let lastPinchMid = { x: 0, y: 0 };

	function zoomAt(px: number, py: number, factor: number) {
		const newScale = Math.max(0.5, Math.min(20, scale * factor));
		const ratio = newScale / scale;
		tx = px - ratio * (px - tx);
		ty = py - ratio * (py - ty);
		scale = newScale;
	}

	function onDown(e: PointerEvent) {
		if (drawMode !== 'none') return; // SVG handles pointer events in draw mode
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (pointers.size === 2) {
			const pts = [...pointers.values()];
			lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
			lastPinchMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
		}
	}

	function onMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return;
		const prev = pointers.get(e.pointerId)!;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size === 1) {
			// Pan
			tx += e.clientX - prev.x;
			ty += e.clientY - prev.y;
		} else if (pointers.size === 2) {
			// Pinch zoom
			const pts = [...pointers.values()];
			const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
			const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

			if (lastPinchDist > 0) {
				zoomAt(mid.x, mid.y, dist / lastPinchDist);
				// Also pan with mid movement
				tx += mid.x - lastPinchMid.x;
				ty += mid.y - lastPinchMid.y;
			}
			lastPinchDist = dist;
			lastPinchMid = mid;
		}
	}

	function onUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
		if (pointers.size < 2) lastPinchDist = 0;
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const factor = e.deltaY < 0 ? 1.1 : 0.9;
		zoomAt(e.clientX, e.clientY, factor);
	}

	// ── Drawing state ─────────────────────────────────────────────────────
	interface Drawing {
		id: string;
		type: 'polygon' | 'line';
		points: [number, number][];
		label: string;
	}

	let currentPoints: [number, number][] = $state([]);
	let drawings: Drawing[] = $state([]);
	let lastTapTime = 0;

	function completeShape() {
		if (currentPoints.length < 2) {
			currentPoints = [];
			return;
		}
		const type = drawMode === 'polygon' ? 'polygon' : 'line';
		let label = '';

		if (type === 'polygon' && currentPoints.length >= 3) {
			label = computePolygonLabel(currentPoints);
		} else if (type === 'line' && currentPoints.length >= 2) {
			label = computeLineLabel(currentPoints);
		}

		const midIdx = Math.floor(currentPoints.length / 2);
		drawings = [
			...drawings,
			{ id: crypto.randomUUID(), type, points: [...currentPoints], label }
		];
		currentPoints = [];
	}

	function computePolygonLabel(pts: [number, number][]): string {
		if (georef?.canvasToGps) {
			try {
				const coords = pts.map(([cx, cy]) => {
					const gps = georef.canvasToGps!(cx, cy);
					return gps ? [gps[1], gps[0]] : [cx, cy]; // [lon, lat] GeoJSON
				});
				coords.push(coords[0]); // close ring
				const sqm = area(turfPolygon([coords]));
				return sqm > 10000 ? `${(sqm / 10000).toFixed(2)} ha` : `${Math.round(sqm)} m²`;
			} catch (err) {
				console.warn('[PdfViewer] polygon area error:', err);
			}
		}
		// Fallback: pixel area via shoelace
		let a = 0;
		for (let i = 0; i < pts.length; i++) {
			const j = (i + 1) % pts.length;
			a += pts[i][0] * pts[j][1];
			a -= pts[j][0] * pts[i][1];
		}
		return `~${Math.round(Math.abs(a) / 2)} px²`;
	}

	function computeLineLabel(pts: [number, number][]): string {
		if (georef?.canvasToGps) {
			try {
				const coords = pts.map(([cx, cy]) => {
					const gps = georef.canvasToGps!(cx, cy);
					return gps ? [gps[1], gps[0]] : [cx, cy];
				});
				const metres = length(lineString(coords), { units: 'meters' });
				return metres >= 1000 ? `${(metres / 1000).toFixed(2)} km` : `${Math.round(metres)} m`;
			} catch (err) {
				console.warn('[PdfViewer] line length error:', err);
			}
		}
		// Fallback: pixel distance
		let d = 0;
		for (let i = 1; i < pts.length; i++) {
			d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
		}
		return `~${Math.round(d)} px`;
	}

	// Convert a client-space pointer position to canvas-space coordinates
	function clientToCanvas(clientX: number, clientY: number): [number, number] {
		return [(clientX - tx) / scale, (clientY - ty) / scale];
	}

	function onSvgDown(e: PointerEvent) {
		e.stopPropagation();
		if (drawMode === 'none') return;

		const now = Date.now();
		const isDoubleTap = now - lastTapTime < 300;
		lastTapTime = now;

		const pt = clientToCanvas(e.clientX, e.clientY);

		if (isDoubleTap) {
			completeShape();
			return;
		}

		currentPoints = [...currentPoints, pt];
	}

	function onSvgContextMenu(e: MouseEvent) {
		e.preventDefault();
		if (drawMode !== 'none') completeShape();
	}

	// ── GPS dot ───────────────────────────────────────────────────────────
	const gpsDot = $derived(
		gpsPos && georef?.gpsToCanvas
			? (() => {
					const result = georef.gpsToCanvas(gpsPos.lat, gpsPos.lon);
					if (!result) return null;
					const [cx, cy] = result;
					// Convert accuracy (metres) to canvas pixels via a rough estimate:
					// 1 degree lat ≈ 111000 m. Use canvasHeight / (lat range) if available.
					// Without projection, approximate: 1m ≈ 1 canvas pixel at scale 1 (very rough).
					// A better estimate requires knowing the map scale, but as a fallback use 5px per metre
					// mapped through the canvas: accuracy in pixels = accuracy * (canvasHeight / latRangeM)
					// We'll just use a fixed visual radius for the accuracy ring.
					const accuracyPx = Math.max(10, gpsPos.accuracy * 0.5);
					return { cx, cy, accuracyPx };
				})()
			: null
	);

	// ── Cursor / tap coordinate readout ──────────────────────────────────
	let probeCoord: [number, number] | null = $state(null); // [lat, lon]

	function onProbeMove(e: PointerEvent) {
		if (!georef?.canvasToGps) return;
		const pt = clientToCanvas(e.clientX, e.clientY);
		probeCoord = georef.canvasToGps(pt[0], pt[1]);
	}

	// ── Canvas / DOM refs ─────────────────────────────────────────────────
	let canvas: HTMLCanvasElement | undefined = $state();
	let svgEl: SVGSVGElement | undefined = $state();

	// ── Render PDF image to canvas & fit on load ──────────────────────────
	$effect(() => {
		if (!georef || !canvas) return;
		canvas.width = georef.canvasWidth;
		canvas.height = georef.canvasHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const img = new Image();
		img.onload = () => ctx.drawImage(img, 0, 0);
		img.src = georef.imageDataUrl;

		// Fit to screen on initial load
		const screenW = window.innerWidth;
		const screenH = window.innerHeight;
		const fitScale = Math.min(screenW / georef.canvasWidth, screenH / georef.canvasHeight);
		scale = fitScale;
		tx = (screenW - georef.canvasWidth * fitScale) / 2;
		ty = (screenH - georef.canvasHeight * fitScale) / 2;
	});

	// Clear in-progress points when draw mode changes
	$effect(() => {
		if (drawMode === 'none') {
			currentPoints = [];
		}
	});

	// ── Helpers for SVG polyline/polygon string ───────────────────────────
	function pointsStr(pts: [number, number][]): string {
		return pts.map(([x, y]) => `${x},${y}`).join(' ');
	}

	function labelPos(pts: [number, number][]): [number, number] {
		const midIdx = Math.floor(pts.length / 2);
		return pts[midIdx] ?? pts[0];
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="absolute inset-0 overflow-hidden touch-none select-none"
	onpointerdown={onDown}
	onpointermove={(e) => { onMove(e); onProbeMove(e); }}
	onpointerup={onUp}
	onpointercancel={onUp}
	onwheel={onWheel}
>
	<div
		style="transform: translate({tx}px, {ty}px) scale({scale}); transform-origin: 0 0; position: absolute;"
	>
		<!-- PDF canvas -->
		<canvas bind:this={canvas}></canvas>

		<!-- SVG overlay for drawings + GPS dot -->
		{#if georef}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<svg
				bind:this={svgEl}
				width={georef.canvasWidth}
				height={georef.canvasHeight}
				style="position: absolute; top: 0; left: 0; overflow: visible;"
				onpointerdown={drawMode !== 'none' ? onSvgDown : undefined}
				oncontextmenu={drawMode !== 'none' ? onSvgContextMenu : undefined}
			>
				<!-- Completed drawings -->
				{#each drawings as d (d.id)}
					{#if d.type === 'polygon'}
						<polygon
							points={pointsStr(d.points)}
							fill="rgba(59,130,246,0.15)"
							stroke="#3b82f6"
							stroke-width={2 / scale}
						/>
					{:else}
						<polyline
							points={pointsStr(d.points)}
							fill="none"
							stroke="#f59e0b"
							stroke-width={2 / scale}
						/>
					{/if}
					{#if d.label}
						{@const [lx, ly] = labelPos(d.points)}
						<text
							x={lx}
							y={ly - 6 / scale}
							fill="white"
							font-size={12 / scale}
							text-anchor="middle"
							paint-order="stroke"
							stroke="black"
							stroke-width={3 / scale}
						>{d.label}</text>
					{/if}
				{/each}

				<!-- In-progress drawing -->
				{#if currentPoints.length > 0}
					{#if drawMode === 'polygon'}
						<polygon
							points={pointsStr(currentPoints)}
							fill="rgba(59,130,246,0.1)"
							stroke="#3b82f6"
							stroke-width={2 / scale}
							stroke-dasharray="{6 / scale},{3 / scale}"
						/>
					{:else}
						<polyline
							points={pointsStr(currentPoints)}
							fill="none"
							stroke="#f59e0b"
							stroke-width={2 / scale}
							stroke-dasharray="{6 / scale},{3 / scale}"
						/>
					{/if}
					<!-- Vertex dots -->
					{#each currentPoints as [vx, vy]}
						<circle cx={vx} cy={vy} r={4 / scale} fill="#3b82f6" stroke="white" stroke-width={1.5 / scale} />
					{/each}
				{/if}

				<!-- GPS dot -->
				{#if gpsDot}
					<circle
						cx={gpsDot.cx}
						cy={gpsDot.cy}
						r={gpsDot.accuracyPx / scale}
						fill="rgba(59,130,246,0.15)"
						stroke="rgba(59,130,246,0.4)"
						stroke-width={1 / scale}
					/>
					<circle
						cx={gpsDot.cx}
						cy={gpsDot.cy}
						r={8 / scale}
						fill="#3b82f6"
						stroke="white"
						stroke-width={2 / scale}
					/>
				{/if}
			</svg>
		{/if}
	</div>

	<!-- Placeholder when no map loaded -->
	{#if !georef}
		<div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/40">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
				<polyline points="14 2 14 8 20 8"/>
			</svg>
			<p class="text-sm">Load a PDF map to begin</p>
		</div>
	{/if}

	<!-- Coordinate readout — bottom center, only when georef is active -->
	{#if georef?.canvasToGps && probeCoord}
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-white/80 bg-black/60 px-3 py-1 rounded-full pointer-events-none">
			{probeCoord[0].toFixed(6)}, {probeCoord[1].toFixed(6)}
		</div>
	{/if}
</div>
