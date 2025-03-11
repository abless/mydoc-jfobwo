import React from 'react'; // ^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // ^12.0.0
import HealthLogScreen from '../../../src/screens/health/HealthLogScreen';
import { useHealthData } from '../../../src/hooks/useHealthData';
import NavigationService from '../../../src/navigation/NavigationService';
import { HEALTH_ROUTES } from '../../../src/constants/navigation';
import { formatAPIDate } from '../../../src/utils/date.utils';

// Mock the hooks and services
jest.mock('../../../src/hooks/useHealthData', () => ({
  useHealthData: jest.fn()
}));

jest.mock('../../../src/navigation/NavigationService', () => ({
  default: { navigateToHealthDataDetail: jest.fn() }
}));

// Mock child components
jest.mock('../../../src/components/health/HealthItemList', () => ({
  default: (props) => <mock-health-item-list {...props} />
}));

jest.mock('../../../src/components/health/CalendarView', () => ({
  default: (props) => <mock-calendar-view {...props} />
}));

jest.mock('../../../src/components/common/SearchBar', () => ({
  default: (props) => <mock-search-bar {...props} />
}));

jest.mock('../../../src/components/common/Header', () => ({
  default: (props) => <mock-header {...props} />
}));

jest.mock('../../../src/components/common/LoadingIndicator', () => ({
  default: () => <mock-loading-indicator />
}));

jest.mock('../../../src/components/common/ErrorMessage', () => ({
  default: (props) => <mock-error-message {...props} />
}));

describe('HealthLogScreen component', () => {
  // Sample mock health data
  const mockHealthData = [
    {
      id: '1',
      type: 'meal',
      timestamp: '2023-05-15T12:30:00Z',
      data: {
        description: 'Grilled chicken salad',
        mealType: 'lunch'
      }
    },
    {
      id: '2',
      type: 'symptom',
      timestamp: '2023-05-15T14:00:00Z',
      data: {
        description: 'Mild headache',
        severity: 'mild'
      }
    }
  ];
  
  // Mock implementations for the useHealthData hook functions
  const mockFetchHealthData = jest.fn().mockResolvedValue(null);
  const mockFetchHealthDataByDate = jest.fn().mockResolvedValue(null);
  const mockSearchHealthDataItems = jest.fn().mockResolvedValue(null);

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default hook implementation
    useHealthData.mockReturnValue({
      healthData: [],
      isLoading: false,
      error: null,
      totalItems: 0,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });
  });

  it('should render loading state', () => {
    // Set up loading state
    useHealthData.mockReturnValue({
      healthData: [],
      isLoading: true,
      error: null,
      totalItems: 0,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { toJSON } = render(<HealthLogScreen />);
    const renderedOutput = JSON.stringify(toJSON());
    
    // Verify loading indicator is shown
    expect(renderedOutput).toContain('mock-loading-indicator');
    // Verify health item list is not shown
    expect(renderedOutput).not.toContain('mock-health-item-list');
  });

  it('should render health data', () => {
    // Set up state with health data
    useHealthData.mockReturnValue({
      healthData: mockHealthData,
      isLoading: false,
      error: null,
      totalItems: mockHealthData.length,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { toJSON } = render(<HealthLogScreen />);
    const renderedOutput = JSON.stringify(toJSON());
    
    // Verify health item list is shown
    expect(renderedOutput).toContain('mock-health-item-list');
    // Verify loading indicator is not shown
    expect(renderedOutput).not.toContain('mock-loading-indicator');
  });

  it('should render error state', () => {
    const errorMessage = 'Error loading health data';
    
    // Set up error state
    useHealthData.mockReturnValue({
      healthData: [],
      isLoading: false,
      error: errorMessage,
      totalItems: 0,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { toJSON } = render(<HealthLogScreen />);
    const renderedOutput = JSON.stringify(toJSON());
    
    // Verify error message is shown
    expect(renderedOutput).toContain('mock-error-message');
    // Verify health item list is not shown
    expect(renderedOutput).not.toContain('mock-health-item-list');
  });

  it('should handle date selection', async () => {
    useHealthData.mockReturnValue({
      healthData: mockHealthData,
      isLoading: false,
      error: null,
      totalItems: mockHealthData.length,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { findByType, queryByType } = render(<HealthLogScreen />);
    
    // Find header component
    const headerComponent = await findByType('mock-header');
    
    // Trigger calendar toggle through the header's right icon press
    act(() => {
      headerComponent.props.onRightPress();
    });
    
    // Find calendar component that should now be visible
    const calendarComponent = await findByType('mock-calendar-view');
    expect(calendarComponent).toBeTruthy();
    
    // Select a date
    const selectedDate = new Date('2023-05-10');
    act(() => {
      calendarComponent.props.onDateSelect(selectedDate);
    });
    
    // Verify the hook was called with the correctly formatted date
    expect(mockFetchHealthDataByDate).toHaveBeenCalledWith(formatAPIDate(selectedDate));
    
    // Calendar should be hidden after selection
    await waitFor(() => {
      expect(queryByType('mock-calendar-view')).toBeNull();
    });
  });

  it('should handle search', () => {
    useHealthData.mockReturnValue({
      healthData: mockHealthData,
      isLoading: false,
      error: null,
      totalItems: mockHealthData.length,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { findByType } = render(<HealthLogScreen />);
    
    // Find search bar component
    findByType('mock-search-bar').then(searchBarComponent => {
      // Enter search term
      const searchTerm = 'headache';
      act(() => {
        searchBarComponent.props.onChangeText(searchTerm);
      });
      
      // Submit search
      act(() => {
        searchBarComponent.props.onSubmit();
      });
      
      // Verify the search function was called with the search term
      expect(mockSearchHealthDataItems).toHaveBeenCalledWith(searchTerm);
    });
  });

  it('should navigate to health data detail', () => {
    useHealthData.mockReturnValue({
      healthData: mockHealthData,
      isLoading: false,
      error: null,
      totalItems: mockHealthData.length,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { findByType } = render(<HealthLogScreen />);
    
    // Find health item list component
    findByType('mock-health-item-list').then(healthItemListComponent => {
      // Simulate pressing an item
      const healthItemId = '1';
      act(() => {
        healthItemListComponent.props.onItemPress(healthItemId);
      });
      
      // Verify that navigation service was called with the correct ID
      expect(NavigationService.navigateToHealthDataDetail).toHaveBeenCalledWith(healthItemId);
    });
  });

  it('should handle pull-to-refresh', async () => {
    useHealthData.mockReturnValue({
      healthData: mockHealthData,
      isLoading: false,
      error: null,
      totalItems: mockHealthData.length,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { findByType } = render(<HealthLogScreen />);
    
    // Find health item list component
    const healthItemListComponent = await findByType('mock-health-item-list');
    
    // Trigger refresh
    await act(async () => {
      await healthItemListComponent.props.onRefresh();
    });
    
    // Verify fetchHealthData was called with page 1
    expect(mockFetchHealthData).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('should handle load more', async () => {
    useHealthData.mockReturnValue({
      healthData: mockHealthData,
      isLoading: false,
      error: null,
      totalItems: 10, // More items than currently loaded
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { findByType } = render(<HealthLogScreen />);
    
    // Find health item list component
    const healthItemListComponent = await findByType('mock-health-item-list');
    
    // Trigger end reached (load more)
    act(() => {
      healthItemListComponent.props.onEndReached();
    });
    
    // Verify fetchHealthData was called with the next page number
    expect(mockFetchHealthData).toHaveBeenCalledWith({ page: 2, limit: 20 });
  });

  it('should toggle calendar view', async () => {
    useHealthData.mockReturnValue({
      healthData: mockHealthData,
      isLoading: false,
      error: null,
      totalItems: mockHealthData.length,
      currentPage: 1,
      fetchHealthData: mockFetchHealthData,
      fetchHealthDataByDate: mockFetchHealthDataByDate,
      searchHealthDataItems: mockSearchHealthDataItems
    });

    const { findByType, queryByType } = render(<HealthLogScreen />);
    
    // Calendar should not be visible initially
    expect(queryByType('mock-calendar-view')).toBeNull();
    
    // Find header component
    const headerComponent = await findByType('mock-header');
    
    // Toggle calendar on by pressing the header's right icon
    act(() => {
      headerComponent.props.onRightPress();
    });
    
    // Calendar should now be visible
    expect(await findByType('mock-calendar-view')).toBeTruthy();
    
    // Toggle calendar off
    act(() => {
      headerComponent.props.onRightPress();
    });
    
    // Calendar should be hidden again
    await waitFor(() => {
      expect(queryByType('mock-calendar-view')).toBeNull();
    });
  });
});