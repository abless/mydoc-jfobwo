/**
 * lightTheme.ts
 * 
 * Defines the light theme configuration for the Health Advisor application.
 * Implements the Theme interface with light mode color palette and styling properties.
 * WCAG AA compliant color contrast ratios are maintained for accessibility.
 */

import { LIGHT, COMMON } from '../constants/colors';
import { Theme } from '../types/theme.types';
import { typography } from './typography';
import { spacing, borderRadius, elevation } from './metrics';

/**
 * Light theme configuration
 * 
 * Implements the Theme interface with:
 * - Light mode color palette (#4A90E2 primary, #6ABEFF secondary, #FF8C42 accent)
 * - Typography configuration for various text elements
 * - Consistent spacing metrics for layout
 * - Border radius values for UI components
 * - Elevation styles for shadow effects
 */
export const lightTheme: Theme = {
  colors: {
    // Primary brand colors from light palette
    PRIMARY: LIGHT.PRIMARY,       // #4A90E2 - Primary blue
    SECONDARY: LIGHT.SECONDARY,   // #6ABEFF - Secondary blue, lighter shade
    ACCENT: LIGHT.ACCENT,         // #FF8C42 - Orange accent for calls-to-action
    
    // UI colors
    BACKGROUND: LIGHT.BACKGROUND, // #F5F7FA - Light gray background
    TEXT: LIGHT.TEXT,             // #333333 - Dark gray text for readability
    
    // Semantic colors for status and feedback
    ERROR: LIGHT.ERROR,           // #E53E3E - Red for errors
    SUCCESS: LIGHT.SUCCESS,       // #38A169 - Green for success
    WARNING: LIGHT.WARNING,       // #F6AD55 - Orange for warnings
    INFO: LIGHT.INFO,             // #63B3ED - Blue for information
    
    // UI element colors
    BORDER: LIGHT.BORDER,         // #E2E8F0 - Light gray for borders
    CARD: LIGHT.CARD,             // #FFFFFF - White for card backgrounds
    DISABLED: LIGHT.DISABLED,     // #A0AEC0 - Gray for disabled elements
    
    // Common colors consistent across themes
    TRANSPARENT: COMMON.TRANSPARENT,
    WHITE: COMMON.WHITE,
    BLACK: COMMON.BLACK,
  },
  
  // Typography configuration from typography.ts
  typography,
  
  // Spacing metrics from metrics.ts
  spacing,
  
  // Border radius values from metrics.ts
  borderRadius,
  
  // Elevation styles from metrics.ts
  elevation,
  
  // Theme mode identifier
  isDark: false
};

export default lightTheme;