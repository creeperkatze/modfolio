import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		testTimeout: 20000,
		coverage: {
			provider: 'v8',
			reporter: ['lcov', 'text'],
			include: ['src/**'],
		},
	},
})
