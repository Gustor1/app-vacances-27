import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Correctness only: formatting and compiler optimization rules are outside L3.
export default [
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/e2e/**/*.ts', 'scripts/**/*.ts', '*config.ts'],
    languageOptions: { parser: tseslint.parser, globals: { ...globals.browser, ...globals.node } },
    plugins: { '@typescript-eslint': tseslint.plugin, 'react-hooks': hooks },
    rules: {
      ...js.configs.recommended.rules,
      // TypeScript validates bindings; core no-undef/unused rules misread TS types.
      'no-undef': 'off', 'no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['scripts/l8-*.mjs', 'scripts/measure-l8.mjs', 'scripts/prepare-l8-release.mjs', 'scripts/smoke-l8-*.mjs', 'scripts/l6-*.mjs', 'scripts/smoke-l6-*.mjs', 'scripts/test-l6-*.mjs', 'tests/preparation.test.mjs', 'scripts/l5-*.mjs', 'scripts/smoke-l5-*.mjs', 'tests/now.test.mjs', 'scripts/l4-*.mjs', 'scripts/smoke-l4-*.mjs', 'tests/offline.test.mjs', 'scripts/build-identity.mjs', 'scripts/check-build.mjs', 'scripts/build-sw.mjs', 'scripts/remote-fixture.mjs', 'scripts/verify*.mjs', 'scripts/test-supabase.mjs', 'scripts/smoke-converter-live.mjs', 'tests/quality-gates.test.mjs', 'eslint.config.mjs'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: js.configs.recommended.rules,
  },
];
