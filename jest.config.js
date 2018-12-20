module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'vue'],

  transform: {
    '^.+\\.vue$': 'vue-jest',
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  snapshotSerializers: ['jest-serializer-vue'],
  testMatch: ['**/tests/unit/**/*.spec.(js|jsx|ts|tsx)|**/__tests__/*.(js|jsx|ts|tsx)'],
  setupFiles: ['jest-localstorage-mock', '<rootDir>/tests/unit/setup'],
  collectCoverage: false,
  coverageDirectory: '<rootDir>/tests/unit/coverage',
  collectCoverageFrom: ['src/**/*.{js,vue}', '!src/main.ts', '!src/router.ts', '!**/node_modules/**'],
}
