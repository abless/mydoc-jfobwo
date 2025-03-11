/**
 * Barrel file for type definitions in the Health Advisor application.
 * This file re-exports all TypeScript type definitions from the types directory,
 * providing a centralized import point for all application types.
 */

// API types for handling HTTP communication, errors, and responses
export * from './api.types';

// Authentication types for user authentication and authorization
export * from './auth.types';

// Chat types for LLM interactions and conversation management
export * from './chat.types';

// Component types for UI component props and configurations
export * from './components.types';

// Health data types for handling various health data formats
export * from './health.types';

// Navigation types for React Navigation integration
export * from './navigation.types';

// Theme types for consistent styling and theming
export * from './theme.types';

// User profile types for user data management
export * from './user.types';