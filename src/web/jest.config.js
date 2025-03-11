/**
 * Jest configuration file for the Health Advisor mobile application.
 * This configuration sets up test environment, patterns, coverage reporting,
 * and React Native integration for the testing framework.
 * 
 * @version 1.0.0
 */

module.exports = {
  // Use react-native preset for proper React Native testing environment
  preset: 'react-native',
  
  // Setup files to run after the test environment is set up
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup.ts',
    '@testing-library/jest-native/extend-expect', // jest-native version: 5.4.2
  ],
  
  // Transform files using babel-jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest', // babel-jest version: 29.5.0
  },
  
  // Regular expression pattern for test files
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  
  // File extensions to consider for testing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Patterns to ignore when transforming source files (important for React Native)
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-.*)/)'],
  
  // Enable code coverage collection
  collectCoverage: true,
  
  // Patterns to include for coverage reporting
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/assets/**/*',
    '!src/types/**/*',
    '!src/constants/**/*',
  ],
  
  // Directory to output coverage reports
  coverageDirectory: 'coverage',
  
  // Coverage thresholds to enforce based on specified requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'src/components': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/hooks': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Module name mapping for imports and asset mocking
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
    '\\.(jpg|jpeg|png|gif)$': '<rootDir>/__mocks__/imageMock.js',
  },
  
  // Patterns to ignore when searching for test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/e2e/',
  ],
  
  // Enable verbose test output for detailed test information
  verbose: true,
  
  // Set test timeout (30 seconds) for longer-running tests
  testTimeout: 30000,
};