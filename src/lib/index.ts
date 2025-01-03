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
	 * *Note* If you have multiple apps running on the same hostname (this is just the name, i.e. `localhost` or `127.0.0.1`; different schemes and ports do not name a different hostname),
	 *   then you need to separate the session cookies from each other.
	 * The simplest method is to simply set different names per app.
	 */
	name?: string;

	/**
	 * Cookie settings object for the session cookie.
	 *
	 * @see CookieSerializeOptions
	 */
	cookie?: CookieSerializeOptions;

	/**
	 * Force the session identifier cookie to be set on every response. The expiration is reset to the original `maxAge`, resetting the expiration countdown.
	 * The default value is `false`.
	 * If `cookie.maxAge` is not set, this option is ignored.
	 *
	 * With this enabled, the session identifier cookie will expire in `maxAge` *since the last response was sent* instead of in `maxAge` *since the session was last modified by the server*.
	 * This is typically used in conjuction with short, non-session-length `maxAge` values to provide a quick timeout of the session data
	 *   with reduced potential of it occurring during on going server interactions.
	 *
	 * Note that when this option is set to `true` but the `saveUninitialized` option is set to `false`, the cookie will not be set on a response with an uninitialized session.
	 * This option only modifies the behavior when an existing session was loaded for the request.
	 *
	 * @see saveUninitialized
	 */
	rolling?: boolean;

	/**
	 * The session store instance.
	 * The default value is new `MemoryStore` instance.
	 *
	 * @see MemoryStore
	 */
	store?: Store;

	/**
	 * This is the secret for signing session ID cookies.
	 * It can be a string or an array string of secrets.
	 * For signing, only the first secret in the array is used; for verification, all secrets are considered.
	 * The secret should be a complex, random string, not easily guessed.
	 * Best practices include:
	 *
	 *   - Storing the secret in environment variables, not in your repository
	 *   - Regularly updating the secret and keeping old ones in the array
	 *
	 * To change the secret without invalidating existing sessions,
	 *   add the new secret as the first element in the array and include the old ones after it.
	 */
	secret: string | string[];

	/**
	 * Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
	 * The default value is `false`.
	 *
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

/**
 * stringify/parseable cookie data(CookieSerializeOptions without `encode`).
 */
export interface SessionCookieOptions extends Omit<CookieSerializeOptions, 'encode'> {
	// https://github.com/sveltejs/kit/blob/%40sveltejs/kit%402.0.3/packages/kit/src/runtime/server/page/types.d.ts#L35
	path: string;
}

/**
 * Session store data.
 */
export interface SessionStoreData {
	cookie: SessionCookieOptions;
	data: SessionData;
}

/**
 * Session store interface.
 * When implementing a custom store, implement it so that it has the following methods.
 *
 * MemoryStore would be helpful.
 * @see MemoryStore
 */
export interface Store {
	/**
	 * Returns JSON data stored in the store.
	 * @param id The session ID
	 * @returns JSON data stored in the store
	 */
	get(id: string): Promise<SessionStoreData | null>;
	/**
	 * Stores JSON data in the store.
	 * @param id The session ID
	 * @param storeData JSON data to store
	 * @param ttl Time to live in milliseconds. This ttl is calculated with a priority of maxAge > expires,
	 *              which is useful for store implementation. If no maxAge and expires, ttl is *Infinity*.
	 *            But can also be calculated independently in the store by referring to the `storeData.cookie`.
	 *
	 * @returns Promise fulfilled with undefined
	 */
	set(id: string, storeData: SessionStoreData, ttl: number): Promise<void>;
	/**
	 * Deletes a session from the store.
	 * @param id The session ID
	 * @returns Promise fulfilled with undefined
	 */
	destroy(id: string): Promise<void>;
	/**
	 * Update expiration with ttl.
	 * @param id The session ID
	 * @param ttl Time to live in milliseconds.
	 * @returns Promise fulfilled with undefined
	 */
	touch(id: string, ttl: number): Promise<void>;
}

const memoryStore = new MemoryStore();

const sveltekitSessionHandle =
	(options: SveltekitSessionConfig): Handle =>
	// eslint-disable-next-line @typescript-eslint/unbound-method
	async ({ event, resolve }) => {
		const { locals } = event;
		locals.session = await Session.initialize(
			{ cookies: event.cookies },
			{ store: memoryStore, ...options }
		);
		const response = await resolve(event);
		return response;
	};

export { sveltekitSessionHandle, MemoryStore, Session };
