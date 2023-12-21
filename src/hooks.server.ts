import type { Handle } from '@sveltejs/kit';
import { sveltekitSessionHandle } from '$lib/index.js';

const di = (): Handle => {
	console.log('import.meta.configPattern', import.meta.configPattern);
	if (import.meta.configPattern === 'default')
		return sveltekitSessionHandle({
			secret: 'my-secret'
		});
	return sveltekitSessionHandle({
		secret: 'my-secret',
		saveUninitialized: false
	});
};

// eslint-disable-next-line import/prefer-default-export
export const handle: Handle = di();
