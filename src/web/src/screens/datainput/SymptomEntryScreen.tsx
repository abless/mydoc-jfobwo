import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import Header from '../../components/common/Header';
import VoiceRecorder from '../../components/datainput/VoiceRecorder';
import TextInput from '../../components/forms/TextInput';
import RadioGroup from '../../components/forms/RadioGroup';
import Button from '../../components/buttons/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import useForm from '../../hooks/useForm';
import useHealthData from '../../hooks/useHealthData';
import useKeyboard from '../../hooks/useKeyboard';
import NavigationService from '../../navigation/NavigationService';
import { validateSymptomForm } from '../../utils/validation.utils';
import { DataEntryScreenProps } from '../../types/navigation.types';
import { SymptomSeverity, InputSource, CreateSymptomDataRequest, HealthDataType } from '../../types/health.types';
import { COLORS } from '../../constants/colors';

/**
 * A screen component that allows users to record and submit symptom information
 * using voice recording, text input, and severity selection.
 * 
 * @param props Screen navigation props
 * @returns The rendered SymptomEntryScreen component
 */
const SymptomEntryScreen = ({ navigation }: DataEntryScreenProps) => {
  // State for audio file path from voice recording
  const [audioFilePath, setAudioFilePath] = useState<string>('');
  
  // Set up keyboard handling to adjust layout when keyboard appears
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();
  
  // Set up health data operations for submitting symptom data
  const { addHealthData, isSubmitting, error: submitError } = useHealthData();
  
  // Initialize form with validation for symptom data
  const { 
    values, 
    errors, 
    handleChange, 
    setFieldValue, 
    handleSubmit 
  } = useForm(
    {
      description: '',
      severity: SymptomSeverity.MILD,
      duration: '',
      transcription: '',
    },
    validateSymptomForm,
    onSubmit
  );
  
  // Create symptom severity options for radio buttons based on enum
  const severityOptions = [
    { label: 'Mild', value: SymptomSeverity.MILD },
    { label: 'Moderate', value: SymptomSeverity.MODERATE },
    { label: 'Severe', value: SymptomSeverity.SEVERE },
  ];
  
  /**
   * Handles completion of voice recording by updating form fields with transcription
   * @param uri The file path of the recorded audio
   * @param transcription The transcribed text from the voice recording
   */
  const handleRecordComplete = useCallback((uri: string, transcription: string) => {
    setAudioFilePath(uri);
    setFieldValue('description', transcription);
    setFieldValue('transcription', transcription);
  }, [setFieldValue]);
  
  /**
   * Handles form submission to create symptom health data
   * @param formValues The validated form values
   */
  async function onSubmit(formValues: any) {
    try {
      // Prepare audio file data if recording exists
      const audio = audioFilePath ? {
        uri: audioFilePath,
        type: 'audio/m4a',
        name: `symptom_${new Date().getTime()}.m4a`,
      } : undefined;
      
      // Create symptom data request object
      const symptomData: CreateSymptomDataRequest = {
        description: formValues.description,
        severity: formValues.severity,
        duration: formValues.duration,
        audio,
        transcription: formValues.transcription,
        timestamp: new Date().toISOString(),
      };
      
      // Submit symptom data to backend
      const result = await addHealthData(symptomData, HealthDataType.SYMPTOM);
      
      if (result) {
        // Show success message and navigate back to main screen
        Alert.alert(
          'Success',
          'Symptom recorded successfully',
          [{ text: 'OK', onPress: () => NavigationService.navigateToMain() }]
        );
      }
    } catch (error) {
      console.error('Error submitting symptom data:', error);
    }
  }
  
  return (
    <View style={styles.container}>
      <Header 
        title="Log Symptom" 
        onLeftPress={() => NavigationService.goBack()} 
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && { paddingBottom: keyboardHeight + 24 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Voice recorder component for capturing symptom description */}
          <VoiceRecorder
            onRecordComplete={handleRecordComplete}
            maxDuration={120} // 2 minutes max as per spec
            style={styles.recorder}
          />
          
          {/* Symptom description field - populated from voice transcription or manual entry */}
          <TextInput
            label="Symptom Description"
            value={values.description}
            onChangeText={handleChange('description')}
            placeholder="Describe your symptoms"
            error={errors.description}
            multiline
          />
          
          {/* Symptom severity selection */}
          <View style={styles.formField}>
            <Text style={styles.label}>Symptom Severity</Text>
            <RadioGroup
              options={severityOptions}
              selectedValue={values.severity}
              onValueChange={(value) => setFieldValue('severity', value)}
            />
            {errors.severity && <Text style={styles.errorText}>{errors.severity}</Text>}
          </View>
          
          {/* Symptom duration field */}
          <TextInput
            label="Symptom Duration"
            value={values.duration}
            onChangeText={handleChange('duration')}
            placeholder="e.g., 2 hours, 3 days"
            error={errors.duration}
          />
          
          {/* Display error message if submission fails */}
          {submitError && <ErrorMessage message={submitError} />}
          
          {/* Save button */}
          <Button
            label="Save"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  recorder: {
    marginVertical: 16,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.PRIMARY,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    marginTop: 24,
  },
});

export default SymptomEntryScreen;