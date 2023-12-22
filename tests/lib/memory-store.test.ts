import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import MemoryStore from '../../src/lib/memory-store.js';
import type { SessionStoreData } from '../../src/lib/index.js';

declare module '../../src/lib/index.js' {
	interface SessionData {
		user?: string;
	}
}

describe('MemoryStore', () => {
	let memoryStore: MemoryStore;

	beforeEach(() => {
		memoryStore = new MemoryStore({
			prefix: 'test:',
			serializer: JSON
		});
	});

	// Clean up any remaining sessions after each test
	afterAll(async () => {
		await Promise.all(
			['session1', 'session2', 'session3', 'nonexistent'].map(async (id) => {
				await memoryStore.destroy(id);
			})
		);
	});

	it('should get session data', async () => {
		const id = 'session1';
		const storeData: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

		await memoryStore.set(id, storeData, Infinity);
		const result = await memoryStore.get(id);

		expect(result).toEqual(storeData);
	});

	it('should return null for non-existent session', async () => {
		const id = 'nonexistent';

		const result = await memoryStore.get(id);

		expect(result).toBeNull();
	});

	it('should set session data', async () => {
		const id = 'session2';
		const data: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

		await memoryStore.set(id, data, Infinity);
		const result = await memoryStore.get(id);

		expect(result).toEqual(data);
	});

	it('should destroy session', async () => {
		const id = 'session3';
		const data: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

		await memoryStore.set(id, data, Infinity);
		await memoryStore.destroy(id);
		const result = await memoryStore.get(id);

		expect(result).toBeNull();
	});
});
