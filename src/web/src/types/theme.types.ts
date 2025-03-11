import { ReactNode } from 'react'; // ^18.2.0

/**
 * Defines the structure of color palettes used throughout the application
 * Based on the design system color specifications for light and dark modes
 */
export interface ColorPalette {
  PRIMARY: string;
  SECONDARY: string;
  ACCENT: string;
  BACKGROUND: string;
  TEXT: string;
  ERROR: string;
  SUCCESS: string;
  WARNING: string;
  INFO: string;
  BORDER: string;
  CARD: string;
  DISABLED: string;
  TRANSPARENT: string;
  WHITE: string;
  BLACK: string;
}

/**
 * Defines the structure of typography configuration
 * Includes font family, size, and line height specifications
 */
export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
  lineHeight: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
}

/**
 * Defines the structure of spacing metrics used for consistent
 * margins, paddings, and layout spacing throughout the application
 */
export interface Spacing {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
}

/**
 * Defines the structure of border radius values for UI components
 */
export interface BorderRadius {
  small: number;
  medium: number;
  large: number;
  round: number;
}

/**
 * Defines the structure of elevation/shadow styles
 * for creating depth in the UI
 */
export interface Elevation {
  small: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  medium: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  large: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

/**
 * Defines the complete theme structure combining colors, typography,
 * spacing, and other styling properties for consistent UI design
 */
export interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  elevation: Elevation;
  isDark: boolean;
}

/**
 * Defines the available theme modes for the application
 * LIGHT - Light theme mode
 * DARK - Dark theme mode
 * SYSTEM - Follows system preference
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

/**
 * Defines the structure of the theme context used for
 * theme management throughout the application
 */
export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  children?: ReactNode;
}