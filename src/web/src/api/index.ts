/**
 * API Barrel File
 * 
 * This file serves as a central entry point for all API functionality in the Health Advisor
 * mobile application. It re-exports all API functions from individual modules to provide
 * a single import location for accessing backend services.
 * 
 * By using this barrel file, components can access all API methods through a single import:
 * import { login, sendMessage, getHealthData } from '../api';
 * 
 * @version 1.0.0
 */

// Authentication API functions (F-001: User Authentication)
export * from './auth.api';

// Chat API functions (F-004: LLM Health Chat)
export * from './chat.api';

// Health Data API functions (F-002: Health Data Input, F-003: Health History Log)
export * from './health.api';

// User Profile API functions (F-005: User Profile Management)
export * from './user.api';