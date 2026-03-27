import proj4 from 'proj4';

export interface GeorefResult {
	imageDataUrl: string;
	canvasWidth: number;
	canvasHeight: number;
	// null if no geotransform found (PDF still displays, GPS/measure won't work)
	gpsToCanvas: ((lat: number, lon: number) => [number, number] | null) | null;
	canvasToGps: ((x: number, y: number) => [number, number] | null) | null;
	// For Mapbox ImageSource: [topLeft, topRight, bottomRight, bottomLeft] as [lng, lat]
	// Handles rotation — computed from the four canvas corners via canvasToGps
	mapboxCorners?: [[number, number], [number, number], [number, number], [number, number]];
}

// ── Compute Mapbox corners from canvas corner points ─────────────────────

function withMapboxCorners(
	converters: Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'>,
	canvasWidth: number,
	canvasHeight: number
): Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps' | 'mapboxCorners'> {
	const { canvasToGps } = converters;
	if (!canvasToGps) return converters;
	const tl = canvasToGps(0, 0);
	const tr = canvasToGps(canvasWidth, 0);
	const br = canvasToGps(canvasWidth, canvasHeight);
	const bl = canvasToGps(0, canvasHeight);
	if (!tl || !tr || !br || !bl) return converters;
	return {
		...converters,
		// Mapbox expects [lng, lat]; canvasToGps returns [lat, lon]
		mapboxCorners: [
			[tl[1], tl[0]],
			[tr[1], tr[0]],
			[br[1], br[0]],
			[bl[1], bl[0]],
		]
	};
}

// ── Stream decompression ──────────────────────────────────────────────────

async function tryInflate(data: Uint8Array): Promise<Uint8Array | null> {
	for (const format of ['deflate', 'deflate-raw'] as const) {
		try {
			const readable = new ReadableStream({
				start(controller) {
					controller.enqueue(data.slice());
					controller.close();
				}
			});
			const output = readable.pipeThrough(new DecompressionStream(format));
			const reader = output.getReader();
			const chunks: Uint8Array[] = [];
			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				if (value) chunks.push(value);
			}
			if (chunks.length === 0) continue;
			const total = chunks.reduce((a, b) => a + b.length, 0);
			const out = new Uint8Array(total);
			let off = 0;
			for (const c of chunks) { out.set(c, off); off += c.length; }
			return out;
		} catch { continue; }
	}
	return null;
}

async function getDecompressedStreams(buffer: ArrayBuffer): Promise<string[]> {
	try {
		const rawBytes = new Uint8Array(buffer.slice(0));
		const rawText = new TextDecoder('latin1').decode(rawBytes);
		const streamRe = /stream\r?\n/g;
		let m: RegExpExecArray | null;
		const results: string[] = [];
		let checked = 0;
		let inflated = 0;

		while ((m = streamRe.exec(rawText)) !== null) {
			const dataStart = m.index + m[0].length;
			const before = rawText.slice(Math.max(0, m.index - 600), m.index);
			if (!before.includes('FlateDecode')) continue;

			const lenMatch = before.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
			if (!lenMatch) continue;

			const streamLen = parseInt(lenMatch[1], 10);
			if (streamLen <= 0 || streamLen > 10 * 1024 * 1024) continue;

			checked++;
			const streamBytes = rawBytes.slice(dataStart, dataStart + streamLen);
			const decompressed = await tryInflate(streamBytes);
			if (!decompressed) continue;
			inflated++;
			results.push(new TextDecoder('latin1').decode(decompressed));
		}

		console.log(`[georef] decompressed ${inflated}/${checked} streams`);
		return results;
	} catch (err) {
		console.warn('[georef] stream decompression error:', err);
		return [];
	}
}

// ── WKT projection extractor — handles both [...] and (...) bracket styles ─

function extractWktProjection(text: string): string | null {
	for (const token of ['PROJCS', 'GEOGCS']) {
		const idx = text.indexOf(token);
		if (idx === -1) continue;

		// Find opening bracket — either [ or ( — within 5 chars of token name
		let openChar = '';
		let closeChar = '';
		for (let i = idx + token.length; i < idx + token.length + 5 && i < text.length; i++) {
			if (text[i] === '[') { openChar = '['; closeChar = ']'; break; }
			if (text[i] === '(') { openChar = '('; closeChar = ')'; break; }
		}
		if (!openChar) continue;

		let depth = 0;
		for (let i = idx; i < text.length; i++) {
			if (text[i] === openChar) depth++;
			else if (text[i] === closeChar) {
				depth--;
				if (depth === 0) return text.slice(idx, i + 1);
			}
		}
	}
	return null;
}

// ── 2D affine transform helpers ───────────────────────────────────────────
// Used to fit canvas↔GPS from GPTS/LPTS control points

function solve3x3(m: number[][], b: number[]): number[] | null {
	// In-place Gauss-Jordan on augmented matrix
	const M = m.map((row, i) => [...row, b[i]]);
	for (let col = 0; col < 3; col++) {
		let pivotRow = -1;
		for (let row = col; row < 3; row++) {
			if (Math.abs(M[row][col]) > 1e-12) { pivotRow = row; break; }
		}
		if (pivotRow === -1) return null;
		[M[col], M[pivotRow]] = [M[pivotRow], M[col]];
		const s = M[col][col];
		for (let j = col; j <= 3; j++) M[col][j] /= s;
		for (let row = 0; row < 3; row++) {
			if (row !== col) {
				const f = M[row][col];
				for (let j = col; j <= 3; j++) M[row][j] -= f * M[col][j];
			}
		}
	}
	return [M[0][3], M[1][3], M[2][3]];
}

// Build forward (canvas→[lat,lon]) and inverse ([lat,lon]→canvas) affine transforms
// from n >= 3 corresponding point pairs. Uses first 3 points for exact fit.
function affinePairConverters(
	canvasPts: [number, number][],
	gpsPts: [number, number][]  // [lat, lon]
): Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'> {
	if (canvasPts.length < 3 || gpsPts.length < 3) return { gpsToCanvas: null, canvasToGps: null };

	const M = canvasPts.slice(0, 3).map(([cx, cy]) => [cx, cy, 1]);
	const bLat = gpsPts.slice(0, 3).map((p) => p[0]);
	const bLon = gpsPts.slice(0, 3).map((p) => p[1]);
	const cLat = solve3x3(M, bLat);
	const cLon = solve3x3(M, bLon);
	if (!cLat || !cLon) return { gpsToCanvas: null, canvasToGps: null };
	// lat = cLat[0]*cx + cLat[1]*cy + cLat[2]
	// lon = cLon[0]*cx + cLon[1]*cy + cLon[2]

	// Inverse: solve [[cLat[0] cLat[1]] [cLon[0] cLon[1]]] * [cx,cy]^T = [lat - cLat[2], lon - cLon[2]]^T
	const detInv = cLat[0] * cLon[1] - cLat[1] * cLon[0];
	if (Math.abs(detInv) < 1e-20) return { gpsToCanvas: null, canvasToGps: null };

	return {
		canvasToGps(cx: number, cy: number): [number, number] | null {
			return [
				cLat[0] * cx + cLat[1] * cy + cLat[2],
				cLon[0] * cx + cLon[1] * cy + cLon[2],
			];
		},
		gpsToCanvas(lat: number, lon: number): [number, number] | null {
			const dlat = lat - cLat[2];
			const dlon = lon - cLon[2];
			const cx = (cLon[1] * dlat - cLat[1] * dlon) / detInv;
			const cy = (cLat[0] * dlon - cLon[0] * dlat) / detInv;
			return [cx, cy];
		}
	};
}

// ── Orientation sanity check ──────────────────────────────────────────────
// After fitting the affine, verify north-up orientation. If the transform
// came out inverted (some PDFs use y=0-at-top LPTS convention) flip the
// offending axis in canvas space and refit.

function orientationChecked(
	canvasPts: [number, number][],
	gpsPts: [number, number][],
	canvasWidth: number,
	canvasHeight: number
): Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'> {
	const conv = affinePairConverters(canvasPts, gpsPts);
	if (!conv.canvasToGps) return conv;

	const cx = canvasWidth / 2, cy = canvasHeight / 2;
	const top = conv.canvasToGps(cx, 0);
	const bot = conv.canvasToGps(cx, canvasHeight);
	const lft = conv.canvasToGps(0, cy);
	const rgt = conv.canvasToGps(canvasWidth, cy);

	// For a north-up map: top should be higher lat, right should be higher lon
	const yFlip = top && bot && top[0] < bot[0];
	const xFlip = lft && rgt && lft[1] > rgt[1];

	if (!yFlip && !xFlip) return conv;

	console.log('[georef] GPTS orientation fix — yFlip:', yFlip, 'xFlip:', xFlip);
	const fixed = canvasPts.map(([px, py]): [number, number] => [
		xFlip ? canvasWidth - px : px,
		yFlip ? canvasHeight - py : py,
	]);
	return affinePairConverters(fixed, gpsPts);
}

// ── Strategy A: OGC GeoPDF — /GPTS + /LPTS ───────────────────────────────

// Convert a normalised LPTS point (lx, ly, both 0–1; y=0 at bottom of un-rotated page)
// to canvas pixel coordinates, accounting for the PDF page's /Rotate value.
//
// PDF /Rotate is the number of degrees the page is rotated CW when displayed.
// pdfjs renders with rotation applied, so the canvas is already post-rotation.
// LPTS coords are in the PRE-rotation page space, so we must account for rotation here.
//
// Derivation (treating canvas as y=0 at top):
//   /Rotate 0:   cx = lx·cw,       cy = (1-ly)·ch
//   /Rotate 90:  cx = ly·cw,        cy = lx·ch
//   /Rotate 180: cx = (1-lx)·cw,   cy = ly·ch
//   /Rotate 270: cx = (1-ly)·cw,   cy = (1-lx)·ch
function lptsToCanvas(
	lx: number, ly: number,
	cw: number, ch: number,
	rotation: number
): [number, number] {
	switch (((rotation % 360) + 360) % 360) {
		case 90:  return [ly * cw,        lx * ch];
		case 180: return [(1 - lx) * cw,  ly * ch];
		case 270: return [(1 - ly) * cw,  (1 - lx) * ch];
		default:  return [lx * cw,        (1 - ly) * ch]; // 0°
	}
}

function extractGptsFromText(
	text: string,
	canvasWidth: number,
	canvasHeight: number,
	rotation = 0
): Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'> | null {
	const gptsMatch = text.match(/\/GPTS\s*\[([^\]]+)\]/);
	if (!gptsMatch) return null;
	const gptsNums = gptsMatch[1].trim().split(/\s+/).map(Number).filter((n) => !isNaN(n));
	if (gptsNums.length < 8) return null;

	// GPTS pairs are [lat, lon, lat, lon, ...]
	const gpsPts: [number, number][] = [];
	for (let i = 0; i + 1 < gptsNums.length; i += 2) gpsPts.push([gptsNums[i], gptsNums[i + 1]]);

	// Validate GPS values are reasonable (lat ±90, lon ±180)
	if (gpsPts.some(([lat, lon]) => Math.abs(lat) > 90 || Math.abs(lon) > 180)) return null;

	// Try LPTS — normalised page space (0–1), y=0 at bottom of un-rotated page
	const lptsMatch = text.match(/\/LPTS\s*\[([^\]]+)\]/);
	let canvasPts: [number, number][];

	if (lptsMatch) {
		const lptsNums = lptsMatch[1].trim().split(/\s+/).map(Number).filter((n) => !isNaN(n));
		if (lptsNums.length >= gpsPts.length * 2) {
			canvasPts = [];
			for (let i = 0; i < gpsPts.length; i++) {
				canvasPts.push(lptsToCanvas(
					lptsNums[i * 2], lptsNums[i * 2 + 1],
					canvasWidth, canvasHeight, rotation
				));
			}
			console.log('[georef] GPTS: LPTS positions computed, rotation=', rotation);
		} else {
			canvasPts = fallbackCanvasPoints(gpsPts, canvasWidth, canvasHeight);
		}
	} else {
		canvasPts = fallbackCanvasPoints(gpsPts, canvasWidth, canvasHeight);
		console.log('[georef] GPTS: no LPTS, rotation=', rotation);
	}

	// orientationChecked auto-corrects any residual inversion
	return orientationChecked(canvasPts, gpsPts, canvasWidth, canvasHeight);
}

// Without LPTS, assign each GPS point to the canvas corner it most likely corresponds to
function fallbackCanvasPoints(
	gpsPts: [number, number][],
	canvasWidth: number,
	canvasHeight: number
): [number, number][] {
	const lats = gpsPts.map((p) => p[0]);
	const lons = gpsPts.map((p) => p[1]);
	const minLat = Math.min(...lats), maxLat = Math.max(...lats);
	const minLon = Math.min(...lons), maxLon = Math.max(...lons);
	return gpsPts.map(([lat, lon]) => [
		((lon - minLon) / (maxLon - minLon)) * canvasWidth,
		((maxLat - lat) / (maxLat - minLat)) * canvasHeight,
	]);
}

// ── Strategy B: LGIDict CTM (Esri / Avenza AMP) ───────────────────────────
//
// CTM = [a b c d e f]  maps PDF user-space (pts, bottom-left origin) → projected CRS:
//   X_geo = a·px + c·py + e
//   Y_geo = b·px + d·py + f

interface LgiCtm {
	a: number; b: number; c: number; d: number; e: number; f: number;
	projcs: string;
}

function extractCtmValues(text: string): [number, number, number, number, number, number] | null {
	const ctmMatch = text.match(/\/CTM\s*\[([^\]]+)\]/);
	if (!ctmMatch) return null;
	const vals = ctmMatch[1].trim().split(/\s+/).map(Number);
	if (vals.length < 6 || vals.some(isNaN)) return null;
	return vals.slice(0, 6) as [number, number, number, number, number, number];
}

// Searches a list of text sources for LGIDict CTM + a WKT projection string.
// They can be in different sources (e.g. different PDF objects/streams).
function findLgiCtm(texts: string[]): LgiCtm | null {
	let hasLgiDict = false;
	let ctm: [number, number, number, number, number, number] | null = null;
	let projcs: string | null = null;

	for (const text of texts) {
		if (text.includes('/LGIDict')) hasLgiDict = true;
		if (!ctm) ctm = extractCtmValues(text);
		if (!projcs) projcs = extractWktProjection(text);
	}

	if (!hasLgiDict) return null;

	if (!ctm) {
		console.log('[georef] B: /LGIDict found but no /CTM');
		return null;
	}
	if (!projcs) {
		console.log('[georef] B: /LGIDict+CTM found but no PROJCS/GEOGCS WKT');
		// Log a snippet around the LGIDict to help diagnose
		for (const text of texts) {
			const idx = text.indexOf('/LGIDict');
			if (idx !== -1) {
				console.log('[georef] B: LGIDict context:', text.slice(idx, idx + 500).replace(/[^\x20-\x7e\n]/g, '?'));
			}
		}
		return null;
	}

	const [a, b, c, d, e, f] = ctm;
	return { a, b, c, d, e, f, projcs };
}

function ctmToConverters(
	lgi: LgiCtm,
	renderScale: number,
	pageHeightPts: number
): Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'> {
	const { a, b, c, d, e, f, projcs } = lgi;
	const det = a * d - b * c;

	let wgs84ToProj: proj4.Converter;
	let projToWgs84: proj4.Converter;

	try {
		wgs84ToProj = proj4('WGS84', projcs);
		projToWgs84 = proj4(projcs, 'WGS84');
	} catch (err) {
		console.warn('[georef] CTM proj4 parse failed:', err);
		console.log('[georef] PROJCS string was:', projcs.slice(0, 200));
		return { gpsToCanvas: null, canvasToGps: null };
	}

	return {
		gpsToCanvas(lat: number, lon: number): [number, number] | null {
			try {
				const pt = wgs84ToProj.forward([lon, lat]);
				const gx = pt[0], gy = pt[1];
				const px = (d * (gx - e) - c * (gy - f)) / det;
				const py = (a * (gy - f) - b * (gx - e)) / det;
				const cx = px * renderScale;
				const cy = (pageHeightPts - py) * renderScale;
				return [cx, cy];
			} catch { return null; }
		},
		canvasToGps(cx: number, cy: number): [number, number] | null {
			try {
				const px = cx / renderScale;
				const py = pageHeightPts - (cy / renderScale);
				const gx = a * px + c * py + e;
				const gy = b * px + d * py + f;
				const pt = projToWgs84.forward([gx, gy]);
				return [pt[1], pt[0]]; // [lat, lon]
			} catch { return null; }
		}
	};
}

// ── Strategy C: GDAL affine transform ────────────────────────────────────

interface GdalGeoref {
	gt: [number, number, number, number, number, number];
	projcs: string;
	width: number;
	height: number;
}

function extractGdalGeoref(text: string): GdalGeoref | null {
	const tMatch = text.match(
		/Transform\s*[=:]\s*\[?\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)/
	);
	if (!tMatch) return null;
	const gt = tMatch.slice(1, 7).map(Number) as [number, number, number, number, number, number];
	if (gt.some(isNaN)) return null;

	const projcs = extractWktProjection(text);
	if (!projcs) return null;

	const sizeMatch =
		text.match(/Size\s*(?:\(pixels\))?\s*[=:]\s*(\d+)\s*[x×]\s*(\d+)/i) ??
		text.match(/(\d+)\s*[x×]\s*(\d+)\s*pixels/i);
	if (!sizeMatch) return null;

	return {
		gt,
		projcs,
		width: parseInt(sizeMatch[1], 10),
		height: parseInt(sizeMatch[2], 10)
	};
}

function gtToConverters(
	gdal: GdalGeoref,
	renderScale: number
): Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'> {
	const [ox, sx, ry, oy, rx, sy] = gdal.gt;
	const det = sx * sy - ry * rx;

	let wgs84ToProj: proj4.Converter;
	let projToWgs84: proj4.Converter;

	try {
		wgs84ToProj = proj4('WGS84', gdal.projcs);
		projToWgs84 = proj4(gdal.projcs, 'WGS84');
	} catch (err) {
		console.warn('[georef] GDAL proj4 parse failed:', err);
		return { gpsToCanvas: null, canvasToGps: null };
	}

	return {
		gpsToCanvas(lat: number, lon: number): [number, number] | null {
			try {
				const pt = wgs84ToProj.forward([lon, lat]);
				const gx = pt[0], gy = pt[1];
				const col = (sy * (gx - ox) - ry * (gy - oy)) / det;
				const row = (sx * (gy - oy) - rx * (gx - ox)) / det;
				return [col * renderScale, row * renderScale];
			} catch { return null; }
		},
		canvasToGps(cx: number, cy: number): [number, number] | null {
			try {
				const col = cx / renderScale;
				const row = cy / renderScale;
				const gx = ox + col * sx + row * ry;
				const gy = oy + col * rx + row * sy;
				const pt = projToWgs84.forward([gx, gy]);
				return [pt[1], pt[0]]; // [lat, lon]
			} catch { return null; }
		}
	};
}

// ── Strategy D: XMP bounding box ─────────────────────────────────────────

function searchXmpMetadata(xmpRaw: string): GptsBounds | null {
	const n = xmpRaw.match(/(?:north|maxLat|NorthBoundingCoordinate)[^>]*?>([\d.-]+)</i);
	const s = xmpRaw.match(/(?:south|minLat|SouthBoundingCoordinate)[^>]*?>([\d.-]+)</i);
	const e = xmpRaw.match(/(?:east|maxLon|EastBoundingCoordinate)[^>]*?>([\d.-]+)</i);
	const w = xmpRaw.match(/(?:west|minLon|WestBoundingCoordinate)[^>]*?>([\d.-]+)</i);
	if (!n || !s || !e || !w) return null;
	const north = parseFloat(n[1]);
	const south = parseFloat(s[1]);
	const east = parseFloat(e[1]);
	const west = parseFloat(w[1]);
	if ([north, south, east, west].some((v) => isNaN(v))) return null;
	if (west === east || south === north) return null;
	return { west, south, east, north };
}

// ── Public API ────────────────────────────────────────────────────────────

export async function extractGeoref(file: File): Promise<GeorefResult> {
	console.log('[georef] starting extraction for:', file.name);

	// 1. Lazy-load pdfjs (avoid SSR breakage)
	const pdfjsLib = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		'pdfjs-dist/build/pdf.worker.min.mjs',
		import.meta.url
	).href;

	const buffer = await file.arrayBuffer();
	// pdfjs transfers the buffer to its worker (detaches it). Pass a copy.
	const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer).slice() }).promise;
	console.log('[georef] PDF loaded, pages:', pdf.numPages);

	// 2. Render page 1, capped at 2048px
	const page = await pdf.getPage(1);
	const rotation = page.rotate ?? 0; // PDF /Rotate value (0 | 90 | 180 | 270)
	const rawViewport = page.getViewport({ scale: 1.0 });
	const renderScale = Math.min(2.0, 2048 / Math.max(rawViewport.width, rawViewport.height));
	const viewport = page.getViewport({ scale: renderScale });
	const canvasWidth = Math.round(viewport.width);
	const canvasHeight = Math.round(viewport.height);
	// pageHeightPts is the un-rotated height (needed for LGIDict CTM Y-flip)
	const pageWidthPts = rawViewport.width;
	const pageHeightPts = rawViewport.height;
	console.log('[georef] page rotation:', rotation);

	const offscreen = document.createElement('canvas');
	offscreen.width = canvasWidth;
	offscreen.height = canvasHeight;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await page.render({ canvas: offscreen, viewport } as any).promise;
	const imageDataUrl = offscreen.toDataURL('image/png');
	console.log('[georef] rendered page at scale', renderScale, `→ ${canvasWidth}×${canvasHeight}, page ${pageWidthPts.toFixed(1)}×${pageHeightPts.toFixed(1)} pts`);

	const base: Pick<GeorefResult, 'imageDataUrl' | 'canvasWidth' | 'canvasHeight'> = {
		imageDataUrl, canvasWidth, canvasHeight
	};

	const rawText = new TextDecoder('latin1').decode(buffer);

	// Helper to attach mapboxCorners before returning
	const withCorners = (c: Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'>) =>
		({ ...base, ...withMapboxCorners(c, canvasWidth, canvasHeight) });

	// ── Strategy A: raw text — /GPTS + /LPTS ──
	const gptsRaw = extractGptsFromText(rawText, canvasWidth, canvasHeight, rotation);
	if (gptsRaw) {
		console.log('[georef] A: /GPTS found in raw text');
		return withCorners(gptsRaw);
	}

	// ── Strategy C: raw text — GDAL affine ──
	const gdalRaw = extractGdalGeoref(rawText);
	if (gdalRaw) {
		console.log('[georef] C: GDAL affine found in raw text', gdalRaw.gt);
		return withCorners(gtToConverters(gdalRaw, renderScale));
	}

	// ── Decompress all FlateDecode streams ──
	const streams = await getDecompressedStreams(buffer);
	console.log(`[georef] searching ${streams.length} decompressed streams + raw text`);

	// ── Strategy A+C per stream ──
	for (let i = 0; i < streams.length; i++) {
		const text = streams[i];

		const gptsStream = extractGptsFromText(text, canvasWidth, canvasHeight, rotation);
		if (gptsStream) {
			console.log(`[georef] A: /GPTS found in stream ${i}`);
			return withCorners(gptsStream);
		}

		const gdalStream = extractGdalGeoref(text);
		if (gdalStream) {
			console.log(`[georef] C: GDAL affine found in stream ${i}`, gdalStream.gt);
			return withCorners(gtToConverters(gdalStream, renderScale));
		}
	}

	// ── Strategy B: LGIDict CTM — search across ALL text sources combined ──
	// CTM and PROJCS may live in different PDF objects; search all sources together.
	const allTexts = [rawText, ...streams];
	const lgi = findLgiCtm(allTexts);
	if (lgi) {
		console.log('[georef] B: LGIDict CTM found across all sources, det=', lgi.a * lgi.d - lgi.b * lgi.c);
		const converters = ctmToConverters(lgi, renderScale, pageHeightPts);
		if (converters.canvasToGps) return withCorners(converters);
	}

	// ── Strategy D: XMP metadata ──
	console.log('[georef] trying D: XMP metadata');
	try {
		const meta = await pdf.getMetadata();
		const rawMeta = meta.metadata as unknown as { getRaw?: () => string } | null;
		const xmpRaw = rawMeta && typeof rawMeta.getRaw === 'function' ? rawMeta.getRaw() : '';
		if (xmpRaw) {
			const xmpBounds = searchXmpMetadata(xmpRaw);
			if (xmpBounds) {
				console.log('[georef] D: XMP bounds found', xmpBounds);
				// Build 4 corner points from bounding box (no LPTS available for XMP)
				const { west, south, east, north } = xmpBounds;
				const canvasPts: [number,number][] = [[0,0],[canvasWidth,0],[canvasWidth,canvasHeight],[0,canvasHeight]];
				const gpsPts: [number,number][] = [[north,west],[north,east],[south,east],[south,west]];
				return withCorners(affinePairConverters(canvasPts, gpsPts));
			}
		}
		console.log('[georef] D: XMP — no bounding fields found');
	} catch (err) {
		console.warn('[georef] D: XMP metadata error:', err);
	}

	// Diagnose: did we find any recognizable georef tokens at all?
	const hasLgi = allTexts.some(t => t.includes('/LGIDict'));
	const hasCtm = allTexts.some(t => /\/CTM\s*\[/.test(t));
	const hasProj = allTexts.some(t => t.includes('PROJCS') || t.includes('GEOGCS'));
	const hasGpts = allTexts.some(t => t.includes('/GPTS'));
	console.warn('[georef] no georeference found. Tokens found — /LGIDict:', hasLgi, '/CTM:', hasCtm, 'PROJCS/GEOGCS:', hasProj, '/GPTS:', hasGpts);

	return { ...base, gpsToCanvas: null, canvasToGps: null };
}
