import React from 'react'; // ^18.2.0
import { TouchableOpacity, View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native'; // ^0.71.0
import { ButtonProps, ButtonVariant, ButtonSize } from '../../types/components.types';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingIndicator from '../common/LoadingIndicator';

/**
 * A reusable button component that renders a customizable button with different variants,
 * sizes, loading states, and optional icon support. Used throughout the Health Advisor 
 * application for primary actions, form submissions, and navigation.
 * 
 * @param props - Component props including label, onPress, variant, etc.
 * @returns Rendered Button component
 */
const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.MEDIUM,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  // Get current theme
  const { theme } = useTheme();

  // Get container style based on props
  const getContainerStyle = (): StyleProp<ViewStyle> => {
    const containerStyles = [styles.container];
    
    // Add border radius from theme
    containerStyles.push({
      borderRadius: theme.borderRadius.medium,
    });
    
    // Add variant style
    if (disabled) {
      if (variant === ButtonVariant.OUTLINE) {
        containerStyles.push({
          backgroundColor: theme.colors.TRANSPARENT,
          borderColor: theme.colors.DISABLED,
        });
      } else if (variant === ButtonVariant.TEXT) {
        containerStyles.push({
          backgroundColor: theme.colors.TRANSPARENT,
          borderColor: theme.colors.TRANSPARENT,
          borderWidth: 0,
        });
      } else {
        containerStyles.push({
          backgroundColor: theme.colors.DISABLED,
          borderColor: theme.colors.DISABLED,
        });
      }
    } else {
      // Apply variant-specific styles when not disabled
      switch (variant) {
        case ButtonVariant.SECONDARY:
          containerStyles.push({
            backgroundColor: theme.colors.SECONDARY,
            borderColor: theme.colors.SECONDARY,
          });
          break;
        case ButtonVariant.OUTLINE:
          containerStyles.push({
            backgroundColor: theme.colors.TRANSPARENT,
            borderColor: theme.colors.PRIMARY,
          });
          break;
        case ButtonVariant.TEXT:
          containerStyles.push({
            backgroundColor: theme.colors.TRANSPARENT,
            borderColor: theme.colors.TRANSPARENT,
            borderWidth: 0,
          });
          break;
        case ButtonVariant.PRIMARY:
        default:
          containerStyles.push({
            backgroundColor: theme.colors.PRIMARY,
            borderColor: theme.colors.PRIMARY,
          });
      }
    }
    
    // Add size style
    switch (size) {
      case ButtonSize.SMALL:
        containerStyles.push({
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.s,
          minHeight: 32,
        });
        break;
      case ButtonSize.LARGE:
        containerStyles.push({
          paddingVertical: theme.spacing.m,
          paddingHorizontal: theme.spacing.l,
          minHeight: 56,
        });
        break;
      case ButtonSize.MEDIUM:
      default:
        containerStyles.push({
          paddingVertical: theme.spacing.s,
          paddingHorizontal: theme.spacing.m,
          minHeight: 44,
        });
    }
    
    // Add custom style if provided
    if (style) {
      containerStyles.push(style);
    }
    
    return containerStyles;
  };

  // Get text style based on props
  const getTextStyle = (): StyleProp<TextStyle> => {
    const textStyles = [styles.text];
    
    // Add font family and size based on theme
    textStyles.push({
      fontFamily: theme.typography.fontFamily.semiBold,
    });
    
    // Add size-specific text styles
    switch (size) {
      case ButtonSize.SMALL:
        textStyles.push({
          fontSize: theme.typography.fontSize.s,
        });
        break;
      case ButtonSize.LARGE:
        textStyles.push({
          fontSize: theme.typography.fontSize.l,
        });
        break;
      case ButtonSize.MEDIUM:
      default:
        textStyles.push({
          fontSize: theme.typography.fontSize.m,
        });
    }
    
    // Add variant and state-specific text color
    if (disabled) {
      if (variant === ButtonVariant.OUTLINE || variant === ButtonVariant.TEXT) {
        textStyles.push({ color: theme.colors.DISABLED });
      } else {
        textStyles.push({ color: theme.colors.WHITE });
      }
    } else {
      switch (variant) {
        case ButtonVariant.OUTLINE:
        case ButtonVariant.TEXT:
          textStyles.push({ color: theme.colors.PRIMARY });
          break;
        case ButtonVariant.PRIMARY:
        case ButtonVariant.SECONDARY:
        default:
          textStyles.push({ color: theme.colors.WHITE });
      }
    }
    
    // Add custom text style if provided
    if (textStyle) {
      textStyles.push(textStyle);
    }
    
    return textStyles;
  };

  // Get loading indicator color based on button variant and state
  const getLoadingColor = (): string => {
    if (disabled) {
      if (variant === ButtonVariant.OUTLINE || variant === ButtonVariant.TEXT) {
        return theme.colors.DISABLED;
      }
      return theme.colors.WHITE;
    }
    
    switch (variant) {
      case ButtonVariant.OUTLINE:
      case ButtonVariant.TEXT:
        return theme.colors.PRIMARY;
      case ButtonVariant.PRIMARY:
      case ButtonVariant.SECONDARY:
      default:
        return theme.colors.WHITE;
    }
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <LoadingIndicator size="small" color={getLoadingColor()} />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={getTextStyle()}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Static styles that don't depend on theme
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;