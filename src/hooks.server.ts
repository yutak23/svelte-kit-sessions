import type { Handle } from '@sveltejs/kit';
import { sveltekitSessionHandle } from '$lib/index.js';

declare module '$lib/index.js' {
	interface SessionData {
		user_id?: string;
		name?: string;
	}
}

const di = (): Handle => {
	if (import.meta.configPattern === 'default')
		return sveltekitSessionHandle({ secret: 'my-secret' });

	if (import.meta.configPattern === 'saveUninitialized')
		return sveltekitSessionHandle({
			secret: 'my-secret',
			name: 'my-session',
			saveUninitialized: true,
			cookie: { maxAge: 60 * 60 * 24 * 7 } // 1 week
		});

	if (import.meta.configPattern === 'rolling')
		return sveltekitSessionHandle({
			secret: 'my-secret',
			rolling: true,
			cookie: { maxAge: 60 * 60 * 24 * 7 } // 1 week
		});

	if (import.meta.configPattern === 'saveUninitialized_and_rolling')
		return sveltekitSessionHandle({
			secret: 'my-secret',
			saveUninitialized: true,
			rolling: true,
			cookie: { maxAge: 60 * 60 * 24 * 7 } // 1 week
		});

	if (import.meta.configPattern === 'both_maxAge_and_expires') {
		const date = new Date();
		date.setDate(date.getDate() + 14);
		return sveltekitSessionHandle({
			secret: 'my-secret',
			rolling: true,
			cookie: {
				maxAge: 60 * 60 * 24 * 7, // 1 week
				expires: date, // 2 weeks
				sameSite: 'none',
				secure: false,
				priority: 'high'
			}
		});
	}

	if(import.meta.configPattern === 'expires') {
		const date = new Date();
		date.setDate(date.getDate() + 7);
		return sveltekitSessionHandle({
			secret: 'my-secret',
			cookie: {
				expires: date, // 1 week
			}
		})
	}

	return sveltekitSessionHandle({
		secret: 'my-secret'
	});
};

// eslint-disable-next-line import/prefer-default-export
export const handle: Handle = di();
