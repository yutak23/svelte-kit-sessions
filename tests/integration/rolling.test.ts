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
 * after a session is created, maxAge is updated with each request to the server
 *
 * Test scenario
 * 1. If there is no cookie in the request, the session does not exist
 * 2. Session is created by save
 * 3. Session exists and maxAge is updated
 */
test('after a session is created, maxAge is updated with each request to the server', async ({
	request
}) => {
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
	expect(saveCookie['Max-Age']).toBe('604800');

	// 3
	const existResponse2 = await request.post('/api/test/exist-session', {
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	const exist2Cookie = parseCookieFromResponse(existResponse2);
	expect(existResponse2.status()).toBe(200);
	expect(exits2).toBeTruthy();
	expect(saveCookie['connect.sid']).toBe(exist2Cookie['connect.sid']);
	expect(saveCookie['Max-Age']).toBe('604800');
});
