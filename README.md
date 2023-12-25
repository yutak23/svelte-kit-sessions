# svelte-kit-session

[![npm](https://img.shields.io/npm/v/svelte-kit-session.svg)](https://www.npmjs.com/package/svelte-kit-session)
[![unit test](https://github.com/yutak23/svelte-kit-session/actions/workflows/unit-test.yaml/badge.svg)](https://github.com/yutak23/svelte-kit-session/actions/workflows/unit-test.yaml)
[![integration test](https://github.com/yutak23/svelte-kit-session/actions/workflows/integration-test.yaml/badge.svg)](https://github.com/yutak23/svelte-kit-session/actions/workflows/integration-test.yaml)
![style](https://img.shields.io/badge/code%20style-airbnb-ff5a5f.svg)

Svelte Kit Session is a module for easy and efficient session management in SvelteKit. It is characterized by the flexibility of being able to freely select a store.

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

export const handle: Handle = sveltekitSessionHandle({ secret: 'secret', saveUninitialized: true });
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

export const handle: Handle = sequence(
	sveltekitSessionHandle({ secret: 'secret', saveUninitialized: true }),
	yourOwnHandle
);
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
import db from '$lib/server/db.ts';

interface TodoBody {
	title: string;
	memo: string;
}

export const POST: RequestHandler = async (event: RequestEvent) => {
	const { title, memo } = (await event.request.json()) as TodoBody;

	const todoId = await db.createTodo({ title, memo, userId: event.locals.session.data.userId });

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

export const handle = sveltekitSessionHandle({ secret: 'secret', saveUninitialized: true });
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

export const handle = sequence(
	sveltekitSessionHandle({ secret: 'secret', saveUninitialized: true }),
	yourOwnHandle
);
```

</details>

## Config options

| Name              | Type                                                                                    | Description                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name              | string                                                                                  | The name of the session ID cookie to set in the response. The default value is 'connect.sid'.                                                                |
| cookie            | [CookieSerializeOptions](https://github.com/jshttp/cookie?tab=readme-ov-file#options-1) | Cookie settings object. See [link](https://github.com/jshttp/cookie?tab=readme-ov-file#options-1) for details.                                               |
| rolling           | boolean                                                                                 | Force the session identifier cookie to be set on every response. The default value is `false`.                                                               |
| store             | [Store](https://github.com/yutak23/svelte-kit-session/blob/main/src/lib/index.ts#L120)  | The session store instance. The default value is new `MemoryStore` instance.                                                                                 |
| secret            | string                                                                                  | This is the secret used to sign the session cookie.                                                                                                          |
| saveUninitialized | boolean                                                                                 | Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. The default value is `false`. |

### Note: About cookie default values

The default value of the cookie matches the behavior of SvelteKit.

https://kit.svelte.dev/docs/types#public-types-cookies

However, it is implemented on the svelte-kit-session side so that `/` is set for `cookie.path`.

## How to develpment and test

Please be sure to read [Attention](#attension) first!

### Attension

This project uses [Playwright](https://playwright.dev/) for testing. Therefore, it must meet Playwright's [System requirements](https://playwright.dev/docs/intro#system-requirements).

If you only have a Linux environment that does not meet the System requirements(e.g., RHEL), you can develop and test with [VS Code devcontainer](https://code.visualstudio.com/docs/devcontainers/containers).

### Development

The directory structure is as follows.  
The code for the project to be developing is located in `src/lib`. Other files exist for E2E testing in Playwright.

```console
├── src
│   ├── app.d.ts
│   ├── app.html
│   ├── lib
│   │   ├── cookie-signature.ts
│   │   ├── index.ts
│   │   ├── memory-store.ts
│   │   └── session.ts
│   └── routes
│       └── +page.svelte
```

### Test

ユニットテストとインテグレーションテストの2つがある。

インテグレーションテストでは、`SveltekitSessionConfig`にあるオプションを網羅するようにテストを実装する。オプションの設定の切り替えは疑似的なDIで行う。また、実行されるテストについても、ファイル名で実行対象を決定するような設計になっている。

### Troubleshooting

Please take the following actions according to the error.

#### Error: browserType.launch: Executable doesn't exist at /home/<...>/.cache/ms-playwright/chromium-1091/chrome-linux/chrome

Please run the `yarn playwright install` command.

#### Error: browserType.launch:

Please run the `yarn playwright install-deps` command.
