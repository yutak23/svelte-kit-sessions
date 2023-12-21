/* eslint-disable @typescript-eslint/no-unsafe-call */
import { expect, test } from '@playwright/test';

test.beforeEach('Clear cookie', async ({ context }) => {
	await context.clearCookies();
});

test('session is created by saving', async ({ request }) => {
	/* not exist session */
	const existResponse = await request.get('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	/* save session(create session) */
	const saveResponse = await request.get('/api/test/save-session');
	const { session_data: saveSessionData } = (await saveResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	const saveCookie = saveResponse.headers()['set-cookie'];
	expect(saveResponse.status()).toBe(200);
	expect(saveSessionData.user_id).toEqual(expect.any(String));
	expect(saveSessionData.name).toEqual(expect.any(String));
	expect(saveCookie).toContain('connect.sid');
	expect(saveCookie).toContain('Path=/');
	expect(saveCookie).toContain('HttpOnly');
	expect(saveCookie).toContain('SameSite=Lax');

	/* exist session */
	const existResponse2 = await request.get('/api/test/exist-session', { headers: { saveCookie } });
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	expect(existResponse2.status()).toBe(200);
	expect(exits2).toBe(true);

	/* session is same */
	const getResponse = await request.get('/api/test/get-session', { headers: { saveCookie } });
	const { session_data: getSessionData } = (await getResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	expect(getResponse.status()).toBe(200);
	expect(getSessionData).toEqual(saveSessionData);
});

test('`saveUninitialized` is `false`, no session is created if not saved', async ({ request }) => {
	/* not exist session */
	const existResponse = await request.get('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	/* not save session(not create session) and no set-cookie */
	const saveResponse = await request.get('/api/test/only-setData');
	const { session_data: saveSessionData } = (await saveResponse.json()) as {
		session_data: { user_id: string; name: string };
	};
	const saveCookie = saveResponse.headers()['set-cookie'];
	expect(saveResponse.status()).toBe(200);
	expect(saveSessionData.user_id).toEqual(expect.any(String));
	expect(saveSessionData.name).toEqual(expect.any(String));
	expect(saveCookie).toBeUndefined();
});

test('session can be regenerated', async ({ request }) => {
	/* not exist session */
	const existResponse = await request.get('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	/* save session(create session) */
	const saveResponse = await request.get('/api/test/save-session');
	await saveResponse.json();
	const saveCookie = saveResponse.headers()['set-cookie'];
	expect(saveResponse.status()).toBe(200);

	/* exist session */
	const existResponse2 = await request.get('/api/test/exist-session', { headers: { saveCookie } });
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	expect(existResponse2.status()).toBe(200);
	expect(exits2).toBe(true);

	/**
	 * regenerate session
	 *
	 * Test Points
	 * - [x] Must be a different session from the /save-session session(Must be a different cookie from the /save-session cookie).
	 * - [x] Must be session data is different.
	 */
	const regenerateResponse = await request.get('/api/test/regenerate-session', {
		headers: { saveCookie }
	});
	const { session_data: regenerateSessionData } = (await regenerateResponse.json()) as {
		session_data: { re_user_id: string; re_name: string; user_id?: string; name?: string };
	};
	const regenerateCookie = regenerateResponse.headers()['set-cookie'];
	expect(regenerateResponse.status()).toBe(200);
	expect(regenerateSessionData.user_id).toBeUndefined();
	expect(regenerateSessionData.name).toBeUndefined();
	expect(regenerateSessionData.re_user_id).toEqual(expect.any(String));
	expect(regenerateSessionData.re_name).toEqual(expect.any(String));
	expect(regenerateCookie).toContain('connect.sid');
	expect(regenerateCookie).toContain('Path=/');
	expect(regenerateCookie).toContain('HttpOnly');
	expect(regenerateCookie).toContain('SameSite=Lax');
	expect(regenerateCookie).not.toBe(saveCookie);

	/* exist session */
	const existResponse3 = await request.get('/api/test/exist-session', {
		headers: { regenerateCookie }
	});
	const { exits: exits3 } = (await existResponse3.json()) as { exits: boolean };
	expect(existResponse3.status()).toBe(200);
	expect(exits3).toBe(true);

	/* session is same */
	const getResponse = await request.get('/api/test/get-session', { headers: { regenerateCookie } });
	const { session_data: getSessionData } = (await getResponse.json()) as {
		session_data: { re_user_id: string; re_name: string };
	};
	expect(getResponse.status()).toBe(200);
	expect(getSessionData).toEqual(regenerateSessionData);
});

test('session can be destroyed', async ({ request }) => {
	/* not exist session */
	const existResponse = await request.get('/api/test/exist-session');
	const { exits } = (await existResponse.json()) as { exits: boolean };
	expect(existResponse.status()).toBe(200);
	expect(exits).toBe(false);

	/* save session(create session) */
	const saveResponse = await request.get('/api/test/save-session');
	await saveResponse.json();
	const saveCookie = saveResponse.headers()['set-cookie'];
	expect(saveResponse.status()).toBe(200);

	/* exist session */
	const existResponse2 = await request.get('/api/test/exist-session', { headers: { saveCookie } });
	const { exits: exits2 } = (await existResponse2.json()) as { exits: boolean };
	expect(existResponse2.status()).toBe(200);
	expect(exits2).toBe(true);

	/**
	 * destroy session
	 *
	 * Test Points
	 * - [x] Must be cookie value is empty.(Must be a different cookie from the /save-session cookie).
	 */
	const destroyResponse = await request.get('/api/test/destroy-session', {
		headers: { saveCookie }
	});
	const destroyCookie = destroyResponse.headers()['set-cookie'];
	expect(destroyResponse.status()).toBe(200);
	expect(destroyCookie).toContain('connect.sid=;');
	expect(destroyCookie).toContain('Path=/');
	expect(destroyCookie).toContain('HttpOnly');
	expect(destroyCookie).toContain('SameSite=Lax');
	expect(destroyCookie).not.toBe(saveCookie);

	/* not exist session */
	const existResponse3 = await request.get('/api/test/exist-session', {
		headers: { destroyCookie }
	});
	const { exits: exits3 } = (await existResponse3.json()) as { exits: boolean };
	expect(existResponse3.status()).toBe(200);
	expect(exits3).toBe(false);
});
