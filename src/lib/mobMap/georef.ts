import proj4 from 'proj4';

export interface GeorefResult {
	imageDataUrl: string;
	canvasWidth: number;
	canvasHeight: number;
	// null if no geotransform found (PDF still displays, GPS/measure won't work)
	gpsToCanvas: ((lat: number, lon: number) => [number, number] | null) | null;
	canvasToGps: ((x: number, y: number) => [number, number] | null) | null;
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

// ── Strategy A: OGC GeoPDF — /GPTS ───────────────────────────────────────

interface GptsBounds {
	west: number; south: number; east: number; north: number;
}

function extractGptsFromText(text: string): GptsBounds | null {
	const match = text.match(/\/GPTS\s*\[([^\]]+)\]/);
	if (!match) return null;
	const nums = match[1].trim().split(/\s+/).map(Number).filter((n) => !isNaN(n));
	if (nums.length < 8) return null;
	const lats: number[] = [], lons: number[] = [];
	for (let i = 0; i + 1 < nums.length; i += 2) { lats.push(nums[i]); lons.push(nums[i + 1]); }
	const south = Math.min(...lats), north = Math.max(...lats);
	const west = Math.min(...lons), east = Math.max(...lons);
	if ([south, north, west, east].some((v) => isNaN(v) || !isFinite(v))) return null;
	if (west === east || south === north) return null;
	return { west, south, east, north };
}

function gptsToConverters(
	bounds: GptsBounds,
	canvasWidth: number,
	canvasHeight: number
): Pick<GeorefResult, 'gpsToCanvas' | 'canvasToGps'> {
	const { west, south, east, north } = bounds;
	return {
		gpsToCanvas(lat: number, lon: number): [number, number] | null {
			const cx = ((lon - west) / (east - west)) * canvasWidth;
			const cy = ((north - lat) / (north - south)) * canvasHeight;
			return [cx, cy];
		},
		canvasToGps(cx: number, cy: number): [number, number] | null {
			const lon = west + (cx / canvasWidth) * (east - west);
			const lat = north - (cy / canvasHeight) * (north - south);
			return [lat, lon];
		}
	};
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
	const rawViewport = page.getViewport({ scale: 1.0 });
	const renderScale = Math.min(2.0, 2048 / Math.max(rawViewport.width, rawViewport.height));
	const viewport = page.getViewport({ scale: renderScale });
	const canvasWidth = Math.round(viewport.width);
	const canvasHeight = Math.round(viewport.height);
	const pageWidthPts = rawViewport.width;
	const pageHeightPts = rawViewport.height;

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

	// ── Strategy A: raw text — /GPTS ──
	const gptsRaw = extractGptsFromText(rawText);
	if (gptsRaw) {
		console.log('[georef] A: /GPTS found in raw text', gptsRaw);
		return { ...base, ...gptsToConverters(gptsRaw, canvasWidth, canvasHeight) };
	}

	// ── Strategy C: raw text — GDAL affine ──
	const gdalRaw = extractGdalGeoref(rawText);
	if (gdalRaw) {
		console.log('[georef] C: GDAL affine found in raw text', gdalRaw.gt);
		return { ...base, ...gtToConverters(gdalRaw, renderScale) };
	}

	// ── Decompress all FlateDecode streams ──
	const streams = await getDecompressedStreams(buffer);
	console.log(`[georef] searching ${streams.length} decompressed streams + raw text`);

	// ── Strategy A+C per stream ──
	for (let i = 0; i < streams.length; i++) {
		const text = streams[i];

		const gptsStream = extractGptsFromText(text);
		if (gptsStream) {
			console.log(`[georef] A: /GPTS found in stream ${i}`, gptsStream);
			return { ...base, ...gptsToConverters(gptsStream, canvasWidth, canvasHeight) };
		}

		const gdalStream = extractGdalGeoref(text);
		if (gdalStream) {
			console.log(`[georef] C: GDAL affine found in stream ${i}`, gdalStream.gt);
			return { ...base, ...gtToConverters(gdalStream, renderScale) };
		}
	}

	// ── Strategy B: LGIDict CTM — search across ALL text sources combined ──
	// CTM and PROJCS may live in different PDF objects; search all sources together.
	const allTexts = [rawText, ...streams];
	const lgi = findLgiCtm(allTexts);
	if (lgi) {
		console.log('[georef] B: LGIDict CTM found across all sources, det=', lgi.a * lgi.d - lgi.b * lgi.c);
		const converters = ctmToConverters(lgi, renderScale, pageHeightPts);
		if (converters.canvasToGps) return { ...base, ...converters };
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
				return { ...base, ...gptsToConverters(xmpBounds, canvasWidth, canvasHeight) };
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
