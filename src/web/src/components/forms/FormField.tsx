import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { FormFieldProps } from '../../types/components.types';
import { COLORS } from '../../constants/colors';
import { spacing } from '../../theme/metrics';

/**
 * A reusable form field component that provides consistent styling and error handling
 * for form inputs in the Health Advisor mobile application.
 * 
 * @param props - Component props including label, error message, and children elements
 * @returns JSX.Element - The rendered form field component
 */
const FormField = ({ label, error, children, style }: FormFieldProps): JSX.Element => {
  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text 
          style={styles.label} 
          accessibilityRole="text"
          accessibilityLabel={label}
        >
          {label}
        </Text>
      ) : null}
      
      {children}
      
      {error ? (
        <Text 
          style={styles.error} 
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${error}`}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
    width: '100%',
  },
  label: {
    color: COLORS.LIGHT.TEXT,
    fontWeight: '500',
    marginBottom: spacing.s,
    fontSize: 16,
  },
  error: {
    color: COLORS.LIGHT.ERROR,
    fontSize: 14,
    marginTop: spacing.xs,
  },
});

export default FormField;