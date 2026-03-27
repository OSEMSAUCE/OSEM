// Capacitor has moved to ReTreever/ (the proprietary host app).
// Run all cap commands from ReTreever/:
//   npm run cap:ios
//   npm run cap:android
//   npm run cap:sync
//
// This file is kept here only so the Capacitor CLI doesn't error
// if accidentally run from this directory.

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.retreever.map',
	appName: 'ReTreever Map',
	webDir: '../build-cap',
	server: {
		androidScheme: 'https',
	},
};

export default config;
