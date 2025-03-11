import React from 'react'; // ^18.2.0
import { createStackNavigator } from '@react-navigation/stack'; // ^6.x

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Types & Constants
import { AuthStackParamList } from '../types/navigation.types';
import { AUTH_ROUTES } from '../constants/navigation';

/**
 * Authentication navigator component that manages navigation between login and signup screens.
 * Implements a stack navigator for the authentication flow and is displayed
 * when the user is not authenticated.
 * 
 * @returns Stack navigator component for authentication screens
 */
const AuthNavigator = () => {
  // Create stack navigator with AuthStackParamList type
  const Stack = createStackNavigator<AuthStackParamList>();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        presentation: 'card',
        animationEnabled: true,
      }}
    >
      <Stack.Screen name={AUTH_ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={AUTH_ROUTES.SIGNUP} component={SignupScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;