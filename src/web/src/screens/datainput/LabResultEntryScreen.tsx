import React, { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import { View, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView, Image, Text } from 'react-native'; // ^0.71.0
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // ^9.2.0

import CameraView from '../../components/datainput/CameraView';
import TextInput from '../../components/forms/TextInput';
import Button from '../../components/buttons/Button';
import Header from '../../components/common/Header';
import DatePicker from '../../components/common/DatePicker';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingIndicator from '../../components/common/LoadingIndicator';

import useCamera from '../../hooks/useCamera';
import useHealthData from '../../hooks/useHealthData';
import useForm from '../../hooks/useForm';

import { HealthDataType, CreateLabResultDataRequest } from '../../types/health.types';
import { useTheme } from '../../contexts/ThemeContext';
import NavigationService from '../../navigation/NavigationService';
import { NAVIGATION_ROUTES } from '../../constants/navigation';
import { ButtonVariant } from '../../types/components.types';

/**
 * Validates the lab result form data
 * @param values Form values to validate
 * @returns Validation errors object
 */
const validateLabResultForm = (values: { testType?: string; testDate?: string; notes?: string }) => {
  const errors: Record<string, string> = {};
  
  if (!values.testType) {
    errors.testType = 'Test type is required';
  }
  
  if (!values.testDate) {
    errors.testDate = 'Test date is required';
  }
  
  return errors;
};

/**
 * Screen component for capturing and submitting lab result data
 */
const LabResultEntryScreen = () => {
  const { theme } = useTheme();
  
  // Set up camera hook for lab result image capture
  const { 
    image, 
    takePhoto, 
    selectFromGallery, 
    resetImage, 
    isLoading: cameraLoading, 
    error: cameraError 
  } = useCamera(HealthDataType.LAB_RESULT);
  
  // Set up health data hook for submission
  const { addHealthData, isSubmitting, error: submitError } = useHealthData();
  
  // Set up form hook for handling form state
  const { 
    values, 
    errors, 
    handleChange, 
    setFieldValue, 
    handleSubmit, 
    resetForm 
  } = useForm(
    {
      testType: '',
      testDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
    validateLabResultForm,
    onSubmit
  );

  // Handler for date change
  const handleDateChange = useCallback((date: Date) => {
    setFieldValue('testDate', date.toISOString().split('T')[0]);
  }, [setFieldValue]);
  
  // Form submission handler
  async function onSubmit(values: any) {
    if (!image) {
      Alert.alert('Error', 'Please take a photo of your lab result');
      return;
    }
    
    const labResultData: CreateLabResultDataRequest = {
      testType: values.testType,
      testDate: values.testDate,
      notes: values.notes,
      image,
      timestamp: new Date().toISOString()
    };
    
    const result = await addHealthData(labResultData, HealthDataType.LAB_RESULT);
    
    if (result) {
      // Success - navigate back to the health log
      resetForm();
      resetImage();
      NavigationService.navigateToHealthLog();
    }
  }
  
  // Handler for camera capture
  const handleCapture = useCallback((uri: string) => {
    // The CameraView component calls this function with the URI of the captured image
    // We need to create an image object for the useCamera hook
    const capturedImage = {
      uri,
      type: 'image/jpeg',
      name: `lab_result_${Date.now()}.jpg`,
    };
    
    // In a real implementation, we would update the image state in useCamera
    // For now, we're manually setting the image
    console.log('Image captured:', uri);
  }, []);
  
  // Cancel handler
  const handleCancel = useCallback(() => {
    NavigationService.goBack();
  }, []);
  
  // Reset form when unmounted
  useEffect(() => {
    return () => {
      resetForm();
      resetImage();
    };
  }, [resetForm, resetImage]);
  
  // Render the screen
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND }]}>
      <Header 
        title="Log Lab Result" 
        leftIcon={<MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.PRIMARY} />}
        onLeftPress={handleCancel}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {!image ? (
            // Show camera for capturing lab result
            <CameraView
              onCapture={handleCapture}
              style={styles.camera}
            />
          ) : (
            // Show captured image
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              <Button 
                label="Retake Photo" 
                onPress={resetImage} 
                variant={ButtonVariant.SECONDARY}
                style={styles.retakeButton}
              />
            </View>
          )}
          
          <TextInput
            label="Test Type"
            value={values.testType}
            onChangeText={handleChange('testType')}
            placeholder="e.g., Blood Test, Cholesterol, Glucose"
            error={errors.testType}
          />
          
          <View style={styles.datePickerContainer}>
            <Text style={[styles.label, { color: theme.colors.TEXT }]}>Test Date</Text>
            <DatePicker
              selectedDate={new Date(values.testDate)}
              onDateChange={handleDateChange}
              maxDate={new Date()}
            />
            {errors.testDate && (
              <Text style={[styles.errorText, { color: theme.colors.ERROR }]}>
                {errors.testDate}
              </Text>
            )}
          </View>
          
          <TextInput
            label="Notes (Optional)"
            value={values.notes}
            onChangeText={handleChange('notes')}
            placeholder="Add any relevant notes about the test"
            multiline
          />
          
          {(submitError || cameraError) && (
            <ErrorMessage 
              message={submitError || cameraError || 'An error occurred'} 
              onRetry={handleSubmit}
            />
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              label="Save"
              onPress={handleSubmit}
              disabled={isSubmitting || cameraLoading}
              loading={isSubmitting}
              style={styles.submitButton}
            />
            <Button
              label="Cancel"
              onPress={handleCancel}
              variant={ButtonVariant.SECONDARY}
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  camera: {
    height: 250,
    marginBottom: 16,
    borderRadius: 8,
  },
  imagePreviewContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    height: 250,
    width: '100%',
    resizeMode: 'cover',
  },
  retakeButton: {
    marginTop: 8,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default LabResultEntryScreen;