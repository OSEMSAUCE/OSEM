/**
 * WHICH offline-tiles Worker the app talks to. ONE definition, both routes.
 *
 * ⛔ WHY THIS FILE EXISTS AT ALL
 *
 * There used to be exactly ONE Worker environment. `wrangler deploy` published
 * straight to tiles.retreever.org — the hostname every shipped phone talks to —
 * so a Worker change could not be tested without testing it on every user at
 * once. When a deploy was bad the app could not download roads AT ALL, for
 * everybody, and the only way out was another blind deploy. That happened.
 *
 * `wrangler.toml` now has an [env.staging] pointing tiles-dev.retreever.org at
 * the SAME R2 bucket (read-only, so no second upload and no new credentials).
 * This module is the phone's half of that split.
 *
 * ⛔ WHY import.meta.env.DEV IS THE RIGHT SWITCH, AND WHAT IT IS NOT
 *
 * It is true ONLY for `npm run dev`. A Capacitor / TestFlight / App Store build
 * is a production Vite build, so a real phone ALWAYS gets the production
 * Worker. Staging is for the laptop — which is exactly where Worker changes
 * should be tried. Do not swap this for a hostname check or a runtime flag: a
 * runtime toggle can be left switched on, and then a shipped build quietly
 * depends on a Worker nobody promised to keep alive.
 *
 * ⛔ ONE DEFINITION ON PURPOSE. Both /pack (roads) and /fires import from here.
 * When these were two string literals in two files they were free to drift, and
 * a half-migrated pair would have meant roads from staging and fires from
 * production — the kind of split-brain that reads as "it works sometimes".
 *
 * Deploy staging:     wrangler deploy --env staging
 * Deploy production:  wrangler deploy          ← a release, never a test
 */
export const PRODUCTION_HOST = "https://tiles.retreever.org";
export const REMOTE_DEV_HOST = "https://tiles-dev.retreever.org";
/** `wrangler dev` in workers/offline-tiles. Needs `--remote` to reach the real
 *  R2 bucket — the checked-in planet.pmtiles is a 0-byte placeholder. */
export const LOCAL_DEV_HOST = "http://127.0.0.1:8787";

export type WorkerTarget = "production" | "remoteDev" | "localDev";

const HOSTS: Record<WorkerTarget, string> = {
	production: PRODUCTION_HOST,
	remoteDev: REMOTE_DEV_HOST,
	localDev: LOCAL_DEV_HOST,
};

/** What the phone talks to with no override: staging on the laptop, production
 *  everywhere else. Unchanged behaviour — see the DEV note above. */
export const DEFAULT_TARGET: WorkerTarget = import.meta.env.DEV
	? "remoteDev"
	: "production";

/**
 * ⛔ THE OVERRIDE EXISTS ONLY IN A DEV BUILD.
 *
 * The warning above says a runtime toggle can be left switched on and then a
 * shipped build quietly depends on a Worker nobody promised to keep alive.
 * That risk is real, so the switch is not defended by remembering to turn it
 * off — `import.meta.env.DEV` is a compile-time constant, so in a Capacitor /
 * TestFlight / App Store build this whole branch is DEAD CODE that Vite drops.
 * A production build cannot read the override even if something writes it.
 *
 * Session-scoped (sessionStorage) so it also cannot outlive the tab it was set
 * in — closing the tab is enough to forget it.
 */
const OVERRIDE_KEY = "rt_worker_target";

export function getWorkerTarget(): WorkerTarget {
	if (!import.meta.env.DEV) return "production";
	try {
		const v = sessionStorage.getItem(OVERRIDE_KEY);
		if (v === "production" || v === "remoteDev" || v === "localDev") return v;
	} catch {
		// codestyle-allow-swallow: sessionStorage is unavailable in SSR and in
		// some private modes; the default target is always a correct answer.
	}
	return DEFAULT_TARGET;
}

export function setWorkerTarget(t: WorkerTarget): void {
	if (!import.meta.env.DEV) return;
	try {
		sessionStorage.setItem(OVERRIDE_KEY, t);
	} catch {
		// codestyle-allow-swallow: as above — a failed write just means the
		// default stays in force, which is the safe outcome.
	}
}

/**
 * ⚠️ FUNCTIONS, NOT CONSTANTS — deliberately.
 *
 * These were `export const PACK_URL = ...`, evaluated once at module load. A
 * const cannot see a target chosen later, so a toggle would have appeared to do
 * nothing until a full reload — and "the switch does nothing" is how you end up
 * testing production while believing you are on staging. Call these per
 * request; it is one property read.
 */
export function tilesHost(): string {
	return HOSTS[getWorkerTarget()];
}

/** Roads. One request returns the whole pack of tiles for a pin. */
export function packUrl(): string {
	return `${tilesHost()}/pack`;
}

/** Wildfire hotspots. The Worker proxies NASA FIRMS so the API key stays server-side. */
export function firesUrl(): string {
	return `${tilesHost()}/fires`;
}

/** Back-compat for callers that only report which host is in play (the debug
 *  report). Reads the CURRENT target, unlike the old module-load constant. */
export const TILES_HOST_LABEL = "see tilesHost()";

/**
 * IS THIS WORKER ACTUALLY THERE?
 *
 * A developer who picks "local Dev" without `wrangler dev` running gets no
 * error — just a map that never fills, which reads as "the offline map is
 * broken" rather than "nothing is listening on 8787". So the switch asks first
 * and greys out what cannot answer.
 *
 * Probe is an OPTIONS preflight, not /bench: the CORS handler answers it
 * without a single R2 read, so this costs nothing even against production.
 * (/bench does 500 range reads by default — never use it as a liveness check.)
 */
export async function probeTarget(
	t: WorkerTarget,
	timeoutMs = 1500,
): Promise<boolean> {
	const ctl = new AbortController();
	const timer = setTimeout(() => ctl.abort(), timeoutMs);
	try {
		await fetch(`${HOSTS[t]}/pack`, {
			method: "OPTIONS",
			signal: ctl.signal,
			mode: "cors",
		});
		// ANY answer means something is listening. A 4xx still proves reachable,
		// and treating "wrong status" as "absent" would grey out a Worker that
		// is up but answering differently than expected.
		return true;
	} catch {
		// codestyle-allow-swallow: unreachable IS the answer here, not an error.
		return false;
	} finally {
		clearTimeout(timer);
	}
}
