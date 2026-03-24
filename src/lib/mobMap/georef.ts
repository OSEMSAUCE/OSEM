// PDF georeference extraction
// TODO: Implement in Step 3

export interface GeorefResult {
	imageDataUrl: string;
	bounds: [[number, number], [number, number]]; // [[west, south], [east, north]]
}

export async function extractGeoref(file: File): Promise<GeorefResult> {
	throw new Error('Not implemented');
}
