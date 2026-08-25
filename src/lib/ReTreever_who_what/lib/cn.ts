/**
 * `cn` — merge Tailwind class strings, last-wins on conflicts.
 *
 * THREE LINES, COPIED ON PURPOSE. This used to live in the harness at
 * `core/utils.ts` alongside currency formatters and price helpers from a
 * long-dead e-commerce template. RAPPER's rule is that a shared file goes
 * DOWN into the children that use it, never up into ReTreever — a child
 * reaching into the parent is exactly what childBoundary.test.ts forbids.
 *
 * ReTreever has its own identical copy at src/lib/core/utils.ts. That is not
 * drift, it is the point: a published child must be self-contained, and a
 * third package for three lines is not worth the release ceremony.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
