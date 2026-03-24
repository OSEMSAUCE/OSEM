// PWA install prompt store
// TODO: Implement in Step 7

import { writable } from 'svelte/store';

export const installPrompt = writable<BeforeInstallPromptEvent | null>(null);
export const isInstalled = writable<boolean>(false);

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
