import type { Config } from '@jest/types'; // @jest/types ^29.5.0

/**
 * Jest configuration for the Health Advisor backend application
 * Defines test environment settings, patterns, coverage reporting, and TypeScript integration
 */
const config: Config.InitialOptions = {
  // Use ts-jest preset for TypeScript integration
  preset: 'ts-jest',
  
  // Run tests in Node.js environment
  testEnvironment: 'node',
  
  // Look for tests in both src and tests directories
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Use ts-jest to transform TypeScript files
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // Pattern to detect test files (tests in __tests__ directories or files ending with .test.ts or .spec.ts)
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Setup files to run after environment setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Enable code coverage collection
  collectCoverage: true,
  
  // Patterns to collect coverage from (exclude d.ts files, server.ts, and types directory)
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/types/**/*'
  ],
  
  // Directory where coverage reports will be stored
  coverageDirectory: 'coverage',
  
  // Coverage thresholds to enforce code quality
  coverageThreshold: {
    // Global coverage thresholds
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Utils should have higher coverage
    'src/utils': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Services should have higher coverage
    'src/services': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Enable verbose output for detailed test reporting
  verbose: true,
  
  // Set test timeout to 30 seconds (for tests that might include LLM service integration)
  testTimeout: 30000,
  
  // Module path aliases for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

export default config;