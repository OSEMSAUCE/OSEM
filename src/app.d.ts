// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// OSEM is a headless frontend - no auth, no direct DB access
declare global {
	namespace App {
		interface Locals {
			// paraglide: ParaglideLocals<AvailableLanguageTag>;
		}

		// Add missing Superforms namespace to fix library compatibility
		namespace Superforms {
			interface Message {}
		}

		// Add flash property for superforms compatibility
		interface PageData {
			flash?: Record<string, unknown> | string;
		}
	}
}

export {};
