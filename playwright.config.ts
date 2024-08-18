import type { PlaywrightTestConfig } from '@playwright/test';
import fs from 'fs';

const configPattern = process.env.CONFIG_PATTERN || 'default';

const isExist = (checkConfigPattern: string): boolean => {
	const directory = './tests/integration';
	const dirents = fs.readdirSync(directory, { withFileTypes: true });
	return dirents
		.filter((dirent) => dirent.isFile())
		.some((dirent) => dirent.name === `${checkConfigPattern}.test.ts`);
};

const config: PlaywrightTestConfig = {
	webServer: {
		command: `CONFIG_PATTERN=${configPattern} yarn build && yarn preview`,
		port: 4173,
		stdout: 'pipe',
		stderr: 'pipe'
	},
	testDir: 'tests',
	// eslint-disable-next-line prefer-regex-literals
	testMatch: isExist(configPattern)
		? new RegExp(`/integration/${configPattern}(.test|.spec).[jt]s`)
		: /default.test.ts/,
	testIgnore: /\/lib\/.*\.test\.ts/,
	reporter: 'list'
};

console.log(config);

export default config;
