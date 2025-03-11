import { Platform } from 'react-native'; // ^0.71.0
import { Typography } from '../types/theme.types';

/**
 * Returns the default system font family based on the platform
 * @returns The default system font family name
 */
export const getDefaultFontFamily = (): string => {
  // Use platform-specific default system fonts
  if (Platform.OS === 'ios') {
    return 'System';
  }
  return 'Roboto';
};

/**
 * Typography configuration for the Health Advisor application
 * Implements the Typography interface defined in theme.types
 * Based on the design system specifications:
 * - Headings: 20-24pt (xl, xxl)
 * - Body text: 16pt (m)
 * - Labels: 14pt (s)
 * - Buttons: 16pt (m)
 * 
 * Supports dynamic text sizing for accessibility and
 * adapts to different device sizes for responsive design
 */
export const typography: Typography = {
  fontFamily: {
    regular: getDefaultFontFamily(),
    medium: getDefaultFontFamily(),
    semiBold: getDefaultFontFamily(),
    bold: getDefaultFontFamily(),
  },
  fontSize: {
    xs: 12, // Small labels, captions
    s: 14,  // Labels, secondary text
    m: 16,  // Body text, buttons
    l: 18,  // Subheadings
    xl: 20, // Headings
    xxl: 24, // Large headings
  },
  lineHeight: {
    xs: 16, // 1.33x line height for xs
    s: 20,  // 1.43x line height for s 
    m: 24,  // 1.5x line height for m
    l: 28,  // 1.56x line height for l
    xl: 32, // 1.6x line height for xl
    xxl: 36, // 1.5x line height for xxl
  },
};