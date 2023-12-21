import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: `CONFIG_PATTERN=${process.env.CONFIG_PATTERN || 'default'} yarn build && yarn preview`,
		port: 4173,
		stdout: 'pipe',
		stderr: 'pipe'
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	testIgnore: /lib\/.*\.test\.ts/
};

export default config;
