/**
 * darkTheme.ts
 * 
 * Defines the dark theme configuration for the Health Advisor application.
 * Implements the Theme interface with dark mode color palette and styling properties.
 * 
 * This theme ensures WCAG AA compliant contrast ratios for accessibility
 * and adapts to different device sizes and orientations for responsive design.
 */

import { DARK, COMMON } from '../constants/colors';
import { Theme } from '../types/theme.types';
import { typography } from './typography';
import { spacing, borderRadius, elevation } from './metrics';

/**
 * Dark theme configuration for the Health Advisor application
 * 
 * Combines the dark color palette with typography, spacing, and other styling
 * properties to create a consistent dark mode experience.
 * 
 * The color palette follows the specifications from the design system:
 * - Primary: #2C5282 (darker blue for dark mode)
 * - Secondary: #4A6FA5 (secondary blue adapted for dark mode)
 * - Accent: #FF8C42 (orange accent for calls-to-action)
 * - Background: #1A202C (dark background)
 * - Text: #E2E8F0 (light gray text for dark mode readability)
 */
export const darkTheme: Theme = {
  // Color palette combining dark mode specific colors with common colors
  colors: {
    // Brand colors
    PRIMARY: DARK.PRIMARY,
    SECONDARY: DARK.SECONDARY,
    ACCENT: DARK.ACCENT,
    
    // UI colors
    BACKGROUND: DARK.BACKGROUND,
    TEXT: DARK.TEXT,
    
    // Semantic colors
    ERROR: DARK.ERROR,
    SUCCESS: DARK.SUCCESS,
    WARNING: DARK.WARNING,
    INFO: DARK.INFO,
    
    // UI element colors
    BORDER: DARK.BORDER,
    CARD: DARK.CARD,
    DISABLED: DARK.DISABLED,
    
    // Common colors that remain consistent across themes
    TRANSPARENT: COMMON.TRANSPARENT,
    WHITE: COMMON.WHITE,
    BLACK: COMMON.BLACK,
  },
  
  // Typography configuration from the shared typography file
  typography,
  
  // Spacing metrics from the shared metrics file
  spacing,
  
  // Border radius values from the shared metrics file
  borderRadius,
  
  // Elevation (shadow) styles from the shared metrics file
  elevation,
  
  // Flag to indicate this is a dark theme
  isDark: true,
};

export default darkTheme;