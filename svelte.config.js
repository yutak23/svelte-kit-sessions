import adapter from '@sveltejs/adapter-auto';
import nodeAdapter from '@sveltejs/adapter-node';
import cloudflareAdapter from '@sveltejs/adapter-cloudflare';
import netlifyAdapter from '@sveltejs/adapter-netlify';
import vercelAdapter from '@sveltejs/adapter-vercel';
// eslint-disable-next-line import/no-unresolved
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter()
	}
};

console.log('process.env.ADAPTER', process.env.ADAPTER);
if (process.env.ADAPTER === 'node') config.kit.adapter = nodeAdapter();
if (process.env.ADAPTER === 'cloudflare')
	config.kit.adapter = cloudflareAdapter({
		routes: {
			include: ['/*'],
			exclude: ['<all>']
		}
	});
if (process.env.ADAPTER === 'netlify_edge') config.kit.adapter = netlifyAdapter({ edge: true });
if (process.env.ADAPTER === 'netlify_node') config.kit.adapter = netlifyAdapter({ edge: false });
if (process.env.ADAPTER === 'vercel_edge') config.kit.adapter = vercelAdapter({ runtime: 'edge' });
if (process.env.ADAPTER === 'vercel_severless')
	config.kit.adapter = vercelAdapter({ runtime: 'nodejs18.x' });

export default config;
