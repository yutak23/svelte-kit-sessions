import type { RequestEvent } from '@sveltejs/kit';
import { sync } from 'uid-safe';
import type { CookieSerializeOptions } from 'cookie';
import type { SessionData, Store, SveltekitSessionConfig } from './index.js';
import MemoryStore from './memory-store.js';
import { sign, unsign } from './cookie-signature.js';

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
	constructor(event: RequestEvent, options: SveltekitSessionConfig) {
		this.#id = generateSessionId();
		this.#cookieName = options?.name || 'connect.sid';
		this.#cookieOptions = { ...defaults(event.url), ...options?.cookie };
		this.#store = options.store ? options.store : new MemoryStore();
	}

	static async initialize(event: RequestEvent, options: SveltekitSessionConfig): Promise<Session> {
		const session = new Session(event, options);

		const sid = event.cookies.get(session.#cookieName);
		const unsignedSid = await unsign(sid || '', options.secret);

		if (unsignedSid) {
			const sessionData = await session.#store.get(unsignedSid);
			if (sessionData) {
				session.#id = unsignedSid;
				session.#cookieOptions = sessionData.cookieOptions;
				session.#data = sessionData.data;
				return session;
			}
		}

		if (options.saveUninitialized) {
			await session.#store.set(session.#id, {
				cookieOptions: session.#cookieOptions,
				data: session.#data
			});
			event.cookies.set(
				session.#cookieName,
				await sign(session.#id, options.secret),
				session.#cookieOptions
			);
		}
		return session;
	}

	#id: string;

	#cookieName: string;

	#cookieOptions: CookieSerializeOptions & { path: string };

	#data: SessionData = {};

	#store: Store;

	get id(): string {
		return this.#id;
	}

	get cookieOptions(): CookieSerializeOptions & { path: string } {
		return this.#cookieOptions;
	}

	get data(): SessionData {
		return this.#data;
	}

	get store(): Store {
		return this.#store;
	}

	async set(data: SessionData): Promise<void> {
		this.#data = data;
		await this.store.set(this.id, { cookieOptions: this.cookieOptions, data: this.#data });
	}
}
