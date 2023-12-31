/**
 * https://github.com/crypto-utils/uid-safe/tree/master
 *
 * Implemented with web crypto instead of Node.js crypto to work in Edge environments such as Cloudflare Worker.
 */

/**
 * Generate a buffer with secure random bytes. *
 * @param size The number of bytes to generate
 * @returns buffer with secure random bytes
 */
const randomBytes = (size: number): Uint8Array => {
	// Validate size is not negative
	if (size < 0) throw new RangeError('argument size must not be negative');

	return crypto.getRandomValues(new Uint8Array(size));
};

const EQUAL_END_REGEXP = /=+$/;
const PLUS_GLOBAL_REGEXP = /\+/g;
const SLASH_GLOBAL_REGEXP = /\//g;
const toString = (buf: Uint8Array): string => {
	const base64 = btoa(String.fromCharCode.apply(null, buf as unknown as number[]));
	return base64
		.replace(EQUAL_END_REGEXP, '')
		.replace(PLUS_GLOBAL_REGEXP, '-')
		.replace(SLASH_GLOBAL_REGEXP, '_');
};

/**
 * Generate a UID with the given length.
 * @param length The number of bytes to generate
 * @returns UID(base64 string)
 */
const uidSync = (length: number): string => toString(randomBytes(length));

// eslint-disable-next-line import/prefer-default-export
export { uidSync };
