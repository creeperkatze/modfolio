import eslint from '@eslint/js'
import prettierPlugin from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
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
	...pluginVue.configs['flat/recommended'],
	prettierPlugin,
	{
		files: ['src/**/*.vue'],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				parser: tseslint.parser,
			},
		},
	},
	{
		files: ['src/**/*.{js,ts}', '*.ts'],
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
		files: ['src/**/*.vue'],
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			'no-undef': 'off',
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
			'vue/html-self-closing': 'off',
			'vue/multi-word-component-names': 'off',
			'vue/require-default-prop': 'off',
		},
	},
	{
		ignores: ['dist/', 'node_modules/'],
	},
)
