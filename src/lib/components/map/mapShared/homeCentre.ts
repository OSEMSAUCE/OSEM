/**
 * homeCentre.ts — THE map home, and the one place it is defined.
 *
 * Lives in mapShared/ because BOTH sides need it and neither owns it: the
 * offline engine bakes a permanent demo blob here (so a first-time offline user
 * always lands on live data), and the online map cold-opens here when there is
 * no resumable camera and no map to frame.
 *
 * ⚠️ ONE CONSTANT, DELIBERATELY. These were once two independent literals in two
 * files whose comments each begged the other to match — and the online↔offline
 * toggle landed in two different places. `stores/mapViewport` re-exports this;
 * it does not re-declare it. Never copy the numbers to a second file.
 */

/** THE map home (45.06°, -76.17°) — where a fresh mount lands when there's
 *  nowhere else to go: no resumable camera AND no map to frame. */
export const MAP_HOME_CENTER: [number, number] = [
	-76.16797958683314, 45.061348227515055,
];
