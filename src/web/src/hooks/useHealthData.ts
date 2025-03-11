import { useState, useCallback, useEffect } from 'react'; // react ^18.2.0
import {
  HealthDataType,
  HealthDataResponse,
  HealthDataListResponse,
  CreateHealthDataRequest,
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
  createHealthData,
  deleteHealthData
} from '../api/health.api';
import {
  formatHealthDataForDisplay,
  groupHealthDataByDate
} from '../services/health.service';
import { parseApiError, getErrorMessage } from '../utils/error.utils';

/**
 * Custom React hook for managing health data throughout the application
 * 
 * This hook provides comprehensive functionality for fetching, creating, updating,
 * and deleting health data entries (meals, lab results, symptoms). It handles all
 * API interactions, loading and error states, and provides utility functions for
 * data organization and display.
 * 
 * @returns Object containing health data state and functions for management
 */
export const useHealthData = () => {
  // State for health data items
  const [healthData, setHealthData] = useState<HealthDataResponse[]>([]);
  
  // State for selected health data item (when viewing details)
  const [selectedHealthData, setSelectedHealthData] = useState<HealthDataResponse | null>(null);
  
  // Loading states for different operations
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingItem, setIsLoadingItem] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Error state for all health data operations
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  /**
   * Fetches health data with optional filtering and pagination
   * 
   * @param params Parameters for filtering and pagination
   * @returns Promise resolving to health data with pagination info, or null on error
   */
  const fetchHealthData = useCallback(async (params: GetHealthDataParams = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getHealthData(params);
      
      // Format the health data for display
      const formattedData = response.items.map(item => formatHealthDataForDisplay(item));
      
      setHealthData(formattedData);
      setTotalItems(response.total);
      setCurrentPage(params.page || 1);
      
      return {
        items: formattedData,
        total: response.total,
        page: params.page || 1
      };
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Fetches a specific health data entry by ID
   * 
   * @param id ID of the health data entry to retrieve
   * @returns Promise resolving to the health data entry, or null on error
   */
  const fetchHealthDataById = useCallback(async (id: string) => {
    try {
      setIsLoadingItem(true);
      setError(null);
      
      const response = await getHealthDataById(id);
      
      // Format the health data for display
      const formattedData = formatHealthDataForDisplay(response);
      
      setSelectedHealthData(formattedData);
      return formattedData;
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      return null;
    } finally {
      setIsLoadingItem(false);
    }
  }, []);
  
  /**
   * Fetches health data entries for a specific date
   * 
   * @param date Date to filter by (YYYY-MM-DD format)
   * @param type Optional type filter (meal, labResult, symptom)
   * @param page Optional page number for pagination
   * @param limit Optional items per page limit
   * @returns Promise resolving to health data with pagination info, or null on error
   */
  const fetchHealthDataByDate = useCallback(async (
    date: string,
    type?: HealthDataType,
    page: number = 1,
    limit: number = 20
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getHealthDataByDate(date, type, page, limit);
      
      // Format the health data for display
      const formattedData = response.items.map(item => formatHealthDataForDisplay(item));
      
      setHealthData(formattedData);
      setTotalItems(response.total);
      setCurrentPage(page);
      
      return {
        items: formattedData,
        total: response.total,
        page
      };
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Searches health data based on a search term
   * 
   * @param searchTerm Term to search for in health data
   * @param type Optional type filter (meal, labResult, symptom)
   * @param page Optional page number for pagination
   * @param limit Optional items per page limit
   * @returns Promise resolving to health data with pagination info, or null on error
   */
  const searchHealthDataItems = useCallback(async (
    searchTerm: string,
    type?: HealthDataType,
    page: number = 1,
    limit: number = 20
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await searchHealthData(searchTerm, type, page, limit);
      
      // Format the health data for display
      const formattedData = response.items.map(item => formatHealthDataForDisplay(item));
      
      setHealthData(formattedData);
      setTotalItems(response.total);
      setCurrentPage(page);
      
      return {
        items: formattedData,
        total: response.total,
        page
      };
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Adds a new health data entry based on type
   * 
   * @param data Health data to create (meal, lab result, symptom, or generic)
   * @param type Type of health data being created
   * @returns Promise resolving to the created health data entry, or null on error
   */
  const addHealthData = useCallback(async (
    data: CreateMealDataRequest | CreateLabResultDataRequest | CreateSymptomDataRequest | CreateHealthDataRequest,
    type: HealthDataType
  ) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      let response: HealthDataResponse | null = null;
      
      // Check if data is already a CreateHealthDataRequest
      if ('type' in data && 'data' in data) {
        response = await createHealthData(data as CreateHealthDataRequest);
      } else {
        switch (type) {
          case HealthDataType.MEAL:
            response = await createMealData(data as CreateMealDataRequest);
            break;
          case HealthDataType.LAB_RESULT:
            response = await createLabResultData(data as CreateLabResultDataRequest);
            break;
          case HealthDataType.SYMPTOM:
            response = await createSymptomData(data as CreateSymptomDataRequest);
            break;
          default:
            throw new Error('Invalid health data type');
        }
      }
      
      // Update health data state with new entry
      if (response) {
        // Format the health data for display
        const formattedData = formatHealthDataForDisplay(response);
        setHealthData(prevData => [formattedData, ...prevData]);
        return formattedData;
      }
      
      return null;
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);
  
  /**
   * Removes a health data entry by ID
   * 
   * @param id ID of the health data entry to remove
   * @returns Promise resolving to true if deletion was successful, false otherwise
   */
  const removeHealthData = useCallback(async (id: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const success = await deleteHealthData(id);
      
      if (success) {
        // Remove the deleted item from state
        setHealthData(prevData => prevData.filter(item => item.id !== id));
        
        // Clear selected health data if it was the deleted item
        if (selectedHealthData?.id === id) {
          setSelectedHealthData(null);
        }
      }
      
      return success;
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedHealthData]);
  
  /**
   * Groups health data items by date for organized display in Health Log
   * 
   * @returns Object with dates as keys and arrays of health data entries as values
   */
  const getGroupedHealthData = useCallback(() => {
    return groupHealthDataByDate(healthData);
  }, [healthData]);
  
  /**
   * Resets the health data state
   * Useful when navigating away or logging out
   */
  const resetState = useCallback(() => {
    setHealthData([]);
    setSelectedHealthData(null);
    setError(null);
    setTotalItems(0);
    setCurrentPage(1);
  }, []);
  
  // Return all state and functions
  return {
    // State
    healthData,
    selectedHealthData,
    isLoading,
    isLoadingItem,
    isSubmitting,
    error,
    totalItems,
    currentPage,
    
    // Functions
    fetchHealthData,
    fetchHealthDataById,
    fetchHealthDataByDate,
    searchHealthDataItems,
    addHealthData,
    removeHealthData,
    getGroupedHealthData,
    resetState
  };
};