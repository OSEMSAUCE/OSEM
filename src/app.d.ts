import type { AvailableLanguageTag } from '../../lib/paraglide/runtime';
import type { ParaglideLocals } from '@inlang/paraglide-sveltekit';

/// <reference types="@sveltepress/theme-default/types" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// OSEM is a headless frontend - no auth, no direct DB access
declare global {
	namespace App {
		interface Locals {
			paraglide: ParaglideLocals<AvailableLanguageTag>;
		}
	}
}

export {};
