import js from '@eslint/js';

export default [
  {
    ignores: ['dist/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {},

      globals: {


        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        MutationObserver: 'readonly',
        AbortController: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        queueMicrotask: 'readonly',
        console: 'readonly',
        __REACT_DEVTOOLS_GLOBAL_HOOK__: 'readonly',
        process: 'readonly',
      },
    },
  },
  js.configs.recommended,
];



