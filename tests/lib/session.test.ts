import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import Session from '../../src/lib/session.js';
import { sign } from '../../src/lib/cookie-signature.js';

declare module '../../src/lib/index.js' {
	interface SessionData {
		user_id?: string;
		name?: string;
	}
}

// in SvelteKit, web crypto is a global variable
vi.stubGlobal('crypto', crypto);

const mockEvent = {
	url: new URL('http://localhost:3000'),
	cookies: {
		get: vi.fn(),
		getAll: vi.fn(),
		set: vi.fn(),
		delete: vi.fn(),
		serialize: vi.fn()
	}
};

const mockStore = {
	get: vi.fn(),
	set: vi.fn(),
	destroy: vi.fn(),
	touch: vi.fn()
};

describe('Session', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('initialize', () => {
		describe('exits session', () => {
			it('if there is data in the session store, an existing session is created', async () => {
				const sid = 'sessionId';
				const cookie = {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: false,
					maxAge: 600
				};
				const data = { user_id: 'user_id', name: 'name' };
				const signedSid = await sign('sessionId', 'my-secret');
				mockEvent.cookies.get.mockImplementation(() => signedSid);
				mockStore.get.mockImplementation((unsignedSid: string) => {
					if (unsignedSid === sid) return { cookie, data };
					return null;
				});

				const session = await Session.initialize(mockEvent, {
					secret: 'my-secret',
					store: mockStore,
					name: 'exits-session',
					cookie: { maxAge: 600 }
				});

				expect(session.id).toBe(sid);
				expect(session.cookie).toEqual(cookie);
				expect(session.data).toEqual(data);
				expect(mockEvent.cookies.set).toBeCalledTimes(0);
				expect(mockStore.touch).toBeCalledTimes(0);
			});

			it('cookie is re-created if maxAge and rolling options are set', async () => {
				const sid = 'sessionId';
				const cookie = {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: false,
					maxAge: 600
				};
				const data = { user_id: 'user_id', name: 'name' };
				const signedSid = await sign('sessionId', 'my-secret');
				mockEvent.cookies.get.mockImplementation(() => signedSid);
				mockStore.get.mockImplementation((unsignedSid: string) => {
					if (unsignedSid === sid) return { cookie, data };
					return null;
				});

				const session = await Session.initialize(mockEvent, {
					secret: 'my-secret',
					store: mockStore,
					name: 'exits-session',
					rolling: true,
					cookie: { maxAge: 600 }
				});

				expect(session.id).toBe(sid);
				expect(session.cookie).toEqual(cookie);
				expect(session.data).toEqual(data);
				expect(mockEvent.cookies.set).toBeCalledTimes(1);
				expect(mockEvent.cookies.set).toBeCalledWith('exits-session', signedSid, cookie);
				expect(mockStore.touch).toBeCalledTimes(1);
				expect(mockStore.touch).toBeCalledWith(sid, cookie.maxAge);
			});

			it('if maxAge is absent, the rolling option is ignored even if the rolling option is set', async () => {
				const sid = 'sessionId';
				const cookie = {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: false
				};
				const data = { user_id: 'user_id', name: 'name' };
				const signedSid = await sign('sessionId', 'my-secret');
				mockEvent.cookies.get.mockImplementation(() => signedSid);
				mockStore.get.mockImplementation((unsignedSid: string) => {
					if (unsignedSid === sid) return { cookie, data };
					return null;
				});

				const session = await Session.initialize(mockEvent, {
					secret: 'my-secret',
					store: mockStore,
					name: 'exits-session',
					rolling: true
				});

				expect(session.id).toBe(sid);
				expect(session.cookie).toEqual(cookie);
				expect(session.data).toEqual(data);
				expect(mockEvent.cookies.set).toBeCalledTimes(0);
				expect(mockStore.touch).toBeCalledTimes(0);
			});
		});

		describe('no exits session', () => {
			it('session is initialized, when cookie.get return undefined', async () => {
				const cookie = {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: false,
					expires: new Date('2024-01-01')
				};
				mockEvent.cookies.get.mockImplementation(() => undefined);

				const session = await Session.initialize(mockEvent, {
					secret: 'my-secret',
					store: mockStore,
					name: 'init-session',
					cookie: { expires: new Date('2024-01-01') }
				});

				expect(session.id).toEqual(expect.any(String));
				expect(session.cookie).toEqual(cookie);
				expect(mockEvent.cookies.set).toBeCalledTimes(0);
				expect(mockStore.touch).toBeCalledTimes(0);
				expect(mockEvent.cookies.get).toBeCalledTimes(1);
				expect(mockStore.get).toBeCalledTimes(0);
			});

			it('session is initialized, when no store data', async () => {
				const signedSid = await sign('sessionId', 'my-secret');
				const cookie = {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: false,
					expires: new Date('2024-01-01')
				};
				mockEvent.cookies.get.mockImplementation(() => signedSid);
				mockStore.get.mockImplementation(() => null);

				const session = await Session.initialize(mockEvent, {
					secret: 'my-secret',
					store: mockStore,
					name: 'init-session',
					cookie: { expires: new Date('2024-01-01') }
				});

				expect(session.id).toEqual(expect.any(String));
				expect(session.cookie).toEqual(cookie);
				expect(mockEvent.cookies.set).toBeCalledTimes(0);
				expect(mockStore.touch).toBeCalledTimes(0);
				expect(mockEvent.cookies.get).toBeCalledTimes(1);
				expect(mockStore.get).toBeCalledTimes(1);
			});

			it('session is initialized and set cookie, when saveUninitialized is true', async () => {
				const cookie = {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: false
				};
				mockEvent.cookies.get.mockImplementation(() => undefined);

				const session = await Session.initialize(mockEvent, {
					secret: 'my-secret',
					store: mockStore,
					name: 'init-session',
					saveUninitialized: true,
					cookie: { maxAge: 60 }
				});

				expect(session.id).toEqual(expect.any(String));
				expect(session.cookie).toEqual({ ...cookie, maxAge: 60 });
				expect(mockEvent.cookies.set).toBeCalledTimes(1);
				expect(mockEvent.cookies.set).toBeCalledWith('init-session', expect.any(String), {
					...cookie,
					maxAge: 60
				});
				expect(mockStore.set).toBeCalledTimes(1);
				expect(mockStore.set).toBeCalledWith(
					session.id,
					{ cookie: { ...cookie, maxAge: 60 }, data: {} },
					60 * 1000
				);
				expect(mockStore.touch).toBeCalledTimes(0);
				expect(mockEvent.cookies.get).toBeCalledTimes(1);
				expect(mockStore.get).toBeCalledTimes(0);
			});
		});
	});

	describe('setData', () => {
		it('when saveUninitialized is false, store.set is not called', async () => {
			const session = new Session(mockEvent, {
				secret: 'my-secret',
				store: mockStore,
				saveUninitialized: false
			});

			await session.setData({ user_id: 'user_id', name: 'name' });

			expect(mockStore.set).toBeCalledTimes(0);
			expect(session.data).toEqual({ user_id: 'user_id', name: 'name' });
		});

		it('when saveUninitialized is true, store.set is called', async () => {
			const session = new Session(mockEvent, {
				secret: 'my-secret',
				store: mockStore,
				saveUninitialized: true
			});

			await session.setData({ user_id: 'user_id', name: 'name' });

			expect(mockStore.set).toBeCalledTimes(1);
			expect(mockStore.set).toBeCalledWith(
				session.id,
				{
					cookie: { path: '/', httpOnly: true, sameSite: 'lax', secure: false },
					data: { user_id: 'user_id', name: 'name' }
				},
				Infinity
			);
			expect(session.data).toEqual({ user_id: 'user_id', name: 'name' });
		});
	});

	describe('#getParsableCookieOptions', () => {
		it('should exists encode in cookieOptions(not having any side effects)', async () => {
			const session = new Session(mockEvent, {
				secret: 'my-secret',
				store: mockStore,
				cookie: { encode: (val: string) => val, path: '/', maxAge: 600 }
			});
			const originalCookie = { ...session.cookie };

			await session.setData({ user_id: 'user_id', name: 'name' });
			await session.save();

			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(originalCookie.encode).toBeDefined();
			expect(session.cookie).toEqual(originalCookie);
			expect(mockStore.set).toBeCalledTimes(1);
			expect(mockStore.set).toBeCalledWith(
				session.id,
				{
					cookie: { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 600 },
					data: session.data
				},
				600000
			);
			expect(mockEvent.cookies.set).toBeCalledTimes(1);
			expect(mockEvent.cookies.set).toBeCalledWith(
				session.cookieName,
				expect.any(String),
				originalCookie
			);
		});
	});
});
