import js from '@eslint/js';
import next from 'eslint-config-next-flat';
import drizzlePlugin from 'eslint-plugin-drizzle';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'build/**'] },
  js.configs.recommended,
  next,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      drizzle: drizzlePlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {},
  },
];
