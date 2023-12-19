import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import MemoryStore from '../../src/lib/memory-store.js';
import type { SessionData } from '../../src/lib/index.js';
import Cookie from '../../src/lib/cookie.js';

interface TestSessionData extends SessionData {
	user: string;
}

describe('MemoryStore', () => {
	let memoryStore: MemoryStore;

	beforeEach(() => {
		memoryStore = new MemoryStore({
			prefix: 'test:',
			serializer: JSON,
			ttl: 86400
		});
	});

	afterAll(async () => {
		// Clean up any remaining sessions after each test
		await Promise.all(
			['session1', 'session2', 'session3', 'nonexistent'].map(async (id) => {
				await memoryStore.destroy(id);
			})
		);
	});

	it('should get session data', async () => {
		const id = 'session1';
		const data: TestSessionData = { user: 'john.doe', cookie: new Cookie() };

		await memoryStore.set(id, data);
		const result = await memoryStore.get(id);

		expect(result).toEqual(data);
	});

	it('should return null for non-existent session', async () => {
		const id = 'nonexistent';

		const result = await memoryStore.get(id);

		expect(result).toBeNull();
	});

	it('should set session data', async () => {
		const id = 'session2';
		const data: TestSessionData = { user: 'john.doe', cookie: new Cookie() };

		await memoryStore.set(id, data);
		const result = await memoryStore.get(id);

		expect(result).toEqual(data);
	});

	it('should destroy session', async () => {
		const id = 'session3';
		const data: TestSessionData = { user: 'john.doe', cookie: new Cookie() };

		await memoryStore.set(id, data);
		await memoryStore.destroy(id);
		const result = await memoryStore.get(id);

		expect(result).toBeNull();
	});
});
