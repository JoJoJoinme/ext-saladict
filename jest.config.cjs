/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  testMatch: ['**/test/**/*.spec.ts', '**/test/**/*.spec.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/test/__mocks__/fileMock.js'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: ['<rootDir>/config/jest/setupTests.cjs'],
  testTimeout: 20000
}
