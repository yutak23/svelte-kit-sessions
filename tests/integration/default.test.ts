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
 * session is created by saving
 *
 * Test scenario
 * 1. If there is no cookie in the request, the session does not exist
 * 2. Session is created by save
 * 3. Session exists
 * 4. Session data is the same as the data saved in 2
 */
test('session is created by saving', async ({ request }) => {
	// 1
	const existResponse = await request.post('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	// 2
	const saveResponse = await request.post('/api/test/save-session', {
		data: { user_id: 'user_id_test', name: 'name_test' }
	});
	const { session_data: saveSessionData } = (await saveResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	const saveCookie = parseCookieFromResponse(saveResponse);
	expect(saveResponse.status()).toBe(200);
	expect(saveSessionData.user_id).toEqual('user_id_test');
	expect(saveSessionData.name).toEqual('name_test');
	expect(saveCookie['connect.sid']).toEqual(expect.any(String));
	expect(saveCookie.Path).toBe('/');
	expect(saveCookie.HttpOnly).toBe('true');
	expect(saveCookie.SameSite).toBe('Lax');

	// 3
	const existResponse2 = await request.post('/api/test/exist-session', {
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	expect(existResponse2.status()).toBe(200);
	expect(exits2).toBeTruthy();

	// 4
	const isequalResponse = await request.post('/api/test/isequal-session', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const { is_equal: isEqual } = (await isequalResponse.json()) as {
		is_equal: boolean;
	};
	expect(isequalResponse.status()).toBe(200);
	expect(isEqual).toBeTruthy();
});

/**
 * `saveUninitialized` is `false`, no session is created if not saved
 *
 * Test scenario
 * 1. If there is no cookie in the request, the session does not exist
 * 2. Session is not created by setData
 */
test('`saveUninitialized` is `false`, no session is created if not saved', async ({ request }) => {
	// 1
	const existResponse = await request.post('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	// 2
	const setDataResponse = await request.post('/api/test/only-setData', {
		data: { user_id: 'user_id_test', name: 'name_test' }
	});
	const { session_data: saveSessionData } = (await setDataResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	const saveCookie = parseCookieFromResponse(setDataResponse);
	expect(setDataResponse.status()).toBe(200);
	expect(saveSessionData.user_id).toEqual(expect.any(String));
	expect(saveSessionData.name).toEqual(expect.any(String));
	expect(saveCookie).toEqual({});
});

/**
 * session can be regenerated
 *
 * Test scenario
 * 1. If there is no cookie in the request, the session does not exist
 * 2. Session is created by save
 * 3. Session exists
 * 4. Session data is the same as the data saved in 2
 * 5. Session is regenerated
 * 6. Session exists
 * 7. Session data is the same as the data saved in 5
 */
test('session can be regenerated', async ({ request }) => {
	// 1
	const existResponse = await request.post('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	// 2
	const saveResponse = await request.post('/api/test/save-session', {
		data: { user_id: 'user_id_test', name: 'name_test' }
	});
	const saveCookie = parseCookieFromResponse(saveResponse);
	expect(saveResponse.status()).toBe(200);

	// 3
	const existResponse2 = await request.post('/api/test/exist-session', {
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	expect(existResponse2.status()).toBe(200);
	expect(exits2).toBeTruthy();

	// 4
	const isequalResponse = await request.post('/api/test/isequal-session', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const { is_equal: isEqual } = (await isequalResponse.json()) as {
		is_equal: boolean;
	};
	expect(isequalResponse.status()).toBe(200);
	expect(isEqual).toBeTruthy();

	// 5
	const regenerateResponse = await request.post('/api/test/regenerate-session', {
		data: { user_id: 'user_id_regenerate', name: 'name_regenerate' },
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const { session_data: regenerateSessionData } = (await regenerateResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	const regenerateCookie = parseCookieFromResponse(regenerateResponse);
	expect(regenerateResponse.status()).toBe(200);
	expect(regenerateSessionData.user_id).toEqual('user_id_regenerate');
	expect(regenerateSessionData.name).toEqual('name_regenerate');
	expect(regenerateCookie['connect.sid']).toEqual(expect.any(String));
	expect(regenerateCookie.Path).toBe('/');
	expect(regenerateCookie.HttpOnly).toBe('true');
	expect(regenerateCookie.SameSite).toBe('Lax');
	expect(regenerateCookie['connect.sid']).not.toBe(saveCookie['connect.sid']);

	// 6
	const existResponse3 = await request.post('/api/test/exist-session', {
		headers: { cookie: serialize('connect.sid', regenerateCookie['connect.sid']) }
	});
	const { exits: exits3 } = (await existResponse3.json()) as { exits: boolean };
	expect(existResponse3.status()).toBe(200);
	expect(exits3).toBeTruthy();

	// 7
	const isequalResponse2 = await request.post('/api/test/isequal-session', {
		data: { user_id: 'user_id_regenerate', name: 'name_regenerate' },
		headers: { cookie: serialize('connect.sid', regenerateCookie['connect.sid']) }
	});
	const { is_equal: isEqual2 } = (await isequalResponse2.json()) as {
		is_equal: boolean;
	};
	expect(isequalResponse2.status()).toBe(200);
	expect(isEqual2).toBeTruthy();
});

/**
 * session can be destroyed
 *
 * Test scenario
 * 1. If there is no cookie in the request, the session does not exist
 * 2. Session is created by save
 * 3. Session exists
 * 4. Session is deleted
 */
test('session can be destroyed', async ({ request }) => {
	// 1
	const existResponse = await request.post('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	// 2
	const saveResponse = await request.post('/api/test/save-session', {
		data: { user_id: 'user_id_test', name: 'name_test' }
	});
	const saveCookie = parseCookieFromResponse(saveResponse);
	expect(saveResponse.status()).toBe(200);

	// 3
	const existResponse2 = await request.post('/api/test/exist-session', {
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	expect(existResponse2.status()).toBe(200);
	expect(exits2).toBeTruthy();

	// 4
	const destroyResponse = await request.post('/api/test/destroy-session', {
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const destroyCookie = parseCookieFromResponse(destroyResponse);
	expect(destroyResponse.status()).toBe(200);
	expect(destroyCookie['connect.sid']).toBe('');
	expect(destroyCookie.Path).toBe('/');
	expect(destroyCookie.HttpOnly).toBe('true');
	expect(destroyCookie.SameSite).toBe('Lax');
	expect(destroyCookie['Max-Age']).toBe('0');
});
