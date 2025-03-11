/**
 * Health Context Provider for the Health Advisor mobile application.
 * 
 * Provides centralized state management for health data (meals, lab results, symptoms),
 * handles data fetching, creation, and organization, and makes health data available
 * throughout the component tree.
 * 
 * Implements requirements for Health Data Input, Health History Log, and provides
 * health context for LLM chat interactions.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react'; // ^18.2.0

import {
  HealthDataType, 
  HealthDataResponse, 
  HealthDataListResponse,
  CreateMealDataRequest,
  CreateLabResultDataRequest,
  CreateSymptomDataRequest,
  GetHealthDataParams
} from '../types/health.types';

import {
  getHealthDataById,
  getHealthData,
  getHealthDataByDate,
  searchHealthData,
  createMealData,
  createLabResultData,
  createSymptomData,
  deleteHealthData as deleteHealthDataService,
  getHealthContext
} from '../services/health.service';

import {
  formatHealthDataForDisplay,
  groupHealthDataByDate
} from '../services/health.service';

import { useAuth } from './AuthContext';
import { parseApiError, getErrorMessage } from '../utils/error.utils';
import { formatDisplayDate } from '../utils/date.utils';

// Define action types for health data reducer
enum HealthActionType {
  FETCH_HEALTH_DATA_REQUEST = 'FETCH_HEALTH_DATA_REQUEST',
  FETCH_HEALTH_DATA_SUCCESS = 'FETCH_HEALTH_DATA_SUCCESS',
  FETCH_HEALTH_DATA_FAILURE = 'FETCH_HEALTH_DATA_FAILURE',
  
  FETCH_HEALTH_DATA_ITEM_REQUEST = 'FETCH_HEALTH_DATA_ITEM_REQUEST',
  FETCH_HEALTH_DATA_ITEM_SUCCESS = 'FETCH_HEALTH_DATA_ITEM_SUCCESS',
  FETCH_HEALTH_DATA_ITEM_FAILURE = 'FETCH_HEALTH_DATA_ITEM_FAILURE',
  
  CREATE_HEALTH_DATA_REQUEST = 'CREATE_HEALTH_DATA_REQUEST',
  CREATE_HEALTH_DATA_SUCCESS = 'CREATE_HEALTH_DATA_SUCCESS',
  CREATE_HEALTH_DATA_FAILURE = 'CREATE_HEALTH_DATA_FAILURE',
  
  DELETE_HEALTH_DATA_REQUEST = 'DELETE_HEALTH_DATA_REQUEST',
  DELETE_HEALTH_DATA_SUCCESS = 'DELETE_HEALTH_DATA_SUCCESS',
  DELETE_HEALTH_DATA_FAILURE = 'DELETE_HEALTH_DATA_FAILURE',
  
  RESET_STATE = 'RESET_STATE'
}

// Define types for health data state and actions
interface HealthState {
  healthData: HealthDataResponse[];
  selectedHealthData: HealthDataResponse | null;
  isLoading: boolean;
  isLoadingItem: boolean;
  isSubmitting: boolean;
  isDeleting: Record<string, boolean>;
  error: string | null;
  totalItems: number;
  currentPage: number;
}

type HealthAction =
  | { type: HealthActionType.FETCH_HEALTH_DATA_REQUEST }
  | { type: HealthActionType.FETCH_HEALTH_DATA_SUCCESS; payload: { items: HealthDataResponse[]; total: number; page: number } }
  | { type: HealthActionType.FETCH_HEALTH_DATA_FAILURE; payload: string }
  
  | { type: HealthActionType.FETCH_HEALTH_DATA_ITEM_REQUEST }
  | { type: HealthActionType.FETCH_HEALTH_DATA_ITEM_SUCCESS; payload: HealthDataResponse }
  | { type: HealthActionType.FETCH_HEALTH_DATA_ITEM_FAILURE; payload: string }
  
  | { type: HealthActionType.CREATE_HEALTH_DATA_REQUEST }
  | { type: HealthActionType.CREATE_HEALTH_DATA_SUCCESS; payload: HealthDataResponse }
  | { type: HealthActionType.CREATE_HEALTH_DATA_FAILURE; payload: string }
  
  | { type: HealthActionType.DELETE_HEALTH_DATA_REQUEST; payload: string }
  | { type: HealthActionType.DELETE_HEALTH_DATA_SUCCESS; payload: string }
  | { type: HealthActionType.DELETE_HEALTH_DATA_FAILURE; payload: { id: string; error: string } }
  
  | { type: HealthActionType.RESET_STATE };

// Initial state for health data
const initialState: HealthState = {
  healthData: [],
  selectedHealthData: null,
  isLoading: false,
  isLoadingItem: false,
  isSubmitting: false,
  isDeleting: {},
  error: null,
  totalItems: 0,
  currentPage: 1
};

/**
 * Reducer function for managing health data state
 * @param state Current health data state
 * @param action Action to perform on the state
 * @returns New health data state after applying the action
 */
const healthReducer = (state: HealthState, action: HealthAction): HealthState => {
  switch (action.type) {
    case HealthActionType.FETCH_HEALTH_DATA_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case HealthActionType.FETCH_HEALTH_DATA_SUCCESS:
      return {
        ...state,
        healthData: action.payload.items,
        totalItems: action.payload.total,
        currentPage: action.payload.page,
        isLoading: false,
        error: null
      };
    case HealthActionType.FETCH_HEALTH_DATA_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
      
    case HealthActionType.FETCH_HEALTH_DATA_ITEM_REQUEST:
      return {
        ...state,
        isLoadingItem: true,
        error: null
      };
    case HealthActionType.FETCH_HEALTH_DATA_ITEM_SUCCESS:
      return {
        ...state,
        selectedHealthData: action.payload,
        isLoadingItem: false,
        error: null
      };
    case HealthActionType.FETCH_HEALTH_DATA_ITEM_FAILURE:
      return {
        ...state,
        isLoadingItem: false,
        error: action.payload
      };
      
    case HealthActionType.CREATE_HEALTH_DATA_REQUEST:
      return {
        ...state,
        isSubmitting: true,
        error: null
      };
    case HealthActionType.CREATE_HEALTH_DATA_SUCCESS:
      return {
        ...state,
        healthData: [action.payload, ...state.healthData],
        isSubmitting: false,
        error: null
      };
    case HealthActionType.CREATE_HEALTH_DATA_FAILURE:
      return {
        ...state,
        isSubmitting: false,
        error: action.payload
      };
      
    case HealthActionType.DELETE_HEALTH_DATA_REQUEST:
      return {
        ...state,
        isDeleting: {
          ...state.isDeleting,
          [action.payload]: true
        },
        error: null
      };
    case HealthActionType.DELETE_HEALTH_DATA_SUCCESS:
      return {
        ...state,
        healthData: state.healthData.filter(item => item.id !== action.payload),
        isDeleting: {
          ...state.isDeleting,
          [action.payload]: false
        },
        error: null
      };
    case HealthActionType.DELETE_HEALTH_DATA_FAILURE:
      return {
        ...state,
        isDeleting: {
          ...state.isDeleting,
          [action.payload.id]: false
        },
        error: action.payload.error
      };
      
    case HealthActionType.RESET_STATE:
      return initialState;
      
    default:
      return state;
  }
};

// Define the Health Context type with all necessary state and methods
interface HealthContextType {
  healthData: HealthDataResponse[];
  selectedHealthData: HealthDataResponse | null;
  isLoading: boolean;
  isLoadingItem: boolean;
  isSubmitting: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  
  fetchHealthData: (params: GetHealthDataParams) => Promise<void>;
  fetchHealthDataById: (id: string) => Promise<void>;
  fetchHealthDataByDate: (date: string, type?: HealthDataType, page?: number, limit?: number) => Promise<void>;
  searchHealthData: (searchTerm: string, type?: HealthDataType, page?: number, limit?: number) => Promise<void>;
  
  addMealData: (mealData: CreateMealDataRequest) => Promise<HealthDataResponse | null>;
  addLabResultData: (labData: CreateLabResultDataRequest) => Promise<HealthDataResponse | null>;
  addSymptomData: (symptomData: CreateSymptomDataRequest) => Promise<HealthDataResponse | null>;
  
  deleteHealthData: (id: string) => Promise<boolean>;
  
  getGroupedHealthData: () => Record<string, HealthDataResponse[]>;
  resetState: () => void;
  getHealthContextForLLM: (limit?: number) => Promise<{ recentMeals: HealthDataResponse[]; recentLabResults: HealthDataResponse[]; recentSymptoms: HealthDataResponse[] } | null>;
}

// Create the Health Context with a default undefined value
const HealthContext = createContext<HealthContextType | undefined>(undefined);

/**
 * Provider component that wraps the application to provide health data context
 * 
 * @param props.children Child components that will have access to the health context
 */
export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(healthReducer, initialState);
  const { state: authState } = useAuth();
  
  /**
   * Fetches health data with optional filtering parameters
   * 
   * @param params Parameters for filtering and pagination
   * @returns Promise that resolves when data fetching is complete
   */
  const fetchHealthData = useCallback(async (params: GetHealthDataParams): Promise<void> => {
    dispatch({ type: HealthActionType.FETCH_HEALTH_DATA_REQUEST });
    
    try {
      const response = await getHealthData(params);
      
      if (response) {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_SUCCESS,
          payload: {
            items: response.items,
            total: response.total,
            page: response.page
          }
        });
      } else {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_FAILURE,
          payload: 'Failed to fetch health data'
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.FETCH_HEALTH_DATA_FAILURE,
        payload: errorMessage
      });
    }
  }, []);
  
  /**
   * Fetches a specific health data entry by ID
   * 
   * @param id ID of the health data to fetch
   * @returns Promise that resolves when data fetching is complete
   */
  const fetchHealthDataById = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: HealthActionType.FETCH_HEALTH_DATA_ITEM_REQUEST });
    
    try {
      const healthDataItem = await getHealthDataById(id);
      
      if (healthDataItem) {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_ITEM_SUCCESS,
          payload: healthDataItem
        });
      } else {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_ITEM_FAILURE,
          payload: 'Health data item not found'
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.FETCH_HEALTH_DATA_ITEM_FAILURE,
        payload: errorMessage
      });
    }
  }, []);
  
  /**
   * Fetches health data entries for a specific date
   * 
   * @param date Date to filter health data by (string format)
   * @param type Optional health data type filter
   * @param page Optional page number for pagination
   * @param limit Optional limit of items per page
   * @returns Promise that resolves when data fetching is complete
   */
  const fetchHealthDataByDate = useCallback(async (
    date: string,
    type?: HealthDataType,
    page: number = 1,
    limit: number = 20
  ): Promise<void> => {
    dispatch({ type: HealthActionType.FETCH_HEALTH_DATA_REQUEST });
    
    try {
      const response = await getHealthDataByDate(new Date(date), type, page, limit);
      
      if (response) {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_SUCCESS,
          payload: {
            items: response.items,
            total: response.total,
            page: response.page
          }
        });
      } else {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_FAILURE,
          payload: 'Failed to fetch health data for this date'
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.FETCH_HEALTH_DATA_FAILURE,
        payload: errorMessage
      });
    }
  }, []);
  
  /**
   * Searches health data entries based on a search term
   * 
   * @param searchTerm Term to search for in health data
   * @param type Optional health data type filter
   * @param page Optional page number for pagination
   * @param limit Optional limit of items per page
   * @returns Promise that resolves when search is complete
   */
  const searchHealthData = useCallback(async (
    searchTerm: string,
    type?: HealthDataType,
    page: number = 1,
    limit: number = 20
  ): Promise<void> => {
    dispatch({ type: HealthActionType.FETCH_HEALTH_DATA_REQUEST });
    
    try {
      const response = await searchHealthData(searchTerm, type, page, limit);
      
      if (response) {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_SUCCESS,
          payload: {
            items: response.items,
            total: response.total,
            page: response.page
          }
        });
      } else {
        dispatch({
          type: HealthActionType.FETCH_HEALTH_DATA_FAILURE,
          payload: 'No results found'
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.FETCH_HEALTH_DATA_FAILURE,
        payload: errorMessage
      });
    }
  }, []);
  
  /**
   * Creates a new meal health data entry with image
   * 
   * @param mealData Meal data including image and description
   * @returns Promise that resolves with created data or null on error
   */
  const addMealData = useCallback(async (
    mealData: CreateMealDataRequest
  ): Promise<HealthDataResponse | null> => {
    dispatch({ type: HealthActionType.CREATE_HEALTH_DATA_REQUEST });
    
    try {
      const response = await createMealData(mealData);
      
      if (response) {
        dispatch({
          type: HealthActionType.CREATE_HEALTH_DATA_SUCCESS,
          payload: response
        });
        return response;
      } else {
        dispatch({
          type: HealthActionType.CREATE_HEALTH_DATA_FAILURE,
          payload: 'Failed to create meal data'
        });
        return null;
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.CREATE_HEALTH_DATA_FAILURE,
        payload: errorMessage
      });
      return null;
    }
  }, []);
  
  /**
   * Creates a new lab result health data entry with image
   * 
   * @param labData Lab result data including image and test information
   * @returns Promise that resolves with created data or null on error
   */
  const addLabResultData = useCallback(async (
    labData: CreateLabResultDataRequest
  ): Promise<HealthDataResponse | null> => {
    dispatch({ type: HealthActionType.CREATE_HEALTH_DATA_REQUEST });
    
    try {
      const response = await createLabResultData(labData);
      
      if (response) {
        dispatch({
          type: HealthActionType.CREATE_HEALTH_DATA_SUCCESS,
          payload: response
        });
        return response;
      } else {
        dispatch({
          type: HealthActionType.CREATE_HEALTH_DATA_FAILURE,
          payload: 'Failed to create lab result data'
        });
        return null;
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.CREATE_HEALTH_DATA_FAILURE,
        payload: errorMessage
      });
      return null;
    }
  }, []);
  
  /**
   * Creates a new symptom health data entry with audio recording
   * 
   * @param symptomData Symptom data including audio recording and symptom information
   * @returns Promise that resolves with created data or null on error
   */
  const addSymptomData = useCallback(async (
    symptomData: CreateSymptomDataRequest
  ): Promise<HealthDataResponse | null> => {
    dispatch({ type: HealthActionType.CREATE_HEALTH_DATA_REQUEST });
    
    try {
      const response = await createSymptomData(symptomData);
      
      if (response) {
        dispatch({
          type: HealthActionType.CREATE_HEALTH_DATA_SUCCESS,
          payload: response
        });
        return response;
      } else {
        dispatch({
          type: HealthActionType.CREATE_HEALTH_DATA_FAILURE,
          payload: 'Failed to create symptom data'
        });
        return null;
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.CREATE_HEALTH_DATA_FAILURE,
        payload: errorMessage
      });
      return null;
    }
  }, []);
  
  /**
   * Deletes a health data entry by ID
   * 
   * @param id ID of the health data entry to delete
   * @returns Promise that resolves with success status
   */
  const deleteHealthData = useCallback(async (id: string): Promise<boolean> => {
    dispatch({ 
      type: HealthActionType.DELETE_HEALTH_DATA_REQUEST,
      payload: id
    });
    
    try {
      const success = await deleteHealthDataService(id);
      
      if (success) {
        dispatch({
          type: HealthActionType.DELETE_HEALTH_DATA_SUCCESS,
          payload: id
        });
        return true;
      } else {
        dispatch({
          type: HealthActionType.DELETE_HEALTH_DATA_FAILURE,
          payload: {
            id,
            error: 'Failed to delete health data'
          }
        });
        return false;
      }
    } catch (error) {
      const errorMessage = getErrorMessage(parseApiError(error));
      dispatch({
        type: HealthActionType.DELETE_HEALTH_DATA_FAILURE,
        payload: {
          id,
          error: errorMessage
        }
      });
      return false;
    }
  }, []);
  
  /**
   * Groups health data entries by date for organized display
   * 
   * @returns Object with dates as keys and arrays of health data entries as values
   */
  const getGroupedHealthData = useCallback((): Record<string, HealthDataResponse[]> => {
    return groupHealthDataByDate(state.healthData);
  }, [state.healthData]);
  
  /**
   * Resets health data state to initial values
   */
  const resetState = useCallback((): void => {
    dispatch({ type: HealthActionType.RESET_STATE });
  }, []);
  
  /**
   * Retrieves recent health data to provide context for LLM chat interactions
   * 
   * @param limit Number of recent entries to retrieve for each type
   * @returns Promise resolving to recent health data organized by type or null on error
   */
  const getHealthContextForLLM = useCallback(async (
    limit: number = 5
  ): Promise<{ recentMeals: HealthDataResponse[]; recentLabResults: HealthDataResponse[]; recentSymptoms: HealthDataResponse[] } | null> => {
    try {
      return await getHealthContext(limit);
    } catch (error) {
      console.error('Error getting health context for LLM:', error);
      return null;
    }
  }, []);
  
  // Create context value with state and methods
  const contextValue: HealthContextType = useMemo(() => ({
    // State
    healthData: state.healthData,
    selectedHealthData: state.selectedHealthData,
    isLoading: state.isLoading,
    isLoadingItem: state.isLoadingItem,
    isSubmitting: state.isSubmitting,
    error: state.error,
    totalItems: state.totalItems,
    currentPage: state.currentPage,
    
    // Methods
    fetchHealthData,
    fetchHealthDataById,
    fetchHealthDataByDate,
    searchHealthData,
    addMealData,
    addLabResultData,
    addSymptomData,
    deleteHealthData,
    getGroupedHealthData,
    resetState,
    getHealthContextForLLM
  }), [
    state,
    fetchHealthData,
    fetchHealthDataById,
    fetchHealthDataByDate,
    searchHealthData,
    addMealData,
    addLabResultData,
    addSymptomData,
    deleteHealthData,
    getGroupedHealthData,
    resetState,
    getHealthContextForLLM
  ]);
  
  return (
    <HealthContext.Provider value={contextValue}>
      {children}
    </HealthContext.Provider>
  );
};

/**
 * Custom hook for accessing health data context
 * 
 * @returns Health data context with state and methods
 */
export const useHealth = (): HealthContextType => {
  const context = useContext(HealthContext);
  
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  
  return context;
};

// Export the context for use in tests or special cases
export { HealthContext };