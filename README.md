# create-svelte

Everything you need to build a Svelte library, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

Read more about creating a library [in the docs](https://kit.svelte.dev/docs/packaging).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

Everything inside `src/lib` is part of your library, everything inside `src/routes` can be used as a showcase or preview app.

## Building

To build your library:

```bash
npm run package
```

To create a production version of your showcase app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Publishing

Go into the `package.json` and give your package the desired name through the `"name"` option. Also consider adding a `"license"` field and point it to a `LICENSE` file which you can create from a template (one popular option is the [MIT license](https://opensource.org/license/mit/)).

To publish your library to [npm](https://www.npmjs.com):

```bash
npm publish
```

Cookieのデフォルト値は、SvelteKitの動作に一致しています。
https://kit.svelte.jp/docs/types#public-types-cookies

// https://github.com/sveltejs/kit/blob/%40sveltejs/kit%402.0.3/packages/kit/src/runtime/server/cookie.js#L40

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
