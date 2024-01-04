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
