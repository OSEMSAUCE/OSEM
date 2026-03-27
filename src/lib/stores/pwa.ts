import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const installPrompt = writable<BeforeInstallPromptEvent | null>(null);
export const isInstalled = writable<boolean>(false);

// Capture the beforeinstallprompt event as early as possible
if (browser) {
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		installPrompt.set(e as BeforeInstallPromptEvent);
	});

	window.addEventListener('appinstalled', () => {
		isInstalled.set(true);
		installPrompt.set(null);
	});
}
