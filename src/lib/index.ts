import type { Handle } from '@sveltejs/kit';
import type { CookieSerializeOptions } from 'cookie';
import type Cookie from './cookie.js';
import Session from './session.js';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session & Partial<SessionData>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export interface SveltekitSessionConfig {
	/**
	 * The name of the session ID cookie to set in the response (and read from in the request).
	 * The default value is 'connect.sid'.
	 *
	 * Note if you have multiple apps running on the same hostname (this is just the name, i.e. `localhost` or `127.0.0.1`; different schemes and ports do not name a different hostname),
	 *   then you need to separate the session cookies from each other.
	 * The simplest method is to simply set different names per app.
	 */
	name?: string | undefined;

	/**
	 * Settings object for the session ID cookie.
	 */
	cookie?: CookieSerializeOptions;

	/**
	 * The session store instance, defaults to a new `MemoryStore` instance.
	 */
	store?: Store;

	/**
	 * This is the secret used to sign the session cookie. This can be either a string for a single secret.
	 * If an array of secrets is provided, **only the first element will be used to sign** the session ID cookie,
	 *   while **all the elements will be considered when verifying the signature** in requests.
	 * The secret itself should be not easily parsed by a human and would best be a random set of characters
	 *
	 * Best practices may include:
	 * - The use of environment variables to store the secret, ensuring the secret itself does not exist in your repository.
	 * - Periodic updates of the secret, while ensuring the previous secret is in the array.
	 *
	 * Using a secret that cannot be guessed will reduce the ability to hijack a session to only guessing the session ID (as determined by the `genid` option).
	 *
	 * Changing the secret value will invalidate all existing sessions.
	 * In order to rotate the secret without invalidating sessions, provide an array of secrets,
	 *   with the new secret as first element of the array, and including previous secrets as the later elements.
	 */
	secret: string;

	saveUninitialized?: boolean;
}

/**
 * This interface allows you to declare additional properties on your session object using [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
 *
 * @example
 * declare module 'svelte-kit-session' {
 *     interface SessionData {
 *         hoge: string;
 *     }
 * }
 */
export interface SessionData {
	cookie: Cookie;
}

export interface Store {
	get(id: string): Promise<SessionData | null>;
	set(id: string, data: SessionData): Promise<void>;
	destroy(id: string): Promise<void>;
}

const sveltekitSessionHandle =
	(options: SveltekitSessionConfig): Handle =>
	async ({ event, resolve }) => {
		const { locals } = event;
		console.log('sveltekitSession');
		locals.session = await Session.initialize(event, options);
		const response = await resolve(event);
		return response;
	};

export { sveltekitSessionHandle };
