/**
 * Authentication screens index file for the Health Advisor mobile application.
 * 
 * Provides a centralized entry point for importing authentication-related screens
 * including login and signup components. This file supports the user authentication 
 * requirements (F-001) by exporting screens that handle email and password-based
 * authentication with JWT token implementation.
 */

// Import authentication screen components
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';

// Export individual components as named exports for selective importing
export { LoginScreen, SignupScreen };

// Export default object with all authentication screens for convenient importing
export default {
  LoginScreen,
  SignupScreen
};