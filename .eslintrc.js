module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/typescript'],
  rules: {
    'no-console': 0,
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  overrides: [
    {
      files: ['**/__tests__/*.{j,t}s?(x)'],
      env: {
        jest: true,
      },
    },
  ],
}
