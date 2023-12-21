import type { PlaywrightTestConfig } from '@playwright/test';

const configPattern = process.env.CONFIG_PATTERN || 'default';

const config: PlaywrightTestConfig = {
	webServer: {
		command: `CONFIG_PATTERN=${configPattern} yarn build && yarn preview`,
		port: 4173,
		stdout: 'pipe',
		stderr: 'pipe'
	},
	testDir: 'tests',
	// eslint-disable-next-line prefer-regex-literals
	testMatch: new RegExp(`/e2e/${configPattern}(.test|.spec).[jt]s`),
	testIgnore: /\/lib\/.*\.test\.ts/
};

export default config;
