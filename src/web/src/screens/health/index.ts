/**
 * Index file for health-related screens in the Health Advisor mobile application.
 * Centralizes exports of health screen components for use in the application's navigation system.
 * Addresses the Health History Log feature requirement for viewing and managing health data.
 */

// Import health screen components
import HealthLogScreen from './HealthLogScreen';
import HealthDataDetailScreen from './HealthDataDetailScreen';

// Export components individually for named imports
export { HealthLogScreen, HealthDataDetailScreen };

// Export as default object for convenient importing
export default {
  HealthLogScreen,
  HealthDataDetailScreen,
};