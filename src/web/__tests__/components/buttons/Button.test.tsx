import React from 'react';
import { View } from 'react-native'; // ^0.71.0
import { render, screen, fireEvent } from '@testing-library/react-native'; // ^12.0.0
import Button from '../../../src/components/buttons/Button';
import { ButtonVariant, ButtonSize } from '../../../src/types/components.types';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';

// Helper component for icon testing
const TestIcon = ({ testID }) => {
  return <View testID={testID} />;
};

describe('Button component', () => {
  test('renders correctly with default props', () => {
    const onPressMock = jest.fn();
    render(
      <ThemeProvider>
        <Button label="Test Button" onPress={onPressMock} />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  test('renders correctly with different variants', () => {
    const onPressMock = jest.fn();
    
    // Test PRIMARY variant
    const { rerender } = render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          variant={ButtonVariant.PRIMARY} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    
    // Test SECONDARY variant
    rerender(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          variant={ButtonVariant.SECONDARY} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    
    // Test OUTLINE variant
    rerender(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          variant={ButtonVariant.OUTLINE} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    
    // Test TEXT variant
    rerender(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          variant={ButtonVariant.TEXT} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  test('renders correctly with different sizes', () => {
    const onPressMock = jest.fn();
    
    // Test SMALL size
    const { rerender } = render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          size={ButtonSize.SMALL} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    
    // Test MEDIUM size
    rerender(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          size={ButtonSize.MEDIUM} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    
    // Test LARGE size
    rerender(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          size={ButtonSize.LARGE} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  test('renders correctly when disabled', () => {
    const onPressMock = jest.fn();
    
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          disabled={true} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    
    // Verify button is disabled
    const button = screen.getByRole('button');
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  test('renders correctly with loading state', () => {
    const onPressMock = jest.fn();
    
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          loading={true} 
        />
      </ThemeProvider>
    );
    
    // Verify loading indicator is present
    expect(screen.getByAccessibilityLabel('Loading content')).toBeTruthy();
    
    // Verify button text is not displayed when loading
    expect(screen.queryByText('Test Button')).toBeNull();
    
    // Verify button is disabled when loading
    const button = screen.getByRole('button');
    expect(button.props.disabled).toBe(true);
  });

  test('renders correctly with an icon', () => {
    const onPressMock = jest.fn();
    const mockIcon = <TestIcon testID="test-icon" />;
    
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          icon={mockIcon} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    expect(screen.getByTestId('test-icon')).toBeTruthy();
  });

  test('applies custom styles correctly', () => {
    const onPressMock = jest.fn();
    const customStyle = { backgroundColor: 'pink' };
    const customTextStyle = { color: 'purple' };
    
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          style={customStyle}
          textStyle={customTextStyle} 
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Test Button')).toBeTruthy();
    
    // We can't easily test actual applied styles in RN testing library,
    // but we can verify the component renders successfully with custom styles
  });

  test('calls onPress handler when pressed', () => {
    const onPressMock = jest.fn();
    
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
        />
      </ThemeProvider>
    );
    
    fireEvent.press(screen.getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  test('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          disabled={true} 
        />
      </ThemeProvider>
    );
    
    fireEvent.press(screen.getByText('Test Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  test('has correct accessibility properties', () => {
    const onPressMock = jest.fn();
    
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
        />
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button');
    
    // Verify accessibility properties
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Test Button');
    expect(button.props.accessibilityState).toEqual({ disabled: false, busy: false });
    
    // Test disabled state accessibility
    render(
      <ThemeProvider>
        <Button 
          label="Test Button" 
          onPress={onPressMock} 
          disabled={true} 
        />
      </ThemeProvider>
    );
    
    const disabledButton = screen.getByRole('button');
    expect(disabledButton.props.accessibilityState.disabled).toBe(true);
  });
});