/**
 * instanceWatch — "is more than one copy of this app running RIGHT NOW?"
 *
 * WHY THIS EXISTS: every memory measurement in this app is worthless if a
 * second tab of the same origin is open. Both tabs run their own bake service,
 * both hammer the same IndexedDB, and both push textures into the ONE shared
 * GPU process — so the Task Manager number you read is the sum of two apps
 * while you believe it is one. This cost a full wasted measurement round
 * (a forgotten private-window tab, 327 MB, next to the 1.5 GB one we cared
 * about) and, worse, it is INVISIBLE: nothing on screen tells you.
 *
 * Auditing your own tabs by hand is the wrong layer. The app knows which
 * route it is on; the browser knows which tabs exist. BroadcastChannel joins
 * the two, so the app can simply say so.
 *
 * HOW IT WORKS — a roll call, not a registry:
 *   • every map page joins a channel and announces itself ("HELLO")
 *   • anyone who hears a HELLO answers ("HERE", with their own id + route)
 *   • peers that go quiet for STALE_MS are dropped (a closed tab can't say
 *     goodbye if it was killed, so silence is the only reliable signal)
 * There is no leader, no shared state to corrupt, and nothing persists — a
 * reload starts a clean roll call.
 *
 * SCOPE — deliberately same-origin. BroadcastChannel cannot cross origins, and
 * that is exactly right: `localhost:4173` and `test.localhost:9777` are
 * different origins with their own memory, so they must NOT trip the warning.
 * Only same-origin duplicates — the ones that actually poison a reading — do.
 *
 * KNOWN GAP: a private/incognito window is a separate storage partition in
 * Chromium, so it may not share this channel. If the panel says "1 instance"
 * and the number still looks wrong, the browser Task Manager remains the
 * backstop for that one case. Stated here rather than discovered later.
 *
 * DEV-ONLY BY CONSTRUCTION: `start()` no-ops unless `dev`, so this compiles
 * out of production and can never show a user a debug banner.
 */

import { dev } from "$app/environment";

/** How often each instance re-announces it is alive. */
const PING_MS = 2000;
/** Silence longer than this and a peer is presumed gone (tab closed/crashed). */
const STALE_MS = 5000;
const CHANNEL = "rt-map-instances";

export interface Peer {
	id: string;
	/** Route path, so the panel can say WHICH map the other copy is on. */
	route: string;
	/** Last time we heard from it — used only to expire the row. */
	lastSeen: number;
}

/** Peers OTHER than this tab. Empty = you are alone = safe to measure. */
const peers = $state(new Map<string, Peer>());

/**
 * Random per-tab id. Not `crypto.randomUUID()` only because this needs to work
 * on any dev surface without feature-checking; collision risk across ~3 tabs
 * is irrelevant for a debug counter.
 */
const myId = Math.random().toString(36).slice(2, 9);

let channel: BroadcastChannel | null = null;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let myRoute = "";

type Msg =
	| { kind: "hello"; id: string; route: string }
	| { kind: "here"; id: string; route: string }
	| { kind: "bye"; id: string };

function post(msg: Msg): void {
	try {
		channel?.postMessage(msg);
	} catch {
		// A closing channel throws on post. Nothing to do and nothing to log —
		// this is a debug aid; it must never become a source of console noise.
	}
}

function remember(id: string, route: string): void {
	if (id === myId) return;
	const existing = peers.get(id);
	if (existing) {
		existing.lastSeen = Date.now();
		existing.route = route;
	} else {
		peers.set(id, { id, route, lastSeen: Date.now() });
	}
}

function dropStale(): void {
	const cutoff = Date.now() - STALE_MS;
	for (const [id, p] of peers) if (p.lastSeen < cutoff) peers.delete(id);
}

/**
 * Join the roll call. Returns a teardown for the caller's `onMount`.
 * Safe to call on any map route; `route` is what the panel displays for peers.
 */
export function startInstanceWatch(route: string): () => void {
	if (!dev || typeof BroadcastChannel === "undefined") return () => {};
	myRoute = route;
	channel = new BroadcastChannel(CHANNEL);

	channel.onmessage = (e: MessageEvent<Msg>) => {
		const msg = e.data;
		if (!msg || msg.id === myId) return;
		if (msg.kind === "bye") {
			peers.delete(msg.id);
			return;
		}
		remember(msg.id, msg.route);
		// Answer a newcomer's HELLO so it learns about us immediately rather
		// than waiting a full ping cycle to discover it is not alone.
		if (msg.kind === "hello") post({ kind: "here", id: myId, route: myRoute });
	};

	post({ kind: "hello", id: myId, route: myRoute });
	pingTimer = setInterval(() => {
		post({ kind: "here", id: myId, route: myRoute });
		dropStale();
	}, PING_MS);

	// A clean close lets the other tab clear its warning instantly instead of
	// waiting out STALE_MS — the difference between the panel feeling live and
	// feeling broken when you close a duplicate.
	const onUnload = () => post({ kind: "bye", id: myId });
	window.addEventListener("pagehide", onUnload);

	return () => {
		post({ kind: "bye", id: myId });
		window.removeEventListener("pagehide", onUnload);
		if (pingTimer) clearInterval(pingTimer);
		pingTimer = null;
		channel?.close();
		channel = null;
		peers.clear();
	};
}

/** Other live instances. Non-empty ⇒ any memory reading is contaminated. */
export function otherInstances(): Peer[] {
	return [...peers.values()];
}

/* ────────────────────────────────────────────────────────────────────────
   THE CROSS-PORT CHECK — what BroadcastChannel cannot see.

   BroadcastChannel is same-origin by hard browser rule, so a tab on :4173
   (a leftover `vite preview`) or a private window is INVISIBLE to the roll
   call above — yet both still cost GPU memory and both have already spoiled
   a reading in this project. Each dev server, though, knows exactly how many
   tabs hold an HMR socket to it. Ask the servers.

   Reported as tabs-per-port so the panel can name the offender rather than
   just claiming something is wrong.
   ──────────────────────────────────────────────────────────────────────── */

/** Ports worth checking: OUR OWN ORIGIN ONLY.
 *
 * This was `[5173, 4173]` — probe the dev server AND the preview server, to
 * catch a leftover `vite preview` tab BroadcastChannel can't see. Two reasons
 * that never worked and had to go:
 *
 * 1. `/__rt_clients` is registered by the `rt-dev-client-count` plugin with
 *    `apply: "serve"` (vite.config.ts:119) — it exists ONLY on the dev server.
 *    `vite preview` does not serve it, so probing 4173 could never return a
 *    count even with preview running. The cross-port probe was already dead.
 *
 * 2. Probing an absent port is not free. A refused connection is logged by the
 *    BROWSER's network stack, not thrown into JS, so the `catch` below cannot
 *    suppress it — the comment there promising it "must never surface as an
 *    error" was undeliverable at that layer. Every 4s poll printed
 *    "Failed to load resource: net::ERR_CONNECTION_REFUSED" to the console,
 *    which red-walled four torture specs (2026-08-11): tests/smoke/torture.spec.ts
 *    asserts a route can be mounted and torn down with an EMPTY console.
 *
 * Do NOT "fix" a recurrence by adding ERR_CONNECTION_REFUSED to the smoke
 * suite's IGNORE list. console-errors.spec.ts:37 keeps localhost off the
 * third-party allowlist on purpose — a refused connection to our own server is
 * exactly the class of failure these tests exist to catch. Don't make the
 * doomed request.
 *
 * Same-origin only means the poll now always hits a server that is actually
 * there, in every context this runs in (dev :5173, or whatever port Vite
 * picked if 5173 was taken — which the old hardcoded list got wrong too). */
const PORT_POLL_MS = 4000;

export interface PortCount {
	port: number;
	/** Browser tabs connected to that dev server. 0 = server up, no tabs. */
	clients: number;
}

const portCounts = $state<PortCount[]>([]);
let portTimer: ReturnType<typeof setInterval> | null = null;

async function pollPorts(): Promise<void> {
	const results: PortCount[] = [];
	// RELATIVE URL — same origin by construction, so this can only ever hit
	// the server that served this page. Never a hardcoded port: the old
	// `http://localhost:5173` also missed the real server whenever Vite fell
	// back to another port because 5173 was taken.
	try {
		const r = await fetch(`/__rt_clients`, {
			cache: "no-store",
			signal: AbortSignal.timeout(1200),
		});
		if (r.ok) {
			const j = (await r.json()) as { port: number; clients: number };
			if (typeof j?.clients === "number") {
				results.push({ port: j.port || 0, clients: j.clients });
			}
		}
	} catch {
		// codestyle-allow-swallow: a missing endpoint means we're not on a dev
		// server (preview/native build) — there is simply nothing to report,
		// which is a normal state, not an error.
	}
	portCounts.length = 0;
	portCounts.push(...results);
}

/** Begin polling the dev servers. Returns teardown. Dev-only. */
export function startPortWatch(): () => void {
	if (!dev) return () => {};
	void pollPorts();
	portTimer = setInterval(() => void pollPorts(), PORT_POLL_MS);
	return () => {
		if (portTimer) clearInterval(portTimer);
		portTimer = null;
		portCounts.length = 0;
	};
}

/** Tabs per dev-server port, including ports the roll call cannot see. */
export function devPortCounts(): PortCount[] {
	return portCounts;
}

/** Total tabs across every reachable dev server. >1 ⇒ contaminated. */
export function totalDevTabs(): number {
	return portCounts.reduce((n, p) => n + p.clients, 0);
}
