import React from 'react'; // ^18.2.0
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native'; // ^0.71.0
import { ErrorMessageProps } from '../../types/components.types';
import Button from '../buttons/Button';
import { COLORS } from '../../constants/colors';

/**
 * A reusable error message component that displays error information with 
 * an optional retry button. Used throughout the application to provide 
 * consistent error feedback to users.
 * 
 * @param props - Component props including error message and optional retry handler
 * @returns Rendered ErrorMessage component
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  style 
}) => {
  return (
    <View 
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${message}`}
      importantForAccessibility="yes"
    >
      <Text 
        style={[
          styles.message,
          onRetry ? { marginBottom: 8 } : null
        ]}
      >
        {message}
      </Text>
      
      {onRetry && (
        <Button 
          label="Retry" 
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: `${COLORS.LIGHT.ERROR}15`, // Using 15% opacity of error color
    borderWidth: 1,
    borderColor: COLORS.LIGHT.ERROR,
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  message: {
    color: COLORS.LIGHT.ERROR,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 8,
    minWidth: 120,
  },
});

export default ErrorMessage;