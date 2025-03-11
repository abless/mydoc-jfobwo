import React, { useState, useEffect, useCallback } from 'react'; // v18.2.0
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Alert, 
  TouchableOpacity,
  Image
} from 'react-native'; // v0.71.0
import { Picker } from '@react-native-picker/picker'; // v2.4.8

// Components
import Header from '../../components/common/Header';
import CameraView from '../../components/datainput/CameraView';
import TextInput from '../../components/forms/TextInput';
import Button from '../../components/buttons/Button';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';

// Hooks
import useCamera from '../../hooks/useCamera';
import useHealthData from '../../hooks/useHealthData';
import useForm from '../../hooks/useForm';

// Types and utils
import { HealthDataType, MealType } from '../../types/health.types';
import { DataEntryScreenProps } from '../../types/navigation.types';
import { validateMealForm } from '../../utils/validation.utils';
import NavigationService from '../../navigation/NavigationService';
import CameraIcon from '../../assets/icons/camera';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Screen component for capturing and submitting meal data with photos,
 * descriptions, and meal type selection. Implements the meal photo capture requirement.
 */
const MealEntryScreen: React.FC<DataEntryScreenProps> = () => {
  // Get current theme
  const { theme } = useTheme();
  
  // Initialize camera hook for meal photos
  const { 
    image, 
    takePhoto, 
    selectFromGallery, 
    resetImage, 
    isLoading: cameraLoading, 
    error: cameraError 
  } = useCamera(HealthDataType.MEAL);
  
  // Initialize health data hook for submission
  const { 
    addHealthData, 
    isSubmitting, 
    error: submitError 
  } = useHealthData();
  
  // Form submission handler
  const handleSubmit = async (values: any) => {
    // Create meal data payload for API
    const mealData = {
      description: values.description,
      mealType: values.mealType,
      image: values.image,
      timestamp: new Date().toISOString()
    };
    
    // Submit meal data to backend
    const result = await addHealthData(mealData, HealthDataType.MEAL);
    
    if (result) {
      // Show success message and navigate back
      Alert.alert(
        'Success', 
        'Meal data saved successfully',
        [{ text: 'OK', onPress: () => NavigationService.goBack() }]
      );
    }
  };
  
  // Initialize form with validation
  const { 
    values, 
    errors, 
    handleChange, 
    setFieldValue, 
    handleSubmit: submitForm 
  } = useForm(
    { 
      mealType: MealType.BREAKFAST, 
      description: '', 
      image: null 
    }, 
    validateMealForm, 
    handleSubmit
  );
  
  // Update form when image changes
  useEffect(() => {
    if (image) {
      setFieldValue('image', image);
    }
  }, [image, setFieldValue]);
  
  // Handle photo capture
  const handleCapture = useCallback(() => {
    takePhoto();
  }, [takePhoto]);
  
  // Handle cancel/back button
  const handleCancel = useCallback(() => {
    NavigationService.goBack();
  }, []);
  
  // Combined error message
  const errorMessage = cameraError || submitError || errors.form;
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.BACKGROUND }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <Header 
        title="Log Meal" 
        leftIcon={<CameraIcon size={24} color={theme.colors.PRIMARY} />}
        onLeftPress={handleCancel}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Camera view or image preview */}
        <View style={styles.imageContainer}>
          {!image ? (
            // Show camera view if no image captured yet
            <View style={styles.cameraContainer}>
              <CameraView
                onCapture={(uri) => {
                  // The actual capture is handled by useCamera hook
                  console.log('Image captured, uri:', uri);
                }}
                style={styles.camera}
              />
              
              <View style={styles.buttonRow}>
                <Button
                  label="Take Photo"
                  onPress={handleCapture}
                  disabled={cameraLoading}
                  style={styles.actionButton}
                />
                
                <Button
                  label="Select from Gallery"
                  onPress={selectFromGallery}
                  disabled={cameraLoading}
                  variant="SECONDARY"
                  style={styles.actionButton}
                />
              </View>
            </View>
          ) : (
            // Show image preview if image is captured
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: image.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <Button
                label="Retake Photo"
                onPress={resetImage}
                style={styles.retakeButton}
              />
            </View>
          )}
        </View>
        
        {/* Form fields */}
        <View style={styles.formContainer}>
          {/* Description input */}
          <TextInput
            label="Description (optional)"
            value={values.description}
            onChangeText={handleChange('description')}
            placeholder="Describe your meal"
            error={errors.description}
            multiline={true}
          />
          
          {/* Meal type picker */}
          <View style={styles.pickerContainer}>
            <Text style={[
              styles.label, 
              { color: theme.colors.TEXT }
            ]}>
              Meal type
            </Text>
            <View style={[
              styles.pickerWrapper, 
              { 
                borderColor: errors.mealType ? theme.colors.ERROR : theme.colors.BORDER,
                backgroundColor: theme.colors.CARD
              }
            ]}>
              <Picker
                selectedValue={values.mealType}
                onValueChange={(value) => setFieldValue('mealType', value)}
                style={{ color: theme.colors.TEXT }}
              >
                <Picker.Item label="Breakfast" value={MealType.BREAKFAST} />
                <Picker.Item label="Lunch" value={MealType.LUNCH} />
                <Picker.Item label="Dinner" value={MealType.DINNER} />
                <Picker.Item label="Snack" value={MealType.SNACK} />
              </Picker>
            </View>
            {errors.mealType && (
              <Text style={[
                styles.errorText, 
                { color: theme.colors.ERROR }
              ]}>
                {errors.mealType}
              </Text>
            )}
          </View>
          
          {/* Error messages */}
          {errorMessage && (
            <ErrorMessage 
              message={errorMessage} 
              style={styles.errorMessage}
            />
          )}
          
          {errors.image && (
            <ErrorMessage 
              message={errors.image} 
              style={styles.errorMessage}
            />
          )}
          
          {/* Save button */}
          <Button
            label="Save"
            onPress={submitForm}
            disabled={isSubmitting || !image}
            loading={isSubmitting}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
      
      {/* Loading overlay */}
      {(cameraLoading || isSubmitting) && (
        <View style={styles.loadingOverlay}>
          <LoadingIndicator size="large" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  imageContainer: {
    marginBottom: 20,
  },
  cameraContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  camera: {
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  previewContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  retakeButton: {
    marginBottom: 16,
  },
  formContainer: {
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    marginVertical: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  errorMessage: {
    marginVertical: 8,
  },
  saveButton: {
    marginTop: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});

export default MealEntryScreen;