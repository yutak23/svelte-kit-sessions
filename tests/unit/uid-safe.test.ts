import { describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import { uidSync } from '../../src/lib/uid-safe.js';

// in SvelteKit, web crypto is a global variable
vi.stubGlobal('crypto', crypto);

describe('uidSync', () => {
	it('uidSync(4)', () => {
		const uid = uidSync(4);
		expect(uid).toHaveLength(6);
	});

	it('uidSync(8)', () => {
		const uid = uidSync(8);
		expect(uid).toHaveLength(11);
	});

	it('uidSync(24)', () => {
		const uid = uidSync(24);
		expect(uid).toHaveLength(32);
	});
});
