/**
 * TypeScript type definitions for health-related data structures in the React Native mobile application.
 * This file defines enums, interfaces, and types for handling various health data types (meals, lab results, symptoms)
 * and their associated operations, ensuring type safety throughout the application.
 */

import { ApiResponse, PaginatedResponse } from './api.types';

/**
 * Enum defining the different types of health data that can be stored in the system
 */
export enum HealthDataType {
  MEAL = 'meal',
  LAB_RESULT = 'labResult',
  SYMPTOM = 'symptom'
}

/**
 * Enum defining the different input methods for health data
 */
export enum InputSource {
  PHOTO = 'photo',
  VOICE = 'voice',
  TEXT = 'text'
}

/**
 * Enum defining the severity levels for symptom reporting
 */
export enum SymptomSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe'
}

/**
 * Enum defining the different types of meals for meal logging
 */
export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

/**
 * Interface for metadata associated with health data entries
 */
export interface HealthDataMetadata {
  /**
   * Input method used to capture the health data
   */
  source: InputSource;
  
  /**
   * Optional tags for categorization and searching
   */
  tags?: string[];
  
  /**
   * Optional location data where the health data was recorded
   */
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
  };
}

/**
 * Interface for meal-specific health data
 */
export interface MealData {
  /**
   * Text description of the meal
   */
  description: string;
  
  /**
   * Type of meal (breakfast, lunch, dinner, snack)
   */
  mealType: MealType;
  
  /**
   * URL to access the meal image
   */
  imageUrl?: string;
}

/**
 * Interface for lab result-specific health data
 */
export interface LabResultData {
  /**
   * Type of medical test (e.g., blood test, cholesterol, glucose)
   */
  testType: string;
  
  /**
   * Date when the lab test was performed
   */
  testDate: string;
  
  /**
   * Structured test results data
   */
  results?: Record<string, any>;
  
  /**
   * Additional notes about the lab results
   */
  notes?: string;
  
  /**
   * URL to access the lab result image
   */
  imageUrl?: string;
}

/**
 * Interface for symptom-specific health data
 */
export interface SymptomData {
  /**
   * Text description of the symptom
   */
  description: string;
  
  /**
   * Severity level of the symptom
   */
  severity: SymptomSeverity;
  
  /**
   * Duration of the symptom (e.g., "2 hours", "3 days")
   */
  duration?: string;
  
  /**
   * URL to access the voice recording of the symptom description
   */
  audioUrl?: string;
  
  /**
   * Text transcription of the voice recording
   */
  transcription?: string;
}

/**
 * Interface for health data response from the API with formatted display properties
 */
export interface HealthDataResponse {
  /**
   * Unique identifier for the health data entry
   */
  id: string;
  
  /**
   * Type of health data (meal, lab result, symptom)
   */
  type: HealthDataType;
  
  /**
   * ISO timestamp when the health data was recorded
   */
  timestamp: string;
  
  /**
   * Type-specific health data content
   */
  data: MealData | LabResultData | SymptomData;
  
  /**
   * Array of file references associated with the health data
   */
  files?: {
    url: string;
    contentType: string;
  }[];
  
  /**
   * Metadata associated with the health data entry
   */
  metadata?: HealthDataMetadata;
  
  /**
   * Formatted date string for display purposes
   */
  displayDate?: string;
}

/**
 * Interface for API response containing a single health data entry
 */
export interface HealthDataApiResponse extends ApiResponse<HealthDataResponse> {}

/**
 * Interface for paginated list of health data entries
 */
export interface HealthDataListResponse extends PaginatedResponse<HealthDataResponse> {}

/**
 * Interface for API response containing a paginated list of health data entries
 */
export interface HealthDataListApiResponse extends ApiResponse<HealthDataListResponse> {}

/**
 * Interface for parameters used when retrieving health data with filtering and pagination
 */
export interface GetHealthDataParams {
  /**
   * Filter by specific date (YYYY-MM-DD format)
   */
  date?: string;
  
  /**
   * Filter by health data type
   */
  type?: HealthDataType;
  
  /**
   * Search query string
   */
  search?: string;
  
  /**
   * Page number for pagination
   */
  page?: number;
  
  /**
   * Number of items per page
   */
  limit?: number;
}

/**
 * Interface for request payload when creating new health data entries
 */
export interface CreateHealthDataRequest {
  /**
   * Type of health data being created
   */
  type: HealthDataType;
  
  /**
   * Type-specific health data content
   */
  data: MealData | LabResultData | SymptomData;
  
  /**
   * ISO timestamp when the health data was recorded
   */
  timestamp: string;
  
  /**
   * Metadata associated with the health data entry
   */
  metadata?: HealthDataMetadata;
}

/**
 * Interface for request payload when creating new meal data entries with image
 */
export interface CreateMealDataRequest {
  /**
   * Text description of the meal
   */
  description: string;
  
  /**
   * Type of meal (breakfast, lunch, dinner, snack)
   */
  mealType: MealType;
  
  /**
   * Image file information for upload
   */
  image?: {
    uri: string;
    type: string;
    name: string;
  };
  
  /**
   * ISO timestamp when the meal was consumed
   */
  timestamp: string;
}

/**
 * Interface for request payload when creating new lab result data entries with image
 */
export interface CreateLabResultDataRequest {
  /**
   * Type of medical test
   */
  testType: string;
  
  /**
   * Date when the lab test was performed
   */
  testDate: string;
  
  /**
   * Additional notes about the lab results
   */
  notes?: string;
  
  /**
   * Image file information for upload
   */
  image?: {
    uri: string;
    type: string;
    name: string;
  };
  
  /**
   * ISO timestamp when the lab result was recorded
   */
  timestamp: string;
}

/**
 * Interface for request payload when creating new symptom data entries with audio recording
 */
export interface CreateSymptomDataRequest {
  /**
   * Text description of the symptom
   */
  description: string;
  
  /**
   * Severity level of the symptom
   */
  severity: SymptomSeverity;
  
  /**
   * Duration of the symptom (e.g., "2 hours", "3 days")
   */
  duration?: string;
  
  /**
   * Audio file information for upload
   */
  audio?: {
    uri: string;
    type: string;
    name: string;
  };
  
  /**
   * Text transcription of the voice recording
   */
  transcription?: string;
  
  /**
   * ISO timestamp when the symptom was experienced
   */
  timestamp: string;
}

/**
 * Interface for health context data used in LLM chat interactions
 */
export interface HealthContext {
  /**
   * Recent meal entries to provide context for the LLM
   */
  recentMeals: HealthDataResponse[];
  
  /**
   * Recent lab result entries to provide context for the LLM
   */
  recentLabResults: HealthDataResponse[];
  
  /**
   * Recent symptom entries to provide context for the LLM
   */
  recentSymptoms: HealthDataResponse[];
}