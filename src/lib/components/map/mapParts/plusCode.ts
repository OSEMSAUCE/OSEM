// Plus Code (Open Location Code) encoder — minimal, dependency-free.
//
// Why inline instead of the npm `open-location-code` package: OSEM is the
// open-source UI library and we keep it dependency-light. Encoding is a small,
// stable algorithm (Google's spec hasn't changed), so a ~40-line encoder is
// cheaper than a dependency and identical in output.
//
// We only need ENCODE (lat/lng → code) at the precisions the grid uses:
//   8 chars  → ~100m cell  (one per hectare — the big dot)
//  10 chars  → ~14m cell   (used when we want a real, Google-lookup-able code
//                            for a sub-dot's exact position)
//
// The grid's friendly sub-dot id (`<hectareCode>.1`..`.9`) is OUR convention,
// layered on top: the `.N` is a fixed metres offset from the hectare centre,
// so it always converts back to real lat/lng (see digitOffsetMetres in
// mapGrid.ts) and from there to a real Plus Code via encode() here. The `.N`
// is a nickname; this module is how you resolve the nickname to the legal name.

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
    const codeLength = Math.min(Math.max(length, 2), PAIR_CODE_LENGTH);

    let lat = Math.min(Math.max(latitude, -LATITUDE_MAX), LATITUDE_MAX);
    let lng = longitude;
    while (lng < -LONGITUDE_MAX) lng += 360;
    while (lng >= LONGITUDE_MAX) lng -= 360;
    // Lat 90 nudged down one cell so the code can still be decoded.
    if (lat === LATITUDE_MAX) {
        lat -= PAIR_RESOLUTIONS[Math.floor((codeLength - 2) / 2)] / 2;
    }

    let adjustedLatitude = lat + LATITUDE_MAX; // 0..180
    let adjustedLongitude = lng + LONGITUDE_MAX; // 0..360

    let code = "";
    let digitCount = 0;
    while (digitCount < codeLength) {
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
        if (digitCount === SEPARATOR_POSITION && digitCount < codeLength) {
            code += "+";
        }
    }
    if (code.length < SEPARATOR_POSITION) {
        code = code.padEnd(SEPARATOR_POSITION, PADDING);
    }
    if (code.length === SEPARATOR_POSITION) {
        code += "+";
    }
    return code;
}

/** The hectare (8-char) parent of any code — used for roll-ups by hectare. */
export function hectareCodeOf(plusCode: string): string {
    // Friendly sub-dot ids look like "87G8Q2PX+.5" or "87G8Q2PX.5"; the hectare
    // is always the first 8 alphabet chars regardless of any '+' / '.N' tail.
    const compact = plusCode.replace(/[+.].*$/, "");
    return compact.slice(0, SEPARATOR_POSITION) + "+";
}
