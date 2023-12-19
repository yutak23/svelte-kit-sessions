import { describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import { sign, unsign } from '../../src/lib/cookie-signature.js';

// in SvelteKit, web crypto is a global variable
vi.stubGlobal('crypto', crypto);

describe('sign and unsign', () => {
	it('should sign the cookie value with the provided secret key', async () => {
		const val = '123cookieValue';
		const secret = 'mySecretKey';

		const signed = await sign(val, secret);
		expect(signed).toBeDefined();

		const unsigned = await unsign(signed, secret);

		expect(unsigned).toBe(val);
	});

	it('should return false if the signature is invalid', async () => {
		const val = '123cookieValue';
		const secret = 'mySecretKey';

		const signed = await sign(val, secret);
		expect(signed).toBeDefined();

		const unsigned = await unsign(signed.substring(signed.length - 1, signed.length), secret);
		expect(unsigned).toBeNull();
	});

	it('should return false if the signature is empty string', async () => {
		const val = '123cookieValue';
		const secret = 'mySecretKey';

		const signed = await sign(val, secret);
		expect(signed).toBeDefined();

		const unsigned = await unsign('', secret);
		expect(unsigned).toBeNull();
	});
});
