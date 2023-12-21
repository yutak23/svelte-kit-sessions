import type { Handle } from '@sveltejs/kit';
import type { CookieSerializeOptions } from 'cookie';
import Session from './session.js';
import MemoryStore from './memory-store.js';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session;
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
	name?: string;

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

	/**
	 * Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
	 * Choosing `false` is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie.
	 * Choosing `false` will also help with race conditions where a client makes multiple parallel requests without a session.
	 */
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
export interface SessionData {}

export interface SessionStoreData {
	// https://github.com/sveltejs/kit/blob/%40sveltejs/kit%402.0.3/packages/kit/src/runtime/server/page/types.d.ts#L35
	cookieOptions: CookieSerializeOptions & { path: string };
	data: SessionData;
}

export interface Store {
	get(id: string): Promise<SessionStoreData | null>;
	set(id: string, data: SessionStoreData): Promise<void>;
	destroy(id: string): Promise<void>;
}

const memoryStore = new MemoryStore();

const sveltekitSessionHandle =
	(options: SveltekitSessionConfig): Handle =>
	async ({ event, resolve }) => {
		const { locals } = event;
		locals.session = await Session.initialize(
			{ url: event.url, cookies: event.cookies },
			{ store: memoryStore, ...options }
		);
		const response = await resolve(event);
		return response;
	};

export { sveltekitSessionHandle, MemoryStore };
