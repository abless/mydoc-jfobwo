import React from 'react';
import { render, screen } from '@testing-library/react-native'; // ^12.0.0
import Avatar from '../../../src/components/common/Avatar';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';
import placeholderImage from '../../../src/assets/images/placeholder.png';

// Wrap component with ThemeProvider for theme context
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('Avatar component', () => {
  test('renders correctly with an image URI', () => {
    const testUri = 'https://example.com/avatar.jpg';
    renderWithTheme(<Avatar uri={testUri} />);
    
    const image = screen.getByAccessibilityLabel('User profile image');
    expect(image).toBeTruthy();
    // Check source prop contains the correct URI
    expect(image.props.source).toEqual({ uri: testUri });
    // Check that the image has circular styling
    expect(image.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderRadius: 25 // Default size is 50, so radius is half
        })
      ])
    );
  });

  test('renders correctly with a text placeholder', () => {
    renderWithTheme(<Avatar placeholder="John Doe" />);
    
    const container = screen.getByAccessibilityLabel('Avatar for John Doe');
    expect(container).toBeTruthy();
    
    const initials = screen.getByText('JD');
    expect(initials).toBeTruthy();
    
    // Verify View has circular styling
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderRadius: 25
        })
      ])
    );
    
    // Verify View has the correct background color from theme
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: expect.any(String)
        })
      ])
    );
  });

  test('renders correctly with default placeholder image', () => {
    renderWithTheme(<Avatar />);
    
    const image = screen.getByAccessibilityLabel('Default profile image');
    expect(image).toBeTruthy();
    expect(image.props.source).toBe(placeholderImage);
    // Check that the image has circular styling
    expect(image.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderRadius: 25
        })
      ])
    );
  });

  test('renders correctly with custom size', () => {
    const customSize = 100;
    renderWithTheme(<Avatar size={customSize} />);
    
    const image = screen.getByAccessibilityLabel('Default profile image');
    expect(image.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: customSize,
          height: customSize,
          borderRadius: customSize / 2
        })
      ])
    );
  });

  test('applies custom styles correctly', () => {
    const customStyle = { borderWidth: 2, borderColor: 'red' };
    renderWithTheme(<Avatar style={customStyle} />);
    
    const image = screen.getByAccessibilityLabel('Default profile image');
    // Check that custom styles are applied
    expect(image.props.style).toEqual(
      expect.arrayContaining([
        customStyle
      ])
    );
    // Also verify that essential styles like border radius are still present
    expect(image.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          borderRadius: 25
        })
      ])
    );
  });

  test('generates correct initials from placeholder text', () => {
    // Test with standard two-word name
    {
      const { getByText } = renderWithTheme(<Avatar placeholder="John Doe" />);
      expect(getByText('JD')).toBeTruthy();
    }
    
    // Test with single word
    {
      const { getByText } = renderWithTheme(<Avatar placeholder="Jane" />);
      expect(getByText('J')).toBeTruthy();
    }
    
    // Test with more than two words
    {
      const { getByText } = renderWithTheme(<Avatar placeholder="John Middle Doe" />);
      expect(getByText('JD')).toBeTruthy();
    }
    
    // Test with special characters
    {
      const { getByText } = renderWithTheme(<Avatar placeholder="John-Doe" />);
      expect(getByText('J')).toBeTruthy();
    }
  });

  test('handles email addresses correctly for placeholder text', () => {
    {
      const { getByText } = renderWithTheme(<Avatar placeholder="john.doe@example.com" />);
      expect(getByText('J')).toBeTruthy();
    }
    
    // Test different email format
    {
      const { getByText } = renderWithTheme(<Avatar placeholder="jane_smith@example.com" />);
      expect(getByText('J')).toBeTruthy();
    }
  });
});