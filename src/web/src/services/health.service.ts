/**
 * Health data service for the React Native mobile application.
 * 
 * This service provides functions for creating, retrieving, updating, and deleting health records
 * (meals, lab results, symptoms), as well as formatting and organizing health data for display
 * in the health log feature and providing context for LLM interactions.
 * 
 * @version 1.0.0
 */

import {
  getHealthDataById as getHealthDataByIdApi,
  getHealthData as getHealthDataApi,
  getHealthDataByDate as getHealthDataByDateApi,
  searchHealthData as searchHealthDataApi,
  createMealData as createMealDataApi,
  createLabResultData as createLabResultDataApi,
  createSymptomData as createSymptomDataApi,
  createHealthData as createHealthDataApi,
  deleteHealthData as deleteHealthDataApi
} from '../api/health.api';

import {
  HealthDataType,
  HealthDataResponse,
  HealthDataListResponse,
  CreateHealthDataRequest,
  CreateMealDataRequest,
  CreateLabResultDataRequest,
  CreateSymptomDataRequest,
  GetHealthDataParams,
  HealthDataApiResponse,
  HealthDataListApiResponse
} from '../types/health.types';

import {
  formatDisplayDate,
  formatDisplayTime,
  getRelativeDateLabel,
  groupByDate
} from '../utils/date.utils';

import { format } from 'date-fns'; // ^2.29.3

/**
 * Retrieves a specific health data entry by its ID and formats it for display
 * 
 * @param id - ID of the health data entry to retrieve
 * @returns Promise resolving to the formatted health data entry or null if not found/error
 */
export const getHealthDataById = async (
  id: string
): Promise<HealthDataResponse | null> => {
  try {
    const healthData = await getHealthDataByIdApi(id);
    return formatHealthDataForDisplay(healthData);
  } catch (error) {
    console.error('Error retrieving health data by ID:', error);
    return null;
  }
};

/**
 * Retrieves health data entries based on filter parameters and formats them for display
 * 
 * @param params - Parameters for filtering and pagination
 * @returns Promise resolving to formatted health data entries with pagination info or null on error
 */
export const getHealthData = async (
  params: GetHealthDataParams
): Promise<{ items: HealthDataResponse[]; total: number; page: number } | null> => {
  try {
    const response = await getHealthDataApi(params);
    
    return {
      items: response.items.map(item => formatHealthDataForDisplay(item)),
      total: response.total,
      page: response.page
    };
  } catch (error) {
    console.error('Error retrieving health data:', error);
    return null;
  }
};

/**
 * Retrieves health data entries for a specific date and formats them for display
 * 
 * @param date - Date to filter health data by
 * @param type - Optional health data type filter
 * @param page - Optional page number for pagination
 * @param limit - Optional limit of items per page
 * @returns Promise resolving to formatted health data entries for the specified date or null on error
 */
export const getHealthDataByDate = async (
  date: Date,
  type?: HealthDataType,
  page: number = 1,
  limit: number = 20
): Promise<{ items: HealthDataResponse[]; total: number; page: number } | null> => {
  try {
    // Format date to YYYY-MM-DD string for API
    const dateString = format(date, 'yyyy-MM-dd');
    
    const response = await getHealthDataByDateApi(
      dateString,
      type,
      page,
      limit
    );
    
    return {
      items: response.items.map(item => formatHealthDataForDisplay(item)),
      total: response.total,
      page: response.page
    };
  } catch (error) {
    console.error('Error retrieving health data by date:', error);
    return null;
  }
};

/**
 * Searches health data entries based on a search term and formats results for display
 * 
 * @param searchTerm - Term to search for in health data
 * @param type - Optional health data type filter
 * @param page - Optional page number for pagination
 * @param limit - Optional limit of items per page
 * @returns Promise resolving to formatted health data entries matching the search term or null on error
 */
export const searchHealthData = async (
  searchTerm: string,
  type?: HealthDataType,
  page: number = 1,
  limit: number = 20
): Promise<{ items: HealthDataResponse[]; total: number; page: number } | null> => {
  try {
    const response = await searchHealthDataApi(
      searchTerm,
      type,
      page,
      limit
    );
    
    return {
      items: response.items.map(item => formatHealthDataForDisplay(item)),
      total: response.total,
      page: response.page
    };
  } catch (error) {
    console.error('Error searching health data:', error);
    return null;
  }
};

/**
 * Creates a new meal health data entry with an image and formats the response
 * 
 * @param mealData - Meal data including image and description
 * @returns Promise resolving to the formatted created health data entry or null on error
 */
export const createMealData = async (
  mealData: CreateMealDataRequest
): Promise<HealthDataResponse | null> => {
  try {
    const response = await createMealDataApi(mealData);
    return formatHealthDataForDisplay(response);
  } catch (error) {
    console.error('Error creating meal data:', error);
    return null;
  }
};

/**
 * Creates a new lab result health data entry with an image and formats the response
 * 
 * @param labData - Lab result data including image and test information
 * @returns Promise resolving to the formatted created health data entry or null on error
 */
export const createLabResultData = async (
  labData: CreateLabResultDataRequest
): Promise<HealthDataResponse | null> => {
  try {
    const response = await createLabResultDataApi(labData);
    return formatHealthDataForDisplay(response);
  } catch (error) {
    console.error('Error creating lab result data:', error);
    return null;
  }
};

/**
 * Creates a new symptom health data entry with audio recording and formats the response
 * 
 * @param symptomData - Symptom data including audio recording and symptom information
 * @returns Promise resolving to the formatted created health data entry or null on error
 */
export const createSymptomData = async (
  symptomData: CreateSymptomDataRequest
): Promise<HealthDataResponse | null> => {
  try {
    const response = await createSymptomDataApi(symptomData);
    return formatHealthDataForDisplay(response);
  } catch (error) {
    console.error('Error creating symptom data:', error);
    return null;
  }
};

/**
 * Creates a new health data entry based on the data type and formats the response
 * 
 * @param healthData - Generic health data to be created
 * @returns Promise resolving to the formatted created health data entry or null on error
 */
export const createHealthData = async (
  healthData: CreateHealthDataRequest
): Promise<HealthDataResponse | null> => {
  try {
    const response = await createHealthDataApi(healthData);
    return formatHealthDataForDisplay(response);
  } catch (error) {
    console.error('Error creating health data:', error);
    return null;
  }
};

/**
 * Deletes a health data entry by its ID
 * 
 * @param id - ID of the health data entry to delete
 * @returns Promise resolving to true if deletion was successful, false otherwise
 */
export const deleteHealthData = async (id: string): Promise<boolean> => {
  try {
    await deleteHealthDataApi(id);
    return true;
  } catch (error) {
    console.error('Error deleting health data:', error);
    return false;
  }
};

/**
 * Formats a health data entry for display with user-friendly date and time formats
 * 
 * @param healthData - Health data entry from the API
 * @returns Health data entry with formatted display properties
 */
export const formatHealthDataForDisplay = (
  healthData: HealthDataResponse
): HealthDataResponse => {
  // Create a copy of the health data to avoid mutating the input
  const formattedData = { ...healthData };
  
  // Parse the timestamp to a Date object
  const timestamp = new Date(healthData.timestamp);
  
  // Add display properties
  formattedData.displayDate = formatDisplayDate(timestamp);
  formattedData.displayTime = formatDisplayTime(timestamp);
  
  // Add relative date (Today, Yesterday, etc.)
  (formattedData as any).relativeDate = getRelativeDateLabel(timestamp);
  
  return formattedData;
};

/**
 * Groups health data entries by date for organized display in the health log
 * 
 * @param healthData - Array of health data entries
 * @returns Object with dates as keys and arrays of health data entries as values
 */
export const groupHealthDataByDate = (
  healthData: HealthDataResponse[]
): Record<string, HealthDataResponse[]> => {
  return groupByDate(healthData, 'timestamp');
};

/**
 * Retrieves recent health data to provide context for LLM chat interactions
 * 
 * @param limit - Number of recent entries to retrieve for each type
 * @returns Promise resolving to recent health data organized by type or null on error
 */
export const getHealthContext = async (
  limit: number = 5
): Promise<{
  recentMeals: HealthDataResponse[];
  recentLabResults: HealthDataResponse[];
  recentSymptoms: HealthDataResponse[];
} | null> => {
  try {
    // Fetch recent meals
    const mealsResponse = await getHealthData({
      type: HealthDataType.MEAL,
      limit: limit,
      page: 1
    });
    
    // Fetch recent lab results
    const labResultsResponse = await getHealthData({
      type: HealthDataType.LAB_RESULT,
      limit: limit,
      page: 1
    });
    
    // Fetch recent symptoms
    const symptomsResponse = await getHealthData({
      type: HealthDataType.SYMPTOM,
      limit: limit,
      page: 1
    });
    
    // If any request failed, return null
    if (!mealsResponse || !labResultsResponse || !symptomsResponse) {
      return null;
    }
    
    // Return all the context data
    return {
      recentMeals: mealsResponse.items,
      recentLabResults: labResultsResponse.items,
      recentSymptoms: symptomsResponse.items
    };
  } catch (error) {
    console.error('Error retrieving health context:', error);
    return null;
  }
};