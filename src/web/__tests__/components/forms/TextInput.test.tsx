import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TextInput from '../../../src/components/forms/TextInput';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';
import { sanitizeInput } from '../../../src/utils/validation.utils';

// Mock the useKeyboard hook since we don't need its functionality in our tests
jest.mock('../../../src/hooks/useKeyboard', () => ({ __esModule: true, default: () => ({ isKeyboardVisible: false, keyboardHeight: 0 }) }));

// Mock the sanitizeInput function to control its behavior in tests
jest.mock('../../../src/utils/validation.utils', () => ({
  sanitizeInput: jest.fn((text) => text + '_sanitized')
}));

// Helper function to render components with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('TextInput component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders correctly with basic props', () => {
    renderWithTheme(
      <TextInput 
        label="Email Address"
        value=""
        onChangeText={() => {}}
        placeholder="Enter your email"
      />
    );
    
    expect(screen.getByText('Email Address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
    // Ensure no error message is displayed
    expect(screen.queryByRole('alert')).toBeNull();
  });
  
  test('handles text input correctly', () => {
    const mockOnChangeText = jest.fn();
    renderWithTheme(
      <TextInput 
        label="Username"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter username"
      />
    );
    
    const input = screen.getByPlaceholderText('Enter username');
    fireEvent.changeText(input, 'testuser');
    
    // Verify that onChangeText was called with the sanitized text
    expect(sanitizeInput).toHaveBeenCalledWith('testuser');
    expect(mockOnChangeText).toHaveBeenCalledWith('testuser_sanitized');
  });
  
  test('displays error messages correctly', () => {
    // With error
    const { rerender } = renderWithTheme(
      <TextInput 
        label="Password"
        value=""
        onChangeText={() => {}}
        placeholder="Enter password"
        error="Password is required"
      />
    );
    
    // Verify error message is displayed
    expect(screen.getByText('Password is required')).toBeTruthy();
    
    // Check that input has error styling via accessibilityState
    const inputWithError = screen.getByPlaceholderText('Enter password');
    expect(inputWithError.props.accessibilityState.invalid).toBe(true);
    
    // Without error
    rerender(
      <ThemeProvider>
        <TextInput 
          label="Password"
          value=""
          onChangeText={() => {}}
          placeholder="Enter password"
        />
      </ThemeProvider>
    );
    
    // Verify no error message is displayed
    expect(screen.queryByText('Password is required')).toBeNull();
    
    // Check that input doesn't have error styling
    const inputWithoutError = screen.getByPlaceholderText('Enter password');
    expect(inputWithoutError.props.accessibilityState.invalid).toBe(false);
  });
  
  test('applies secure text entry correctly', () => {
    // With secureTextEntry=true
    renderWithTheme(
      <TextInput 
        label="Password"
        value=""
        onChangeText={() => {}}
        placeholder="Enter password"
        secureTextEntry={true}
      />
    );
    
    // Verify secureTextEntry is applied
    const passwordInput = screen.getByPlaceholderText('Enter password');
    expect(passwordInput.props.secureTextEntry).toBe(true);
    
    // Re-render with secureTextEntry=false
    const { rerender } = renderWithTheme(
      <TextInput 
        label="Text"
        value=""
        onChangeText={() => {}}
        placeholder="Enter text"
        secureTextEntry={false}
      />
    );
    
    // Verify secureTextEntry is not applied
    const textInput = screen.getByPlaceholderText('Enter text');
    expect(textInput.props.secureTextEntry).toBe(false);
  });
  
  test('handles focus and blur events', async () => {
    renderWithTheme(
      <TextInput 
        label="Email"
        value=""
        onChangeText={() => {}}
        placeholder="Enter email"
      />
    );
    
    const input = screen.getByPlaceholderText('Enter email');
    
    // Test focus
    fireEvent(input, 'focus');
    expect(input.props.accessibilityState.selected).toBe(true);
    
    // Test blur
    fireEvent(input, 'blur');
    expect(input.props.accessibilityState.selected).toBe(false);
  });
  
  test('sanitizes input correctly', () => {
    const mockOnChangeText = jest.fn();
    renderWithTheme(
      <TextInput 
        label="Comment"
        value=""
        onChangeText={mockOnChangeText}
        placeholder="Enter comment"
      />
    );
    
    const input = screen.getByPlaceholderText('Enter comment');
    fireEvent.changeText(input, '<script>alert("XSS")</script>');
    
    // Verify sanitizeInput was called with the potentially harmful content
    expect(sanitizeInput).toHaveBeenCalledWith('<script>alert("XSS")</script>');
    
    // Verify onChangeText was called with the sanitized result
    expect(mockOnChangeText).toHaveBeenCalledWith('<script>alert("XSS")</script>_sanitized');
  });
  
  test('applies custom styles correctly', () => {
    const customContainerStyle = { marginTop: 20 };
    const customInputStyle = { backgroundColor: 'rgba(0,0,0,0.1)' };
    
    renderWithTheme(
      <TextInput 
        label="Notes"
        value=""
        onChangeText={() => {}}
        placeholder="Enter notes"
        containerStyle={customContainerStyle}
        inputStyle={customInputStyle}
      />
    );
    
    // Getting the input element
    const input = screen.getByPlaceholderText('Enter notes');
    
    // We can't directly test the applied styles, but we can check if props are passed correctly
    // The component should receive the styles and apply them correctly
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.any(Object), // base styles
      expect.any(Object), // focused styles (not applied)
      expect.any(Object), // error styles (not applied)
      expect.any(Object), // multiline styles (not applied)
      customInputStyle, // our custom style should be in the array
    ]));
  });
  
  test('has correct accessibility properties', () => {
    renderWithTheme(
      <TextInput 
        label="Full Name"
        value=""
        onChangeText={() => {}}
        placeholder="Enter your full name"
        error="Name is required"
      />
    );
    
    const input = screen.getByPlaceholderText('Enter your full name');
    
    // Check accessibility label matches the label prop
    expect(input.props.accessibilityLabel).toBe('Full Name');
    
    // Check accessibility hint is set to placeholder
    expect(input.props.accessibilityHint).toBe('Enter your full name');
    
    // Check that invalid state is set when there's an error
    expect(input.props.accessibilityState.invalid).toBe(true);
    
    // Find the error message and check it's accessible to screen readers
    const errorMessage = screen.getByText('Name is required');
    expect(errorMessage.props.accessibilityRole).toBe('alert');
  });
  
  test('supports multiline input', () => {
    renderWithTheme(
      <TextInput 
        label="Description"
        value=""
        onChangeText={() => {}}
        placeholder="Enter description"
        multiline={true}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter description');
    
    // Verify multiline prop is passed to TextInput
    expect(input.props.multiline).toBe(true);
    
    // Test multiline text input
    fireEvent.changeText(input, 'Line 1\nLine 2\nLine 3');
    
    // Verify sanitizeInput was called with the multiline text
    expect(sanitizeInput).toHaveBeenCalledWith('Line 1\nLine 2\nLine 3');
  });
});