/**
 * menuShape.ts — THE SHAPE OF THE MENU. Shared by both tiers.
 *
 * WHAT IS SHARED AND WHAT IS NOT — the whole point of this file.
 *
 *   SHARED (here)      the SHAPE: what slots a menu bar has, in what order,
 *                      how a logo entry is described, the bar's dimensions.
 *   PER-TIER (not here) the CONTENTS: which logos, which links, which child is
 *                      mounted, whose brand it is.
 *
 * A menu whose contents were shared would put ReTreever's identity into a repo
 * meant to be handed to a contractor. A menu whose SHAPE was not shared drifts
 * — which is exactly what happened to the pill: two copies, different padding,
 * different font-size, opposite half-order, every fix made twice.
 *
 * WHY THE LOGOS ARE A LIST AND NOT FILES SCATTERED AROUND
 * There are five or so brand marks and there will be more. Declaring them once
 * here means changing one entry updates every menu that renders them, instead
 * of hunting copies of the same .webp across two repos. Each tier resolves the
 * list against ITS OWN assets — see `resolve` below — so the list names logos
 * without either tier shipping the other's artwork.
 *
 * COPIED, NOT IMPORTED. This file is the source; gitEr/syncRetreeved.sh copies
 * it into rapper on every run_dev_start. rapper must clone WITHOUT this
 * monorepo, so a path or alias into ReTreever would resolve here and nowhere
 * else — the clone would build on this machine and die on a contractor's.
 */

/** One brand mark in the menu. `key` is the stable name; the URL is resolved
 *  per tier, because each ships its own copy of the artwork. */
export type LogoEntry = {
	/** Stable identifier — what the entry IS, not where its file lives. */
	key: string;
	/** Alt text. Shared, because it describes the mark, not the tier. */
	alt: string;
};

/**
 * THE LOGOS, declared once.
 *
 * Add one here and every menu that renders the list picks it up. Neither tier
 * holds its own copy of this list, so they cannot disagree about what exists —
 * only about where the bytes for each one live.
 */
export const LOGOS: LogoEntry[] = [
	{ key: "retreever", alt: "ReTreever" },
	{ key: "retreeverWide", alt: "ReTreever" },
	{ key: "getcache", alt: "Get Cache" },
	{ key: "cent", alt: "Get Ca\u00a2he" },
	{ key: "cache", alt: "Cache" },
	{ key: "marker", alt: "ReTreever map marker" },
	{ key: "appIcon", alt: "Get Cache app icon" },
	{ key: "github", alt: "GitHub" },
];

/**
 * The BYTES live beside this file, in assets/, and the whole directory is
 * mirrored to the other tier on every server start — so dropping a new mark in
 * there shares it with no script edit. `resolveLogos` still decides which of
 * them a given menu renders, because a tier may legitimately not use all of
 * them.
 */

/**
 * Turn the shared list into real URLs using THIS tier's assets.
 *
 * The caller passes a map from key to an imported asset URL — imported, so the
 * bundler copies the bytes and they travel with whoever ships them. A key with
 * no asset in this tier is dropped rather than rendered broken: a tier is
 * allowed not to carry every mark, and a missing image is worse than an absent
 * one.
 */
export function resolveLogos(
	assets: Record<string, string | undefined>,
): (LogoEntry & { src: string })[] {
	return LOGOS.map((l) => ({ ...l, src: assets[l.key] })).filter(
		(l): l is LogoEntry & { src: string } => Boolean(l.src),
	);
}

/**
 * THE BAR'S DIMENSIONS — shared so the two bars are the same object.
 *
 * `--host-chrome` is read by a child that owns the viewport (a map stage is
 * position:fixed and ignores a header in normal flow), so it must match the
 * bar's real height or the child starts under it.
 */
export const MENU_HEIGHT_PX = 67; // 64px bar + the 3px gold rule under it
