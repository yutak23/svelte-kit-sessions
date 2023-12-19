import type { CookieSerializeOptions } from 'cookie';

export default class Cookie {
	domain?: string;

	expires?: Date;

	httpOnly?: boolean;

	maxAge?: number;

	partitioned?: boolean;

	path?: string;

	priority?: 'low' | 'medium' | 'high';

	sameSite?: boolean | 'lax' | 'strict' | 'none';

	secure?: boolean;

	constructor(options?: CookieSerializeOptions) {
		this.domain = options?.domain;
		this.expires = options?.expires;
		this.httpOnly = options?.httpOnly;
		this.maxAge = options?.maxAge;
		this.partitioned = options?.partitioned;
		this.path = options?.path;
		this.priority = options?.priority;
		this.sameSite = options?.sameSite;
		this.secure = options?.secure;
	}

	get(): string | undefined {
		return this.domain;
	}
}
