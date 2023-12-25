import { expect, test, type APIResponse } from '@playwright/test';
import { parse, serialize } from 'cookie';

const parseCookieFromResponse = (cookie: APIResponse): Record<string, string> => {
	const setCookie = cookie.headers()['set-cookie'];
	if (!setCookie) return {};
	const parsedCookie = parse(setCookie);
	if (setCookie.includes('HttpOnly;')) parsedCookie.HttpOnly = 'true';
	return parsedCookie;
};

test.beforeEach('Clear cookie', async ({ context }) => {
	await context.clearCookies();
});

/**
 * session is created without save
 *
 * Test scenario
 * 1. Session exists
 * 2. Session data is empty object, and not set maxAge when rolling is false
 * 3. Data is stored in the session with setData
 * 4. Session data is the same as the data saved in 3
 */
test('session is created without save', async ({ request }) => {
	// 1
	const existResponse = await request.post('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	const existCookie = parseCookieFromResponse(existResponse);
	expect(existResponse.status()).toBe(200);
	expect(exits).toBeTruthy();
	expect(existCookie['my-session']).toEqual(expect.any(String));
	expect(existCookie.Path).toBe('/');
	expect(existCookie.HttpOnly).toBe('true');
	expect(existCookie.SameSite).toBe('Lax');
	expect(existCookie['Max-Age']).toBe('604800');

	// 2
	const isequalResponse = await request.post('/api/test/isequal-session', {
		data: {},
		headers: { cookie: serialize('my-session', existCookie['my-session']) }
	});
	const { is_equal: isEqual } = (await isequalResponse.json()) as {
		is_equal: boolean;
	};
	const isequalCookie = parseCookieFromResponse(isequalResponse);
	expect(isequalResponse.status()).toBe(200);
	expect(isEqual).toBeTruthy();
	expect(isequalCookie['Max-Age']).toBeUndefined();

	// 3
	const setDataResponse = await request.post('/api/test/only-setData', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('my-session', existCookie['my-session']) }
	});
	const { session_data: setDataSessionData } = (await setDataResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	expect(setDataResponse.status()).toBe(200);
	expect(setDataSessionData.user_id).toEqual('user_id_test');
	expect(setDataSessionData.name).toEqual('name_test');

	// 4
	const isequalResponse2 = await request.post('/api/test/isequal-session', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('my-session', existCookie['my-session']) }
	});
	const { is_equal: isEqual2 } = (await isequalResponse2.json()) as {
		is_equal: boolean;
	};
	expect(isequalResponse.status()).toBe(200);
	expect(isEqual2).toBeTruthy();
});

/**
 * Automatic session creation again after deleting a session
 *
 * Test scenario
 * 1. Session exists
 * 2. Data is stored in the session with setData
 * 3. Session data is the same as the data saved in 2
 * 4. Session destroyed
 * 5. Session automatic create again, and session is not the same as the session created in 1
 */
test('Automatic session creation again after deleting a session', async ({ request }) => {
	// 1
	const existResponse = await request.post('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	const existCookie = parseCookieFromResponse(existResponse);
	expect(existResponse.status()).toBe(200);
	expect(exits).toBeTruthy();
	expect(existCookie['my-session']).toEqual(expect.any(String));
	expect(existCookie.Path).toBe('/');
	expect(existCookie.HttpOnly).toBe('true');
	expect(existCookie.SameSite).toBe('Lax');

	// 2
	const setDataResponse = await request.post('/api/test/only-setData', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('my-session', existCookie['my-session']) }
	});
	const { session_data: setDataSessionData } = (await setDataResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	expect(setDataResponse.status()).toBe(200);
	expect(setDataSessionData.user_id).toEqual('user_id_test');
	expect(setDataSessionData.name).toEqual('name_test');

	// 3
	const isequalResponse = await request.post('/api/test/isequal-session', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('my-session', existCookie['my-session']) }
	});
	const { is_equal: isEqual } = (await isequalResponse.json()) as {
		is_equal: boolean;
	};
	expect(isequalResponse.status()).toBe(200);
	expect(isEqual).toBeTruthy();

	// 4
	const destroyResponse = await request.post('/api/test/destroy-session', {
		headers: { cookie: serialize('my-session', existCookie['my-session']) }
	});
	const destroyCookie = parseCookieFromResponse(destroyResponse);
	expect(destroyResponse.status()).toBe(200);
	expect(destroyCookie['my-session']).toBe('');
	expect(destroyCookie.Path).toBe('/');
	expect(destroyCookie.HttpOnly).toBe('true');
	expect(destroyCookie.SameSite).toBe('Lax');
	expect(destroyCookie['Max-Age']).toBe('0');

	// 5
	const existResponse2 = await request.post('/api/test/exist-session');
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	const existCookie2 = parseCookieFromResponse(existResponse2);
	expect(existResponse.status()).toBe(200);
	expect(exits2).toBeTruthy();
	expect(existCookie2['my-session']).toEqual(expect.any(String));
	expect(existCookie2.Path).toBe('/');
	expect(existCookie2.HttpOnly).toBe('true');
	expect(existCookie2.SameSite).toBe('Lax');
	expect(existCookie2['my-session']).not.toBe(existCookie['my-session']);
});
