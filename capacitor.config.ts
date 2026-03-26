import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.retreever.map',
	appName: 'ReTreever Map',
	webDir: 'build-cap',
	server: {
		androidScheme: 'https',
	},
};

export default config;
