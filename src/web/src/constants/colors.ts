/**
 * colors.ts
 * 
 * Defines color constants for the Health Advisor mobile application.
 * This file establishes the color palette for both light and dark modes,
 * ensuring consistent theming throughout the application.
 * 
 * All colors are selected to maintain WCAG AA compliant contrast ratios
 * to support users with visual impairments.
 */

/**
 * Light mode color palette
 * Used when the application is in light mode theme
 */
export const LIGHT = {
  // Primary brand colors
  PRIMARY: '#4A90E2',    // Primary blue
  SECONDARY: '#6ABEFF',  // Secondary blue, lighter shade
  ACCENT: '#FF8C42',     // Orange accent for calls-to-action
  
  // UI colors
  BACKGROUND: '#F5F7FA', // Light gray background
  TEXT: '#333333',       // Dark gray text for readability
  
  // Semantic colors for status and feedback
  ERROR: '#E53E3E',      // Red for errors and negative actions
  SUCCESS: '#38A169',    // Green for success and positive feedback
  WARNING: '#F6AD55',    // Orange for warnings and caution
  INFO: '#63B3ED',       // Blue for informational messages
  
  // UI element colors
  BORDER: '#E2E8F0',     // Light gray for borders and dividers
  CARD: '#FFFFFF',       // White for card backgrounds
  DISABLED: '#A0AEC0',   // Gray for disabled elements
};

/**
 * Dark mode color palette
 * Used when the application is in dark mode theme
 */
export const DARK = {
  // Primary brand colors
  PRIMARY: '#2C5282',    // Darker blue for dark mode
  SECONDARY: '#4A6FA5',  // Secondary blue adapted for dark mode
  ACCENT: '#FF8C42',     // Same orange accent for consistency
  
  // UI colors
  BACKGROUND: '#1A202C', // Dark background
  TEXT: '#E2E8F0',       // Light gray text for dark mode readability
  
  // Semantic colors for status and feedback
  ERROR: '#FC8181',      // Lighter red for dark mode visibility
  SUCCESS: '#68D391',    // Lighter green for dark mode visibility
  WARNING: '#F6AD55',    // Same orange for warnings
  INFO: '#63B3ED',       // Same blue for informational messages
  
  // UI element colors
  BORDER: '#2D3748',     // Darker border for dark mode contrast
  CARD: '#2D3748',       // Dark gray for card backgrounds
  DISABLED: '#718096',   // Medium gray for disabled elements
};

/**
 * Common colors that remain consistent across both light and dark themes
 */
export const COMMON = {
  TRANSPARENT: 'transparent',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
};

/**
 * Combined color object for easy importing throughout the application
 */
export const COLORS = {
  LIGHT,
  DARK,
  COMMON,
};

export default COLORS;