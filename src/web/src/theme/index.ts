/**
 * index.ts - Theme configuration
 * 
 * Central export file for the theming system of the Health Advisor mobile application.
 * Provides access to light and dark themes, typography, spacing metrics, and theme utility functions.
 * 
 * This file is responsible for:
 * - Exporting all theme-related components and utilities
 * - Providing a utility function to determine the appropriate theme based on theme mode
 * - Supporting dynamic theme switching including system theme detection
 */

import { Appearance } from 'react-native'; // ^0.71.0
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { typography } from './typography';
import { spacing, borderRadius, elevation } from './metrics';
import { ThemeMode, Theme } from '../types/theme.types';

/**
 * Returns the appropriate theme based on the specified theme mode
 * 
 * @param themeMode - The theme mode to use (LIGHT, DARK, or SYSTEM)
 * @returns The selected theme object (light or dark)
 */
export const getTheme = (themeMode: ThemeMode): Theme => {
  if (themeMode === ThemeMode.LIGHT) {
    return lightTheme;
  }
  
  if (themeMode === ThemeMode.DARK) {
    return darkTheme;
  }
  
  // For SYSTEM mode, check the device appearance
  if (themeMode === ThemeMode.SYSTEM) {
    const deviceTheme = Appearance.getColorScheme();
    return deviceTheme === 'dark' ? darkTheme : lightTheme;
  }
  
  // Default to light theme
  return lightTheme;
};

// Export the light and dark themes
export { lightTheme, darkTheme };

// Export typography and metrics
export { typography, spacing, borderRadius, elevation };