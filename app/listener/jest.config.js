module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'listener.js'
  ],
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true
};
