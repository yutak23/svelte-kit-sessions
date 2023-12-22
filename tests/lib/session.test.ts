import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import Session from '../../src/lib/session.js';

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

beforeEach(() => {
	vi.resetAllMocks();
});

describe('Session', () => {
	describe('make sure #getParsableCookieOptions is not having any side effects.', () => {
		it('should exists encode in cookieOptions', async () => {
			const session = new Session(mockEvent, {
				secret: 'my-secret',
				store: mockStore,
				cookie: { encode: (val: string) => val, path: '/', maxAge: 600 }
			});
			const originalCookieOptions = { ...session.cookieOptions };

			await session.setData({ user_id: 'user_id', name: 'name' });
			await session.save();

			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(originalCookieOptions.encode).toBeDefined();
			expect(session.cookieOptions).toEqual(originalCookieOptions);
			expect(mockStore.set).toBeCalledTimes(1);
			expect(mockStore.set).toBeCalledWith(session.id, {
				cookie: { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 600 },
				data: session.data
			});
			expect(mockEvent.cookies.set).toBeCalledTimes(1);
			expect(mockEvent.cookies.set).toBeCalledWith(
				session.cookieName,
				expect.any(String),
				originalCookieOptions
			);
		});
	});
});
