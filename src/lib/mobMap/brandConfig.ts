// Branding configuration for the mobile map PWA
// When deployed as part of ReTreever, these values come from env vars
// When deployed standalone (OSEM), uses defaults

export interface BrandConfig {
	appName: string;
	shortName: string;
	themeColor: string;
	backgroundColor: string;
	logo192: string;
	logo512: string;
}

// Default to ReTreever branding, can be overridden via env vars
export const brandConfig: BrandConfig = {
	appName: import.meta.env.VITE_APP_NAME ?? 'ReTreever Map',
	shortName: import.meta.env.VITE_APP_SHORT_NAME ?? 'MapView',
	themeColor: import.meta.env.VITE_THEME_COLOR ?? '#1a1a1a',
	backgroundColor: import.meta.env.VITE_BG_COLOR ?? '#1a1a1a',
	logo192: import.meta.env.VITE_LOGO_192 ?? '/mobileAssets/icon-192.png',
	logo512: import.meta.env.VITE_LOGO_512 ?? '/mobileAssets/icon-512.png',
};
