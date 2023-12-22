import { afterEach, describe, expect, it } from 'vitest';
import MemoryStore from '../../src/lib/memory-store.js';
import type { SessionStoreData } from '../../src/lib/index.js';

declare module '../../src/lib/index.js' {
	interface SessionData {
		user?: string;
	}
}

const sleep = async (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

describe('MemoryStore', () => {
	let memoryStore: MemoryStore | null;

	afterEach(() => {
		memoryStore = null;
	});

	describe('get', () => {
		it('should get session data', async () => {
			memoryStore = new MemoryStore();
			const sid = 'sessionId';
			const storeData: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

			await memoryStore.set(sid, storeData, 10 * 1000);
			const result = await memoryStore.get(sid);

			expect(result).toEqual(storeData);
		});

		it('should get null, not exist', async () => {
			memoryStore = new MemoryStore();
			const sid = 'sessionId';

			const result = await memoryStore.get(sid);

			expect(result).toBeNull();
		});

		it('should get null, when ttl is reached', async () => {
			memoryStore = new MemoryStore();
			const sid = 'sessionId';
			const storeData: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

			await memoryStore.set(sid, storeData, 0.1 * 1000);
			await sleep(150);
			const result = await memoryStore.get(sid);

			expect(result).toBeNull();
		});
	});

	describe('set', () => {
		it('should set session data', async () => {
			memoryStore = new MemoryStore();
			const sid = 'sessionId';
			const storeData: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

			await memoryStore.set(sid, storeData, 10 * 1000);
			const result = await memoryStore.get(sid);

			expect(result).toEqual(storeData);
		});

		it('should ttl is constructor ttl, when Infinity', async () => {
			memoryStore = new MemoryStore({ ttl: 0.1 * 1000 });
			const sid = 'sessionId';
			const storeData: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

			await memoryStore.set(sid, storeData, Infinity);
			await sleep(150);
			const result = await memoryStore.get(sid);

			expect(result).toBeNull();
		});
	});

	describe('destroy', () => {
		it('should destroy session', async () => {
			memoryStore = new MemoryStore();
			const sid = 'sessionId';
			const storeData: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

			await memoryStore.set(sid, storeData, 10 * 1000);
			await memoryStore.destroy(sid);
			const result = await memoryStore.get(sid);

			expect(result).toBeNull();
		});
	});

	describe('touch', () => {
		it('should ttl is extended', async () => {
			memoryStore = new MemoryStore();
			const sid = 'sessionId';
			const storeData: SessionStoreData = { data: { user: 'john.doe' }, cookie: { path: '/' } };

			await memoryStore.set(sid, storeData, 0.5 * 1000);
			await memoryStore.touch(sid, 10 * 1000);
			await sleep(1000);
			const result = await memoryStore.get(sid);

			expect(result).toEqual(storeData);
		});
	});
});
