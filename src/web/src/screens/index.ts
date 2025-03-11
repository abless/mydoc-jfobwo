/**
 * Central index file that exports all screen components from the Health Advisor mobile application.
 * This file serves as a single entry point for importing any screen component, simplifying imports across the application.
 */

// Import authentication screen components
import { LoginScreen, SignupScreen } from './auth';
// Import chat screen component for LLM interaction
import { ChatScreen } from './chat';
// Import data entry screen components for different health data types
import { MealEntryScreen, LabResultEntryScreen, SymptomEntryScreen } from './datainput';
// Import health data viewing screen components
import { HealthLogScreen, HealthDataDetailScreen } from './health';
// Import insights screen component for future health insights feature
import { InsightsScreen } from './insights';
// Import profile screen component for user account management
import { ProfileScreen } from './profile';

// Export login screen component for use in navigation
export { LoginScreen };
// Export signup screen component for use in navigation
export { SignupScreen };
// Export chat screen component for use in navigation
export { ChatScreen };
// Export meal entry screen component for use in navigation
export { MealEntryScreen };
// Export lab result entry screen component for use in navigation
export { LabResultEntryScreen };
// Export symptom entry screen component for use in navigation
export { SymptomEntryScreen };
// Export health log screen component for use in navigation
export { HealthLogScreen };
// Export health data detail screen component for use in navigation
export { HealthDataDetailScreen };
// Export insights screen component for use in navigation
export { InsightsScreen };
// Export profile screen component for use in navigation
export { ProfileScreen };