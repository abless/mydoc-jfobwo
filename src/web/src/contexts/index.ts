/**
 * Main export file for context providers and hooks used in the Health Advisor application.
 * This file serves as a central export point for all contexts, making them easily importable
 * throughout the application.
 * 
 * @version 1.0.0
 */

// Export authentication context components
// Implements authentication and authorization framework with JWT-based authentication
export { AuthProvider, useAuth, AuthContext } from './AuthContext';

// Export chat context components
// Implements LLM Health Chat feature for AI interaction
export { ChatProvider, useChat, ChatContext } from './ChatContext';

// Export health data context components
// Implements Health Data Management features for meals, lab results, and symptoms
export { HealthProvider, useHealth, HealthContext } from './HealthContext';

// Export theme context components
// Implements UI Theming based on the design system
export { ThemeProvider, useTheme, ThemeContext } from './ThemeContext';