/**
 * offlineDownloadGate — a SOFT, user-facing brake on heavy offline downloads.
 *
 * The offline map syncs continuously by default (the reconcile pre-downloads every
 * feature's tiles). That's wanted — EXCEPT when a single catch-up is about to pull a
 * lot of data over CELLULAR (e.g. you just imported a big map). This gate watches the
 * bytes the reconcile downloads and, each time a session crosses another **100 MB on
 * cellular**, pauses and asks the user: keep going, or only download maps as you open
 * them?
 *
 *   • WiFi (or non-native dt-web / mob-web) → NEVER prompts; download freely.
 *   • Cellular, every +100 MB → prompt Continue / "Download per feature only".
 *       - Continue → raise the bar another 100 MB, keep bulk-downloading.
 *       - Per feature only → set the session flag; the reconcile then skips the
 *         all-other-maps backlog and only fetches the map you're actually on.
 *
 * Session-scoped (module state, NOT persisted): "normally sync all the time" is the
 * default every launch — per-feature-only is a "not right now", not a sticky setting.
 *
 * This is the OFFLINE-MAP download surface (which already shows a "Saving offline
 * map…" spinner), NOT the silent cloud-sync — so a prompt here is fine.
 * Distinct from `downloadGuard.ts`, which is the HARD circuit-breaker (throws on a
 * true runaway); this gate is the soft, user-driven choice below that ceiling.
 */
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";

/** Prompt + raise the bar every this-many downloaded bytes (on cellular). */
const THRESHOLD_BYTES = 100 * 1024 * 1024; // 100 MB

let sessionBytes = 0;
let nextThresholdBytes = THRESHOLD_BYTES;
let perFeatureOnly = false;

/** The page registers a fn that shows the Continue / per-feature modal and resolves
 *  with the choice. Null when no UI is mounted → the gate never blocks. */
let promptFn: (() => Promise<"continue" | "per-feature">) | null = null;

export function registerDownloadPrompt(
	fn: (() => Promise<"continue" | "per-feature">) | null,
): void {
	promptFn = fn;
}

/** True once the user chose "per feature only" this session — the reconcile uses
 *  this to skip the all-other-maps backlog. Resets on app restart. */
export function isPerFeatureOnly(): boolean {
	return perFeatureOnly;
}

/** Tally bytes the reconcile actually downloaded (pack tiles + satellite photo). */
export function noteDownloadedBytes(n: number): void {
	if (n > 0) sessionBytes += n;
}

/** For the /blobs debug surface. */
export function offlineDownloadGateStats(): {
	sessionBytes: number;
	nextThresholdBytes: number;
	perFeatureOnly: boolean;
} {
	return { sessionBytes, nextThresholdBytes, perFeatureOnly };
}

/** Cellular = a metered connection we should protect. WiFi / unknown / non-native
 *  (dt-web, mob-web — no Capacitor) are treated as unmetered: never gate. */
async function onCellular(): Promise<boolean> {
	if (!Capacitor.isNativePlatform()) return false;
	try {
		const status = await Network.getStatus();
		return status.connectionType === "cellular";
	} catch {
		// Plugin unavailable / errored → don't gate (fail open; the hard guard still caps runaways).
		return false;
	}
}

/**
 * Call BETWEEN downloaded areas in the reconcile. Returns `true` when the caller
 * should STOP bulk-downloading for this pass (the user chose to pause). Returns
 * `false` to keep going. Only ever prompts when, on cellular, the session's
 * downloaded bytes have crossed the next 100 MB boundary.
 */
export async function checkDownloadGate(): Promise<boolean> {
	if (sessionBytes < nextThresholdBytes) return false;
	// Crossed the bar — but only the user's data plan is worth interrupting for.
	if (!(await onCellular())) {
		nextThresholdBytes = sessionBytes + THRESHOLD_BYTES; // bump so we don't re-check every area
		return false;
	}
	if (!promptFn) {
		nextThresholdBytes = sessionBytes + THRESHOLD_BYTES; // no UI to ask → don't block
		return false;
	}
	const choice = await promptFn();
	if (choice === "per-feature") {
		perFeatureOnly = true;
		return true; // stop the bulk pass
	}
	nextThresholdBytes = sessionBytes + THRESHOLD_BYTES; // Continue → ask again at the next +100 MB
	return false;
}
