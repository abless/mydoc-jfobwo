import React from 'react'; // ^18.2.0
import { View, Text, StyleSheet } from 'react-native'; // ^0.71.0
import { ConfirmationModalProps, ButtonVariant } from '../../types/components.types';
import Modal from './Modal';
import Button from '../buttons/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS } from '../../constants/colors';
import { spacing } from '../../theme';

/**
 * A reusable confirmation modal component that displays a dialog with a title,
 * message, and confirm/cancel buttons. Used throughout the Health Advisor application 
 * to confirm user actions before proceeding with potentially important operations.
 *
 * @returns Rendered ConfirmationModal component
 */
const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = ButtonVariant.PRIMARY,
}: ConfirmationModalProps) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={title}
    >
      <View style={styles.container}>
        <Text 
          style={[
            styles.message, 
            { 
              color: theme.colors.TEXT,
              fontSize: theme.typography.fontSize.m,
              lineHeight: theme.typography.lineHeight.m,
              fontFamily: theme.typography.fontFamily.regular,
            }
          ]}
          accessibilityRole="text"
        >
          {message}
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            label={cancelText}
            onPress={onCancel}
            variant={ButtonVariant.SECONDARY}
            style={[styles.button, styles.cancelButton]}
          />
          <Button
            label={confirmText}
            onPress={onConfirm}
            variant={confirmVariant}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
  },
  message: {
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.m,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    marginRight: spacing.m,
  },
});

export default ConfirmationModal;