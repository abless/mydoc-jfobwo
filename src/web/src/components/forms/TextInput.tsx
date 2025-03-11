import React, { useState, useEffect } from 'react';
import { TextInput as RNTextInput, StyleSheet, Platform } from 'react-native';
import FormField from './FormField';
import { TextInputComponentProps } from '../../types/components.types';
import { COLORS } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../theme/index';
import useKeyboard from '../../hooks/useKeyboard';
import { sanitizeInput } from '../../utils/validation.utils';

/**
 * A reusable text input component for the Health Advisor mobile application that
 * provides consistent styling, validation, and accessibility features.
 * 
 * @param props Component properties including label, value, onChangeText, and other configuration options
 * @returns JSX.Element - Rendered text input component
 */
const TextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  multiline = false,
  containerStyle,
  inputStyle,
}: TextInputComponentProps): JSX.Element => {
  // Track focus state for styling
  const [isFocused, setIsFocused] = useState<boolean>(false);
  
  // Get keyboard state to handle layout adjustments
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  // Sanitize user input for security
  const handleChangeText = (text: string) => {
    onChangeText(sanitizeInput(text));
  };

  // Focus state handlers
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Adjust component layout when keyboard visibility changes
  useEffect(() => {
    // This could be extended to handle more complex keyboard adjustments if needed
  }, [isKeyboardVisible, keyboardHeight]);

  return (
    <FormField 
      label={label} 
      error={error}
      style={containerStyle}
    >
      <RNTextInput
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.LIGHT.DISABLED}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[
          styles.input,
          isFocused && styles.focused,
          error && styles.error,
          multiline && styles.multiline,
          // Platform-specific styling adjustments
          Platform.OS === 'ios' && multiline && { paddingTop: spacing.s },
          inputStyle,
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        // Accessibility props for screen readers
        accessibilityLabel={label}
        accessibilityHint={placeholder}
        accessibilityState={{ 
          disabled: false,
          selected: isFocused,
          invalid: !!error 
        }}
      />
    </FormField>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.LIGHT.CARD,
    borderWidth: 1,
    borderColor: COLORS.LIGHT.BORDER,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.m,
    color: COLORS.LIGHT.TEXT,
    height: 48, // Standard height for touch targets
    width: '100%',
  },
  focused: {
    borderColor: COLORS.LIGHT.PRIMARY,
    borderWidth: 2,
  },
  error: {
    borderColor: COLORS.LIGHT.ERROR,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top', // For Android
  },
});

export default TextInput;