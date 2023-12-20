import TTLCache from '@isaacs/ttlcache';
import type { Store, SessionStoreData } from './index.js';

interface Serializer {
	parse(s: string): SessionStoreData | Promise<SessionStoreData>;
	stringify(data: SessionStoreData): string;
}

interface MemoryStoreOptions {
	prefix?: string;
	serializer?: Serializer;
	ttl?: number;
}

export default class MemoryStore implements Store {
	#sessions = new TTLCache();

	#prefix: string;

	#serializer: Serializer;

	#ttl: number;

	constructor(options?: MemoryStoreOptions) {
		this.#prefix = options?.prefix || '';
		this.#serializer = options?.serializer || JSON;
		this.#ttl = options?.ttl || Infinity;
	}

	async get(id: string): Promise<SessionStoreData | null> {
		const key = this.#prefix + id;
		const storeData = this.#sessions.get(key) as string;
		return storeData ? this.#serializer.parse(storeData) : null;
	}

	async set(id: string, storeData: SessionStoreData): Promise<void> {
		const key = this.#prefix + id;
		const serialized = this.#serializer.stringify(storeData);

		if (storeData.cookieOptions && storeData.cookieOptions.expires) {
			const ms = Number(new Date(storeData.cookieOptions.expires)) - Date.now();
			const ttl = Math.ceil(ms / 1000);
			this.#sessions.set(key, serialized, { ttl });
			return;
		}

		this.#sessions.set(key, serialized, { ttl: this.#ttl });
	}

	async destroy(id: string): Promise<void> {
		const key = this.#prefix + id;
		this.#sessions.delete(key);
	}
}
