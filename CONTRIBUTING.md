## How to develpment and test

Please be sure to read [Attention](#attension) first!

**Attension** This project uses [Playwright](https://playwright.dev/) for testing. Therefore, it must meet Playwright's [System requirements](https://playwright.dev/docs/intro#system-requirements). If you only have a Linux environment that does not meet the System requirements(e.g., RHEL), you can develop and test with [VS Code devcontainer](https://code.visualstudio.com/docs/devcontainers/containers).

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

There are two types of tests: unit tests and integration tests.

In integration testing, tests are implemented to cover the options in `SveltekitSessionConfig`. Switching between option settings is done by a pseudo DI. The tests to be executed are also designed in such a way that the file name determines the target of execution.

### Troubleshooting

Please take the following actions according to the error.

#### Error: browserType.launch: Executable doesn't exist at /home/<...>/.cache/ms-playwright/chromium-1091/chrome-linux/chrome

Please run the `yarn playwright install` command.

#### Error: browserType.launch:

Please run the `yarn playwright install-deps` command.
