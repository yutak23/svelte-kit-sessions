import { describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import { sign, unsign } from '../../src/lib/cookie-signature.js';

// in SvelteKit, web crypto is a global variable
vi.stubGlobal('crypto', crypto);

describe('cookie-signature', () => {
	describe('secret is string', () => {
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

	describe('secret is string[] and length is 1', () => {
		it('should sign the cookie value with the provided secret key', async () => {
			const val = '123cookieValue';
			const secret = ['mySecretKeyFirst'];

			const signed = await sign(val, secret);
			expect(signed).toBeDefined();

			const unsigned = await unsign(signed, secret);

			expect(unsigned).toBe(val);
		});

		it('should return false if the signature is invalid', async () => {
			const val = '123cookieValue';
			const secret = ['mySecretKeyFirst'];

			const signed = await sign(val, secret);
			expect(signed).toBeDefined();

			const unsigned = await unsign(signed.substring(signed.length - 1, signed.length), secret);
			expect(unsigned).toBeNull();
		});

		it('should return false if the signature is empty string', async () => {
			const val = '123cookieValue';
			const secret = ['mySecretKeyFirst'];

			const signed = await sign(val, secret);
			expect(signed).toBeDefined();

			const unsigned = await unsign('', secret);
			expect(unsigned).toBeNull();
		});
	});

	describe('secret is string[] and length is over 2', () => {
		it('should sign the cookie value with the provided secret key', async () => {
			const val = '123cookieValue';
			const secret = ['mySecretKeyFirst', 'mySecretKeySecond'];

			const signed = await sign(val, secret);
			expect(signed).toBeDefined();

			const unsigned = await unsign(signed, secret);

			expect(unsigned).toBe(val);
		});

		it('should return false if the signature is invalid', async () => {
			const val = '123cookieValue';
			const secret = ['mySecretKeyFirst', 'mySecretKeySecond'];

			const signed = await sign(val, secret);
			expect(signed).toBeDefined();

			const unsigned = await unsign(signed.substring(signed.length - 1, signed.length), secret);
			expect(unsigned).toBeNull();
		});

		it('should return false if the signature is empty string', async () => {
			const val = '123cookieValue';
			const secret = ['mySecretKeyFirst', 'mySecretKeySecond'];

			const signed = await sign(val, secret);
			expect(signed).toBeDefined();

			const unsigned = await unsign('', secret);
			expect(unsigned).toBeNull();
		});
	});

	describe('secret rotation', () => {
		it('should sign the cookie value with the provided secret key', async () => {
			const val = '123cookieValue';

			const signed = await sign(val, 'mySecretKeySecond');
			expect(signed).toBeDefined();

			const unsigned = await unsign(signed, [
				'mySecretKeyFirst',
				'mySecretKeySecond',
				'mySecretKeyThird'
			]);

			expect(unsigned).toBe(val);
		});

		it('should return false if the signature is invalid', async () => {
			const val = '123cookieValue';

			const signed = await sign(val, 'mySecretKeySecond');
			expect(signed).toBeDefined();

			const unsigned = await unsign(signed.substring(signed.length - 1, signed.length), [
				'mySecretKeyFirst',
				'mySecretKeySecond',
				'mySecretKeyThird'
			]);
			expect(unsigned).toBeNull();
		});

		it('should return false if the signature is empty string', async () => {
			const val = '123cookieValue';

			const signed = await sign(val, 'mySecretKeySecond');
			expect(signed).toBeDefined();

			const unsigned = await unsign('', [
				'mySecretKeyFirst',
				'mySecretKeySecond',
				'mySecretKeyThird'
			]);
			expect(unsigned).toBeNull();
		});

		it('secret is not contain', async () => {
			const val = '123cookieValue';

			const signed = await sign(val, 'mySecretKeySecond');
			expect(signed).toBeDefined();

			const unsigned = await unsign('', ['mySecretKeyFirst', 'mySecretKeyThird']);
			expect(unsigned).toBeNull();
		});
	});
});
