import type { RequestEvent } from '@sveltejs/kit';
import type { CookieSerializeOptions } from 'cookie';
import type { SessionCookieOptions, SessionData, Store, SveltekitSessionConfig } from './index.js';
import { sign, unsign } from './cookie-signature.js';
import { uidSync } from './uid-safe.js';

interface SimpleRequestEvent extends Pick<RequestEvent, 'cookies'> {}

/**
 * Generate a session ID.
 * @returns {string} session ID(base64 string)
 */
const generateSessionId = (): string => uidSync(24);

/**
 * Get default cookie options.
 * @returns {CookieSerializeOptions & { path: string }} default cookie options
 */
const defaultCookieOptions = (): CookieSerializeOptions & { path: string } => ({
	// https://github.com/expressjs/session/blob/v1.17.3/session/cookie.js#L26
	path: '/'
});

/**
 * Get the TTL in milliseconds for the given cookie options.
 * If `expires` and `maxAge` are set, then `maxAge` takes precedence.
 * See *Note* below for details.
 *
 * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
 * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
 * possible not all clients by obey this, so if both are set, they should
 * point to the same date and time.
 */
const getTtlMs = (cookie: CookieSerializeOptions): number => {
	const { expires, maxAge } = cookie;

	if (maxAge) return maxAge * 1000;
	if (expires) {
		const ms = Number(expires) - Date.now();
		return Math.ceil(ms / 1000) * 1000;
	}
	return Infinity;
};

/**
 * Parse session cookie options.
 * @param {SveltekitSessionConfig} options session options
 * @param {SessionCookieOptions} cookieOptions session cookie options
 * @returns {CookieSerializeOptions & { path: string }} cookie options
 */
const parseSessionCookieOptions = (
	options: SveltekitSessionConfig,
	cookieOptions: SessionCookieOptions
): CookieSerializeOptions & { path: string } => {
	const cookie = { ...cookieOptions } as CookieSerializeOptions & { path: string };

	// Set encode in SveltekitSessionConfig.cookie(CookieSerializeOptions) because encode function cannot parse to JSON
	if (options.cookie && options.cookie.encode)
		cookie.encode = (value: string) => options.cookie!.encode!(value);
	if (cookie.expires) cookie.expires = new Date(cookie.expires);
	return cookie;
};

export default class Session {
	constructor(event: SimpleRequestEvent, options: SveltekitSessionConfig & { store: Store }) {
		this.#id = generateSessionId();
		this.#cookieName = options.name || 'connect.sid';
		this.#cookie = { ...defaultCookieOptions(), ...options.cookie };
		this.#sessionOptions = options;
		this.#event = event;
		this.#storeTtlMs = getTtlMs(options.cookie || {});
	}

	static async initialize(
		event: SimpleRequestEvent,
		options: SveltekitSessionConfig & { store: Store }
	): Promise<Session> {
		const session = new Session(event, options);

		const { cookies } = session.#event;
		const { secret, store, rolling, saveUninitialized } = session.#sessionOptions;

		const sid = cookies.get(session.#cookieName);
		const unsignedSid = await unsign(sid || '', secret);

		if (unsignedSid) {
			const sessionData = await store.get(unsignedSid);
			if (sessionData) {
				session.#id = unsignedSid;
				session.#cookie = parseSessionCookieOptions(options, sessionData.cookie);
				session.#data = sessionData.data;
				session.#storeTtlMs = getTtlMs(sessionData.cookie);

				// update cookie maxAge and touch store ttl
				if (session.#cookie.maxAge && rolling) {
					await store.touch(session.#id, session.#cookie.maxAge * 1000);
					cookies.set(session.#cookieName, await sign(session.#id, secret), session.#cookie);
				}

				return session;
			}
		}

		if (saveUninitialized) {
			await store.set(
				session.#id,
				{ cookie: session.#getParsableCookieOptions(), data: session.#data },
				session.#storeTtlMs
			);
			cookies.set(session.#cookieName, await sign(session.#id, secret), session.#cookie);
		}
		return session;
	}

	#id: string;

	#cookieName: string;

	#cookie: CookieSerializeOptions & { path: string };

	#data: SessionData = {} as SessionData;

	#sessionOptions: SveltekitSessionConfig & { store: Store };

	#event: SimpleRequestEvent;

	/**
	 * ttl time(milliseconds) for session store.
	 */
	#storeTtlMs: number;

	/**
	 * Session ID.
	 */
	get id(): string {
		return this.#id;
	}

	/**
	 * Session cookie name.
	 */
	get cookieName(): string {
		return this.#cookieName;
	}

	/**
	 * Session cookie options.
	 */
	get cookie(): CookieSerializeOptions & { path: string } {
		return this.#cookie;
	}

	/**
	 * Session data.
	 */
	get data(): SessionData {
		return this.#data;
	}

	/**
	 * Session store instance.
	 */
	get store(): Store {
		return this.#sessionOptions.store;
	}

	#getParsableCookieOptions(): SessionCookieOptions {
		const cookie = { ...this.#cookie };
		if (cookie.encode) delete cookie.encode;
		return cookie;
	}

	/**
	 * Set data in the session.
	 *
	 * If `saveUninitialized` is `true`, the session is saved without calling `save()`.
	 * Conversely, if `saveUninitialized` is `false`, call `save()` to explicitly save the session.
	 */
	async setData(data: SessionData): Promise<void> {
		this.#data = data;
		if (this.#sessionOptions.saveUninitialized)
			await this.store.set(
				this.id,
				{ cookie: this.#getParsableCookieOptions(), data: this.#data },
				this.#storeTtlMs
			);
	}

	/**
	 * Save the session (save session to store) and set cookie.
	 */
	async save(): Promise<void> {
		await this.#sessionOptions.store.set(
			this.id,
			{ cookie: this.#getParsableCookieOptions(), data: this.#data },
			this.#storeTtlMs
		);
		this.#event.cookies.set(
			this.#cookieName,
			await sign(this.#id, this.#sessionOptions.secret),
			this.#cookie
		);
	}

	/**
	 * Regenerate the session simply invoke the method.
	 * Once complete, a new Session and `Session` instance will be initialized.
	 */
	async regenerate(): Promise<Session> {
		await this.destroy();
		const session = new Session(this.#event, this.#sessionOptions);
		return session;
	}

	/**
	 * Destroy the session.
	 */
	async destroy(): Promise<void> {
		await this.#sessionOptions.store.destroy(this.#id);
		// Specify the cookie option set in the sveltekitSessionHandle options.
		// 	However, maxAge is set to 0 on the SvelteKit side.
		// cf. https://github.com/sveltejs/kit/blob/%40sveltejs/package%402.3.1/packages/kit/src/runtime/server/cookie.js#L126
		this.#event.cookies.delete(this.#cookieName, { ...this.#cookie });
	}
}
