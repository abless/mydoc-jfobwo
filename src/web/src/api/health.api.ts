/**
 * API module for health data management
 * 
 * This module provides functions for interacting with the health data endpoints of the backend server.
 * It handles all health-related API requests including retrieving, creating, updating, and deleting
 * health data entries (meals, lab results, symptoms) with support for filtering, pagination, and file uploads.
 * 
 * @version 1.0.0
 */

import { apiService } from '../services/api.service'; // axios v1.3.4
import { ENDPOINTS } from '../constants/endpoints';
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

/**
 * Retrieves a specific health data entry by its ID
 * @param id - The ID of the health data entry to retrieve
 * @returns Promise resolving to the health data entry
 */
export const getHealthDataById = async (id: string): Promise<HealthDataResponse> => {
  const url = ENDPOINTS.HEALTH.GET_BY_ID.replace(':id', id);
  const response = await apiService.get<HealthDataApiResponse>(url);
  return response.data;
};

/**
 * Retrieves health data entries with optional filtering and pagination
 * @param params - Parameters for filtering and pagination
 * @returns Promise resolving to paginated health data entries
 */
export const getHealthData = async (params: GetHealthDataParams): Promise<HealthDataListResponse> => {
  const response = await apiService.get<HealthDataListApiResponse>(ENDPOINTS.HEALTH.GET_ALL, params);
  return response.data;
};

/**
 * Retrieves health data entries for a specific date with optional type filtering
 * @param date - The date to filter by (YYYY-MM-DD format)
 * @param type - Optional type filter (meal, labResult, symptom)
 * @param page - Optional page number for pagination
 * @param limit - Optional limit of items per page
 * @returns Promise resolving to paginated health data entries for the date
 */
export const getHealthDataByDate = async (
  date: string,
  type?: HealthDataType,
  page?: number,
  limit?: number
): Promise<HealthDataListResponse> => {
  const params: GetHealthDataParams = {
    date,
    ...(type && { type }),
    ...(page && { page }),
    ...(limit && { limit })
  };
  return getHealthData(params);
};

/**
 * Searches health data entries based on a search term with optional type filtering
 * @param search - The search term to filter by
 * @param type - Optional type filter (meal, labResult, symptom)
 * @param page - Optional page number for pagination
 * @param limit - Optional limit of items per page
 * @returns Promise resolving to paginated health data entries matching the search
 */
export const searchHealthData = async (
  search: string,
  type?: HealthDataType,
  page?: number,
  limit?: number
): Promise<HealthDataListResponse> => {
  const params: GetHealthDataParams = {
    search,
    ...(type && { type }),
    ...(page && { page }),
    ...(limit && { limit })
  };
  return getHealthData(params);
};

/**
 * Creates a new meal health data entry with an image
 * @param mealData - The meal data to create
 * @returns Promise resolving to the created health data entry
 */
export const createMealData = async (
  mealData: CreateMealDataRequest
): Promise<HealthDataResponse> => {
  const formData = new FormData();
  formData.append('type', HealthDataType.MEAL);
  formData.append('description', mealData.description);
  formData.append('mealType', mealData.mealType);
  formData.append('timestamp', mealData.timestamp);
  
  if (mealData.image) {
    formData.append('file', {
      uri: mealData.image.uri,
      type: mealData.image.type,
      name: mealData.image.name,
    } as any); // Cast to any to satisfy TypeScript
  }
  
  const response = await apiService.uploadFile<HealthDataApiResponse>(
    ENDPOINTS.HEALTH.CREATE,
    formData
  );
  
  return response.data;
};

/**
 * Creates a new lab result health data entry with an image
 * @param labData - The lab result data to create
 * @returns Promise resolving to the created health data entry
 */
export const createLabResultData = async (
  labData: CreateLabResultDataRequest
): Promise<HealthDataResponse> => {
  const formData = new FormData();
  formData.append('type', HealthDataType.LAB_RESULT);
  formData.append('testType', labData.testType);
  formData.append('testDate', labData.testDate);
  if (labData.notes) {
    formData.append('notes', labData.notes);
  }
  formData.append('timestamp', labData.timestamp);
  
  if (labData.image) {
    formData.append('file', {
      uri: labData.image.uri,
      type: labData.image.type,
      name: labData.image.name,
    } as any); // Cast to any to satisfy TypeScript
  }
  
  const response = await apiService.uploadFile<HealthDataApiResponse>(
    ENDPOINTS.HEALTH.CREATE,
    formData
  );
  
  return response.data;
};

/**
 * Creates a new symptom health data entry with audio recording
 * @param symptomData - The symptom data to create
 * @returns Promise resolving to the created health data entry
 */
export const createSymptomData = async (
  symptomData: CreateSymptomDataRequest
): Promise<HealthDataResponse> => {
  const formData = new FormData();
  formData.append('type', HealthDataType.SYMPTOM);
  formData.append('description', symptomData.description);
  formData.append('severity', symptomData.severity);
  if (symptomData.duration) {
    formData.append('duration', symptomData.duration);
  }
  if (symptomData.transcription) {
    formData.append('transcription', symptomData.transcription);
  }
  formData.append('timestamp', symptomData.timestamp);
  
  if (symptomData.audio) {
    formData.append('file', {
      uri: symptomData.audio.uri,
      type: symptomData.audio.type,
      name: symptomData.audio.name,
    } as any); // Cast to any to satisfy TypeScript
  }
  
  const response = await apiService.uploadFile<HealthDataApiResponse>(
    ENDPOINTS.HEALTH.CREATE,
    formData
  );
  
  return response.data;
};

/**
 * Creates a new health data entry with the specified type and data
 * @param healthData - The health data to create
 * @returns Promise resolving to the created health data entry
 */
export const createHealthData = async (
  healthData: CreateHealthDataRequest
): Promise<HealthDataResponse> => {
  const response = await apiService.post<HealthDataApiResponse>(
    ENDPOINTS.HEALTH.CREATE,
    healthData
  );
  return response.data;
};

/**
 * Deletes a health data entry by its ID
 * @param id - The ID of the health data entry to delete
 * @returns Promise resolving to true if deletion was successful
 */
export const deleteHealthData = async (id: string): Promise<boolean> => {
  const url = ENDPOINTS.HEALTH.DELETE.replace(':id', id);
  await apiService.delete<any>(url);
  return true;
};