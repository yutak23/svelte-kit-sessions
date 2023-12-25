import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: { host: '0.0.0.0' },
	test: {
		reporters: ['verbose'],
		include: ['tests/unit/**/*.{test,spec}.{js,ts}']
	},
	define: {
		'import.meta.configPattern': `'${process.env.CONFIG_PATTERN}'`
	}
});
