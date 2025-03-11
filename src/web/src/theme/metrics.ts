import { Platform } from 'react-native'; // ^0.71.0
import { Spacing, BorderRadius, Elevation } from '../types/theme.types';

/**
 * Spacing metrics for consistent layout throughout the application
 * Used for margins, padding, and general layout spacing
 * Values are in pixels and increase in a consistent scale
 */
export const spacing: Spacing = {
  xs: 4,  // Extra small spacing for tight areas
  s: 8,   // Small spacing for related elements
  m: 16,  // Medium spacing for general separation
  l: 24,  // Large spacing for section separation
  xl: 32, // Extra large spacing for major sections
  xxl: 48 // Extra extra large spacing for screen padding
};

/**
 * Border radius metrics for consistent corner rounding
 * Used for buttons, cards, inputs, and other UI elements
 * Values are in pixels
 */
export const borderRadius: BorderRadius = {
  small: 4,       // Subtle rounding for elements like inputs
  medium: 8,      // Standard rounding for cards and buttons
  large: 16,      // Significant rounding for prominent elements
  round: 9999     // Fully rounded for pills and circular buttons
};

/**
 * Elevation (shadow) styles for creating UI depth
 * Platform-specific implementation to ensure consistent appearance
 * across iOS and Android
 */
export const elevation: Elevation = {
  small: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 2
    },
    android: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 2
    }
  }) as Elevation['small'],
  
  medium: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    android: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    }
  }) as Elevation['medium'],
  
  large: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8
    },
    android: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8
    }
  }) as Elevation['large']
};