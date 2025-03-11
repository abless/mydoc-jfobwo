import { renderHook, act, waitFor } from '@testing-library/react-hooks'; // @testing-library/react-hooks ^8.0.1
import { useHealthData } from '../../src/hooks/useHealthData';
import {
  getHealthDataById,
  getHealthData,
  getHealthDataByDate,
  searchHealthData,
  createMealData,
  createLabResultData,
  createSymptomData,
  deleteHealthData
} from '../../src/api/health.api';
import {
  formatHealthDataForDisplay,
  groupHealthDataByDate
} from '../../src/services/health.service';
import {
  HealthDataType,
  HealthDataResponse,
  CreateMealDataRequest,
  CreateLabResultDataRequest,
  CreateSymptomDataRequest
} from '../../src/types/health.types';
import { parseApiError } from '../../src/utils/error.utils';

// Mock API functions
jest.mock('../../src/api/health.api', () => ({
  getHealthDataById: jest.fn(),
  getHealthData: jest.fn(),
  getHealthDataByDate: jest.fn(),
  searchHealthData: jest.fn(),
  createMealData: jest.fn(),
  createLabResultData: jest.fn(),
  createSymptomData: jest.fn(),
  deleteHealthData: jest.fn()
}));

// Mock service functions
jest.mock('../../src/services/health.service', () => ({
  formatHealthDataForDisplay: jest.fn(),
  groupHealthDataByDate: jest.fn()
}));

// Mock error utilities
jest.mock('../../src/utils/error.utils', () => ({
  parseApiError: jest.fn()
}));

describe('useHealthData', () => {
  // Mock test data for health data items
  const mockHealthData: HealthDataResponse[] = [
    {
      id: '1',
      type: HealthDataType.MEAL,
      timestamp: '2023-05-15T12:00:00Z',
      data: {
        description: 'Test meal',
        mealType: 'lunch'
      }
    },
    {
      id: '2',
      type: HealthDataType.LAB_RESULT,
      timestamp: '2023-05-14T10:00:00Z',
      data: {
        testType: 'Blood test',
        testDate: '2023-05-14'
      }
    }
  ];

  // Mock test data for a single health data item
  const mockHealthDataItem: HealthDataResponse = {
    id: '1',
    type: HealthDataType.MEAL,
    timestamp: '2023-05-15T12:00:00Z',
    data: {
      description: 'Test meal',
      mealType: 'lunch'
    }
  };

  // Mock formatted health data
  const mockFormattedHealthData: HealthDataResponse = {
    ...mockHealthDataItem,
    displayDate: 'May 15, 2023',
    displayTime: '12:00 PM'
  };

  // Mock health data list response with pagination
  const mockHealthDataResponse = {
    items: mockHealthData,
    total: 2,
    page: 1,
    limit: 20
  };

  // Mock grouped health data by date
  const mockGroupedHealthData = {
    '2023-05-15': [mockHealthData[0]],
    '2023-05-14': [mockHealthData[1]]
  };

  // Mock error
  const mockError = new Error('Test error');
  const mockParsedError = { message: 'Parsed test error', type: 'SERVER_ERROR', details: {} };

  // Mock request data for different health data types
  const mockMealRequest: CreateMealDataRequest = {
    description: 'New test meal',
    mealType: 'breakfast',
    timestamp: '2023-05-16T08:00:00Z'
  };

  const mockLabResultRequest: CreateLabResultDataRequest = {
    testType: 'New blood test',
    testDate: '2023-05-16',
    timestamp: '2023-05-16T09:00:00Z'
  };

  const mockSymptomRequest: CreateSymptomDataRequest = {
    description: 'New test symptom',
    severity: 'mild',
    timestamp: '2023-05-16T10:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    (formatHealthDataForDisplay as jest.Mock).mockImplementation(
      (data) => ({ ...data, displayDate: 'May 15, 2023', displayTime: '12:00 PM' })
    );
    
    (groupHealthDataByDate as jest.Mock).mockReturnValue(mockGroupedHealthData);
    
    (parseApiError as jest.Mock).mockReturnValue(mockParsedError);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useHealthData());
    
    expect(result.current.healthData).toEqual([]);
    expect(result.current.selectedHealthData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingItem).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.totalItems).toBe(0);
    expect(result.current.currentPage).toBe(1);
  });

  it('should fetch health data successfully', async () => {
    (getHealthData as jest.Mock).mockResolvedValue(mockHealthDataResponse);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.fetchHealthData();
    });
    
    expect(getHealthData).toHaveBeenCalledWith({});
    expect(formatHealthDataForDisplay).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.healthData).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch health data failure', async () => {
    (getHealthData as jest.Mock).mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.fetchHealthData();
    });
    
    expect(getHealthData).toHaveBeenCalledWith({});
    expect(parseApiError).toHaveBeenCalledWith(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.healthData).toEqual([]);
    expect(result.current.error).toBe(mockParsedError.message);
  });

  it('should fetch health data by id successfully', async () => {
    (getHealthDataById as jest.Mock).mockResolvedValue(mockHealthDataItem);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.fetchHealthDataById('1');
    });
    
    expect(getHealthDataById).toHaveBeenCalledWith('1');
    expect(formatHealthDataForDisplay).toHaveBeenCalledTimes(1);
    expect(result.current.isLoadingItem).toBe(false);
    expect(result.current.selectedHealthData).toEqual(mockFormattedHealthData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch health data by id failure', async () => {
    (getHealthDataById as jest.Mock).mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.fetchHealthDataById('1');
    });
    
    expect(getHealthDataById).toHaveBeenCalledWith('1');
    expect(parseApiError).toHaveBeenCalledWith(mockError);
    expect(result.current.isLoadingItem).toBe(false);
    expect(result.current.selectedHealthData).toBeNull();
    expect(result.current.error).toBe(mockParsedError.message);
  });

  it('should fetch health data by date successfully', async () => {
    (getHealthDataByDate as jest.Mock).mockResolvedValue(mockHealthDataResponse);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.fetchHealthDataByDate('2023-05-15');
    });
    
    expect(getHealthDataByDate).toHaveBeenCalledWith('2023-05-15', undefined, 1, 20);
    expect(formatHealthDataForDisplay).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.healthData).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should search health data successfully', async () => {
    (searchHealthData as jest.Mock).mockResolvedValue(mockHealthDataResponse);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.searchHealthDataItems('test');
    });
    
    expect(searchHealthData).toHaveBeenCalledWith('test', undefined, 1, 20);
    expect(formatHealthDataForDisplay).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.healthData).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should add meal data successfully', async () => {
    (createMealData as jest.Mock).mockResolvedValue(mockHealthDataItem);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.addHealthData(mockMealRequest, HealthDataType.MEAL);
    });
    
    expect(createMealData).toHaveBeenCalledWith(mockMealRequest);
    expect(formatHealthDataForDisplay).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.healthData).toEqual([mockFormattedHealthData]);
    expect(result.current.error).toBeNull();
  });

  it('should add lab result data successfully', async () => {
    (createLabResultData as jest.Mock).mockResolvedValue(mockHealthDataItem);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.addHealthData(mockLabResultRequest, HealthDataType.LAB_RESULT);
    });
    
    expect(createLabResultData).toHaveBeenCalledWith(mockLabResultRequest);
    expect(formatHealthDataForDisplay).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.healthData).toEqual([mockFormattedHealthData]);
    expect(result.current.error).toBeNull();
  });

  it('should add symptom data successfully', async () => {
    (createSymptomData as jest.Mock).mockResolvedValue(mockHealthDataItem);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.addHealthData(mockSymptomRequest, HealthDataType.SYMPTOM);
    });
    
    expect(createSymptomData).toHaveBeenCalledWith(mockSymptomRequest);
    expect(formatHealthDataForDisplay).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.healthData).toEqual([mockFormattedHealthData]);
    expect(result.current.error).toBeNull();
  });

  it('should handle add health data failure', async () => {
    (createMealData as jest.Mock).mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useHealthData());
    
    await act(async () => {
      await result.current.addHealthData(mockMealRequest, HealthDataType.MEAL);
    });
    
    expect(createMealData).toHaveBeenCalledWith(mockMealRequest);
    expect(parseApiError).toHaveBeenCalledWith(mockError);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.healthData).toEqual([]);
    expect(result.current.error).toBe(mockParsedError.message);
  });

  it('should remove health data successfully', async () => {
    // Setup: Add items first to have data to remove
    (createMealData as jest.Mock).mockResolvedValue(mockHealthData[0]);
    (deleteHealthData as jest.Mock).mockResolvedValue(true);
    
    const { result } = renderHook(() => useHealthData());
    
    // Add a health data item
    await act(async () => {
      await result.current.addHealthData(mockMealRequest, HealthDataType.MEAL);
    });
    
    expect(result.current.healthData).toHaveLength(1);
    
    // Now test removal
    await act(async () => {
      await result.current.removeHealthData('1');
    });
    
    expect(deleteHealthData).toHaveBeenCalledWith('1');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.healthData).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('should handle remove health data failure', async () => {
    // Setup: Add items first to have data to remove
    (createMealData as jest.Mock).mockResolvedValue(mockHealthData[0]);
    (deleteHealthData as jest.Mock).mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useHealthData());
    
    // Add a health data item
    await act(async () => {
      await result.current.addHealthData(mockMealRequest, HealthDataType.MEAL);
    });
    
    const initialHealthData = result.current.healthData;
    expect(initialHealthData).toHaveLength(1);
    
    // Now test removal failure
    await act(async () => {
      await result.current.removeHealthData('1');
    });
    
    expect(deleteHealthData).toHaveBeenCalledWith('1');
    expect(parseApiError).toHaveBeenCalledWith(mockError);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.healthData).toEqual(initialHealthData);
    expect(result.current.error).toBe(mockParsedError.message);
  });

  it('should get grouped health data correctly', async () => {
    // Setup: Add items first to have data to group
    (getHealthData as jest.Mock).mockResolvedValue(mockHealthDataResponse);
    
    const { result } = renderHook(() => useHealthData());
    
    // Fetch health data to populate the state
    await act(async () => {
      await result.current.fetchHealthData();
    });
    
    // Now test getGroupedHealthData
    let groupedData;
    act(() => {
      groupedData = result.current.getGroupedHealthData();
    });
    
    expect(groupHealthDataByDate).toHaveBeenCalledWith(mockHealthData);
    expect(groupedData).toEqual(mockGroupedHealthData);
  });

  it('should reset state correctly', async () => {
    // Setup: Add items and set selectedHealthData to have state to reset
    (getHealthData as jest.Mock).mockResolvedValue(mockHealthDataResponse);
    (getHealthDataById as jest.Mock).mockResolvedValue(mockHealthDataItem);
    
    const { result } = renderHook(() => useHealthData());
    
    // Fetch health data and selected item to populate the state
    await act(async () => {
      await result.current.fetchHealthData();
      await result.current.fetchHealthDataById('1');
    });
    
    expect(result.current.healthData).toHaveLength(2);
    expect(result.current.selectedHealthData).toEqual(mockFormattedHealthData);
    
    // Now test resetState
    act(() => {
      result.current.resetState();
    });
    
    expect(result.current.healthData).toEqual([]);
    expect(result.current.selectedHealthData).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingItem).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.currentPage).toBe(1);
  });
});