import type { SessionData } from '$lib/index.js';
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
 * Only expires is set for the session
 *
 * Test scenario
 * 1. If there is no cookie in the request, the session does not exist
 * 2. Session is created by save
 * 3. Session exists and cookie has expires
 * 4. Regenerate the session will result in the same cookie options
 */
test('Only expires is set for the session', async ({ request }) => {
	// 1
	const existResponse = await request.post('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBeFalsy();

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
	expect(saveCookie.Expires).toEqual(expect.any(String));

	// 3
	const existResponse2 = await request.post('/api/test/set-cookie', {
		headers: { cookie: serialize('connect.sid', saveCookie['connect.sid']) }
	});
	const existCookie2 = parseCookieFromResponse(existResponse2);
	expect(existResponse2.status()).toBe(200);
	expect(existCookie2['connect.sid']).toEqual(expect.any(String));
	expect(existCookie2.Path).toBe('/');
	expect(existCookie2.Expires).toEqual(expect.any(String));

	// 4
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
	expect(regenerateCookie.Expires).toEqual(existCookie2.Expires);
	expect(regenerateCookie['connect.sid']).not.toBe(saveCookie['connect.sid']);
});
