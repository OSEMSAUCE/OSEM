import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'ReTreever Map',
				short_name: 'MapView',
				theme_color: '#1a1a1a',
				background_color: '#1a1a1a',
				display: 'standalone',
				scope: '/',
				start_url: '/mobile',
				icons: [
					{
						src: '/mobileAssets/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/mobileAssets/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
			workbox: {
				navigateFallback: '/offline',
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.mapbox\.com\/.*/,
						handler: 'NetworkFirst',
						options: { cacheName: 'mapbox-tiles' },
					},
					{
						urlPattern: ({ request }) => request.destination === 'document',
						handler: 'NetworkFirst',
					},
					{
						urlPattern: ({ request }) =>
							['style', 'script', 'worker', 'font'].includes(request.destination),
						handler: 'CacheFirst',
						options: { cacheName: 'static-assets' },
					},
				],
			},
		}),
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
	},
});
