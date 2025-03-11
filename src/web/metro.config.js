/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * This configuration customizes how the React Native code is bundled for the
 * Health Advisor application, supporting both iOS and Android platforms.
 *
 * @format
 */

const { getDefaultConfig } = require('metro-config'); // ^0.76.2

module.exports = (async () => {
  // Get the default Metro configuration to extend
  const defaultConfig = await getDefaultConfig();

  return {
    transformer: {
      // Use the svg transformer to handle SVG files as React components
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      
      // Configure transformation options
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      // Define which file extensions should be processed as assets
      assetExts: [
        'png', 
        'jpg', 
        'jpeg', 
        'gif', 
        'bmp', 
        'ttf', 
        'otf'
      ],
      
      // Define which file extensions should be processed as source code
      // Including SVG files as source extensions allows them to be imported as components
      sourceExts: [
        'js', 
        'jsx', 
        'ts', 
        'tsx', 
        'json', 
        'svg'
      ],
    },
  };
})();