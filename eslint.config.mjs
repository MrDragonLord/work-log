import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{ ignores: ['coverage', 'dist', 'src/paraglide', 'src-tauri/target'] },
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		settings: {
			react: { version: 'detect' },
		},
		rules: {
			...react.configs.recommended.rules,
			...react.configs['jsx-runtime'].rules,
			...reactHooks.configs['recommended-latest'].rules,
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ fixStyle: 'inline-type-imports', prefer: 'type-imports' },
			],
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': [
				'error',
				{ checksVoidReturn: { attributes: false } },
			],
			'@typescript-eslint/no-non-null-assertion': 'error',
			curly: ['error', 'all'],
			eqeqeq: ['error', 'always'],
			'prefer-const': 'error',
			'react/prop-types': 'off',
			'react/self-closing-comp': 'warn',
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
			'sort-imports': [
				'error',
				{
					allowSeparatedGroups: true,
					ignoreCase: false,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
				},
			],
		},
	},
	{
		files: ['src/shared/ui/**/*.tsx'],
		rules: {
			'react-refresh/only-export-components': 'off',
		},
	},
	prettier,
)
