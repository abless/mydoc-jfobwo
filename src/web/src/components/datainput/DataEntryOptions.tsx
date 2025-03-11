import React from 'react'; // v18.2.0
import { View, StyleSheet } from 'react-native'; // v0.71.0
import { DataEntryOptionsProps } from '../../types/components.types';
import BottomSheet from '../modals/BottomSheet';
import Button from '../buttons/Button';
import CameraIcon from '../../assets/icons/camera';
import MicrophoneIcon from '../../assets/icons/microphone';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A component that displays options for health data entry when the user taps
 * the '+' button in the bottom navigation. It presents three options for logging
 * different types of health data along with a cancel option.
 * 
 * Rendered inside a bottom sheet that slides up from the bottom of the screen.
 */
const DataEntryOptions: React.FC<DataEntryOptionsProps> = ({
  onSelectMeal,
  onSelectLabResult,
  onSelectSymptom,
  onCancel,
}) => {
  // Get current theme
  const { theme } = useTheme();

  return (
    <BottomSheet
      visible={true}
      onClose={onCancel}
      title="Add Health Data"
    >
      <View style={styles.container}>
        {/* Meal entry option with camera icon */}
        <Button
          label="Log Meal"
          onPress={onSelectMeal}
          icon={<CameraIcon size={20} color={theme.colors.PRIMARY} />}
          style={styles.button}
          accessibilityLabel="Log meal with camera"
        />
        
        {/* Lab result entry option with camera icon */}
        <Button
          label="Log Lab Result"
          onPress={onSelectLabResult}
          icon={<CameraIcon size={20} color={theme.colors.PRIMARY} />}
          style={styles.button}
          accessibilityLabel="Log lab result with camera"
        />
        
        {/* Symptom entry option with microphone icon */}
        <Button
          label="Log Symptom"
          onPress={onSelectSymptom}
          icon={<MicrophoneIcon size={20} color={theme.colors.PRIMARY} />}
          style={styles.button}
          accessibilityLabel="Log symptom with voice recording"
        />
        
        {/* Cancel option */}
        <Button
          label="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.cancelButton}
          accessibilityLabel="Cancel"
        />
      </View>
    </BottomSheet>
  );
};

/**
 * Styles for the DataEntryOptions component
 */
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 8,
    marginBottom: 8,
  }
});

export default DataEntryOptions;