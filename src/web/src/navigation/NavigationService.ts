import { NavigationContainerRef, createNavigationContainerRef } from '@react-navigation/native'; // ^6.x
import { RootStackParamList, NavigateFunction } from '../types/navigation.types';
import { 
  ROOT_ROUTES, 
  AUTH_ROUTES, 
  MAIN_TAB_ROUTES, 
  DATA_ENTRY_ROUTES, 
  HEALTH_ROUTES 
} from '../constants/navigation';

// Create a navigation reference that can be used throughout the app
let navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Sets the navigation reference to be used by the service
 * @param ref The navigation container reference
 */
const setNavigationRef = (ref: NavigationContainerRef<RootStackParamList>): void => {
  navigationRef = ref;
};

/**
 * Navigates to a specified route in the application
 * @param routeName The name of the route to navigate to
 * @param params The parameters to pass to the route
 */
const navigate = (routeName: string, params?: object): void => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(routeName as never, params as never);
  } else {
    console.warn('Navigation attempted before navigation container was ready');
  }
};

/**
 * Navigates to a specified route and resets the navigation stack
 * @param routeName The name of the route to navigate to
 * @param params The parameters to pass to the route
 */
const navigateAndReset = (routeName: string, params?: object): void => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName as never, params: params as never }],
    });
  } else {
    console.warn('Navigation reset attempted before navigation container was ready');
  }
};

/**
 * Navigates back to the previous screen
 */
const goBack = (): void => {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  } else if (navigationRef.isReady()) {
    console.warn('Cannot go back from this screen');
  } else {
    console.warn('Navigation back attempted before navigation container was ready');
  }
};

/**
 * Gets the name of the current active route
 * @returns The name of the current route or undefined if not available
 */
const getCurrentRoute = (): string | undefined => {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return undefined;
};

/**
 * Navigates to the authentication stack
 */
const navigateToAuth = (): void => {
  navigateAndReset(ROOT_ROUTES.AUTH);
};

/**
 * Navigates to the main application stack
 */
const navigateToMain = (): void => {
  navigateAndReset(ROOT_ROUTES.MAIN);
};

/**
 * Navigates to the login screen
 */
const navigateToLogin = (): void => {
  navigate(AUTH_ROUTES.LOGIN);
};

/**
 * Navigates to the signup screen
 */
const navigateToSignup = (): void => {
  navigate(AUTH_ROUTES.SIGNUP);
};

/**
 * Navigates to the chat screen
 */
const navigateToChat = (): void => {
  navigate(MAIN_TAB_ROUTES.CHAT);
};

/**
 * Navigates to the health log screen
 */
const navigateToHealthLog = (): void => {
  navigate(MAIN_TAB_ROUTES.HEALTH_LOG);
};

/**
 * Navigates to the health data detail screen
 * @param healthDataId The ID of the health data to view
 */
const navigateToHealthDataDetail = (healthDataId: string): void => {
  navigate(HEALTH_ROUTES.HEALTH_DATA_DETAIL, { healthDataId });
};

/**
 * Navigates to the data entry options screen
 */
const navigateToDataEntry = (): void => {
  navigate(MAIN_TAB_ROUTES.DATA_ENTRY);
};

/**
 * Navigates to the meal entry screen
 */
const navigateToMealEntry = (): void => {
  navigate(DATA_ENTRY_ROUTES.MEAL_ENTRY);
};

/**
 * Navigates to the lab result entry screen
 */
const navigateToLabResultEntry = (): void => {
  navigate(DATA_ENTRY_ROUTES.LAB_RESULT_ENTRY);
};

/**
 * Navigates to the symptom entry screen
 */
const navigateToSymptomEntry = (): void => {
  navigate(DATA_ENTRY_ROUTES.SYMPTOM_ENTRY);
};

/**
 * Navigates to the insights screen
 */
const navigateToInsights = (): void => {
  navigate(MAIN_TAB_ROUTES.INSIGHTS);
};

/**
 * Navigates to the profile screen
 */
const navigateToProfile = (): void => {
  navigate(MAIN_TAB_ROUTES.PROFILE);
};

// Export all navigation functions as a service
export default {
  setNavigationRef,
  navigate,
  navigateAndReset,
  goBack,
  getCurrentRoute,
  navigateToAuth,
  navigateToMain,
  navigateToLogin,
  navigateToSignup,
  navigateToChat,
  navigateToHealthLog,
  navigateToHealthDataDetail,
  navigateToDataEntry,
  navigateToMealEntry,
  navigateToLabResultEntry,
  navigateToSymptomEntry,
  navigateToInsights,
  navigateToProfile,
};