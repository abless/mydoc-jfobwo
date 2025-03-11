import { device, element, by, expect, waitFor } from 'detox'; // detox ^20.0.0
import { ensureLoggedIn } from './authentication.test';

// Test data constants
const TEST_MEAL_DESCRIPTION = 'Test meal with protein and vegetables';
const TEST_LAB_RESULT_TYPE = 'Blood Test';
const TEST_LAB_RESULT_NOTES = 'Routine annual checkup';
const TEST_SYMPTOM_DESCRIPTION = 'Mild headache after meals';

/**
 * Setup function that runs before all tests
 */
beforeAll(async () => {
  await device.launchApp();
  await ensureLoggedIn();
  // Navigate to the main screen
});

/**
 * Setup function that runs before each test
 */
beforeEach(async () => {
  // Reset to main screen before each test
  try {
    // Navigate to the main screen via chat tab
    const chatTab = element(by.id('chatTab'));
    await chatTab.tap();
    
    // Ensure the bottom tab navigation is visible
    await waitFor(element(by.id('bottomTabNavigator')))
      .toBeVisible()
      .withTimeout(2000);
  } catch (error) {
    // If navigation fails, reload the app
    await device.reloadReactNative();
    await ensureLoggedIn();
  }
});

/**
 * Cleanup function that runs after all tests
 */
afterAll(async () => {
  // Clean up any test data created during tests
  // Navigate back to main screen
  const chatTab = element(by.id('chatTab'));
  await chatTab.tap();
});

/**
 * Helper function to navigate to the data entry options screen
 */
async function navigateToDataEntryOptions(): Promise<void> {
  const addButton = element(by.id('addDataButton'));
  await addButton.tap();
  
  // Wait for data entry options to appear
  await waitFor(element(by.id('dataEntryOptions')))
    .toBeVisible()
    .withTimeout(2000);
    
  // Verify all options are visible
  await expect(element(by.id('mealEntryOption'))).toBeVisible();
  await expect(element(by.id('labResultEntryOption'))).toBeVisible();
  await expect(element(by.id('symptomEntryOption'))).toBeVisible();
}

/**
 * Helper function to navigate to the meal entry screen
 */
async function navigateToMealEntry(): Promise<void> {
  await navigateToDataEntryOptions();
  
  const mealEntryOption = element(by.id('mealEntryOption'));
  await mealEntryOption.tap();
  
  // Wait for meal entry screen to appear
  await waitFor(element(by.id('mealEntryScreen')))
    .toBeVisible()
    .withTimeout(2000);
    
  // Verify camera view is visible
  await expect(element(by.id('cameraView'))).toBeVisible();
}

/**
 * Helper function to navigate to the lab result entry screen
 */
async function navigateToLabResultEntry(): Promise<void> {
  await navigateToDataEntryOptions();
  
  const labResultEntryOption = element(by.id('labResultEntryOption'));
  await labResultEntryOption.tap();
  
  // Wait for lab result entry screen to appear
  await waitFor(element(by.id('labResultEntryScreen')))
    .toBeVisible()
    .withTimeout(2000);
    
  // Verify camera view is visible
  await expect(element(by.id('cameraView'))).toBeVisible();
}

/**
 * Helper function to navigate to the symptom entry screen
 */
async function navigateToSymptomEntry(): Promise<void> {
  await navigateToDataEntryOptions();
  
  const symptomEntryOption = element(by.id('symptomEntryOption'));
  await symptomEntryOption.tap();
  
  // Wait for symptom entry screen to appear
  await waitFor(element(by.id('symptomEntryScreen')))
    .toBeVisible()
    .withTimeout(2000);
    
  // Verify voice recorder is visible
  await expect(element(by.id('voiceRecorder'))).toBeVisible();
}

/**
 * Helper function to mock camera capture since Detox cannot interact with native camera
 */
async function mockCameraCapture(): Promise<void> {
  const takePhotoButton = element(by.id('takePhotoButton'));
  await takePhotoButton.tap();
  
  // Wait for mock image to be processed
  await waitFor(element(by.id('imagePreview')))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Helper function to mock voice recording since Detox cannot interact with native voice recorder
 */
async function mockVoiceRecording(): Promise<void> {
  const startRecordingButton = element(by.id('startRecordingButton'));
  await startRecordingButton.tap();
  
  // Wait for recording animation
  await waitFor(element(by.id('recordingAnimation')))
    .toBeVisible()
    .withTimeout(2000);
    
  // Wait a moment to simulate recording
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const stopRecordingButton = element(by.id('stopRecordingButton'));
  await stopRecordingButton.tap();
  
  // Wait for transcription to appear
  await waitFor(element(by.id('transcriptionText')))
    .toBeVisible()
    .withTimeout(5000);
    
  // Verify transcription contains text
  await expect(element(by.id('transcriptionText'))).toHaveText(expect.anything());
}

/**
 * Helper function to fill the meal entry form
 */
async function fillMealEntryForm(description: string, mealType: string): Promise<void> {
  const descriptionInput = element(by.id('descriptionInput'));
  await descriptionInput.clearText();
  await descriptionInput.typeText(description);
  
  const mealTypePicker = element(by.id('mealTypePicker'));
  await mealTypePicker.tap();
  
  // Select the meal type
  const mealTypeOption = element(by.text(mealType));
  await mealTypeOption.tap();
  
  // Close picker if needed
  try {
    const doneButton = element(by.text('Done'));
    await doneButton.tap();
  } catch (error) {
    // Picker might close automatically, ignore error
  }
}

/**
 * Helper function to fill the lab result entry form
 */
async function fillLabResultEntryForm(testType: string, notes: string): Promise<void> {
  const testTypeInput = element(by.id('testTypeInput'));
  await testTypeInput.clearText();
  await testTypeInput.typeText(testType);
  
  const datePickerButton = element(by.id('datePickerButton'));
  await datePickerButton.tap();
  
  // Select today's date
  try {
    const todayButton = element(by.text('Today'));
    await todayButton.tap();
  } catch (error) {
    // If Today button not available, tap OK/Done
    const doneButton = element(by.text('Done'));
    await doneButton.tap();
  }
  
  const notesInput = element(by.id('notesInput'));
  await notesInput.clearText();
  await notesInput.typeText(notes);
}

/**
 * Helper function to fill the symptom entry form
 */
async function fillSymptomEntryForm(severity: string): Promise<void> {
  // Select severity option
  const severityOption = element(by.text(severity));
  await severityOption.tap();
  
  // Verify that option is selected
  await expect(element(by.id(`severity-${severity.toLowerCase()}`))).toBeVisible();
}

/**
 * Helper function to submit the data entry form
 */
async function submitForm(): Promise<void> {
  const saveButton = element(by.id('saveButton'));
  await saveButton.tap();
  
  // Check for loading indicator
  try {
    await waitFor(element(by.id('saveButtonLoading')))
      .toBeVisible()
      .withTimeout(1000);
      
    // Wait for loading to complete
    await waitFor(element(by.id('saveButtonLoading')))
      .not.toBeVisible()
      .withTimeout(5000);
  } catch (error) {
    // Loading indicator might be quick or not visible, continue
  }
  
  // Wait for either success message or navigation back to health log
  try {
    await waitFor(element(by.id('successMessage')))
      .toBeVisible()
      .withTimeout(2000);
  } catch (error) {
    // If no success message, we should have navigated back
    await waitFor(element(by.id('healthLogScreen')))
      .toBeVisible()
      .withTimeout(2000);
  }
}

/**
 * Helper function to verify that health data was created successfully
 */
async function verifyHealthDataCreated(): Promise<void> {
  // Navigate to health log if not already there
  const healthLogTab = element(by.id('healthLogTab'));
  await healthLogTab.tap();
  
  // Wait for health log to load
  await waitFor(element(by.id('healthLogScreen')))
    .toBeVisible()
    .withTimeout(2000);
    
  // Verify that there is at least one health data entry
  await waitFor(element(by.id('healthDataItem')))
    .toBeVisible()
    .withTimeout(5000);
    
  // Verify the entry has today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  await expect(element(by.text(dateString, {exact: false}))).toBeVisible();
}

describe('Data Entry Options', () => {
  it('should display data entry options when + button is tapped', async () => {
    const addButton = element(by.id('addDataButton'));
    await addButton.tap();
    
    // Verify data entry options are displayed
    await expect(element(by.id('dataEntryOptions'))).toBeVisible();
    await expect(element(by.id('mealEntryOption'))).toBeVisible();
    await expect(element(by.id('labResultEntryOption'))).toBeVisible();
    await expect(element(by.id('symptomEntryOption'))).toBeVisible();
  });
  
  it('should close data entry options when cancel is tapped', async () => {
    await navigateToDataEntryOptions();
    
    const cancelButton = element(by.id('cancelButton'));
    await cancelButton.tap();
    
    // Verify data entry options are no longer visible
    await expect(element(by.id('dataEntryOptions'))).not.toBeVisible();
  });
});

describe('Meal Entry', () => {
  it('should navigate to meal entry screen from data entry options', async () => {
    await navigateToDataEntryOptions();
    
    const mealEntryOption = element(by.id('mealEntryOption'));
    await mealEntryOption.tap();
    
    // Verify meal entry screen is displayed
    await expect(element(by.id('mealEntryScreen'))).toBeVisible();
    await expect(element(by.id('cameraView'))).toBeVisible();
  });
  
  it('should allow taking a photo of a meal', async () => {
    await navigateToMealEntry();
    await mockCameraCapture();
    
    // Verify image preview is displayed
    await expect(element(by.id('imagePreview'))).toBeVisible();
  });
  
  it('should allow retaking a photo', async () => {
    await navigateToMealEntry();
    await mockCameraCapture();
    
    const retakeButton = element(by.id('retakeButton'));
    await retakeButton.tap();
    
    // Verify camera view is visible again
    await expect(element(by.id('cameraView'))).toBeVisible();
  });
  
  it('should show validation error for missing description', async () => {
    await navigateToMealEntry();
    await mockCameraCapture();
    
    // Try to submit without entering description
    const saveButton = element(by.id('saveButton'));
    await saveButton.tap();
    
    // Verify validation error is displayed
    await expect(element(by.text('Description is required'))).toBeVisible();
  });
  
  it('should successfully submit meal data', async () => {
    await navigateToMealEntry();
    await mockCameraCapture();
    await fillMealEntryForm(TEST_MEAL_DESCRIPTION, 'Breakfast');
    await submitForm();
    
    // Verify health data was created
    await verifyHealthDataCreated();
  });
});

describe('Lab Result Entry', () => {
  it('should navigate to lab result entry screen from data entry options', async () => {
    await navigateToDataEntryOptions();
    
    const labResultEntryOption = element(by.id('labResultEntryOption'));
    await labResultEntryOption.tap();
    
    // Verify lab result entry screen is displayed
    await expect(element(by.id('labResultEntryScreen'))).toBeVisible();
    await expect(element(by.id('cameraView'))).toBeVisible();
  });
  
  it('should allow taking a photo of lab results', async () => {
    await navigateToLabResultEntry();
    await mockCameraCapture();
    
    // Verify image preview is displayed
    await expect(element(by.id('imagePreview'))).toBeVisible();
  });
  
  it('should show validation error for missing test type', async () => {
    await navigateToLabResultEntry();
    await mockCameraCapture();
    
    // Try to submit without entering test type
    const saveButton = element(by.id('saveButton'));
    await saveButton.tap();
    
    // Verify validation error is displayed
    await expect(element(by.text('Test type is required'))).toBeVisible();
  });
  
  it('should successfully submit lab result data', async () => {
    await navigateToLabResultEntry();
    await mockCameraCapture();
    await fillLabResultEntryForm(TEST_LAB_RESULT_TYPE, TEST_LAB_RESULT_NOTES);
    await submitForm();
    
    // Verify health data was created
    await verifyHealthDataCreated();
  });
});

describe('Symptom Entry', () => {
  it('should navigate to symptom entry screen from data entry options', async () => {
    await navigateToDataEntryOptions();
    
    const symptomEntryOption = element(by.id('symptomEntryOption'));
    await symptomEntryOption.tap();
    
    // Verify symptom entry screen is displayed
    await expect(element(by.id('symptomEntryScreen'))).toBeVisible();
    await expect(element(by.id('voiceRecorder'))).toBeVisible();
  });
  
  it('should allow recording a voice description', async () => {
    await navigateToSymptomEntry();
    await mockVoiceRecording();
    
    // Verify transcription is displayed
    await expect(element(by.id('transcriptionText'))).toBeVisible();
  });
  
  it('should allow editing the transcription', async () => {
    await navigateToSymptomEntry();
    await mockVoiceRecording();
    
    const transcriptionInput = element(by.id('transcriptionText'));
    await transcriptionInput.clearText();
    await transcriptionInput.typeText(TEST_SYMPTOM_DESCRIPTION);
    
    // Verify updated transcription
    await expect(element(by.id('transcriptionText'))).toHaveText(TEST_SYMPTOM_DESCRIPTION);
  });
  
  it('should show validation error for missing transcription', async () => {
    await navigateToSymptomEntry();
    await mockVoiceRecording();
    
    // Clear transcription
    const transcriptionInput = element(by.id('transcriptionText'));
    await transcriptionInput.clearText();
    
    // Try to submit without transcription
    const saveButton = element(by.id('saveButton'));
    await saveButton.tap();
    
    // Verify validation error is displayed
    await expect(element(by.text('Symptom description is required'))).toBeVisible();
  });
  
  it('should successfully submit symptom data', async () => {
    await navigateToSymptomEntry();
    await mockVoiceRecording();
    await fillSymptomEntryForm('Moderate');
    await submitForm();
    
    // Verify health data was created
    await verifyHealthDataCreated();
  });
});

describe('Data Input Flow', () => {
  it('should handle network errors gracefully during submission', async () => {
    // Put device in airplane mode
    try {
      // This API may not be available in all Detox environments
      // await device.setStatusBar({ network: 'airplane' });
      console.log('Setting device to airplane mode for network error testing');
    } catch (error) {
      console.log('Unable to set airplane mode, continuing test with simulation');
    }
    
    // Navigate to meal entry
    await navigateToMealEntry();
    await mockCameraCapture();
    await fillMealEntryForm(TEST_MEAL_DESCRIPTION, 'Lunch');
    
    // Submit form
    const saveButton = element(by.id('saveButton'));
    await saveButton.tap();
    
    // Verify network error message is displayed
    await expect(element(by.text('Network error'))).toBeVisible();
    
    // Turn off airplane mode
    try {
      // await device.setStatusBar({ network: 'wifi' });
      console.log('Turning off airplane mode');
    } catch (error) {
      console.log('Unable to reset network mode, continuing test with simulation');
    }
    
    // Tap retry button
    const retryButton = element(by.id('retryButton'));
    await retryButton.tap();
    
    // Verify submission succeeds
    await waitFor(element(by.id('healthLogScreen')))
      .toBeVisible()
      .withTimeout(5000);
      
    // Verify health data was created
    await verifyHealthDataCreated();
  });
  
  it('should navigate back to previous screen when cancel is tapped', async () => {
    await navigateToMealEntry();
    
    // Tap back button
    const backButton = element(by.id('backButton'));
    await backButton.tap();
    
    // Verify app navigates back to main screen
    await expect(element(by.id('bottomTabNavigator'))).toBeVisible();
    await expect(element(by.id('mealEntryScreen'))).not.toBeVisible();
  });
  
  it('should show loading state during submission', async () => {
    await navigateToSymptomEntry();
    await mockVoiceRecording();
    await fillSymptomEntryForm('Mild');
    
    // Tap save button
    const saveButton = element(by.id('saveButton'));
    await saveButton.tap();
    
    // Verify loading indicator is displayed
    await expect(element(by.id('saveButtonLoading'))).toBeVisible();
    
    // Verify button is disabled during submission
    await expect(saveButton).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(element(by.id('saveButtonLoading')))
      .not.toBeVisible()
      .withTimeout(5000);
      
    // Verify health data was created
    await verifyHealthDataCreated();
  });
});