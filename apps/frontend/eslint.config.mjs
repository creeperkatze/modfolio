import eslint from '@eslint/js'
import prettierPlugin from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginVue from 'eslint-plugin-vue'

export default [
	eslint.configs.recommended,
	...pluginVue.configs['flat/recommended'],
	prettierPlugin,
	{
		languageOptions: {
			globals: {
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				console: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				fetch: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				Image: 'readonly',
				performance: 'readonly',
			},
		},
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'vue/html-self-closing': 'off',
			'vue/multi-word-component-names': 'off',
			'vue/require-default-prop': 'off',
		},
	},
	{
		ignores: ['dist/', 'node_modules/'],
	},
]
