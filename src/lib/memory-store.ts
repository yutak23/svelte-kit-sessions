import TTLCache from '@isaacs/ttlcache';
import type { Store, SessionData } from './index.js';

interface Serializer {
	parse(s: string): SessionData | Promise<SessionData>;
	stringify(data: SessionData): string;
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
		this.#ttl = options?.ttl || 86400; // One day in seconds.;
	}

	async get(id: string): Promise<SessionData | null> {
		const key = this.#prefix + id;
		const data = this.#sessions.get(key) as string;
		return data ? this.#serializer.parse(data) : null;
	}

	async set(id: string, data: SessionData): Promise<void> {
		const key = this.#prefix + id;
		const serialized = this.#serializer.stringify(data);

		if (data.cookie && data.cookie.expires) {
			const ms = Number(new Date(data.cookie?.expires)) - Date.now();
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
