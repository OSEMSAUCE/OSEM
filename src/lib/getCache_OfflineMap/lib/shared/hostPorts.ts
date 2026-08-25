/**
 * HOST PORTS — the one narrow door between the offline map engine and whatever
 * app is hosting it.
 *
 * WHY THIS EXISTS. The engine (bake, store, render, roads, satellite) is meant
 * to be liftable into the harness and run on a page that has no database, no auth and
 * no TinyBase — a contractor opens it, breaks something, and exports a report.
 * Everything it needs from the host is exactly this: a list of places, a nudge
 * when that list changes, and two optional extras. It does NOT need to know what
 * a map, a plot, a user or a session is.
 *
 * This is OFFLINE_MAP_SPEC.md rule 5 made literal — "a narrow, explicit
 * interface; it needs a list of {lng, lat} and nothing else".
 *
 * WHY FEATURES AND NOT PRE-FLATTENED PINS. The bake service does not want a bag
 * of coordinates — it wants to know, per place, WHEN it was last touched (newest
 * bakes first, oldest evicts first) and whether it is a CORRIDOR (a line gets
 * baked along its length, a point gets a disc). Flattening to {lng,lat} in the
 * host would throw both away and every host would have to re-invent the same
 * two rules. So the port hands over anchored places, and `anchorsOf` /
 * `isBlobAnchor` — which travel WITH the engine — do the flattening.
 *
 * ReTreever passes its real mapStore through `mapStorePorts()`. The harness demo
 * passes a literal array. Neither knows about the other.
 */

/** A place the map should keep offline: its anchor points plus the two facts the bake order depends on. */
export interface HostPlace {
	/** Anchor coordinates, [lng, lat]. A point has one; a line has many. */
	anchors: [number, number][];
	/** ISO timestamp of the last edit. Newest bakes first and is evicted last. */
	lastTouched: string;
	/** True for lines/corridors — baked along their length rather than as a single disc. */
	corridor: boolean;

	// ── OPTIONAL DISPLAY METADATA ───────────────────────────────────────────
	// The bake service ignores every field below; they exist for the INSPECTOR,
	// which shows a human which pin an area belongs to. A host that only wants
	// baking can omit them all and nothing changes — a blob is still identified
	// by its areaKey, never by a name.

	/** Stable id of the feature this place came from. */
	featureKey?: string;
	/** Human name, for the inspector's cards. */
	featureName?: string;
	/** Feature type ("Point", "LineString", a PDF overlay…). */
	featureType?: string;
	/** Id of the map/collection that owns it. */
	groupKey?: string;
	/** Human name of that map — the inspector nests cards under it. */
	groupName?: string;
}

/**
 * One hotspot, trimmed to what the map renders.
 *
 * STRUCTURAL ON PURPOSE — declared here rather than imported from the host, so
 * neither side depends on the other's module. It must stay assignable to the
 * host's own hotspot type in BOTH directions, which is why every field the host
 * requires appears here too; a field the host makes optional stays optional.
 */
export interface PortHotspot {
	/** [lng, lat] — GeoJSON order. */
	readonly coordinates: [number, number];
	/** Acquisition time, UTC epoch ms. Drives the age-colour ramp. */
	readonly t: number;
	/** Detection confidence. */
	readonly c: "low" | "nominal" | "high";
	/** Fire radiative power, MW. */
	readonly frp: number;
	/** Pixel footprint in km. Optional — an older cached record predates it. */
	readonly px?: number;
	/** Day / Night overpass. */
	readonly dn?: "D" | "N";
}

/** What one area's fire fetch returns. */
export interface PortFireResult {
	hotspots: readonly PortHotspot[];
	/** The SERVER's fetch time — the edge may serve a cached slice, so our own
	 *  clock would overstate freshness by up to the cache TTL. */
	fetchedAt: number;
	/** How many upstream satellites reported. */
	sourcesOk: number;
	/** Response size, for the cellular-gate tally. */
	bytes: number;
}

/**
 * The fire layer, as the bake service consumes it.
 *
 * The arrival pair is a CONSUME-ONCE DEBT, not a boolean: "a person just turned
 * up" arms every reader, and each reader clears only its own debt. The bake
 * service is one reader; the map layer is the other. Keep them separate — when
 * this was a single shared flag the bake tick reliably won the race and ate it
 * before the map ever ran, so the disc under the user's eyes never refreshed.
 */
export interface FirePort {
	/** Fetch hotspots for one area. Omit the whole `fires` port to disable fire baking. */
	fetchArea(lng: number, lat: number): Promise<PortFireResult>;
	/** ARM every reader — call on app open, visibility-return and `online`. */
	arrival(): void;
	/** Clear THIS reader's debt and report whether it was owed. */
	takeArrival(): boolean;

	// ── the fire STORE ──────────────────────────────────────────────────────
	// Reading and writing hotspot records is IndexedDB work, and where a host
	// keeps its data is the host's business. The engine only ever asks "what do
	// we have for this area, is it still good, and here is a newer one".

	/** This area's cached record, or null if absent / written by an older format. */
	read(areaKey: string): Promise<FireRecord | null>;
	/** Store a freshly fetched record for this area. */
	write(areaKey: string, rec: FireRecord): Promise<void>;
	/** Drop this area's hotspots — an evicted area sheds ALL its data together. */
	delete(areaKey: string): Promise<void>;
	/** Is this record still within its freshness TTL? */
	isFresh(rec: FireRecord): boolean;
	/**
	 * Centres + times of every cached disc — NO hotspots.
	 *
	 * Deliberately coverage-only: the containment gate compares circle CENTRES,
	 * and pulling full records here held tens of thousands of detections live in
	 * the bake service's heap just to do that. ([[offlinev4-mount-memory-measured]])
	 */
	coverage(): Promise<FireCoverage[]>;
	/** Is this coverage entry fresh enough to count as covering an area? */
	isCoverageFresh(c: FireCoverage): boolean;
}

/** One cached fire record, as the engine reads and writes it. */
export interface FireRecord {
	fetchedAt: number;
	center: [number, number];
	radiusKm: number;
	sourcesOk: number;
	hotspots: readonly PortHotspot[];
}

/** A cached disc's centre, size and age — no hotspots. */
export interface FireCoverage {
	readonly center: [number, number];
	readonly radiusKm: number;
	readonly fetchedAt: number;
}

export interface HostPorts {
	/** Every place to keep offline, right now. Called on each reconcile pass. */
	places(): HostPlace[];
	/**
	 * Has the host finished loading? EVICTION DEPENDS ON THIS, and it is NOT the
	 * same question as "are there any places".
	 *
	 * On a cold reload the host is briefly empty because it is still hydrating.
	 * Evicting then would see every stored blob as unreferenced and the conveyor
	 * would nuke nearly everything — the "1 GB → 70 MB" collapse. But a host that
	 * has finished loading and legitimately has NO places (every pin deleted) is a
	 * different state, and eviction must still run there.
	 *
	 * A host with nothing to hydrate should return true.
	 */
	ready(): boolean;
	/**
	 * Register for "the list changed" — a PUSH, not a reactive read. Must fire on
	 * every add/move/delete/import/restore, and once on register. Returns an
	 * unsubscribe fn.
	 *
	 * A push is required, not a preference: an $effect reading the host's state
	 * across a module boundary silently failed to fire on a fresh pin drop —
	 * exactly the bug this shape prevents. ([[cross-module-state-use-applier-pattern]])
	 */
	onPlacesChanged(fn: () => void): () => void;
	/** Optional fire layer. Omit → the engine bakes no fires and never calls out for them. */
	fires?: FirePort;
	/** Optional live position, [lng, lat]. Omit → no live anchor; features only. */
	gps?: () => Promise<[number, number] | null>;
}
