import React from 'react'; // ^18.2.0
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'; // ^0.71.0
import { IconButtonProps } from '../../types/components.types';
import { useTheme } from '../../contexts/ThemeContext';

// Static styles for the icon button container
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/**
 * A customizable icon button component that renders a touchable icon with
 * configurable size and color
 */
const IconButton = ({
  icon,
  onPress,
  size,
  color,
  disabled = false,
  style,
  accessibilityLabel,
}: IconButtonProps) => {
  // Get theme context for default styling
  const { theme } = useTheme();
  
  // Set default size to 24 if not provided
  const iconSize = size || 24;
  
  // Use theme color if no color provided
  const iconColor = color || theme.colors.PRIMARY;
  
  // Ensure minimum touch target size of 44x44 for accessibility
  const touchableSize = Math.max(iconSize, 44);
  
  // Combine static and dynamic styles
  const containerStyle = [
    styles.container,
    {
      width: touchableSize,
      height: touchableSize,
      opacity: disabled ? 0.5 : 1,
    },
    style, // Apply custom styles from props
  ];

  // Try to apply color and size to the icon if it's a React element
  let iconElement = icon;
  if (React.isValidElement(icon)) {
    try {
      // Merge props correctly to ensure our values take precedence
      const mergedProps = {
        ...icon.props,
        color: iconColor,
        size: iconSize,
      };
      
      iconElement = React.cloneElement(icon, mergedProps);
    } catch (error) {
      // If cloning fails, just use the original icon
      console.error('IconButton: Failed to apply color and size to icon', error);
      iconElement = icon;
    }
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {iconElement}
    </TouchableOpacity>
  );
};

export default IconButton;