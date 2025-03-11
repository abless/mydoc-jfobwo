import React from 'react'; // ^18.2.0
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'; // ^0.71.0
import { CardProps } from '../../types/components.types';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A reusable card component with consistent styling and optional touch interaction.
 * Provides elevation (shadow) and rounded corners as a container for content throughout
 * the application, particularly in health data displays.
 * 
 * @param props - Component props
 * @returns Rendered Card component with appropriate styling and interaction
 */
const Card = ({ 
  children, 
  style, 
  onPress, 
  elevation = 'medium' // Default to medium elevation
}: CardProps): JSX.Element => {
  // Get current theme to apply consistent styling
  const { theme } = useTheme();
  
  // Determine the appropriate elevation style based on the elevation prop
  const elevationStyle = theme.elevation[elevation];
  
  // Base styles for the card component
  const cardStyle = [
    styles.container,
    {
      backgroundColor: theme.colors.CARD,
      borderRadius: theme.borderRadius.medium,
      margin: theme.spacing.s,
      padding: theme.spacing.m,
      ...elevationStyle
    },
    style // Merge custom styles provided by parent component
  ];
  
  // If onPress is provided, render as a TouchableOpacity for interaction
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  // Otherwise, render as a regular View
  return (
    <View 
      style={cardStyle} 
      accessible={true}
      accessibilityRole="none"
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Ensures content doesn't overflow rounded corners
  }
});

export default Card;