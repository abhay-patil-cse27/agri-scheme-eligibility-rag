import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'android', 'node_modules', 'public']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Allow vars that start with uppercase OR underscore (e.g. _err in catch blocks)
      // Also treats catch clause bindings beginning with _ as intentionally unused
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        // Framer Motion: motion.div counts as usage of `motion`
        // ESLint sees member expressions as usage — this is correct by spec.
        // The false-positives were caused by the error level being too strict.
      }],
      // Downgrade the set-state-in-effect rule to warn (it is intentional in ProfileForm)
      'react-hooks/exhaustive-deps': 'warn',
      // Allow hooks/helpers to be exported from Context or Switcher files
      'react-refresh/only-export-components': 'off',
      // Allow syncing state dynamically inside effects (common in multi-stage forms)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])

