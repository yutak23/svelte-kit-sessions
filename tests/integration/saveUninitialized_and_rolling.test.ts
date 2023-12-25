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
 * session is created without save and rolling
 *
 * Test scenario
 * 1. Session exists
 * 2. Session data is empty object, and set maxAge when rolling is true
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
	expect(existCookie['connect.sid']).toEqual(expect.any(String));
	expect(existCookie.Path).toBe('/');
	expect(existCookie.HttpOnly).toBe('true');
	expect(existCookie.SameSite).toBe('Lax');
	expect(existCookie['Max-Age']).toBe('604800');

	// 2
	const isequalResponse = await request.post('/api/test/isequal-session', {
		data: {},
		headers: { cookie: serialize('connect.sid', existCookie['connect.sid']) }
	});
	const { is_equal: isEqual } = (await isequalResponse.json()) as {
		is_equal: boolean;
	};
	const isequalCookie = parseCookieFromResponse(isequalResponse);
	expect(isequalResponse.status()).toBe(200);
	expect(isEqual).toBeTruthy();
	expect(isequalCookie['Max-Age']).toBe('604800');

	// 3
	const setDataResponse = await request.post('/api/test/only-setData', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('connect.sid', existCookie['connect.sid']) }
	});
	const { session_data: setDataSessionData } = (await setDataResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	const setDataCookie = parseCookieFromResponse(setDataResponse);
	expect(setDataResponse.status()).toBe(200);
	expect(setDataSessionData.user_id).toEqual('user_id_test');
	expect(setDataSessionData.name).toEqual('name_test');
	expect(setDataCookie['Max-Age']).toBe('604800');

	// 4
	const isequalResponse2 = await request.post('/api/test/isequal-session', {
		data: { user_id: 'user_id_test', name: 'name_test' },
		headers: { cookie: serialize('connect.sid', existCookie['connect.sid']) }
	});
	const { is_equal: isEqual2 } = (await isequalResponse2.json()) as {
		is_equal: boolean;
	};
	const isequalCookie2 = parseCookieFromResponse(isequalResponse2);
	expect(isequalResponse.status()).toBe(200);
	expect(isEqual2).toBeTruthy();
	expect(isequalCookie2['Max-Age']).toBe('604800');
});
