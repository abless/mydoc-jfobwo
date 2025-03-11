import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextInput, View } from 'react-native';
import FormField from '../../../src/components/forms/FormField';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';

/**
 * Helper function to render components with ThemeProvider context
 */
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('FormField component', () => {
  test('renders correctly with label only', () => {
    const { getByText, queryByLabelText } = renderWithTheme(
      <FormField label="Test Label">
        <View />
      </FormField>
    );
    
    // Check if label is rendered correctly
    expect(getByText('Test Label')).toBeTruthy();
    
    // Check that no error message is displayed
    expect(queryByLabelText(/error/i)).toBeNull();
  });

  test('renders correctly with label and children', () => {
    const { getByText, getByPlaceholderText, queryByLabelText } = renderWithTheme(
      <FormField label="Test Label">
        <TextInput placeholder="Test Input" />
      </FormField>
    );
    
    // Check if label is rendered correctly
    expect(getByText('Test Label')).toBeTruthy();
    
    // Check if child component is rendered
    expect(getByPlaceholderText('Test Input')).toBeTruthy();
    
    // Check that no error message is displayed
    expect(queryByLabelText(/error/i)).toBeNull();
  });

  test('renders correctly with error message', () => {
    const { getByText, getByPlaceholderText, getByLabelText } = renderWithTheme(
      <FormField label="Test Label" error="Error message">
        <TextInput placeholder="Test Input" />
      </FormField>
    );
    
    // Check if label is rendered correctly
    expect(getByText('Test Label')).toBeTruthy();
    
    // Check if child component is rendered
    expect(getByPlaceholderText('Test Input')).toBeTruthy();
    
    // Check if error message is displayed
    expect(getByText('Error message')).toBeTruthy();
    
    // Check error message accessibility label
    expect(getByLabelText('Error: Error message')).toBeTruthy();
    
    // Check if error message has the error style color
    const errorMessage = getByText('Error message');
    expect(errorMessage.props.style.color).toBeDefined();
  });

  test('applies custom styles correctly', () => {
    const customStyle = { marginTop: 20, backgroundColor: 'red' };
    
    const { toJSON } = renderWithTheme(
      <FormField label="Test Label" style={customStyle}>
        <TextInput placeholder="Test Input" />
      </FormField>
    );
    
    // For React Native, we can check the rendered JSON structure
    const tree = toJSON();
    expect(tree).toBeTruthy();
    
    // The root element should be a View with style that includes our custom style
    expect(tree.type).toBe('View');
    expect(tree.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });

  test('has correct accessibility properties', () => {
    const { getByLabelText } = renderWithTheme(
      <FormField label="Test Label">
        <TextInput placeholder="Test Input" />
      </FormField>
    );
    
    // Check if label has correct accessibility label
    expect(getByLabelText('Test Label')).toBeTruthy();
  });
});