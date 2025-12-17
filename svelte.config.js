import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({ postcss: true }),
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x'
		}),
		alias: {
			'$lib/components/ui': './src/lib/subwoof/components/ui',
			'$lib/components/ui/*': './src/lib/subwoof/components/ui/*'
		}
	}
};

export default config;
