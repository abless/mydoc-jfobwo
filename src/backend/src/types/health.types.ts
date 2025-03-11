/**
 * Health data type definitions for the Health Advisor application
 * Contains types, interfaces, and enums for handling health-related data
 */

import { Types } from 'mongoose'; // v7.0.3

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
  /** The method used to input the health data */
  source: InputSource;
  
  /** Tags for categorizing health data */
  tags: string[];
  
  /** Location information where the health data was recorded */
  location: {
    latitude?: number;
    longitude?: number;
    name?: string;
  };
}

/**
 * Interface for meal-specific health data
 */
export interface MealData {
  /** Description of the meal */
  description: string;
  
  /** Type of meal (breakfast, lunch, dinner, snack) */
  mealType: MealType;
  
  /** URL to the image of the meal, if captured via photo */
  imageUrl: string;
}

/**
 * Interface for lab result-specific health data
 */
export interface LabResultData {
  /** Type of lab test (e.g., "Blood Test", "Cholesterol", etc.) */
  testType: string;
  
  /** Date when the lab test was conducted */
  testDate: Date;
  
  /** Key-value pairs of test results */
  results: Record<string, any>;
  
  /** Additional notes about the lab results */
  notes: string;
  
  /** URL to the image of the lab result, if captured via photo */
  imageUrl: string;
}

/**
 * Interface for symptom-specific health data
 */
export interface SymptomData {
  /** Description of the symptom */
  description: string;
  
  /** Severity level of the symptom */
  severity: SymptomSeverity;
  
  /** Duration of the symptom (e.g., "2 hours", "3 days") */
  duration: string;
  
  /** URL to the audio recording of the symptom description, if captured via voice */
  audioUrl: string;
  
  /** Transcription of the voice recording */
  transcription: string;
}

/**
 * Interface for the core health data document structure
 */
export interface HealthData {
  /** Reference to the user who owns this health data */
  userId: Types.ObjectId;
  
  /** Type of health data (meal, lab result, symptom) */
  type: HealthDataType;
  
  /** Timestamp when the health data was recorded */
  timestamp: Date;
  
  /** The specific health data depending on the type */
  data: MealData | LabResultData | SymptomData;
  
  /** References to files associated with this health data (images, audio) */
  fileIds: Types.ObjectId[];
  
  /** Metadata associated with this health data */
  metadata: HealthDataMetadata;
}

/**
 * Interface for health data creation request payload
 */
export interface CreateHealthDataRequest {
  /** Type of health data being created */
  type: HealthDataType;
  
  /** The specific health data depending on the type */
  data: MealData | LabResultData | SymptomData;
  
  /** Timestamp when the health data was recorded */
  timestamp: Date;
  
  /** Metadata associated with this health data */
  metadata: HealthDataMetadata;
}

/**
 * Interface for health data response payload returned to clients
 */
export interface HealthDataResponse {
  /** Unique identifier for the health data entry */
  id: string;
  
  /** Type of health data */
  type: HealthDataType;
  
  /** Timestamp when the health data was recorded (ISO string format) */
  timestamp: string;
  
  /** The specific health data depending on the type */
  data: MealData | LabResultData | SymptomData;
  
  /** URLs and content types of files associated with this health data */
  files: {
    url: string;
    contentType: string;
  }[];
  
  /** Metadata associated with this health data */
  metadata: HealthDataMetadata;
}

/**
 * Interface for health data retrieval request with filtering and pagination options
 */
export interface GetHealthDataRequest {
  /** Filter by date (ISO string format) */
  date?: string;
  
  /** Filter by health data type */
  type?: HealthDataType;
  
  /** Search term to filter health data */
  search?: string;
  
  /** Page number for pagination */
  page?: number;
  
  /** Number of items per page */
  limit?: number;
}

/**
 * Interface for paginated health data response
 */
export interface GetHealthDataResponse {
  /** Array of health data items */
  items: HealthDataResponse[];
  
  /** Total number of items matching the query */
  total: number;
  
  /** Current page number */
  page: number;
}

/**
 * Interface for health context data used in LLM interactions
 */
export interface HealthContext {
  /** Recent meal entries to provide context for LLM */
  recentMeals: HealthDataResponse[];
  
  /** Recent lab result entries to provide context for LLM */
  recentLabResults: HealthDataResponse[];
  
  /** Recent symptom entries to provide context for LLM */
  recentSymptoms: HealthDataResponse[];
}