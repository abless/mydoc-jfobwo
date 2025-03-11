/**
 * ESLint configuration for Health Advisor React Native mobile application
 * @version 1.0.0
 * 
 * This configuration is designed to enforce code quality and consistency across the
 * Health Advisor mobile application codebase. It implements rules for TypeScript,
 * React, and React Native development best practices.
 */

module.exports = {
  // Stop ESLint from looking for configuration files in parent folders
  root: true,

  // Specify parser for TypeScript files
  parser: '@typescript-eslint/parser', // @typescript-eslint/parser v5.57.1

  // Parser options for TypeScript and React JSX
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },

  // Extend recommended configurations
  extends: [
    '@react-native-community', // @react-native-community/eslint-config v3.2.0
    'plugin:@typescript-eslint/recommended', // @typescript-eslint/eslint-plugin v5.57.1
    'plugin:react/recommended', // eslint-plugin-react v7.32.2
    'plugin:react-hooks/recommended', // eslint-plugin-react-hooks v4.6.0
  ],

  // Include additional plugins
  plugins: [
    'react', // eslint-plugin-react v7.32.2
    'react-hooks', // eslint-plugin-react-hooks v4.6.0
    '@typescript-eslint', // @typescript-eslint/eslint-plugin v5.57.1
  ],

  // Set environment globals
  env: {
    'react-native': true,
    'jest': true,
    'es2021': true,
  },

  // Custom rule configurations
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'interface',
        'format': ['PascalCase'],
        'prefix': ['I']
      },
      {
        'selector': 'typeAlias',
        'format': ['PascalCase']
      },
      {
        'selector': 'enum',
        'format': ['PascalCase']
      }
    ],
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',

    // React specific rules
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/self-closing-comp': 'error',
    'react/jsx-curly-brace-presence': ['error', { 'props': 'never', 'children': 'never' }],
    'react/jsx-pascal-case': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-unescaped-entities': 'error',
    'react/display-name': 'off',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General code quality rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'max-len': ['warn', { 'code': 100, 'ignoreComments': true, 'ignoreStrings': true }],
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    'semi': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
  },

  // Override rules for specific files
  overrides: [
    {
      files: ['**/__tests__/**/*.{js,ts,tsx}', '**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        // Relax some rules for test files
        '@typescript-eslint/no-explicit-any': 'off',
        'max-len': 'off',
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['*.js'],
      rules: {
        // Disable TypeScript rules for JavaScript files
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],

  // Files to ignore
  ignorePatterns: [
    'node_modules/',
    'ios/',
    'android/',
    'coverage/',
    'jest.config.js',
    'babel.config.js',
    'metro.config.js',
    'react-native.config.js',
    '*.json',
  ],

  // Plugin-specific settings
  settings: {
    react: {
      version: 'detect', // Auto-detect React version
    },
  },
};