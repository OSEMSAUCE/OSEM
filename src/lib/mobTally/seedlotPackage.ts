// .retreever file format — seedlot package for sharing between planters.
// A package contains the seelot specs (species, seedlot code, container size, price).
// Recipients import it to pre-fill their cache; they only need to enter counts.

import type { SeedlotSpec } from "./types.js";

export interface RetreeverPackage {
    v: 1;
    seedlots: SeedlotSpec[];
    blockNumber?: string | null; // optional cache metadata
}

export function parseRetreeverFile(json: string): RetreeverPackage {
    let pkg: unknown;
    try {
        pkg = JSON.parse(json);
    } catch {
        throw new Error("Not valid JSON");
    }
    if (
        !pkg ||
        typeof pkg !== "object" ||
        (pkg as RetreeverPackage).v !== 1 ||
        !Array.isArray((pkg as RetreeverPackage).seedlots)
    ) {
        throw new Error("Not a valid .retreever package");
    }
    return pkg as RetreeverPackage;
}

export function buildRetreeverFile(
    seedlots: SeedlotSpec[],
    blockNumber?: string | null,
): string {
    const pkg: RetreeverPackage = { v: 1, seedlots };
    if (blockNumber) {
        pkg.blockNumber = blockNumber;
    }
    return JSON.stringify(pkg, null, 2);
}
