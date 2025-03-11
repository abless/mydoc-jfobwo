import React, { useEffect } from 'react'; // ^18.2.0
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'; // ^6.x
import { createStackNavigator } from '@react-navigation/stack'; // ^6.x

// Internal imports for navigation components
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Internal imports for authentication context and hook
import { useAuth } from '../contexts/AuthContext';

// Internal imports for navigation service and route constants
import NavigationService from './NavigationService';
import { RootStackParamList } from '../types/navigation.types';
import { ROOT_ROUTES } from '../constants/navigation';

/**
 * Creates a navigation container reference that can be used throughout the app
 * This allows navigation actions to be performed outside of React components
 */
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Root navigation component that conditionally renders authentication or main app flows
 * @returns Navigation container with appropriate navigator based on auth state
 */
const AppNavigator = () => {
  // Create a stack navigator with RootStackParamList type
  const Stack = createStackNavigator<RootStackParamList>();

  // Get authentication state using useAuth hook
  const { isAuthenticated } = useAuth();

  // Set up useEffect to check authentication status on component mount
  useEffect(() => {
    // Check if the navigation ref is available
    if (navigationRef.isReady()) {
      // Navigate to the appropriate screen based on authentication status
      if (isAuthenticated) {
        NavigationService.navigateToMain();
      } else {
        NavigationService.navigateToAuth();
      }
    }
  }, [isAuthenticated]);

  // Set the navigation reference in NavigationService
  useEffect(() => {
    if (navigationRef) {
      NavigationService.setNavigationRef(navigationRef);
    }
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide headers for root level navigation
          gestureEnabled: false, // Disable swipe gestures for root level
          animationEnabled: false, // Disable animations for root level
        }}
      >
        {/* Conditionally render AuthNavigator or MainNavigator based on authentication state */}
        {isAuthenticated ? (
          <Stack.Screen name={ROOT_ROUTES.MAIN} component={MainNavigator} />
        ) : (
          <Stack.Screen name={ROOT_ROUTES.AUTH} component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;