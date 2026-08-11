/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  maxWorkers: 1,
  testTimeout: 60_000,
  forceExit: true,
};
