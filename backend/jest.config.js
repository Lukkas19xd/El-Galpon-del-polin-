export default {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  // Los tests usan su propia base de datos (ver tests/config/)
  globalSetup: './tests/config/prepararBase.js',
  setupFiles: ['./tests/config/entorno.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js'
  ]
};
