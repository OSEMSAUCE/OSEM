// Plus Code (Open Location Code) encoder — minimal, dependency-free.
//
// Why inline instead of the npm `open-location-code` package: OSEM is the
// open-source UI library and we keep it dependency-light. Encoding is a small,
// stable algorithm (Google's spec hasn't changed), so a ~40-line encoder is
// cheaper than a dependency and identical in output.
//
// ── "+2" and "+3" — the two grid-dot precisions (SOURCE OF TRUTH) ────────────
// A Plus Code always has a "+" after the 8th character. We name a code by HOW
// MANY characters come AFTER that "+":
//
//   +2  → the BIG dots.   10-char code, e.g. "87G3J24G+62".
//                         Cell ≈ 98 m. One per ~hectare. "Close enough" to mark
//                         the big grid dots — they sit ~100 m apart.
//
//   +3  → the SMALL dots. 11-char code, e.g. "87G3J24G+62V".
//                         Cell ≈ 3.5 m. Close enough to fill in the small dots,
//                         which sit ~3.5 m apart.
//
// So: encodePlusCode(lat, lng, 10) → a +2 (big) code; encodePlusCode(lat,lng,11)
// → a +3 (small) code. The number you pass as `length` is the TOTAL char count
// (10 or 11), i.e. 8 + the "+2"/"+3" tail.
//
// Every dot's id IS a real, Google-lookup-able Plus Code — no ".N" nicknames
// (removed). Two forms of the SAME real code:
//   • DISPLAY (the popup label): the SHORT tail — full code minus its 5-char
//     region prefix, e.g. "87G3J24G+62" → "24G+62". The prefix is identical
//     across the region, so dropping it just removes noise; the tail still
//     resolves to the exact same point. Fits the pill, no ellipsis.
//   • COPY / STAMP: the FULL code, so it's Google-pasteable anywhere.
// There is NO made-up "friendly" form — both are the genuine code, just trimmed
// or not.

// Google's 20-symbol base-20 alphabet. Note the gaps (no A/B/D/E/I/L/N/O/S/T/U)
// — this is why the codes read in a "scrambled" order to a human eye.
const ALPHABET = "23456789CFGHJMPQRVWX";
const SEPARATOR_POSITION = 8;
const PADDING = "0";
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
// First 10 chars are lat/lng pairs at base-20; chars beyond 10 use a 4×5 grid
// refinement we don't need (8 and 10 are the only lengths the grid asks for).
const PAIR_CODE_LENGTH = 10;
// Place value (in degrees) of each lat/lng DIGIT PAIR. Index = pair number.
// This is the source of truth for cell size: pair 0 = 20°, pair 3 = .0025°, …
const PAIR_RESOLUTIONS = [20.0, 1.0, 0.05, 0.0025, 0.000125];
// Grid-refinement (chars 11+): each char splits a cell into 4 cols × 5 rows.
const GRID_COLS = 4;
const GRID_ROWS = 5;

/**
 * Encode a lat/lng to an Open Location Code (Plus Code).
 * Ported 1:1 from Google's reference `encodePairs` so output is byte-identical
 * to the `open-location-code` npm package (verified against it in tests).
 * @param length 8 → hectare (~100m), 10 → sub-hectare (~14m). Even, 2..10.
 */
export function encodePlusCode(
    latitude: number,
    longitude: number,
    length = 8,
): string {
    const pairLength = Math.min(Math.max(length, 2), PAIR_CODE_LENGTH);

    let lat = Math.min(Math.max(latitude, -LATITUDE_MAX), LATITUDE_MAX);
    let lng = longitude;
    while (lng < -LONGITUDE_MAX) lng += 360;
    while (lng >= LONGITUDE_MAX) lng -= 360;
    // Lat 90 nudged down one cell so the code can still be decoded.
    if (lat === LATITUDE_MAX) {
        lat -= PAIR_RESOLUTIONS[Math.floor((pairLength - 2) / 2)] / 2;
    }

    let adjustedLatitude = lat + LATITUDE_MAX; // 0..180
    let adjustedLongitude = lng + LONGITUDE_MAX; // 0..360

    let code = "";
    let digitCount = 0;
    while (digitCount < pairLength) {
        const placeValue = PAIR_RESOLUTIONS[Math.floor(digitCount / 2)];
        // Latitude digit.
        let digitValue = Math.floor(adjustedLatitude / placeValue);
        adjustedLatitude -= digitValue * placeValue;
        code += ALPHABET.charAt(digitValue);
        digitCount += 1;
        // Longitude digit (same place value).
        digitValue = Math.floor(adjustedLongitude / placeValue);
        adjustedLongitude -= digitValue * placeValue;
        code += ALPHABET.charAt(digitValue);
        digitCount += 1;
        if (digitCount === SEPARATOR_POSITION && digitCount < pairLength) {
            code += "+";
        }
    }
    if (code.length < SEPARATOR_POSITION) {
        code = code.padEnd(SEPARATOR_POSITION, PADDING);
    }
    if (code.length === SEPARATOR_POSITION) {
        code += "+";
    }

    // Grid-refinement chars (11th+): each char splits the current cell into a
    // 4-col × 5-row grid (ported 1:1 from Google's encodeGrid). The grid uses a
    // single base-20 digit = row*4 + col. We need 11-char for sub-dot codes.
    if (length > PAIR_CODE_LENGTH) {
        const latVal = lat + LATITUDE_MAX;
        const lngVal = lng + LONGITUDE_MAX;
        let latPlace = PAIR_RESOLUTIONS[PAIR_RESOLUTIONS.length - 1]; // 0.000125
        let lngPlace = latPlace;
        for (let i = PAIR_CODE_LENGTH; i < length; i++) {
            const latStep = latPlace / GRID_ROWS;
            const lngStep = lngPlace / GRID_COLS;
            const r = Math.min(GRID_ROWS - 1, Math.floor((latVal % latPlace) / latStep));
            const c = Math.min(GRID_COLS - 1, Math.floor((lngVal % lngPlace) / lngStep));
            code += ALPHABET.charAt(r * GRID_COLS + c);
            latPlace = latStep;
            lngPlace = lngStep;
        }
    }
    return code;
}

/** The hectare (8-char) parent of any code — used for roll-ups by hectare. */
export function hectareCodeOf(plusCode: string): string {
    // Friendly sub-dot ids look like "87G8Q2PX+.5" or "87G8Q2PX.5"; the hectare
    // is always the first 8 alphabet chars regardless of any '+' / '.N' tail.
    const compact = plusCode.replace(/[+.].*$/, "");
    return `${compact.slice(0, SEPARATOR_POSITION)}+`;
}

// A decoded Plus Code cell: its bounding box + centre + size in degrees.
export type PlusCodeArea = {
    latLo: number;
    lngLo: number;
    latHi: number;
    lngHi: number;
    latCenter: number;
    lngCenter: number;
    latSize: number; // cell height in degrees
    lngSize: number; // cell width in degrees
};

// Decode an 8- or 10-char Plus Code to its cell area. Inverse of encodePlusCode
// for the pair section (the only precision the grid uses). Lets us place dots on
// REAL Plus Code cell centres so every big-dot code is genuinely Google-able.
export function decodePlusCode(plusCode: string): PlusCodeArea {
    const clean = plusCode.replace(/\+/g, "").replace(/0+$/, "").toUpperCase();
    let latLo = -LATITUDE_MAX;
    let lngLo = -LONGITUDE_MAX;
    let latRes = PAIR_RESOLUTIONS[0]; // 20°
    let lngRes = PAIR_RESOLUTIONS[0];
    const digits = Math.min(clean.length, PAIR_CODE_LENGTH);
    for (let i = 0; i < digits; i += 2) {
        latRes = PAIR_RESOLUTIONS[i / 2];
        lngRes = latRes;
        latLo += ALPHABET.indexOf(clean[i]) * latRes;
        lngLo += ALPHABET.indexOf(clean[i + 1]) * lngRes;
    }
    return {
        latLo,
        lngLo,
        latHi: latLo + latRes,
        lngHi: lngLo + lngRes,
        latCenter: latLo + latRes / 2,
        lngCenter: lngLo + lngRes / 2,
        latSize: latRes,
        lngSize: lngRes,
    };
}
