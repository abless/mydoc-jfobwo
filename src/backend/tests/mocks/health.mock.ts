import { Types } from 'mongoose'; // v7.0.3
import {
  HealthData,
  HealthDataType,
  MealData,
  LabResultData,
  SymptomData,
  HealthDataMetadata,
  InputSource,
  MealType,
  SymptomSeverity,
  CreateHealthDataRequest,
  HealthDataResponse
} from '../../src/types/health.types';
import { mockUserId, mockUserObjectId } from './user.mock';

// Create consistent mock IDs for testing
export const mockHealthDataId = new Types.ObjectId().toString();
export const mockHealthDataObjectId = new Types.ObjectId();
export const mockFileId = new Types.ObjectId().toString();
export const mockFileObjectId = new Types.ObjectId();

/**
 * Creates mock meal data with optional overrides for testing
 * @param overrides - Optional property overrides for the meal data
 * @returns A mock meal data object with default values and any provided overrides
 */
export const createMockMealData = (overrides?: Partial<MealData>): MealData => {
  return {
    description: 'Oatmeal with berries and honey',
    mealType: MealType.BREAKFAST,
    imageUrl: 'https://example.com/images/meals/oatmeal.jpg',
    ...overrides
  };
};

/**
 * Creates mock lab result data with optional overrides for testing
 * @param overrides - Optional property overrides for the lab result data
 * @returns A mock lab result data object with default values and any provided overrides
 */
export const createMockLabResultData = (overrides?: Partial<LabResultData>): LabResultData => {
  return {
    testType: 'Blood Test',
    testDate: new Date('2023-05-15T10:15:00.000Z'),
    results: {
      cholesterol: 180,
      hdl: 60,
      ldl: 100,
      triglycerides: 150,
      glucose: 85
    },
    notes: 'Fasting blood test results',
    imageUrl: 'https://example.com/images/lab-results/blood-test.jpg',
    ...overrides
  };
};

/**
 * Creates mock symptom data with optional overrides for testing
 * @param overrides - Optional property overrides for the symptom data
 * @returns A mock symptom data object with default values and any provided overrides
 */
export const createMockSymptomData = (overrides?: Partial<SymptomData>): SymptomData => {
  return {
    description: 'Headache after meals',
    severity: SymptomSeverity.MODERATE,
    duration: '1 hour',
    audioUrl: 'https://example.com/audio/symptoms/headache.mp3',
    transcription: 'I have been experiencing headaches after eating, typically lasting about an hour. The pain is moderate and located in my temples.',
    ...overrides
  };
};

/**
 * Default mock health data metadata
 */
export const mockHealthMetadata: HealthDataMetadata = {
  source: InputSource.PHOTO,
  tags: ['health', 'testing'],
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco, CA'
  }
};

/**
 * Default mock meal data
 */
export const mockMealData: MealData = createMockMealData();

/**
 * Default mock lab result data
 */
export const mockLabResultData: LabResultData = createMockLabResultData();

/**
 * Default mock symptom data
 */
export const mockSymptomData: SymptomData = createMockSymptomData();

/**
 * Creates a mock health data document with optional overrides for testing
 * @param overrides - Optional property overrides for the health data document
 * @returns A mock health data document with default values and any provided overrides
 */
export const createMockHealthData = (overrides?: Partial<HealthData>): HealthData => {
  const now = new Date();
  return {
    _id: mockHealthDataObjectId,
    userId: mockUserObjectId,
    type: HealthDataType.MEAL,
    timestamp: new Date('2023-05-15T08:30:00.000Z'),
    data: mockMealData,
    fileIds: [mockFileObjectId],
    metadata: mockHealthMetadata,
    createdAt: now,
    updatedAt: now,
    ...overrides
  } as HealthData;
};

/**
 * Default mock meal health data document
 */
export const mockMealHealthData: HealthData = createMockHealthData();

/**
 * Default mock lab result health data document
 */
export const mockLabResultHealthData: HealthData = createMockHealthData({
  type: HealthDataType.LAB_RESULT,
  timestamp: new Date('2023-05-15T10:15:00.000Z'),
  data: mockLabResultData,
  metadata: {
    ...mockHealthMetadata,
    source: InputSource.PHOTO
  }
});

/**
 * Default mock symptom health data document
 */
export const mockSymptomHealthData: HealthData = createMockHealthData({
  type: HealthDataType.SYMPTOM,
  timestamp: new Date('2023-05-15T14:45:00.000Z'),
  data: mockSymptomData,
  metadata: {
    ...mockHealthMetadata,
    source: InputSource.VOICE
  }
});

/**
 * Creates mock health data request with optional overrides for testing API requests
 * @param overrides - Optional property overrides for the health data request
 * @returns Mock health data request with default values and any provided overrides
 */
export const createMockHealthDataRequest = (overrides?: Partial<CreateHealthDataRequest>): CreateHealthDataRequest => {
  return {
    type: HealthDataType.MEAL,
    data: mockMealData,
    timestamp: new Date('2023-05-15T08:30:00.000Z'),
    metadata: mockHealthMetadata,
    ...overrides
  };
};

/**
 * Default mock health data request
 */
export const mockHealthDataRequest: CreateHealthDataRequest = createMockHealthDataRequest();

/**
 * Creates a mock health data response for testing API responses
 * @param overrides - Optional property overrides for the health data response
 * @returns Mock health data response with default values and any provided overrides
 */
export const createMockHealthDataResponse = (overrides?: Partial<HealthDataResponse>): HealthDataResponse => {
  return {
    id: mockHealthDataId,
    type: HealthDataType.MEAL,
    timestamp: '2023-05-15T08:30:00.000Z',
    data: mockMealData,
    files: [
      {
        url: 'https://example.com/images/meals/oatmeal.jpg',
        contentType: 'image/jpeg'
      }
    ],
    metadata: mockHealthMetadata,
    ...overrides
  };
};

/**
 * Default mock health data response
 */
export const mockHealthDataResponse: HealthDataResponse = createMockHealthDataResponse();