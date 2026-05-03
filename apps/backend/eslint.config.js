import eslint from '@eslint/js'
import prettierPlugin from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	prettierPlugin,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				fetch: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				setImmediate: 'readonly',
				clearImmediate: 'readonly',
				Date: 'readonly',
				JSON: 'readonly',
				encodeURIComponent: 'readonly',
			},
		},
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
	{
		ignores: ['node_modules/', 'dist/'],
	},
)
