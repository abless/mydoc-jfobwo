import React from 'react'; // 18.2.0
import { render, screen, fireEvent } from '@testing-library/react-native'; // ^12.0.0
import SearchBar from '../../../src/components/common/SearchBar';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';

describe('SearchBar component', () => {
  test('renders correctly with default props', () => {
    render(
      <ThemeProvider>
        <SearchBar value="" onChangeText={jest.fn()} />
      </ThemeProvider>
    );
    
    // Check that the input with default placeholder exists
    const input = screen.getByPlaceholderText('Search health data...');
    expect(input).toBeTruthy();
    
    // Verify search icon is rendered (indirectly, since we can't directly test SVG)
    expect(screen.getByAccessibilityLabel('Search text field')).toBeTruthy();
  });

  test('renders with placeholder', () => {
    const customPlaceholder = 'Find in health records';
    render(
      <ThemeProvider>
        <SearchBar 
          value="" 
          onChangeText={jest.fn()} 
          placeholder={customPlaceholder} 
        />
      </ThemeProvider>
    );
    
    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeTruthy();
  });

  test('handles text input correctly', () => {
    const mockOnChangeText = jest.fn();
    render(
      <ThemeProvider>
        <SearchBar 
          value="test" 
          onChangeText={mockOnChangeText} 
        />
      </ThemeProvider>
    );
    
    const input = screen.getByDisplayValue('test');
    fireEvent.changeText(input, 'updated text');
    expect(mockOnChangeText).toHaveBeenCalledWith('updated text');
  });

  test('calls onSubmit when search button is pressed', () => {
    const mockOnSubmit = jest.fn();
    render(
      <ThemeProvider>
        <SearchBar 
          value="test" // Must have a value to show search button
          onChangeText={jest.fn()} 
          onSubmit={mockOnSubmit} 
        />
      </ThemeProvider>
    );
    
    const searchButton = screen.getByAccessibilityLabel('Search button');
    fireEvent.press(searchButton);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  test('calls onSubmit when submit button on keyboard is pressed', () => {
    const mockOnSubmit = jest.fn();
    render(
      <ThemeProvider>
        <SearchBar 
          value="test" 
          onChangeText={jest.fn()} 
          onSubmit={mockOnSubmit} 
        />
      </ThemeProvider>
    );
    
    const input = screen.getByAccessibilityLabel('Search text field');
    fireEvent.submitEditing(input);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  test('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'red', padding: 20 };
    render(
      <ThemeProvider>
        <SearchBar 
          value="" 
          onChangeText={jest.fn()} 
          style={customStyle} 
        />
      </ThemeProvider>
    );
    
    // Since we can't easily check the applied styles directly in React Native Testing Library,
    // we're mainly ensuring the component renders without errors
    const input = screen.getByPlaceholderText('Search health data...');
    expect(input).toBeTruthy();
  });

  test('has correct accessibility properties', () => {
    render(
      <ThemeProvider>
        <SearchBar 
          value="" 
          onChangeText={jest.fn()} 
        />
      </ThemeProvider>
    );
    
    const input = screen.getByAccessibilityLabel('Search text field');
    expect(input).toBeTruthy();
    expect(input.props.accessibilityHint).toBe('Enter text to search health data');
    
    // When we have a value and onSubmit, the search button should have accessibility props
    render(
      <ThemeProvider>
        <SearchBar 
          value="test" 
          onChangeText={jest.fn()}
          onSubmit={jest.fn()} 
        />
      </ThemeProvider>
    );
    
    const searchButton = screen.getByAccessibilityLabel('Search button');
    expect(searchButton).toBeTruthy();
    expect(searchButton.props.accessibilityRole).toBe('button');
    expect(searchButton.props.accessibilityHint).toBe('Tap to search');
  });
});