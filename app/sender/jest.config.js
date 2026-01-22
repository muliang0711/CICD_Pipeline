module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'sender.js'
  ],
  testMatch: ['**/test/**/*.test.js'],
  verbose: true,
  testTimeout: 10000
};
