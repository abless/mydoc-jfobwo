/**
 * ThemeContext.tsx
 * 
 * Context provider for theme management in the Health Advisor mobile application.
 * Handles theme switching between light, dark, and system modes, persists user
 * theme preferences, and provides theme-related values and functions to all
 * components in the application.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react'; // ^18.2.0
import { Appearance, useColorScheme } from 'react-native'; // ^0.71.0
import { lightTheme, darkTheme, getTheme } from '../theme';
import { Theme, ThemeContextType, ThemeMode } from '../types/theme.types';
import { storeThemePreference, getThemePreference } from '../services/storage.service';

/**
 * React context for theme management
 * Provides theme values and functions to components
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the theme context
 * Manages theme state and provides theme-related functionality to all child components
 * 
 * @param {ThemeProviderProps} props - The component props
 * @returns {JSX.Element} The provider component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize with system theme mode
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.SYSTEM);
  // Initialize theme state with the appropriate theme based on mode
  const [theme, setTheme] = useState<Theme>(getTheme(ThemeMode.SYSTEM));

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await getThemePreference();
        if (savedThemeMode && 
            (savedThemeMode === ThemeMode.LIGHT || 
             savedThemeMode === ThemeMode.DARK || 
             savedThemeMode === ThemeMode.SYSTEM)) {
          setThemeMode(savedThemeMode as ThemeMode);
        } else {
          // Default to system preference if no valid preference is found
          setThemeMode(ThemeMode.SYSTEM);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to system preference if error occurs
        setThemeMode(ThemeMode.SYSTEM);
      }
    };

    loadThemePreference();
  }, []);

  // Update theme when themeMode changes
  useEffect(() => {
    try {
      setTheme(getTheme(themeMode));
      storeThemePreference(themeMode).catch(error => {
        console.error('Error storing theme preference:', error);
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      // Fallback to light theme if there's an error
      setTheme(lightTheme);
    }
  }, [themeMode]);

  // Listen for system appearance changes when using system theme
  useEffect(() => {
    if (themeMode === ThemeMode.SYSTEM) {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        try {
          setTheme(getTheme(ThemeMode.SYSTEM));
        } catch (error) {
          console.error('Error updating theme on appearance change:', error);
          // Fallback to light theme if there's an error
          setTheme(lightTheme);
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, [themeMode]);

  /**
   * Toggle between light and dark themes
   * Switches from light to dark or dark to light
   */
  const toggleTheme = () => {
    setThemeMode(theme.isDark ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  /**
   * Set the theme mode explicitly
   * @param {ThemeMode} mode - The theme mode to set
   */
  const setThemeModeHandler = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  // Context value object
  const contextValue: ThemeContextType = {
    theme,
    isDark: theme.isDark,
    toggleTheme,
    setThemeMode: setThemeModeHandler,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access the theme context
 * Provides access to theme values and theme management functions
 * 
 * @returns {ThemeContextType} The theme context value
 * @throws {Error} If used outside of a ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the context for advanced use cases
export { ThemeContext };