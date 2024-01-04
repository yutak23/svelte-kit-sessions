# svelte-kit-session

[![npm](https://img.shields.io/npm/v/svelte-kit-session.svg)](https://www.npmjs.com/package/svelte-kit-session)
[![unit test](https://github.com/yutak23/svelte-kit-session/actions/workflows/unit-test.yaml/badge.svg)](https://github.com/yutak23/svelte-kit-session/actions/workflows/unit-test.yaml)
[![integration test](https://github.com/yutak23/svelte-kit-session/actions/workflows/integration-test.yaml/badge.svg)](https://github.com/yutak23/svelte-kit-session/actions/workflows/integration-test.yaml)
![style](https://img.shields.io/badge/code%20style-airbnb-ff5a5f.svg)

Svelte Kit Session is a module for easy and efficient session management in SvelteKit.

## Features

- **Simple session management module**: Svelte Kit Session is designed to be simple enough to be used in a variety of use cases, including a pattern in which sessions are paid out after authentication by the user's own application, or after authentication using OpenID Connect.
- **Customizable Store**: In addition to the default MemoryStore, various other stores such as Redis and Cloudflare KV are available
- **Also available in edge environments**: Svelte Kit Session also supports use in the Edge environment such as Cloudflare Pages Functions(Cloudflare Workers).

## Installation

```console
$ npm i svelte-kit-session

$ yarn add svelte-kit-session

$ pnpm add svelte-kit-session
```

## Usage

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { sveltekitSessionHandle } from 'svelte-kit-session';

export const handle: Handle = sveltekitSessionHandle({ secret: 'secret' });
```

or if you want to use it with your own handle, you can use [sequence](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence).

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { sveltekitSessionHandle } from 'svelte-kit-session';

const yourOwnHandle: Handle = async ({ event, resolve }) => {
	// `event.locals.session` is available
	// your code here
	const result = await resolve(event);
	return result;
};

export const handle: Handle = sequence(sveltekitSessionHandle({ secret: 'secret' }), yourOwnHandle);
```

After the above implementation, you can use the following in Actions and API routes.

### Actions

```ts
// src/routes/login/+page.server.ts
import type { ServerLoad, Actions } from '@sveltejs/kit';
import type Session from 'svelte-kit-session';
import db from '$lib/server/db.ts';

export const load: ServerLoad = async ({ locals }) => {
	const session: Session = locals; // you can access `locals.session`
	const user = await db.getUserFromId(session.data.userId);
	return { user };
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const session: Session = locals; // you can access `locals.session`

		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');
		const user = await db.getUser(email, password);

		await session.setData({ id: user.id, name: user.name }); // set data to session
		await session.save(); // session saveand session create(session data is stored and set-cookie)

		return { success: true };
	},
	...
};
```

### API route

```ts
// src/routes/api/todo/+server.ts
import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import type Session from 'svelte-kit-session';
import db from '$lib/server/db.ts';

interface TodoBody {
	title: string;
	memo: string;
}

export const POST: RequestHandler = async (event: RequestEvent) => {
	const session: Session = event.locals; // you can access `locals.session`

	const { title, memo } = (await event.request.json()) as TodoBody;
	const todoId = await db.createTodo({ title, memo, userId: session.data.userId });

	return json({ id: todoId }, { status: 200 });
};
```

### Typing your session data

You can use [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to define types as follows.

```ts
// src/hooks.server.ts
declare module 'svelte-kit-session' {
	interface SessionData {
		userId: string;
		name: string;
	}
}
```

<details>

<summary>Click here to see how to use in JavaScript</summary>

### JavaScript

```js
// src/hooks.server.js
import { sveltekitSessionHandle } from 'svelte-kit-session';

export const handle = sveltekitSessionHandle({ secret: 'secret' });
```

or if you want to use it with your own handle, you can use [sequence](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence).

```js
// src/hooks.server.js
import { sequence } from '@sveltejs/kit/hooks';
import { sveltekitSessionHandle } from 'svelte-kit-session';

const yourOwnHandle = async ({ event, resolve }) => {
	// `event.locals.session` is available
	// your code here
	const result = await resolve(event);
	return result;
};

export const handle = sequence(sveltekitSessionHandle({ secret: 'secret' }), yourOwnHandle);
```

</details>

## API

```ts
import { sveltekitSessionHandle } from 'svelte-kit-session';

sveltekitSessionHandle(options);
```

### sveltekitSessionHandle(options)

Create a server hooks handle with the given `options`. This allows access to `event.locals.session` in hooks handles, Actions and API route.

**Note** Session data is _not_ saved in the cookie itself, just the session ID.
Session data is stored server-side.

**Warning** The default server-side session storage, `MemoryStore`, is _purposely_
not designed for a production environment. It will leak memory under most
conditions, does not scale past a single process, and is meant for debugging and
developing.

For a list of stores, see [Compatible Session Stores](#compatible-session-stores).

#### Apis(class methods)

A summary of the `event.locals.session` class methods is as follows.

| Name       | Arguments      | Return          | Description                                              |
| ---------- | -------------- | --------------- | -------------------------------------------------------- |
| setData    | 1. SessionData | Promise\<void\> | Set data in the session.                                 |
| save       | _nothing_      | Promise\<void\> | Save the session (save session to store) and set cookie. |
| regenerate | _nothing_      | Promise\<void\> | Regenerate the session simply invoke the method.         |
| destroy    | _nothing_      | Promise\<void\> | Destroy the session.                                     |

##### session.setData(data)

Set data in the session.

**Note** If `saveUninitialized` is `true`, the session is saved without calling `save()`.
Conversely, if `saveUninitialized` is `false`, call `save()` to explicitly save the session.

###### arguments

1. SessionData  
   Data to be stored in the session.  
   In TypeScript, you can declare additional properties on your session object using [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) for interface `SessionData`.

###### return

Promise\<void\>

##### session.save()

#### Options

A summary of the `options` is as follows.

| Name              | Type                                                                                    | required/optional | Description                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name              | string                                                                                  | _optional_        | The name of the session ID cookie to set in the response. The default value is 'connect.sid'.                                                                |
| cookie            | [CookieSerializeOptions](https://github.com/jshttp/cookie?tab=readme-ov-file#options-1) | _optional_        | Cookie settings object. See [link](https://github.com/jshttp/cookie?tab=readme-ov-file#options-1) for details.                                               |
| rolling           | boolean                                                                                 | _optional_        | Force the session identifier cookie to be set on every response. The default value is `false`. If `cookie.maxAge` is not set, this option is ignored.        |
| store             | [Store](https://github.com/yutak23/svelte-kit-session/blob/main/src/lib/index.ts#L120)  | _optional_        | The session store instance. The default value is new `MemoryStore` instance.                                                                                 |
| secret            | string                                                                                  | _required_        | This is the secret used to sign the session cookie.                                                                                                          |
| saveUninitialized | boolean                                                                                 | _optional_        | Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. The default value is `false`. |

##### name

The name of the session ID cookie to set in the response (and read from in the request). The default value is 'connect.sid'.

**Note** If you have multiple apps running on the same hostname (this is just the name, i.e. `localhost` or `127.0.0.1`; different schemes and ports do not name a different hostname), then you need to separate the session cookies from each other. The simplest method is to simply set different names per app.

##### cookie

Cookie settings object. Exactly the same options that can be specified in `cookie.serialize` of the [cookie npm package](https://www.npmjs.com/package/cookie).

**Note** The default value of the cookie matches the behavior of SvelteKit. For more details, please check https://kit.svelte.dev/docs/types#public-types-cookies. However, for the `cookie.path`, it is implemented so that `/` is set on the Svelte Kit Session side.

The following are options that can be set in this object.

###### cookie.domain

Specifies the value for the [`Domain` `Set-Cookie` attribute][rfc-6265-5.2.3]. By default, no domain is set, and most clients will consider the cookie to apply to only the current domain.

###### cookie.encode

Specifies a function that will be used to encode a cookie's value. Since value of a cookie has a limited character set (and must be a simple string), this function can be used to encode a value into a string suited for a cookie's value.

The default function is the global `encodeURIComponent`, which will encode a JavaScript string into UTF-8 byte sequences and then URL-encode any that fall outside of the cookie range.

###### cookie.expires

Specifies the `Date` object to be the value for the [`Expires` `Set-Cookie` attribute][rfc-6265-5.2.1]. By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete it on a condition like exiting a web browser application.

**Note** the [cookie storage model specification][rfc-6265-5.3] states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this, so if both are set, they should point to the same date and time.

###### cookie.httpOnly

Specifies the `boolean` value for the [`HttpOnly` `Set-Cookie` attribute][rfc-6265-5.2.6]. When truthy, the `HttpOnly` attribute is set, otherwise it is not. By default, the `HttpOnly` attribute is not set.

**Note** be careful when setting this to `true`, as compliant clients will not allow client-side JavaScript to see the cookie in `document.cookie`.

###### cookie.maxAge

Specifies the `number` (in seconds) to be the value for the [`Max-Age` `Set-Cookie` attribute][rfc-6265-5.2.2]. The given number will be converted to an integer by rounding down. By default, no maximum age is set.

**Note** the [cookie storage model specification][rfc-6265-5.3] states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is possible not all clients by obey this, so if both are set, they should point to the same date and time.

###### cookie.partitioned

Specifies the `boolean` value for the [`Partitioned` `Set-Cookie`](rfc-cutler-httpbis-partitioned-cookies) attribute. When truthy, the `Partitioned` attribute is set, otherwise it is not. By default, the `Partitioned` attribute is not set.

**Note** This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.

More information about can be found in [the proposal](https://github.com/privacycg/CHIPS).

###### cookie.path

Specifies the value for the [`Path` `Set-Cookie` attribute][rfc-6265-5.2.4]. By default, the path is considered the ["default path"][rfc-6265-5.1.4].

###### cookie.priority

Specifies the `string` to be the value for the [`Priority` `Set-Cookie` attribute][rfc-west-cookie-priority-00-4.1].

- `'low'` will set the `Priority` attribute to `Low`.
- `'medium'` will set the `Priority` attribute to `Medium`, the default priority when not set.
- `'high'` will set the `Priority` attribute to `High`.

More information about the different priority levels can be found in [the specification][rfc-west-cookie-priority-00-4.1].

**Note** This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.

###### cookie.sameSite

Specifies the `boolean` or `string` to be the value for the [`SameSite` `Set-Cookie` attribute][rfc-6265bis-09-5.4.7].

- `true` will set the `SameSite` attribute to `Strict` for strict same site enforcement.
- `false` will not set the `SameSite` attribute.
- `'lax'` will set the `SameSite` attribute to `Lax` for lax same site enforcement.
- `'none'` will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
- `'strict'` will set the `SameSite` attribute to `Strict` for strict same site enforcement.

More information about the different enforcement levels can be found in [the specification][rfc-6265bis-09-5.4.7].

**Note** This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.

###### cookie.secure

Specifies the `boolean` value for the [`Secure` `Set-Cookie` attribute][rfc-6265-5.2.5]. When truthy, the `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.

**note** be careful when setting this to `true`, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection.

##### rolling

Force the session identifier cookie to be set on every response. The expiration is reset to the original `maxAge`, resetting the expiration countdown. The default value is `false`. If `cookie.maxAge` is not set, this option is ignored.

With this enabled, the session identifier cookie will expire in `maxAge` _since the last response was sent_ instead of in `maxAge` _since the session was last modified by the server_.
This is typically used in conjuction with short, non-session-length `maxAge` values to provide a quick timeout of the session data
with reduced potential of it occurring during on going server interactions.

**Note** When this option is set to `true` but the `saveUninitialized` option is set to `false`, the cookie will not be set on a response with an uninitialized session.
This option only modifies the behavior when an existing session was loaded for the request.

##### store

The session store instance. The default value is new `MemoryStore` instance.

**Note** See the chapter [Session Store Implementation](#session-store-implementation) for more information on the store.

##### secret

This is the secret used to sign the session cookie.
The secret itself should be not easily parsed by a human and would best be a random set of characters.

Best practices may include:

- The use of environment variables to store the secret, ensuring the secret itself does not exist in your repository.
- Periodic updates of the secret.

Using a secret that cannot be guessed will reduce the ability to hijack a session to only guessing the session ID.

Changing the secret value will invalidate all existing sessions.

##### saveUninitialized

Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. The default value is `false`.

Choosing `false` is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing `false` will also help with race conditions where a client makes multiple parallel requests without a session.

## Session Store Implementation

## Compatible Session Stores

_Currently under development and no stores available at this time. You can implement your own store by referring to the chapter [Session Store Implementation](#session-store-implementation)._

## Contributing

We're open to all community contributions! If you'd like to contribute in any way, please first read
our [Contributing Guide](./CONTRIBUTING.md).

## License

[MIT licensed](./LICENSE)
