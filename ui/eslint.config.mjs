import gravityConfig from '@gravity-ui/eslint-config';
import a11yConfig from '@gravity-ui/eslint-config/a11y';
import clientConfig from '@gravity-ui/eslint-config/client';
import prettierConfig from '@gravity-ui/eslint-config/prettier';

export default [
  ...gravityConfig,
  ...clientConfig,
  ...a11yConfig,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
      'no-return-assign': 'off',
      'no-useless-escape': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/parameter-properties': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'react/display-name': 'off',
      'react/jsx-no-useless-fragment': 'warn',
    },
  },
  ...prettierConfig,
];
