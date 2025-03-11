import React from 'react'; // ^18.2.0
import { render, screen, fireEvent } from '@testing-library/react-native'; // ^12.0.0
import HealthDataCard from '../../../src/components/cards/HealthDataCard';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';
import { HealthDataType, MealType, SymptomSeverity } from '../../../src/types/health.types';

/**
 * Helper function to render components with ThemeProvider
 */
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

/**
 * Helper function to create mock meal data for testing
 */
const createMockMealData = (overrides = {}) => ({
  id: 'meal-1',
  type: HealthDataType.MEAL,
  timestamp: '2023-05-15T08:30:00Z',
  data: {
    description: 'Oatmeal with berries and honey',
    mealType: MealType.BREAKFAST,
    imageUrl: 'https://example.com/meal.jpg'
  },
  ...overrides
});

/**
 * Helper function to create mock lab result data for testing
 */
const createMockLabResultData = (overrides = {}) => ({
  id: 'lab-1',
  type: HealthDataType.LAB_RESULT,
  timestamp: '2023-05-15T10:15:00Z',
  data: {
    testType: 'Blood Test',
    testDate: '2023-05-15',
    notes: 'Cholesterol, Blood Sugar, CBC',
    imageUrl: 'https://example.com/lab.jpg'
  },
  ...overrides
});

/**
 * Helper function to create mock symptom data for testing
 */
const createMockSymptomData = (overrides = {}) => ({
  id: 'symptom-1',
  type: HealthDataType.SYMPTOM,
  timestamp: '2023-05-15T14:45:00Z',
  data: {
    description: 'Moderate headache',
    severity: SymptomSeverity.MODERATE,
    duration: '1 hour'
  },
  ...overrides
});

describe('HealthDataCard component', () => {
  test('renders correctly with meal data', () => {
    const mealData = createMockMealData();
    const { getByText, getByLabelText } = renderWithTheme(
      <HealthDataCard item={mealData} onPress={() => {}} />
    );
    
    // Verify that the card displays the correct meal type title
    expect(getByText('Breakfast')).toBeTruthy();
    
    // Verify that the card displays the correct timestamp
    expect(getByText(/May 15, 2023/)).toBeTruthy();
    
    // Verify that the card displays the meal description
    expect(getByText('Oatmeal with berries and honey')).toBeTruthy();
    
    // Verify that the card displays the meal image
    expect(getByLabelText('Breakfast image')).toBeTruthy();
  });

  test('renders correctly with lab result data', () => {
    const labData = createMockLabResultData();
    const { getByText, getByLabelText } = renderWithTheme(
      <HealthDataCard item={labData} onPress={() => {}} />
    );
    
    // Verify that the card displays the correct test type title
    expect(getByText('Blood Test')).toBeTruthy();
    
    // Verify that the card displays the correct timestamp
    expect(getByText(/May 15, 2023/)).toBeTruthy();
    
    // Verify that the card displays the lab result notes
    expect(getByText('Cholesterol, Blood Sugar, CBC')).toBeTruthy();
    
    // Verify that the card displays the lab result image
    expect(getByLabelText('Blood Test image')).toBeTruthy();
  });

  test('renders correctly with symptom data', () => {
    const symptomData = createMockSymptomData();
    const { getByText, queryByLabelText } = renderWithTheme(
      <HealthDataCard item={symptomData} onPress={() => {}} />
    );
    
    // Verify that the card displays 'Symptom' as the title
    expect(getByText('Symptom')).toBeTruthy();
    
    // Verify that the card displays the correct timestamp
    expect(getByText(/May 15, 2023/)).toBeTruthy();
    
    // Verify that the card displays the symptom description
    expect(getByText('Moderate headache')).toBeTruthy();
    
    // Verify that the card does not display an image
    expect(queryByLabelText(/image/i)).toBeNull();
  });

  test('calls onPress with correct item ID', () => {
    const mockOnPress = jest.fn();
    const mealData = createMockMealData();
    const { getByRole } = renderWithTheme(
      <HealthDataCard item={mealData} onPress={mockOnPress} />
    );
    
    // Find the touchable component and trigger a press event
    const button = getByRole('button');
    fireEvent.press(button);
    
    // Verify that onPress was called with the correct item ID
    expect(mockOnPress).toHaveBeenCalledWith(mealData.id);
  });

  test('applies custom styles', () => {
    const mealData = createMockMealData();
    const customStyle = { margin: 20, backgroundColor: 'red' };
    
    // Define custom styles object
    const { UNSAFE_getByType } = renderWithTheme(
      <HealthDataCard 
        item={mealData} 
        onPress={() => {}} 
        style={customStyle}
      />
    );
    
    // Verify that the custom styles are applied to the component
    const card = UNSAFE_getByType('Card');
    expect(card.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });

  test('truncates long descriptions', () => {
    const longDescription = 'This is a very long description that should be truncated because it exceeds the maximum length allowed for descriptions in the HealthDataCard component. We want to make sure ellipsis is added at the end.';
    const mealData = createMockMealData({
      data: {
        ...createMockMealData().data,
        description: longDescription
      }
    });
    
    const { queryByText } = renderWithTheme(
      <HealthDataCard item={mealData} onPress={() => {}} />
    );
    
    // Verify that the displayed description is truncated
    expect(queryByText(longDescription)).toBeNull();
    
    // Verify that a truncated version is displayed
    expect(queryByText(/This is a very long description/)).toBeTruthy();
  });

  test('has correct accessibility properties', () => {
    const mealData = createMockMealData();
    const { getByRole } = renderWithTheme(
      <HealthDataCard item={mealData} onPress={() => {}} />
    );
    
    // Verify that the component has the correct accessibility role
    const element = getByRole('button');
    
    // Verify that the component has an appropriate accessibility label
    expect(element.props.accessibilityLabel).toContain('Breakfast');
    expect(element.props.accessibilityLabel).toContain('May 15, 2023');
    expect(element.props.accessibilityLabel).toContain('Oatmeal with berries and honey');
  });
});