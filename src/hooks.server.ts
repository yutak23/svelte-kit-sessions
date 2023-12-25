import type { Handle } from '@sveltejs/kit';
import { sveltekitSessionHandle } from '$lib/index.js';

declare module '$lib/index.js' {
	interface SessionData {
		user_id?: string;
		name?: string;
		re_user_id?: string;
		re_name?: string;
	}
}

const di = (): Handle => {
	if (import.meta.configPattern === 'default')
		return sveltekitSessionHandle({ secret: 'my-secret' });

	if (import.meta.configPattern === 'saveUninitialized')
		return sveltekitSessionHandle({
			secret: 'my-secret',
			saveUninitialized: true
		});

	return sveltekitSessionHandle({
		secret: 'my-secret'
	});
};

// eslint-disable-next-line import/prefer-default-export
export const handle: Handle = di();
