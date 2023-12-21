import type { RequestEvent } from '@sveltejs/kit';
import { sync } from 'uid-safe';
import type { CookieSerializeOptions } from 'cookie';
import type { SessionData, Store, SveltekitSessionConfig } from './index.js';
import { sign, unsign } from './cookie-signature.js';

interface SimpleRequestEvent extends Pick<RequestEvent, 'url' | 'cookies'> {}

/**
 * Generate a session ID for a new session.
 */
const generateSessionId = (): string => sync(24);

// https://github.com/sveltejs/kit/blob/%40sveltejs/kit%402.0.3/packages/kit/src/runtime/server/cookie.js#L40
const defaults = (url: URL): CookieSerializeOptions & { path: string } => ({
	// https://github.com/expressjs/session/blob/v1.17.3/session/cookie.js#L26
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: !(url.hostname === 'localhost' && url.protocol === 'http:')
});

export default class Session {
	constructor(event: SimpleRequestEvent, options: SveltekitSessionConfig & { store: Store }) {
		this.#id = generateSessionId();
		this.#cookieName = options?.name || 'connect.sid';
		this.#cookieOptions = { ...defaults(event.url), ...options?.cookie };
		this.#sessionOptions = options;
		this.#event = event;
	}

	static async initialize(
		event: SimpleRequestEvent,
		options: SveltekitSessionConfig & { store: Store }
	): Promise<Session> {
		const session = new Session(event, options);

		const sid = event.cookies.get(session.#cookieName);
		const unsignedSid = await unsign(sid || '', options.secret);

		if (unsignedSid) {
			const sessionData = await session.#sessionOptions.store.get(unsignedSid);
			if (sessionData) {
				session.#id = unsignedSid;
				session.#cookieOptions = sessionData.cookieOptions;
				session.#data = sessionData.data;
				return session;
			}
		}

		if (options.saveUninitialized) {
			await session.#sessionOptions.store.set(session.#id, {
				cookieOptions: session.#cookieOptions,
				data: session.#data
			});
			event.cookies.set(
				session.#cookieName,
				await sign(session.#id, session.#sessionOptions.secret),
				session.#cookieOptions
			);
		}
		return session;
	}

	#id: string;

	#cookieName: string;

	#cookieOptions: CookieSerializeOptions & { path: string };

	#data: SessionData = {} as SessionData;

	#sessionOptions: SveltekitSessionConfig & { store: Store };

	#event: SimpleRequestEvent;

	get id(): string {
		return this.#id;
	}

	get cookieName(): string {
		return this.#cookieName;
	}

	get cookieOptions(): CookieSerializeOptions & { path: string } {
		return this.#cookieOptions;
	}

	get data(): SessionData {
		return this.#data;
	}

	get store(): Store {
		return this.#sessionOptions.store;
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
			await this.store.set(this.id, { cookieOptions: this.cookieOptions, data: this.#data });
	}

	/**
	 * Save the session (save session to store) and set cookie.
	 */
	async save(): Promise<void> {
		await this.#sessionOptions.store.set(this.id, {
			cookieOptions: this.cookieOptions,
			data: this.#data
		});
		this.#event.cookies.set(
			this.#cookieName,
			await sign(this.#id, this.#sessionOptions.secret),
			this.#cookieOptions
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
		this.#event.cookies.delete(this.#cookieName, { path: this.#cookieOptions.path });
	}
}
