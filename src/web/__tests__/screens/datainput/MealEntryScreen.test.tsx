import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MealEntryScreen from '../../../src/screens/datainput/MealEntryScreen';
import useCamera from '../../../src/hooks/useCamera';
import useHealthData from '../../../src/hooks/useHealthData';
import useForm from '../../../src/hooks/useForm';
import NavigationService from '../../../src/navigation/NavigationService';
import { HealthDataType, MealType } from '../../../src/types/health.types';
import { validateMealForm } from '../../../src/utils/validation.utils';

// Mock the hooks and services
jest.mock('../../../src/hooks/useCamera', () => jest.fn());
jest.mock('../../../src/hooks/useHealthData', () => jest.fn());
jest.mock('../../../src/hooks/useForm', () => jest.fn());
jest.mock('../../../src/navigation/NavigationService', () => ({
  goBack: jest.fn()
}));
jest.mock('../../../src/utils/validation.utils', () => ({
  validateMealForm: jest.fn()
}));

// Mock React Native Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}));

// Mock ThemeContext
jest.mock('../../../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        BACKGROUND: '#FFFFFF',
        PRIMARY: '#4A90E2',
        TEXT: '#333333',
        ERROR: '#E53E3E',
        BORDER: '#E2E8F0',
        CARD: '#FFFFFF',
        WHITE: '#FFFFFF',
      },
      spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24
      },
      borderRadius: {
        small: 4,
        medium: 8
      }
    }
  })
}));

describe('MealEntryScreen', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock useCamera hook
    (useCamera as jest.Mock).mockReturnValue({
      image: null,
      takePhoto: jest.fn(),
      selectFromGallery: jest.fn(),
      resetImage: jest.fn(),
      isLoading: false,
      error: null
    });

    // Mock useHealthData hook
    (useHealthData as jest.Mock).mockReturnValue({
      addHealthData: jest.fn().mockResolvedValue(true),
      isSubmitting: false,
      error: null
    });

    // Mock useForm hook
    (useForm as jest.Mock).mockReturnValue({
      values: {
        mealType: MealType.BREAKFAST,
        description: '',
        image: null
      },
      errors: {},
      handleChange: jest.fn().mockReturnValue(jest.fn()),
      setFieldValue: jest.fn(),
      handleSubmit: jest.fn(),
      touched: {}
    });

    // Mock validateMealForm
    (validateMealForm as jest.Mock).mockReturnValue({});
    
    // Mock Alert.alert
    (Alert.alert as jest.Mock) = jest.fn();
  });

  test('renders correctly with initial state', () => {
    const { getByText } = render(<MealEntryScreen />);
    
    // Verify screen title is present
    expect(getByText('Log Meal')).toBeTruthy();
    
    // Verify meal type label is present
    expect(getByText('Meal type')).toBeTruthy();
    
    // Verify camera action buttons are present
    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByText('Select from Gallery')).toBeTruthy();
    
    // Verify save button is present
    expect(getByText('Save')).toBeTruthy();
  });

  test('handles taking photo', () => {
    const takePhotoMock = jest.fn();
    (useCamera as jest.Mock).mockReturnValue({
      image: null,
      takePhoto: takePhotoMock,
      selectFromGallery: jest.fn(),
      resetImage: jest.fn(),
      isLoading: false,
      error: null
    });

    const { getByText } = render(<MealEntryScreen />);
    
    // Find and press the take photo button
    const takePhotoButton = getByText('Take Photo');
    fireEvent.press(takePhotoButton);
    
    // Verify takePhoto was called
    expect(takePhotoMock).toHaveBeenCalled();
  });

  test('handles selecting image from gallery', () => {
    const selectFromGalleryMock = jest.fn();
    (useCamera as jest.Mock).mockReturnValue({
      image: null,
      takePhoto: jest.fn(),
      selectFromGallery: selectFromGalleryMock,
      resetImage: jest.fn(),
      isLoading: false,
      error: null
    });

    const { getByText } = render(<MealEntryScreen />);
    
    // Find and press the select from gallery button
    const galleryButton = getByText('Select from Gallery');
    fireEvent.press(galleryButton);
    
    // Verify selectFromGallery was called
    expect(selectFromGalleryMock).toHaveBeenCalled();
  });

  test('handles description input', () => {
    const handleChangeFunction = jest.fn();
    const handleChangeMock = jest.fn().mockReturnValue(handleChangeFunction);
    
    (useForm as jest.Mock).mockReturnValue({
      values: {
        mealType: MealType.BREAKFAST,
        description: '',
        image: null
      },
      errors: {},
      handleChange: handleChangeMock,
      setFieldValue: jest.fn(),
      handleSubmit: jest.fn(),
      touched: {}
    });

    const { getByPlaceholderText } = render(<MealEntryScreen />);
    
    // Find the description input
    const descriptionInput = getByPlaceholderText('Describe your meal');
    
    // Simulate user input
    fireEvent.changeText(descriptionInput, 'Healthy salad with chicken');
    
    // Verify handleChange was called with the correct field name
    expect(handleChangeMock).toHaveBeenCalledWith('description');
    
    // Verify the returned function was called with the input text
    expect(handleChangeFunction).toHaveBeenCalledWith('Healthy salad with chicken');
  });

  test('handles meal type selection', () => {
    const setFieldValueMock = jest.fn();
    (useForm as jest.Mock).mockReturnValue({
      values: {
        mealType: MealType.BREAKFAST,
        description: '',
        image: null
      },
      errors: {},
      handleChange: jest.fn().mockReturnValue(jest.fn()),
      setFieldValue: setFieldValueMock,
      handleSubmit: jest.fn(),
      touched: {}
    });

    // Render the component and simulate a useEffect update of image
    const image = { uri: 'test-uri', type: 'image/jpeg', name: 'test.jpg' };
    (useCamera as jest.Mock).mockReturnValue({
      image,
      takePhoto: jest.fn(),
      selectFromGallery: jest.fn(),
      resetImage: jest.fn(),
      isLoading: false,
      error: null
    });
    
    render(<MealEntryScreen />);
    
    // Verify the setFieldValue is called with the image
    expect(setFieldValueMock).toHaveBeenCalledWith('image', image);
  });

  test('validates form before submission', () => {
    const handleSubmitMock = jest.fn();
    (useForm as jest.Mock).mockReturnValue({
      values: {
        mealType: MealType.BREAKFAST,
        description: 'Test meal',
        image: null  // Missing image should cause validation error
      },
      errors: {
        image: 'Image is required'
      },
      handleChange: jest.fn().mockReturnValue(jest.fn()),
      setFieldValue: jest.fn(),
      handleSubmit: handleSubmitMock,
      touched: { image: true }
    });
    
    (validateMealForm as jest.Mock).mockReturnValue({
      image: 'Image is required'
    });

    const { getByText } = render(<MealEntryScreen />);
    
    // Find and press the save button
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    // Verify handleSubmit was called
    expect(handleSubmitMock).toHaveBeenCalled();
    
    // Verify error message is displayed
    expect(getByText('Image is required')).toBeTruthy();
  });

  test('submits form successfully', async () => {
    // Mock Alert.alert to simulate pressing OK
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      // Call the first button's onPress handler (OK button)
      if (buttons && buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });
    
    // Set up mock data
    const mockImage = { uri: 'file://test-image.jpg', type: 'image/jpeg', name: 'test-image.jpg' };
    const mockValues = {
      mealType: MealType.LUNCH,
      description: 'Healthy lunch',
      image: mockImage
    };
    
    // Mock the functions with our own implementation that can be tested
    const addHealthDataMock = jest.fn().mockResolvedValue(true);
    
    // Mock the form's handleSubmit to capture and execute the submitted callback 
    let capturedCallback: Function;
    const handleSubmitMock = jest.fn(callback => {
      capturedCallback = callback;
    });
    
    (useForm as jest.Mock).mockReturnValue({
      values: mockValues,
      errors: {},
      handleChange: jest.fn().mockReturnValue(jest.fn()),
      setFieldValue: jest.fn(),
      handleSubmit: handleSubmitMock,
      touched: {}
    });
    
    (useHealthData as jest.Mock).mockReturnValue({
      addHealthData: addHealthDataMock,
      isSubmitting: false,
      error: null
    });
    
    const { getByText } = render(<MealEntryScreen />);
    
    // Find and press the save button
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    // Verify form submission was initiated
    expect(handleSubmitMock).toHaveBeenCalled();
    
    // Execute the callback that would be passed to handleSubmit
    if (capturedCallback) {
      await capturedCallback(mockValues);
    }
    
    // Verify health data was submitted
    expect(addHealthDataMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mealType: MealType.LUNCH,
        description: 'Healthy lunch',
        image: mockImage,
        timestamp: expect.any(String)
      }),
      HealthDataType.MEAL
    );
    
    // Verify success alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Success', 
      'Meal data saved successfully',
      expect.arrayContaining([expect.objectContaining({ text: 'OK' })])
    );
    
    // Verify navigation occurred after pressing OK
    expect(NavigationService.goBack).toHaveBeenCalled();
  });

  test('handles submission error', async () => {
    // Set up mock data
    const errorMessage = 'Failed to save meal data';
    const mockImage = { uri: 'file://test-image.jpg', type: 'image/jpeg', name: 'test-image.jpg' };
    const mockValues = {
      mealType: MealType.DINNER,
      description: 'Evening meal',
      image: mockImage
    };
    
    // Mock a failed submission
    const addHealthDataMock = jest.fn().mockResolvedValue(null);
    
    // Mock the form's handleSubmit to capture and execute the submitted callback
    let capturedCallback: Function;
    const handleSubmitMock = jest.fn(callback => {
      capturedCallback = callback;
    });
    
    (useForm as jest.Mock).mockReturnValue({
      values: mockValues,
      errors: {},
      handleChange: jest.fn().mockReturnValue(jest.fn()),
      setFieldValue: jest.fn(),
      handleSubmit: handleSubmitMock,
      touched: {}
    });
    
    (useHealthData as jest.Mock).mockReturnValue({
      addHealthData: addHealthDataMock,
      isSubmitting: false,
      error: errorMessage
    });
    
    const { getByText } = render(<MealEntryScreen />);
    
    // Find and press the save button
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);
    
    // Verify form submission was initiated
    expect(handleSubmitMock).toHaveBeenCalled();
    
    // Execute the callback that would be passed to handleSubmit
    if (capturedCallback) {
      await capturedCallback(mockValues);
    }
    
    // Verify health data submission was attempted
    expect(addHealthDataMock).toHaveBeenCalled();
    
    // Verify error message is displayed
    expect(getByText(errorMessage)).toBeTruthy();
    
    // Verify we didn't show success alert
    expect(Alert.alert).not.toHaveBeenCalled();
    
    // Verify we didn't navigate on error
    expect(NavigationService.goBack).not.toHaveBeenCalled();
  });

  test('displays loading indicator during submission', () => {
    (useHealthData as jest.Mock).mockReturnValue({
      addHealthData: jest.fn().mockResolvedValue(true),
      isSubmitting: true,  // Submission in progress
      error: null
    });
    
    const { getByText } = render(<MealEntryScreen />);
    
    // Find the save button and verify it's disabled during submission
    const saveButton = getByText('Save');
    expect(saveButton.props.disabled).toBeTruthy();
  });

  test('handles cancel button press', () => {
    const { getByLabelText } = render(<MealEntryScreen />);
    
    // Find and press the header's back button
    const backButton = getByLabelText('Log Meal back button');
    fireEvent.press(backButton);
    
    // Verify navigation back
    expect(NavigationService.goBack).toHaveBeenCalled();
  });

  test('handles camera errors', () => {
    const errorMessage = 'Camera permission denied';
    (useCamera as jest.Mock).mockReturnValue({
      image: null,
      takePhoto: jest.fn(),
      selectFromGallery: jest.fn(),
      resetImage: jest.fn(),
      isLoading: false,
      error: errorMessage
    });
    
    const { getByText } = render(<MealEntryScreen />);
    
    // Verify error message is displayed
    expect(getByText(errorMessage)).toBeTruthy();
  });
});