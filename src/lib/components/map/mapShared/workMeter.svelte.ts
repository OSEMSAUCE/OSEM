/**
 * workMeter — THE PANEL.
 *
 * A building has a breaker panel: one place where you see which circuit is
 * live and how hard it is pulling. This app had no such thing, so every
 * "why is it slow?" turned into a DevTools archaeology session that measured
 * the water on the floor (heap size) instead of the running tap (which
 * function, how often, how long).
 *
 * This is the panel. Wrap any repeating or expensive operation in `track()`
 * and the meter answers, at a glance:
 *   • how many times it has run
 *   • how long the last one took, and the worst one
 *   • whether one is running RIGHT NOW, and for how long
 *   • whether another is already queued behind it   ← the runaway tell
 *
 * THE READING THAT MATTERS: sit still, touch nothing. If `runs` keeps
 * climbing, something is working while the app is idle. If `running` is
 * ~always true and `queued` is set, passes are chaining back-to-back and
 * never getting a breath — that is a runaway, and it will eat memory for as
 * long as the tab is open.
 *
 * DEV-ONLY by construction: `<OfflineWorkMeter>` renders nothing outside dev,
 * and tracking is a couple of Date.now() calls, so leaving `track()` wrappers
 * in shipped code costs nothing measurable.
 */

export interface WorkStat {
	/** Label shown in the panel. */
	name: string;
	/** Completed runs since page load. */
	runs: number;
	/** ms of the most recent completed run. */
	lastMs: number;
	/** ms of the slowest run seen. */
	maxMs: number;
	/** Total ms spent in this operation since load — the "power bill". */
	totalMs: number;
	/** Wall-clock start of the in-flight run, or null when idle. */
	startedAt: number | null;
	/** Set by the caller when a fresh run was requested mid-flight. */
	queued: boolean;
	/** Runs that ended by throwing. */
	errors: number;
	/**
	 * Times the operation was TRIGGERED but returned at the door without
	 * doing anything — breaker latched, already running, nothing to do.
	 *
	 * This is the counter whose absence made the panel unreadable: a pass
	 * that bails leaves no trace in `runs`, so "nothing tracked yet" meant
	 * BOTH "hasn't started" and "woke up 15 times and refused every time",
	 * with no way to tell them apart. A skip is not nothing — it is the
	 * timer firing, which is the thing we are trying to observe.
	 */
	skips: number;
	/** Why the last skip happened, for the panel to show verbatim. */
	lastSkip: string;
}

/**
 * A PAYLOAD handed across a boundary — `setData` into the Mapbox worker, a
 * postMessage, a cache write.
 *
 * Separate from WorkStat because the question is different. WorkStat asks "is
 * this operation keeping up?" (time). This asks "how much data are we making
 * something else re-parse, and how often?" (bytes × frequency).
 *
 * That product is the one number that matters for the memory work: a Mapbox
 * `geojson` source re-parses and re-indexes the WHOLE payload on every
 * `setData`, inside its own worker, where `performance.memory` cannot see it.
 * A small payload sent constantly and a huge payload sent once look identical
 * in a heap snapshot and need opposite fixes.
 */
export interface PayloadStat {
	/** Label shown in the panel — the source id. */
	name: string;
	/** Times a payload was handed over since page load. */
	sends: number;
	/** KB of the most recent payload. */
	lastKb: number;
	/** KB of the largest payload seen. */
	maxKb: number;
	/** Total KB pushed across the boundary since load — the re-parse bill. */
	totalKb: number;
	/** Features in the most recent payload, or -1 when not a FeatureCollection. */
	lastFeatures: number;
}

const stats = $state(new Map<string, WorkStat>());
const payloads = $state(new Map<string, PayloadStat>());

/** Every tracked payload, stable order (insertion). Read in the panel. */
export function payloadStats(): PayloadStat[] {
	return [...payloads.values()];
}

/**
 * Record a payload handed across a boundary.
 *
 * Takes the ALREADY-SERIALISED string when there is one — that is the whole
 * point of the strings-not-object-graphs rewrite, and re-stringifying an
 * object here purely to measure it would reintroduce the exact allocation the
 * rewrite deleted. When handed an object we measure features only and report
 * 0 KB rather than paying for a JSON.stringify to satisfy the panel.
 */
export function notePayload(name: string, data: unknown): void {
	let s = payloads.get(name);
	if (!s) {
		s = { name, sends: 0, lastKb: 0, maxKb: 0, totalKb: 0, lastFeatures: -1 };
		payloads.set(name, s);
	}
	const kb =
		typeof data === "string" ? Math.round(data.length / 1024) : 0;
	const feats =
		data && typeof data === "object" && Array.isArray((data as { features?: unknown[] }).features)
			? ((data as { features: unknown[] }).features.length)
			: -1;
	s.sends++;
	s.lastKb = kb;
	s.totalKb += kb;
	if (kb > s.maxKb) s.maxKb = kb;
	s.lastFeatures = feats;
}

function slot(name: string): WorkStat {
	let s = stats.get(name);
	if (!s) {
		s = {
			name,
			runs: 0,
			lastMs: 0,
			maxMs: 0,
			totalMs: 0,
			startedAt: null,
			queued: false,
			errors: 0,
			skips: 0,
			lastSkip: "",
		};
		stats.set(name, s);
	}
	return s;
}

/** Every tracked operation, stable order (insertion). Read in the panel. */
export function workStats(): WorkStat[] {
	return [...stats.values()];
}

/**
 * Mark that a run was ASKED FOR while one was already in flight. This is the
 * single most diagnostic bit in the panel: a `queued` that is permanently
 * true means the operation can never keep up with the rate it is triggered.
 */
export function noteQueued(name: string, queued = true): void {
	slot(name).queued = queued;
}

/**
 * Record that a trigger fired but the operation declined to run, and why.
 * Call this at EVERY early return, otherwise the panel cannot distinguish
 * "idle" from "refusing".
 */
export function noteSkip(name: string, why: string): void {
	const s = slot(name);
	s.skips++;
	s.lastSkip = why;
}

/**
 * Time one run of `fn`. Returns whatever `fn` returns; a throw is recorded
 * and re-thrown, so wrapping NEVER changes behaviour.
 */
export async function track<T>(name: string, fn: () => Promise<T>): Promise<T> {
	const s = slot(name);
	// Nested/overlapping runs share the slot; the LAST start wins for the
	// "running for Ns" read-out, which is the one the user is watching.
	s.startedAt = Date.now();
	const t0 = performance.now();
	try {
		return await fn();
	} catch (err) {
		s.errors++;
		throw err;
	} finally {
		const ms = performance.now() - t0;
		s.runs++;
		s.lastMs = ms;
		if (ms > s.maxMs) s.maxMs = ms;
		s.totalMs += ms;
		s.startedAt = null;
	}
}

/**
 * Manual bracket for code whose control flow can't be wrapped in a callback
 * (a long function with its own try/finally). Call at the start, call the
 * returned function in the `finally`. Same accounting as `track`.
 *
 *   const done = beginWork("reconcile");
 *   try { ... } finally { done(); }
 */
export function beginWork(name: string): (failed?: boolean) => void {
	const s = slot(name);
	s.startedAt = Date.now();
	const t0 = performance.now();
	let closed = false;
	return (failed = false) => {
		if (closed) return; // double-call must not double-count
		closed = true;
		const ms = performance.now() - t0;
		s.runs++;
		s.lastMs = ms;
		if (ms > s.maxMs) s.maxMs = ms;
		s.totalMs += ms;
		if (failed) s.errors++;
		s.startedAt = null;
	};
}

/** Zero the counters (the panel's Reset) — the in-flight run is untouched. */
export function resetWorkStats(): void {
	for (const s of stats.values()) {
		s.runs = 0;
		s.lastMs = 0;
		s.maxMs = 0;
		s.totalMs = 0;
		s.errors = 0;
		s.skips = 0;
		s.lastSkip = "";
	}
	// Payloads reset too: a Reset that zeroed only half the panel would make
	// the two halves describe different time windows.
	for (const p of payloads.values()) {
		p.sends = 0;
		p.lastKb = 0;
		p.maxKb = 0;
		p.totalKb = 0;
		p.lastFeatures = -1;
	}
}
