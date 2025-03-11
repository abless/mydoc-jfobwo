import React from 'react'; // ^18.2.0
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // ^0.71.0
import { LoadingIndicatorProps } from '../../types/components.types';
import { useTheme } from '../../contexts/ThemeContext'; 

/**
 * A reusable loading indicator component that displays an activity indicator
 * with customizable size and color. Used throughout the application to provide
 * consistent loading feedback to users.
 * 
 * @param props - The component props including size, color, and style
 * @returns Rendered LoadingIndicator component
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'small',
  color,
  style,
}) => {
  // Get current theme
  const { theme } = useTheme();
  
  // Use theme's primary color if color is not provided
  const indicatorColor = color || theme.colors.PRIMARY;

  return (
    <View 
      style={[styles.container, style]} 
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
      accessibilityState={{ busy: true }}
      importantForAccessibility="yes"
    >
      <ActivityIndicator size={size} color={indicatorColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});

export default LoadingIndicator;