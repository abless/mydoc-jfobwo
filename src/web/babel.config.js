/**
 * Babel configuration for the Health Advisor React Native application
 * 
 * This configuration enables:
 * - React Native JavaScript/TypeScript transpilation
 * - Path aliasing for cleaner imports
 * - Environment-specific optimizations
 * - Jest testing support
 * 
 * @version 1.0.0
 */

module.exports = {
  // React Native preset that includes all necessary transformations for mobile development
  presets: ['module:metro-react-native-babel-preset'],
  
  plugins: [
    // Module resolver plugin for import path aliasing
    [
      'module-resolver',
      {
        root: ['./src'],
        // Support for JavaScript and TypeScript files
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        // Path aliases for cleaner imports across the application
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@contexts': './src/contexts',
          '@services': './src/services',
          '@utils': './src/utils',
          '@types': './src/types',
          '@assets': './src/assets',
          '@constants': './src/constants',
          '@theme': './src/theme',
          '@api': './src/api',
        },
      },
    ],
    // Support for the Reanimated library (used for animations)
    'react-native-reanimated/plugin',
  ],
  
  // Environment-specific configurations
  env: {
    // Production build optimizations
    production: {
      // Remove console.log statements in production for better performance
      plugins: ['transform-remove-console'],
    },
    // Test environment configuration (for Jest)
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            // Target current Node.js version for testing
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    },
  },
};