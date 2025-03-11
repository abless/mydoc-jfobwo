/**
 * Constants Index
 * 
 * This barrel file exports all constants from the constants directory,
 * providing a centralized import point for application constants.
 * This simplifies imports by allowing developers to import multiple
 * constants from a single location.
 * 
 * @version 1.0.0
 */

// Import from API constants
export { 
  API_CONSTANTS,
  HTTP_STATUS,
  ERROR_MESSAGES 
} from './api.constants';

// Import from colors
export {
  COLORS,
  LIGHT,
  DARK,
  COMMON
} from './colors';

// Import from config
export {
  APP_CONFIG,
  AUTH_CONFIG,
  CHAT_CONFIG,
  HEALTH_DATA_CONFIG,
  UI_CONFIG
} from './config';

// Import from endpoints
export { ENDPOINTS } from './endpoints';

// Import from navigation
export {
  ROOT_ROUTES,
  AUTH_ROUTES,
  MAIN_TAB_ROUTES,
  DATA_ENTRY_ROUTES,
  HEALTH_ROUTES,
  NAVIGATION_ROUTES
} from './navigation';

// Import from storage
export {
  STORAGE_PREFIX,
  STORAGE_KEYS
} from './storage';