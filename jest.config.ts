export default {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**',
    '!src/settings.ts',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: [
    'text',
    'lcov',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  preset: 'ts-jest',
};
