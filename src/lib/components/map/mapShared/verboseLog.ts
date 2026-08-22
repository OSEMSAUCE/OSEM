/**
 * verboseLog.ts — the ONE switch for chatty diagnostic logging.
 *
 * ── Why this exists ──
 * The dev console had become unreadable: a plot-audit table, four PURGED lines,
 * a storage-boot report and a demo-scheduler line all printed on every mount,
 * every navigation. The cost is not noise for its own sake — it is that a REAL
 * signal cannot be found in it. A wildfire layer failing silently went unnoticed
 * for an entire session because "[v4 fire] …" was indistinguishable from the
 * wall of routine chatter scrolling past it.
 *
 * So: routine per-mount diagnostics are OFF by default and opt-in per topic.
 * Anything that reports a FAILURE stays on unconditionally — this file must
 * never be used to hide an error.
 *
 * ── Turning it on ──
 *   localStorage.rtVerbose = 'plots'          → just that topic
 *   localStorage.rtVerbose = 'plots,storage'  → several
 *   localStorage.rtVerbose = '*'              → everything
 * Then reload. Each call site names its own topic, so you can watch one
 * subsystem without re-enabling the flood.
 */

/** Topics that opt into chatty logging. Keep the names short — they are typed
 *  by hand into localStorage. */
export type VerboseTopic =
	| "plots"
	| "storage"
	| "quality704"
	| "mapDemo"
	| "fire"
	/** Snapshot upload / restore-gate chatter. Routine SUCCESS only — every
	 *  failure path in snapshotUploader stays a bare console.warn/error. */
	| "sync"
	/** Map bring-up: hospital markers, layer wiring. */
	| "map"
	/** Animation placement chatter — the per-hand "🖐 placed at (x,y)" line and
	 *  the off-stage grow report. Routine SUCCESS only: every ❌ in Player.svelte
	 *  (dead target, off-screen aim, frame 404, clamped grow) stays a bare
	 *  console.error/warn, because those say the user saw NOTHING. */
	| "anim"
	/** Import progress: per-chunk KML/KMZ/PDF write timings. */
	| "import"
	/** Offline wall map: per-burst tile-read counts, per-area download lines.
	 *  OFF by default because both are high-frequency and REPEAT the same
	 *  answer — the wall map speaks unprompted only on a change of state (the
	 *  read went blind, a pass finished with new tiles). Turn this on to watch
	 *  every individual read and download. */
	| "wall";

function enabledTopics(): Set<string> {
	try {
		if (typeof localStorage === "undefined") return new Set();
		const raw = localStorage.getItem("rtVerbose");
		if (!raw) return new Set();
		return new Set(
			raw
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean),
		);
	} catch {
		// codestyle-allow-swallow: storage blocked (private mode / iframe) just
		// means "not opted in", which is the default anyway.
		return new Set();
	}
}

/** Is chatty logging on for this topic? */
export function isVerbose(topic: VerboseTopic): boolean {
	const t = enabledTopics();
	return t.has("*") || t.has(topic);
}

/**
 * Log a routine diagnostic — printed only when its topic is opted in.
 *
 * NOT for errors or warnings. A failure must always be visible; use
 * console.warn/console.error directly for those.
 */
export function vlog(topic: VerboseTopic, ...args: unknown[]): void {
	if (isVerbose(topic)) console.log(`[${topic}]`, ...args);
}
