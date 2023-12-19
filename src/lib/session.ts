import type { RequestEvent } from '@sveltejs/kit';
import { sync } from 'uid-safe';
import type { SessionData, Store, SveltekitSessionConfig } from './index.js';
import Cookie from './cookie.js';
import MemoryStore from './memory-store.js';
import { unsign } from './cookie-signature.js';

/**
 * Generate a session ID for a new session.
 */
const generateSessionId = (): string => sync(24);

export default class Session {
	id: string;

	cookie: Cookie;

	store: Store;

	#cookieName: string;

	constructor(event: RequestEvent, options: SveltekitSessionConfig) {
		this.id = generateSessionId();
		this.cookie = new Cookie(options?.cookie);
		this.store = options.store ? options.store : new MemoryStore();
		this.#cookieName = options?.name || 'connect.sid';
	}

	static async initialize(event: RequestEvent, options: SveltekitSessionConfig): Promise<Session> {
		const session = new Session(event, options);

		const sid = event.cookies.get(session.#cookieName);
		const unsignedSid = await unsign(sid || '', options.secret);

		if (unsignedSid) {
			const sessionData = await session.store.get(unsignedSid);
			if (sessionData) {
				session.id = unsignedSid;
				session.cookie = sessionData.cookie;
				Object.keys(sessionData).forEach((key) => {
					session[key as keyof SessionData] = sessionData[key as keyof SessionData];
				});
				return session;
			}

			return session;
		}

		return session;
	}

	// save(): Promise<void> {}
}
