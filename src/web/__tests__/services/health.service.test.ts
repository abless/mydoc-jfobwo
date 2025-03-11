import * as healthService from '../../src/services/health.service';
import * as healthApi from '../../src/api/health.api';
import { HealthDataType, MealType, SymptomSeverity } from '../../src/types/health.types';
import { formatDisplayDate, formatDisplayTime, getRelativeDateLabel, groupByDate } from '../../src/utils/date.utils';

// Mock the health API module
jest.mock('../../src/api/health.api');

// Mock the date utils module
jest.mock('../../src/utils/date.utils');

describe('Health Service', () => {
  // Helper function to create mock health data
  const createMockHealthData = (overrides = {}) => ({
    id: 'test-id',
    type: HealthDataType.MEAL,
    timestamp: '2023-05-15T12:00:00Z',
    data: {
      description: 'Test meal',
      mealType: MealType.LUNCH,
      imageUrl: 'https://example.com/meal.jpg'
    },
    ...overrides
  });

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Set up default mocks for date utils
    (formatDisplayDate as jest.Mock).mockImplementation(() => 'May 15, 2023');
    (formatDisplayTime as jest.Mock).mockImplementation(() => '12:00 PM');
    (getRelativeDateLabel as jest.Mock).mockImplementation(() => 'Today');
    (groupByDate as jest.Mock).mockImplementation((items, property) => {
      const result: Record<string, any[]> = {};
      
      // Simple implementation for tests
      items.forEach(item => {
        const dateStr = item.timestamp.split('T')[0];
        if (!result[dateStr]) {
          result[dateStr] = [];
        }
        result[dateStr].push(item);
      });
      
      return result;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests for getHealthDataById
  describe('getHealthDataById', () => {
    it('should call the API function with the correct ID', async () => {
      const mockHealthData = createMockHealthData();
      (healthApi.getHealthDataById as jest.Mock).mockResolvedValue(mockHealthData);
      
      await healthService.getHealthDataById('test-id');
      
      expect(healthApi.getHealthDataById).toHaveBeenCalledWith('test-id');
    });

    it('should format the health data for display', async () => {
      const mockHealthData = createMockHealthData();
      (healthApi.getHealthDataById as jest.Mock).mockResolvedValue(mockHealthData);
      
      const result = await healthService.getHealthDataById('test-id');
      
      expect(formatDisplayDate).toHaveBeenCalledWith(new Date(mockHealthData.timestamp));
      expect(formatDisplayTime).toHaveBeenCalledWith(new Date(mockHealthData.timestamp));
      expect(getRelativeDateLabel).toHaveBeenCalledWith(new Date(mockHealthData.timestamp));
      expect(result).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result).toHaveProperty('displayTime', '12:00 PM');
      expect(result).toHaveProperty('relativeDate', 'Today');
    });

    it('should return null when API call fails', async () => {
      (healthApi.getHealthDataById as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.getHealthDataById('test-id');
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.getHealthDataById as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.getHealthDataById('test-id');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for getHealthData
  describe('getHealthData', () => {
    it('should call the API function with the correct parameters', async () => {
      const mockParams = { type: HealthDataType.MEAL, page: 1, limit: 10 };
      const mockResponse = {
        items: [createMockHealthData()],
        total: 1,
        page: 1
      };
      (healthApi.getHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.getHealthData(mockParams);
      
      expect(healthApi.getHealthData).toHaveBeenCalledWith(mockParams);
    });

    it('should format each health data entry for display', async () => {
      const mockResponse = {
        items: [createMockHealthData(), createMockHealthData({ id: 'test-id-2' })],
        total: 2,
        page: 1
      };
      (healthApi.getHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.getHealthData({ page: 1, limit: 10 });
      
      expect(formatDisplayDate).toHaveBeenCalledTimes(2);
      expect(formatDisplayTime).toHaveBeenCalledTimes(2);
      expect(getRelativeDateLabel).toHaveBeenCalledTimes(2);
      expect(result?.items[0]).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result?.items[1]).toHaveProperty('displayDate', 'May 15, 2023');
    });

    it('should return the formatted health data list with pagination info', async () => {
      const mockResponse = {
        items: [createMockHealthData()],
        total: 1,
        page: 1
      };
      (healthApi.getHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.getHealthData({ page: 1, limit: 10 });
      
      expect(result).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'test-id',
            displayDate: 'May 15, 2023',
            displayTime: '12:00 PM',
            relativeDate: 'Today'
          })
        ]),
        total: 1,
        page: 1
      });
    });

    it('should return null when API call fails', async () => {
      (healthApi.getHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.getHealthData({ page: 1, limit: 10 });
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.getHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.getHealthData({ page: 1, limit: 10 });
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for getHealthDataByDate
  describe('getHealthDataByDate', () => {
    it('should call the API function with the correct date and optional parameters', async () => {
      const mockDate = new Date('2023-05-15');
      const mockResponse = {
        items: [createMockHealthData()],
        total: 1,
        page: 1
      };
      (healthApi.getHealthDataByDate as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.getHealthDataByDate(mockDate, HealthDataType.MEAL, 1, 10);
      
      expect(healthApi.getHealthDataByDate).toHaveBeenCalledWith(
        '2023-05-15',
        HealthDataType.MEAL,
        1,
        10
      );
    });

    it('should format each health data entry for display', async () => {
      const mockDate = new Date('2023-05-15');
      const mockResponse = {
        items: [createMockHealthData(), createMockHealthData({ id: 'test-id-2' })],
        total: 2,
        page: 1
      };
      (healthApi.getHealthDataByDate as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.getHealthDataByDate(mockDate);
      
      expect(formatDisplayDate).toHaveBeenCalledTimes(2);
      expect(formatDisplayTime).toHaveBeenCalledTimes(2);
      expect(getRelativeDateLabel).toHaveBeenCalledTimes(2);
      expect(result?.items[0]).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result?.items[1]).toHaveProperty('displayDate', 'May 15, 2023');
    });

    it('should return the formatted health data list with pagination info', async () => {
      const mockDate = new Date('2023-05-15');
      const mockResponse = {
        items: [createMockHealthData()],
        total: 1,
        page: 1
      };
      (healthApi.getHealthDataByDate as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.getHealthDataByDate(mockDate);
      
      expect(result).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'test-id',
            displayDate: 'May 15, 2023',
            displayTime: '12:00 PM',
            relativeDate: 'Today'
          })
        ]),
        total: 1,
        page: 1
      });
    });

    it('should return null when API call fails', async () => {
      const mockDate = new Date('2023-05-15');
      (healthApi.getHealthDataByDate as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.getHealthDataByDate(mockDate);
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const mockDate = new Date('2023-05-15');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.getHealthDataByDate as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.getHealthDataByDate(mockDate);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for searchHealthData
  describe('searchHealthData', () => {
    it('should call the API function with the correct search term and optional parameters', async () => {
      const mockSearchTerm = 'test';
      const mockResponse = {
        items: [createMockHealthData()],
        total: 1,
        page: 1
      };
      (healthApi.searchHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.searchHealthData(mockSearchTerm, HealthDataType.MEAL, 1, 10);
      
      expect(healthApi.searchHealthData).toHaveBeenCalledWith(
        mockSearchTerm,
        HealthDataType.MEAL,
        1,
        10
      );
    });

    it('should format each health data entry for display', async () => {
      const mockSearchTerm = 'test';
      const mockResponse = {
        items: [createMockHealthData(), createMockHealthData({ id: 'test-id-2' })],
        total: 2,
        page: 1
      };
      (healthApi.searchHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.searchHealthData(mockSearchTerm);
      
      expect(formatDisplayDate).toHaveBeenCalledTimes(2);
      expect(formatDisplayTime).toHaveBeenCalledTimes(2);
      expect(getRelativeDateLabel).toHaveBeenCalledTimes(2);
      expect(result?.items[0]).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result?.items[1]).toHaveProperty('displayDate', 'May 15, 2023');
    });

    it('should return the formatted health data list with pagination info', async () => {
      const mockSearchTerm = 'test';
      const mockResponse = {
        items: [createMockHealthData()],
        total: 1,
        page: 1
      };
      (healthApi.searchHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.searchHealthData(mockSearchTerm);
      
      expect(result).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'test-id',
            displayDate: 'May 15, 2023',
            displayTime: '12:00 PM',
            relativeDate: 'Today'
          })
        ]),
        total: 1,
        page: 1
      });
    });

    it('should return null when API call fails', async () => {
      const mockSearchTerm = 'test';
      (healthApi.searchHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.searchHealthData(mockSearchTerm);
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const mockSearchTerm = 'test';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.searchHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.searchHealthData(mockSearchTerm);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for createMealData
  describe('createMealData', () => {
    it('should call the API function with the correct meal data', async () => {
      const mockMealData = {
        description: 'Test meal',
        mealType: MealType.LUNCH,
        timestamp: '2023-05-15T12:00:00Z',
        image: {
          uri: 'file://test.jpg',
          type: 'image/jpeg',
          name: 'test.jpg'
        }
      };
      const mockResponse = createMockHealthData();
      (healthApi.createMealData as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.createMealData(mockMealData);
      
      expect(healthApi.createMealData).toHaveBeenCalledWith(mockMealData);
    });

    it('should format the created health data for display', async () => {
      const mockMealData = {
        description: 'Test meal',
        mealType: MealType.LUNCH,
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData();
      (healthApi.createMealData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createMealData(mockMealData);
      
      expect(formatDisplayDate).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(formatDisplayTime).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(getRelativeDateLabel).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(result).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result).toHaveProperty('displayTime', '12:00 PM');
      expect(result).toHaveProperty('relativeDate', 'Today');
    });

    it('should return the formatted health data', async () => {
      const mockMealData = {
        description: 'Test meal',
        mealType: MealType.LUNCH,
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData();
      (healthApi.createMealData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createMealData(mockMealData);
      
      expect(result).toMatchObject({
        id: 'test-id',
        type: HealthDataType.MEAL,
        displayDate: 'May 15, 2023',
        displayTime: '12:00 PM',
        relativeDate: 'Today'
      });
    });

    it('should return null when API call fails', async () => {
      const mockMealData = {
        description: 'Test meal',
        mealType: MealType.LUNCH,
        timestamp: '2023-05-15T12:00:00Z'
      };
      (healthApi.createMealData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.createMealData(mockMealData);
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const mockMealData = {
        description: 'Test meal',
        mealType: MealType.LUNCH,
        timestamp: '2023-05-15T12:00:00Z'
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.createMealData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.createMealData(mockMealData);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for createLabResultData
  describe('createLabResultData', () => {
    it('should call the API function with the correct lab result data', async () => {
      const mockLabData = {
        testType: 'Blood Test',
        testDate: '2023-05-15',
        notes: 'Normal results',
        timestamp: '2023-05-15T12:00:00Z',
        image: {
          uri: 'file://test.jpg',
          type: 'image/jpeg',
          name: 'test.jpg'
        }
      };
      const mockResponse = createMockHealthData({
        type: HealthDataType.LAB_RESULT,
        data: {
          testType: 'Blood Test',
          testDate: '2023-05-15',
          notes: 'Normal results',
          imageUrl: 'https://example.com/lab.jpg'
        }
      });
      (healthApi.createLabResultData as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.createLabResultData(mockLabData);
      
      expect(healthApi.createLabResultData).toHaveBeenCalledWith(mockLabData);
    });

    it('should format the created health data for display', async () => {
      const mockLabData = {
        testType: 'Blood Test',
        testDate: '2023-05-15',
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData({
        type: HealthDataType.LAB_RESULT,
        data: {
          testType: 'Blood Test',
          testDate: '2023-05-15',
          imageUrl: 'https://example.com/lab.jpg'
        }
      });
      (healthApi.createLabResultData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createLabResultData(mockLabData);
      
      expect(formatDisplayDate).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(formatDisplayTime).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(getRelativeDateLabel).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(result).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result).toHaveProperty('displayTime', '12:00 PM');
      expect(result).toHaveProperty('relativeDate', 'Today');
    });

    it('should return the formatted health data', async () => {
      const mockLabData = {
        testType: 'Blood Test',
        testDate: '2023-05-15',
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData({
        type: HealthDataType.LAB_RESULT,
        data: {
          testType: 'Blood Test',
          testDate: '2023-05-15',
          imageUrl: 'https://example.com/lab.jpg'
        }
      });
      (healthApi.createLabResultData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createLabResultData(mockLabData);
      
      expect(result).toMatchObject({
        id: 'test-id',
        type: HealthDataType.LAB_RESULT,
        displayDate: 'May 15, 2023',
        displayTime: '12:00 PM',
        relativeDate: 'Today'
      });
    });

    it('should return null when API call fails', async () => {
      const mockLabData = {
        testType: 'Blood Test',
        testDate: '2023-05-15',
        timestamp: '2023-05-15T12:00:00Z'
      };
      (healthApi.createLabResultData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.createLabResultData(mockLabData);
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const mockLabData = {
        testType: 'Blood Test',
        testDate: '2023-05-15',
        timestamp: '2023-05-15T12:00:00Z'
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.createLabResultData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.createLabResultData(mockLabData);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for createSymptomData
  describe('createSymptomData', () => {
    it('should call the API function with the correct symptom data', async () => {
      const mockSymptomData = {
        description: 'Headache',
        severity: SymptomSeverity.MODERATE,
        duration: '2 hours',
        timestamp: '2023-05-15T12:00:00Z',
        transcription: 'I have a moderate headache that started two hours ago',
        audio: {
          uri: 'file://test.m4a',
          type: 'audio/m4a',
          name: 'test.m4a'
        }
      };
      const mockResponse = createMockHealthData({
        type: HealthDataType.SYMPTOM,
        data: {
          description: 'Headache',
          severity: SymptomSeverity.MODERATE,
          duration: '2 hours',
          transcription: 'I have a moderate headache that started two hours ago',
          audioUrl: 'https://example.com/symptom.m4a'
        }
      });
      (healthApi.createSymptomData as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.createSymptomData(mockSymptomData);
      
      expect(healthApi.createSymptomData).toHaveBeenCalledWith(mockSymptomData);
    });

    it('should format the created health data for display', async () => {
      const mockSymptomData = {
        description: 'Headache',
        severity: SymptomSeverity.MODERATE,
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData({
        type: HealthDataType.SYMPTOM,
        data: {
          description: 'Headache',
          severity: SymptomSeverity.MODERATE
        }
      });
      (healthApi.createSymptomData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createSymptomData(mockSymptomData);
      
      expect(formatDisplayDate).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(formatDisplayTime).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(getRelativeDateLabel).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(result).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result).toHaveProperty('displayTime', '12:00 PM');
      expect(result).toHaveProperty('relativeDate', 'Today');
    });

    it('should return the formatted health data', async () => {
      const mockSymptomData = {
        description: 'Headache',
        severity: SymptomSeverity.MODERATE,
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData({
        type: HealthDataType.SYMPTOM,
        data: {
          description: 'Headache',
          severity: SymptomSeverity.MODERATE
        }
      });
      (healthApi.createSymptomData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createSymptomData(mockSymptomData);
      
      expect(result).toMatchObject({
        id: 'test-id',
        type: HealthDataType.SYMPTOM,
        displayDate: 'May 15, 2023',
        displayTime: '12:00 PM',
        relativeDate: 'Today'
      });
    });

    it('should return null when API call fails', async () => {
      const mockSymptomData = {
        description: 'Headache',
        severity: SymptomSeverity.MODERATE,
        timestamp: '2023-05-15T12:00:00Z'
      };
      (healthApi.createSymptomData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.createSymptomData(mockSymptomData);
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const mockSymptomData = {
        description: 'Headache',
        severity: SymptomSeverity.MODERATE,
        timestamp: '2023-05-15T12:00:00Z'
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.createSymptomData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.createSymptomData(mockSymptomData);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for createHealthData
  describe('createHealthData', () => {
    it('should call the API function with the correct health data', async () => {
      const mockHealthData = {
        type: HealthDataType.MEAL,
        data: {
          description: 'Test meal',
          mealType: MealType.LUNCH
        },
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData();
      (healthApi.createHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.createHealthData(mockHealthData);
      
      expect(healthApi.createHealthData).toHaveBeenCalledWith(mockHealthData);
    });

    it('should format the created health data for display', async () => {
      const mockHealthData = {
        type: HealthDataType.MEAL,
        data: {
          description: 'Test meal',
          mealType: MealType.LUNCH
        },
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData();
      (healthApi.createHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createHealthData(mockHealthData);
      
      expect(formatDisplayDate).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(formatDisplayTime).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(getRelativeDateLabel).toHaveBeenCalledWith(new Date(mockResponse.timestamp));
      expect(result).toHaveProperty('displayDate', 'May 15, 2023');
      expect(result).toHaveProperty('displayTime', '12:00 PM');
      expect(result).toHaveProperty('relativeDate', 'Today');
    });

    it('should return the formatted health data', async () => {
      const mockHealthData = {
        type: HealthDataType.MEAL,
        data: {
          description: 'Test meal',
          mealType: MealType.LUNCH
        },
        timestamp: '2023-05-15T12:00:00Z'
      };
      const mockResponse = createMockHealthData();
      (healthApi.createHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await healthService.createHealthData(mockHealthData);
      
      expect(result).toMatchObject({
        id: 'test-id',
        type: HealthDataType.MEAL,
        displayDate: 'May 15, 2023',
        displayTime: '12:00 PM',
        relativeDate: 'Today'
      });
    });

    it('should return null when API call fails', async () => {
      const mockHealthData = {
        type: HealthDataType.MEAL,
        data: {
          description: 'Test meal',
          mealType: MealType.LUNCH
        },
        timestamp: '2023-05-15T12:00:00Z'
      };
      (healthApi.createHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.createHealthData(mockHealthData);
      
      expect(result).toBeNull();
    });

    it('should log errors when API call fails', async () => {
      const mockHealthData = {
        type: HealthDataType.MEAL,
        data: {
          description: 'Test meal',
          mealType: MealType.LUNCH
        },
        timestamp: '2023-05-15T12:00:00Z'
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.createHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.createHealthData(mockHealthData);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for deleteHealthData
  describe('deleteHealthData', () => {
    it('should call the API function with the correct ID', async () => {
      (healthApi.deleteHealthData as jest.Mock).mockResolvedValue(true);
      
      await healthService.deleteHealthData('test-id');
      
      expect(healthApi.deleteHealthData).toHaveBeenCalledWith('test-id');
    });

    it('should return true when deletion is successful', async () => {
      (healthApi.deleteHealthData as jest.Mock).mockResolvedValue(true);
      
      const result = await healthService.deleteHealthData('test-id');
      
      expect(result).toBe(true);
    });

    it('should return false when API call fails', async () => {
      (healthApi.deleteHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      const result = await healthService.deleteHealthData('test-id');
      
      expect(result).toBe(false);
    });

    it('should log errors when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.deleteHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.deleteHealthData('test-id');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // Tests for formatHealthDataForDisplay
  describe('formatHealthDataForDisplay', () => {
    it('should add displayDate property with formatted date', () => {
      const mockHealthData = createMockHealthData();
      
      const result = healthService.formatHealthDataForDisplay(mockHealthData);
      
      expect(formatDisplayDate).toHaveBeenCalledWith(new Date(mockHealthData.timestamp));
      expect(result).toHaveProperty('displayDate', 'May 15, 2023');
    });

    it('should add displayTime property with formatted time', () => {
      const mockHealthData = createMockHealthData();
      
      const result = healthService.formatHealthDataForDisplay(mockHealthData);
      
      expect(formatDisplayTime).toHaveBeenCalledWith(new Date(mockHealthData.timestamp));
      expect(result).toHaveProperty('displayTime', '12:00 PM');
    });

    it('should add relativeDate property with relative date label', () => {
      const mockHealthData = createMockHealthData();
      
      const result = healthService.formatHealthDataForDisplay(mockHealthData);
      
      expect(getRelativeDateLabel).toHaveBeenCalledWith(new Date(mockHealthData.timestamp));
      expect(result).toHaveProperty('relativeDate', 'Today');
    });

    it('should not modify the original health data object', () => {
      const mockHealthData = createMockHealthData();
      const originalHealthData = { ...mockHealthData };
      
      healthService.formatHealthDataForDisplay(mockHealthData);
      
      expect(mockHealthData).toEqual(originalHealthData);
    });
  });

  // Tests for groupHealthDataByDate
  describe('groupHealthDataByDate', () => {
    it('should group health data entries by date', () => {
      const mockHealthData = [
        createMockHealthData({ id: 'test-id-1', timestamp: '2023-05-15T12:00:00Z' }),
        createMockHealthData({ id: 'test-id-2', timestamp: '2023-05-15T14:00:00Z' }),
        createMockHealthData({ id: 'test-id-3', timestamp: '2023-05-16T10:00:00Z' })
      ];
      
      const result = healthService.groupHealthDataByDate(mockHealthData);
      
      expect(groupByDate).toHaveBeenCalledWith(mockHealthData, 'timestamp');
      expect(result).toHaveProperty('2023-05-15');
      expect(result).toHaveProperty('2023-05-16');
    });

    it('should use the timestamp property for grouping', () => {
      const mockHealthData = [
        createMockHealthData({ id: 'test-id-1', timestamp: '2023-05-15T12:00:00Z' }),
        createMockHealthData({ id: 'test-id-2', timestamp: '2023-05-16T12:00:00Z' })
      ];
      
      healthService.groupHealthDataByDate(mockHealthData);
      
      expect(groupByDate).toHaveBeenCalledWith(mockHealthData, 'timestamp');
    });

    it('should return an object with dates as keys and arrays of health data as values', () => {
      const mockHealthData = [
        createMockHealthData({ id: 'test-id-1', timestamp: '2023-05-15T12:00:00Z' }),
        createMockHealthData({ id: 'test-id-2', timestamp: '2023-05-16T12:00:00Z' })
      ];
      
      const expectedResult = {
        '2023-05-15': [mockHealthData[0]],
        '2023-05-16': [mockHealthData[1]]
      };
      
      (groupByDate as jest.Mock).mockReturnValue(expectedResult);
      
      const result = healthService.groupHealthDataByDate(mockHealthData);
      
      expect(result).toEqual(expectedResult);
    });
  });

  // Tests for getHealthContext
  describe('getHealthContext', () => {
    it('should call getHealthData for each health data type', async () => {
      const mockResponse = {
        items: [createMockHealthData()],
        total: 1,
        page: 1
      };
      (healthApi.getHealthData as jest.Mock).mockResolvedValue(mockResponse);
      
      await healthService.getHealthContext(5);
      
      expect(healthApi.getHealthData).toHaveBeenCalledTimes(3);
      expect(healthApi.getHealthData).toHaveBeenCalledWith({
        type: HealthDataType.MEAL,
        limit: 5,
        page: 1
      });
      expect(healthApi.getHealthData).toHaveBeenCalledWith({
        type: HealthDataType.LAB_RESULT,
        limit: 5,
        page: 1
      });
      expect(healthApi.getHealthData).toHaveBeenCalledWith({
        type: HealthDataType.SYMPTOM,
        limit: 5,
        page: 1
      });
    });

    it('should return object with recent meals, lab results, and symptoms', async () => {
      const mockMealsResponse = {
        items: [createMockHealthData({ type: HealthDataType.MEAL })],
        total: 1,
        page: 1
      };
      const mockLabResultsResponse = {
        items: [createMockHealthData({ type: HealthDataType.LAB_RESULT })],
        total: 1,
        page: 1
      };
      const mockSymptomsResponse = {
        items: [createMockHealthData({ type: HealthDataType.SYMPTOM })],
        total: 1,
        page: 1
      };
      
      (healthApi.getHealthData as jest.Mock)
        .mockResolvedValueOnce(mockMealsResponse)
        .mockResolvedValueOnce(mockLabResultsResponse)
        .mockResolvedValueOnce(mockSymptomsResponse);
      
      const result = await healthService.getHealthContext(5);
      
      expect(result).toMatchObject({
        recentMeals: mockMealsResponse.items,
        recentLabResults: mockLabResultsResponse.items,
        recentSymptoms: mockSymptomsResponse.items
      });
    });

    it('should return null when any API call fails', async () => {
      (healthApi.getHealthData as jest.Mock)
        .mockResolvedValueOnce({
          items: [createMockHealthData({ type: HealthDataType.MEAL })],
          total: 1,
          page: 1
        })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          items: [createMockHealthData({ type: HealthDataType.SYMPTOM })],
          total: 1,
          page: 1
        });
      
      const result = await healthService.getHealthContext(5);
      
      expect(result).toBeNull();
    });

    it('should log errors when API calls fail', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (healthApi.getHealthData as jest.Mock).mockRejectedValue(new Error('API error'));
      
      await healthService.getHealthContext(5);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});