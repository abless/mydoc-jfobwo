/**
 * Central export file for all navigation-related components and services in the Health Advisor mobile application.
 * This file simplifies imports by providing a single entry point for navigation components, making it easier to use navigation throughout the application.
 */

// Internal navigation components
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Internal navigation service
import NavigationService from './NavigationService';

/**
 * Export the root navigation component
 */
export { AppNavigator };

/**
 * Export the authentication navigator component
 */
export { AuthNavigator };

/**
 * Export the main application navigator component
 */
export { MainNavigator };

/**
 * Export the navigation service with all navigation methods
 */
export { NavigationService };

/**
 * Default export of all navigation components and services
 */
export default {
  AppNavigator,
  AuthNavigator,
  MainNavigator,
  NavigationService,
};