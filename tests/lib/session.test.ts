import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import Session from '../../src/lib/session.js';

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
	destroy: vi.fn()
};

describe('Session', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('make sure #getParsableCookieOptions is not having any side effects.', () => {
		it('should exists encode in cookieOptions', async () => {
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
