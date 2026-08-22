// icons.ts — THE icon file for the whole mobile app.
//
// ONE list: `ICONS`. Each row is a name and the path to its picture.
// Pins, inbox glyphs, shape icons — everything with an icon is one row
// here. A pin row also says which library section it sits in (`pin`).
// No label, no second file, no string-building. Add an icon = add a row.


const DIR = "/mobileAssets";
/** Where the pin artwork lives. Exported: ReTreever's inbox half
 *  and the emoji plate both build paths from it. */
export const PIN_DIR = "/mobileAssets/pin_library_small";

// A map pin's name. Pins are saved into features / shared files by this
// string, so the set is a stable contract.
export type PinKey =
    | "pin"
    | "cache"
    | "truck"
    | "bear"
    | "heli"
    | "crossing"
    | "noCrossing"
    | "warning"
    | "atv"
    | "muster"
    | "home"
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "blue"
    | "purple";

// Every icon name — pins plus the non-pin glyphs (inbox / shapes).
export type IconName =
    | PinKey
    | "map"
    | "box"
    | "cacheGroup"
    | "tally"
    | "poly"
    | "line"
    | "track"
    | "pdf"
    | "tiles"
    | "quality"
    | "qualityWhite"
    | "cleanCache"
    | "handPointLeft"
    | "handPointRight";

export type IconRow = {
    /** The name of the thing. This is what gets saved / referenced. */
    name: IconName;
    /** Path to its picture. Right here, on the same row. */
    path: string;
    /** Set ONLY if this icon is a user-droppable map pin — and says
     *  which library section it belongs to. Absent = not a pin. */
    pin?: "glyph" | "rainbow";
};

/** A pin row — `name` is a PinKey, `pin` is guaranteed present. */
export type PinRow = IconRow & { name: PinKey; pin: "glyph" | "rainbow" };

// ─────────────────────────────────────────────────────────────────────
// THE LIST.  name  →  path.   (pin rows also carry their section)
// ─────────────────────────────────────────────────────────────────────
export const ICONS: readonly IconRow[] = [
    // ── map pins · glyphs (artwork) ──
    // Row order = display order in the Pin Library (and the first
    // COLLAPSED_COUNT feed the detail sheet's quick-pick row). The
    // default "pin" sits LAST — it's what every feature starts with,
    // so the library leads with the exciting ones.
    { name: "truck", pin: "glyph", path: `${PIN_DIR}/pin_truck_sm.webp` },
    { name: "cache", pin: "glyph", path: `${PIN_DIR}/pin_cache_sm.webp` },
    { name: "atv", pin: "glyph", path: `${PIN_DIR}/pin_atv_sm.webp` },
    { name: "bear", pin: "glyph", path: `${PIN_DIR}/pin_bear_sm.webp` },
    {
        name: "heli",
        pin: "glyph",
        path: `${PIN_DIR}/pin_helicopter_sm.webp`,
    },
    {
        name: "crossing",
        pin: "glyph",
        path: `${PIN_DIR}/pin_crossing_good_sm.webp`,
    },
    {
        name: "noCrossing",
        pin: "glyph",
        path: `${PIN_DIR}/pin_crossing_bad_sm.webp`,
    },
    { name: "warning", pin: "glyph", path: `${PIN_DIR}/pin_warn_sm.webp` },
    {
        name: "muster",
        pin: "glyph",
        path: `${PIN_DIR}/pin_muster_point_sm.webp`,
    },
    { name: "home", pin: "glyph", path: `${PIN_DIR}/pin_home_sm.webp` },
    { name: "pin", pin: "glyph", path: `${PIN_DIR}/pin_default_sm.webp` },
    // ── map pins · rainbow (plain colours) ──
    { name: "red", pin: "rainbow", path: `${PIN_DIR}/1pin_red_sm.webp` },
    { name: "orange", pin: "rainbow", path: `${PIN_DIR}/2pin_orange_sm.webp` },
    { name: "yellow", pin: "rainbow", path: `${PIN_DIR}/3pin_yellow_sm.webp` },
    { name: "green", pin: "rainbow", path: `${PIN_DIR}/4pin_green_sm.webp` },
    { name: "blue", pin: "rainbow", path: `${PIN_DIR}/5pin_blue_sm.webp` },
    { name: "purple", pin: "rainbow", path: `${PIN_DIR}/6pin_purple_sm.webp` },
    // ── inbox row / kind glyphs (not pins) ──
    { name: "map", path: `${DIR}/blockHeart_sm2.webp` },
    { name: "box", path: `${DIR}/box_icon_V9.webp` },
    { name: "cacheGroup", path: `${DIR}/cache_icon.webp` },
    { name: "tally", path: `${DIR}/cent_icon_plain_v3_gold.webp` },
    { name: "poly", path: `${DIR}/poly_icon.webp` },
    { name: "line", path: `${DIR}/line_icon.webp` },
    // GPS breadcrumb tracks — the gold railway squiggle, same art as the
    // TRACKS drawer tile. A track is NOT a line; it never gets line_icon.
    { name: "track", path: `${DIR}/tracks_goldV3.webp` },
    { name: "pdf", path: `${DIR}/pdf_maps_icon.webp` },
    { name: "tiles", path: `${DIR}/pin_library_small/pin_tiles_sm.webp` },
    // ── ANIMATED webps ──
    // These are single self-animating .webp files (they play by themselves in
    // an <img>), NOT frame folders — so they live here, not in the scene
    // registry. Each is BUILT from its sibling frame folder by
    // `scripts/rebuild-anime-webp.sh <name>`; edit the frames, rerun the
    // script, or the app keeps showing the old assembled file forever.
    // The gold quality glyph — inbox rows, plot popovers, the Quality tab.
    { name: "quality", path: `${DIR}/animations/quality_icon.webp` },
    // White variant — for gold/dark backgrounds (tab bar active, snake ruler).
    { name: "qualityWhite", path: `${DIR}/animations/quality_icon_white.webp` },
    // The sweeping-broom timelapse shown while slow work runs (imports,
    // conversions, admin loads).
    { name: "cleanCache", path: `${DIR}/animations/cleanCache_anime.webp` },
    // ── intro-tour pointing hands (STATIC pngs, not sequences) ──
    // The shovel-gripping hand with the index finger up, tweened along a path
    // by Fingers.svelte. Fingertip anchors live with the tour geometry in
    // animation/components_anime/demos/demoConfigs.ts — only the URLs are here.
    { name: "handPointLeft", path: `${DIR}/hand_point_left.webp` },
    { name: "handPointRight", path: `${DIR}/hand_point_right.png` },
];

const BY_NAME = new Map<string, IconRow>(ICONS.map((r) => [r.name, r]));

/** The path for any icon. The one and only way to get an icon path.
 *  An unknown name falls back to the default pin's artwork rather than
 *  crashing — the old `BY_NAME.get(name)!.path` threw a bare TypeError on
 *  any typo'd/unmapped name, white-screening whatever rendered it. */
export function iconPath(name: IconName): string {
    return (BY_NAME.get(name) ?? BY_NAME.get(DEFAULT_PIN_KEY))?.path ?? "";
}

/** The path for a pin (same table, narrower type). Same default-on-miss
 *  hardening as iconPath. */
export function pinAssetPath(key: PinKey): string {
    return (BY_NAME.get(key) ?? BY_NAME.get(DEFAULT_PIN_KEY))?.path ?? "";
}

const PIN_ROWS: readonly PinRow[] = ICONS.filter(
    (r): r is PinRow => r.pin !== undefined,
);

/** Artwork pins — the library's top (untitled) section. */
export const GLYPH_PINS: readonly PinRow[] = PIN_ROWS.filter(
    (r) => r.pin === "glyph",
);

/** Rainbow colour pins — the library's "RAINBOW" section. */
export const RAINBOW_PINS: readonly PinRow[] = PIN_ROWS.filter(
    (r) => r.pin === "rainbow",
);

/** Every pin row, glyphs then rainbow. */
export const ALL_PINS: readonly PinRow[] = PIN_ROWS;

/** The pin a feature carries before the user deliberately picks one. */
export const DEFAULT_PIN_KEY: PinKey = "pin";

const PIN_SET: ReadonlySet<string> = new Set(ALL_PINS.map((r) => r.name));

/**
 * Parse an untrusted string (KML ExtendedData, envelope field, deep-link
 * param) into a PinKey, or `null` if it isn't a pin name.
 */
export function parsePinKey(raw: unknown): PinKey | null {
    return typeof raw === "string" && PIN_SET.has(raw) ? (raw as PinKey) : null;
}

// ─── Emoji pins ─────────────────────────────────────────────────────
//
// `pinTypeKey` is a NAMESPACE, not a closed enum — `plot:<n>` has always
// been a dynamic composite key rendering bespoke DOM. Emoji pins are the
// same shape: `emoji:<char>`, e.g. `emoji:🌸`.
//
// This costs no schema change: `pinTypeKey` is already a free-text column
// and `onChangeIcon` is already typed `(key: string)`. Anything reading a
// pin key must ask THIS module what it is — never string-match inline, or
// the map, the inbox, the detail sheet and the KMZ exporter drift apart.

/** The prefix marking a pin whose artwork is a system-font emoji. */
export const EMOJI_PIN_PREFIX = "emoji:";

/** The blank gold pin an emoji is composited onto. Not in ICONS: it is
 *  never selectable on its own, only as the backing plate for an emoji. */
export const EMOJI_PIN_PLATE = `${PIN_DIR}/pin_blank_emoji_sm.webp`;

/**
 * The emoji character in an `emoji:<char>` key, or `null` for anything
 * else. The mirror of `parsePinKey` — every surface that renders a pin
 * asks both, and the two are exhaustive over user-pickable pins.
 */
export function parseEmojiPin(raw: unknown): string | null {
    if (typeof raw !== "string" || !raw.startsWith(EMOJI_PIN_PREFIX))
        return null;
    const char = raw.slice(EMOJI_PIN_PREFIX.length);
    // Guard the empty tail (`"emoji:"`) — a truncated key must fall back to
    // the default pin rather than render an invisible marker.
    return char.length > 0 ? char : null;
}

/** Build the `pinTypeKey` for an emoji. The only place this string is
 *  assembled — callers never concatenate the prefix themselves. */
export function emojiPinKey(char: string): string {
    return `${EMOJI_PIN_PREFIX}${char}`;
}
