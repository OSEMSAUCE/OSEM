import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({ postcss: true }),
	kit: {
		adapter: adapter(),
		alias: {
			'$lib/components/ui': './src/lib/subwoof/components/ui',
			'$lib/components/ui/*': './src/lib/subwoof/components/ui/*'
		}
	}
};

export default config;
