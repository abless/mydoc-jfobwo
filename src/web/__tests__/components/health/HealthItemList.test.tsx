import React from 'react'; // 18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'; // ^12.0.0
import HealthItemList from '../../../src/components/health/HealthItemList';
import { HealthDataType, MealType, SymptomSeverity } from '../../../src/types/health.types';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';

// Helper function to render components with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

// Mock health data for testing
const mockHealthData = [
  { 
    id: '1', 
    type: HealthDataType.MEAL, 
    timestamp: '2023-05-15T08:30:00.000Z', 
    data: { 
      description: 'Oatmeal with berries', 
      mealType: MealType.BREAKFAST, 
      imageUrl: 'https://example.com/meal1.jpg' 
    }, 
    displayDate: 'May 15, 2023' 
  }, 
  { 
    id: '2', 
    type: HealthDataType.LAB_RESULT, 
    timestamp: '2023-05-15T10:15:00.000Z', 
    data: { 
      testType: 'Blood Test', 
      testDate: '2023-05-15', 
      notes: 'Routine checkup', 
      imageUrl: 'https://example.com/lab1.jpg' 
    }, 
    displayDate: 'May 15, 2023' 
  }, 
  { 
    id: '3', 
    type: HealthDataType.SYMPTOM, 
    timestamp: '2023-05-15T14:45:00.000Z', 
    data: { 
      description: 'Headache', 
      severity: SymptomSeverity.MODERATE, 
      duration: '1 hour' 
    }, 
    displayDate: 'May 15, 2023' 
  }, 
  { 
    id: '4', 
    type: HealthDataType.MEAL, 
    timestamp: '2023-05-14T12:30:00.000Z', 
    data: { 
      description: 'Grilled chicken salad', 
      mealType: MealType.BREAKFAST, 
      imageUrl: 'https://example.com/meal2.jpg' 
    }, 
    displayDate: 'May 14, 2023' 
  }
];

// Mock the date utilities to ensure consistent date labels
jest.mock('../../../src/utils/date.utils', () => ({
  ...jest.requireActual('../../../src/utils/date.utils'),
  getRelativeDateLabel: (date) => {
    const dateStr = date instanceof Date ? date.toISOString() : date.toString();
    if (dateStr.includes('2023-05-15')) return 'Today';
    if (dateStr.includes('2023-05-14')) return 'Yesterday';
    return 'Some date';
  }
}));

describe('HealthItemList component', () => {
  test('renders correctly with health data items', () => {
    const onItemPress = jest.fn();
    const { getByText, getAllByRole } = renderWithTheme(
      <HealthItemList 
        items={mockHealthData} 
        onItemPress={onItemPress} 
      />
    );
    
    // Check for date section headers
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Yesterday')).toBeTruthy();
    
    // Check for item content - we look for key content in each type of card
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('Blood Test')).toBeTruthy();
    expect(getByText('Symptom')).toBeTruthy();
    expect(getByText('Headache')).toBeTruthy();
    
    // Verify that we have buttons for all items
    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(4); // At least one for each health data item
  });

  test('renders empty state when no items', () => {
    const onItemPress = jest.fn();
    const { getByText } = renderWithTheme(
      <HealthItemList 
        items={[]} 
        onItemPress={onItemPress} 
      />
    );
    
    // Check for empty state message
    expect(getByText('No health data available. Tap the + button to add your first health entry.')).toBeTruthy();
  });

  test('renders loading state correctly', () => {
    const onItemPress = jest.fn();
    const { getByRole } = renderWithTheme(
      <HealthItemList 
        items={mockHealthData} 
        onItemPress={onItemPress}
        loading={true}
      />
    );
    
    // Check for loading indicator (uses accessibility role)
    expect(getByRole('progressbar')).toBeTruthy();
  });

  test('handles item press correctly', () => {
    const onItemPress = jest.fn();
    const { getAllByRole } = renderWithTheme(
      <HealthItemList 
        items={mockHealthData} 
        onItemPress={onItemPress}
      />
    );
    
    // Find a health data item (button) and press it
    const buttons = getAllByRole('button');
    fireEvent.press(buttons[0]); // Press the first button
    
    // Check that onItemPress was called with the correct item id
    expect(onItemPress).toHaveBeenCalledWith('1');
  });

  test('groups items by date correctly', () => {
    const onItemPress = jest.fn();
    const { getByText } = renderWithTheme(
      <HealthItemList 
        items={mockHealthData} 
        onItemPress={onItemPress}
      />
    );
    
    // Check that dates are grouped with headers
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Yesterday')).toBeTruthy();
    
    // Check that items from both days are rendered
    expect(getByText('Oatmeal with berries')).toBeTruthy(); // From Today
    expect(getByText('Grilled chicken salad')).toBeTruthy(); // From Yesterday
  });

  test('handles pull-to-refresh correctly', () => {
    const onRefresh = jest.fn();
    const { UNSAFE_getByType } = renderWithTheme(
      <HealthItemList 
        items={mockHealthData} 
        onItemPress={jest.fn()}
        refreshing={false}
        onRefresh={onRefresh}
      />
    );
    
    // Get the FlatList and simulate refresh
    const flatList = UNSAFE_getByType('FlatList');
    flatList.props.onRefresh();
    
    // Check that onRefresh was called
    expect(onRefresh).toHaveBeenCalled();
  });

  test('handles end reached for pagination correctly', () => {
    const onEndReached = jest.fn();
    const { UNSAFE_getByType } = renderWithTheme(
      <HealthItemList 
        items={mockHealthData} 
        onItemPress={jest.fn()}
        onEndReached={onEndReached}
      />
    );
    
    // Get the FlatList and simulate end reached
    const flatList = UNSAFE_getByType('FlatList');
    flatList.props.onEndReached();
    
    // Check that onEndReached was called
    expect(onEndReached).toHaveBeenCalled();
  });

  test('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'red' };
    const { UNSAFE_getByProps } = renderWithTheme(
      <HealthItemList 
        items={mockHealthData} 
        onItemPress={jest.fn()}
        style={customStyle}
      />
    );
    
    // Find the container with accessibilityRole="list"
    const container = UNSAFE_getByProps({ accessibilityRole: 'list' });
    
    // Check that the custom style is applied to the component
    // The actual styles will be an array with multiple style objects
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });
});