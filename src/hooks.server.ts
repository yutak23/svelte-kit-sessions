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
	return sveltekitSessionHandle({
		secret: 'my-secret',
		saveUninitialized: true
	});
};

// eslint-disable-next-line import/prefer-default-export
export const handle: Handle = di();
