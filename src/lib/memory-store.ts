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

const ONE_DAY_IN_SECONDS = 86400;

export default class MemoryStore implements Store {
	#sessions = new TTLCache();

	#prefix: string;

	#serializer: Serializer;

	/**
	 * Time to live in milliseconds.
	 * default: 86400 * 1000
	 */
	#ttl: number;

	constructor(options?: MemoryStoreOptions) {
		this.#prefix = options?.prefix || '';
		this.#serializer = options?.serializer || JSON;
		this.#ttl = options?.ttl || ONE_DAY_IN_SECONDS * 1000;
	}

	async get(id: string): Promise<SessionStoreData | null> {
		const key = this.#prefix + id;
		const storeData = this.#sessions.get(key) as string;
		return storeData ? this.#serializer.parse(storeData) : null;
	}

	async set(id: string, storeData: SessionStoreData, ttl: number): Promise<void> {
		const key = this.#prefix + id;
		const serialized = this.#serializer.stringify(storeData);

		if (ttl !== Infinity) {
			this.#sessions.set(key, serialized, { ttl });
			return;
		}
		this.#sessions.set(key, serialized, { ttl: this.#ttl });
	}

	async destroy(id: string): Promise<void> {
		const key = this.#prefix + id;
		this.#sessions.delete(key);
	}

	async touch(id: string, ttl: number): Promise<void> {
		const key = this.#prefix + id;
		this.#sessions.setTTL(key, ttl);
	}
}
