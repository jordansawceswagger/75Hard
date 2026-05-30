import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Context files (e.g. lib/auth.jsx) intentionally export a provider
      // component alongside a useAuth hook — standard React Context pattern.
      'react-refresh/only-export-components': 'warn',
      // The auth provider syncs React state to Supabase's auth subscription;
      // clearing profile state in that effect is intended, not a bug.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
