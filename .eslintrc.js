// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended`
    // for stricter rules.
    'eslint:recommended',
    'plugin:vue/essential',
  ],
  // required to lint *.vue files
  plugins: ['vue'],
  // add your custom rules here
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 2 : 1,
    'comma-dangle': ['off', 'ignore'],
    semi: ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
  },
}
