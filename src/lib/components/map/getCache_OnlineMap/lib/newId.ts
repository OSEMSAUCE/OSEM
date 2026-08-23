// newId — UUIDv4 generator built directly on `crypto.getRandomValues`.
//
// OSEM ships UI shells that need stable random keys for feature ids
// without depending on `crypto.randomUUID` — which is only defined in
// SECURE contexts (HTTPS, `http://localhost`, `capacitor://localhost`).
// Insecure contexts (Capacitor live-reload on a LAN IP) leave it
// undefined, and the WKWebView in iOS 26 silently rejects assignment to
// the readonly `Crypto` interface, so a prototype polyfill can't be
// relied on. `crypto.getRandomValues` IS defined in every context, so
// this helper builds the UUID itself.
//
// The proprietary mobile app uses its own copy at
// `src/lib/mobile/utils/newId.ts` — kept in sync conceptually but not
// imported across the open-core split.

const HEX = "0123456789abcdef";

/** Random v4 UUID. Safe in every runtime OSEM ships into. */
export function newId(): string {
	const b = new Uint8Array(16);
	crypto.getRandomValues(b);
	b[6] = (b[6] & 0x0f) | 0x40; // version 4
	b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
	let out = "";
	for (let i = 0; i < 16; i++) {
		if (i === 4 || i === 6 || i === 8 || i === 10) out += "-";
		out += HEX[(b[i] >> 4) & 0x0f] + HEX[b[i] & 0x0f];
	}
	return out;
}
