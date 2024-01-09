/**
 * Cookie signing and unsigning.
 *
 * Implemented with web crypto instead of Node.js crypto
 * to work in Edge environments such as Cloudflare Worker.
 */

/**
 * Convert a string to an ArrayBuffer
 *
 * @param {string} str string to convert to ArrayBuffer (should be the session id)
 * @return {ArrayBuffer} buffer
 */
function str2ab(str: string): ArrayBuffer {
	const buffer = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i += 1) {
		buffer[i] = str.charCodeAt(i);
	}
	return buffer;
}

/**
 * Sign the given `val` with `secret`.
 * The `secret` is a secret key to sign the cookie with.
 * This is used to detect tampering the cookie later.
 *
 * The `secret` can be a string or an array of strings.
 * If an array of strings is provided, only the first element will be used to sign the cookie,
 *   but all the elements will be used to unsign the cookie.
 *
 * @param {string} val Cookie value to sign (should be the session id)
 * @param {string | string[]} secret Secret string to sign with
 * @return {Promise<string>} Signed cookie in the form of `<val>.<signature>` where `<signature>` is a base64 encoded HMAC SHA256 signature
 */
export async function sign(val: string, secret: string | string[]): Promise<string> {
	const keyData = str2ab(typeof secret === 'string' ? secret : secret[0]);
	const key = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign('HMAC', key, str2ab(val));
	return `${val}.${btoa(
		String.fromCharCode.apply(null, Array.from(new Uint8Array(signature)))
	).replace(/=+$/, '')}`;
}

/**
 * Unsign and decode the given `input` with `secret`,
 *   returning `false` if the signature is invalid.
 *
 * The `secret` can be a string or an array of strings.
 * If an array of strings is provided, only the first element will be used to sign the cookie,
 *   but all the elements will be used to unsign the cookie.
 *
 * @param {string} input Signed cookie to unsign
 * @param {string | string[]} secret Secret to sign with (should be the same as the one used to sign)
 * @return {Promise<string | null>} Unsigned cookie or `null` if signature is invalid
 */
export async function unsign(input: string, secret: string | string[]): Promise<string | null> {
	const tentativeValue = input.slice(0, input.lastIndexOf('.'));

	if (typeof secret === 'string') {
		const expectedSignature = await sign(tentativeValue, secret);
		return expectedSignature === input ? tentativeValue : null;
	}

	const results = await Promise.all(
		secret.map(async (v) => {
			const expectedSignature = await sign(tentativeValue, v);
			return expectedSignature === input ? tentativeValue : null;
		})
	);
	return results.find((v) => v !== null) || null;
}
