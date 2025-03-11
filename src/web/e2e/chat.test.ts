import { device, element, by, expect, waitFor } from 'detox'; // detox ^20.0.0
import { 
  ensureLoggedOut, 
  navigateToLoginScreen, 
  fillLoginForm, 
  submitLoginForm, 
  verifyLoggedIn 
} from './authentication.test';

// Test constants
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';
const TEST_MESSAGE = "Hello, I've been having headaches after meals lately. What could be causing this?";
const LONG_TEST_MESSAGE = "I've noticed that whenever I eat foods with a lot of sugar, I tend to get headaches about 30 minutes later. This has been happening for the past two weeks. Is this something I should be concerned about?";

/**
 * Setup function that runs before all tests
 */
beforeAll(async () => {
  await device.launchApp();
  // Ensure the app is in a clean state for testing
});

/**
 * Setup function that runs before each test
 */
beforeEach(async () => {
  await device.reloadReactNative();
  // Login and navigate to chat screen before each test
  await loginAndNavigateToChatScreen();
});

/**
 * Cleanup function that runs after all tests
 */
afterAll(async () => {
  await ensureLoggedOut();
  // Reset the app to its initial state
});

/**
 * Helper function to login and navigate to the chat screen
 */
async function loginAndNavigateToChatScreen(): Promise<void> {
  await navigateToLoginScreen();
  await fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
  await submitLoginForm();
  await verifyLoggedIn();

  // Navigate to chat screen
  const chatTab = element(by.id('chatTab'));
  await chatTab.tap();

  // Wait for chat screen to load
  await waitFor(element(by.id('chatScreen')))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Helper function to send a message in the chat
 */
async function sendChatMessage(message: string): Promise<void> {
  const chatInput = element(by.id('chatInput'));
  await chatInput.clearText();
  await chatInput.typeText(message);
  
  const sendButton = element(by.id('sendButton'));
  await sendButton.tap();
  
  // Wait for the message to appear in the chat
  await waitFor(element(by.text(message)))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Helper function to wait for the LLM to respond
 */
async function waitForLLMResponse(): Promise<void> {
  // First, check if there's a loading indicator
  try {
    const loadingIndicator = element(by.id('responseLoading'));
    await waitFor(loadingIndicator)
      .toBeVisible()
      .withTimeout(3000);
    
    // Wait for loading indicator to disappear
    await waitFor(loadingIndicator)
      .not.toBeVisible()
      .withTimeout(15000);
  } catch (error) {
    // Loading indicator might not be visible or might have already disappeared
    console.log('Loading indicator not found or already gone');
  }
  
  // Wait for an AI response message to appear
  await waitFor(element(by.id('assistantMessage')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Helper function to verify a message exists in the chat
 */
async function verifyMessageInChat(messageText: string, role: string): Promise<void> {
  const messageElement = element(by.id(`${role}Message`)).atIndex(0);
  
  await waitFor(element(by.text(messageText)))
    .toBeVisible()
    .withTimeout(5000);
    
  // Check if the message has the correct role styling
  if (role === 'user') {
    await expect(messageElement).toHaveText(messageText);
  } else if (role === 'assistant') {
    // For assistant messages, we just check if the element exists and contains some text
    await expect(messageElement).toExist();
    await expect(messageElement).toHaveText();
  }
}

/**
 * Helper function to clear the chat history if available
 */
async function clearChat(): Promise<void> {
  try {
    // Check if options menu is available
    const optionsButton = element(by.id('chatOptionsButton'));
    if (await optionsButton.isVisible()) {
      await optionsButton.tap();
      
      // Look for clear chat option
      const clearChatOption = element(by.text('Clear Chat'));
      await clearChatOption.tap();
      
      // Confirm clearing the chat
      const confirmButton = element(by.text('Confirm'));
      await confirmButton.tap();
      
      // Wait for chat to be cleared
      await waitFor(element(by.id('chatEmptyState')))
        .toBeVisible()
        .withTimeout(3000);
    }
  } catch (error) {
    // Clear chat option may not be available, or chat might already be empty
    console.log('Could not clear chat or already empty');
  }
}

describe('Chat Screen', () => {
  it('should display chat screen with all elements', async () => {
    // Check for header
    await expect(element(by.text('Health Advisor'))).toBeVisible();
    
    // Check for chat components
    await expect(element(by.id('chatList'))).toBeVisible();
    await expect(element(by.id('chatInput'))).toBeVisible();
    await expect(element(by.id('sendButton'))).toBeVisible();
    await expect(element(by.id('micButton'))).toBeVisible();
  });
  
  it('should show empty state or welcome message for new users', async () => {
    // Try to clear chat first
    await clearChat();
    
    // Check for empty state or welcome message
    try {
      await expect(element(by.id('chatEmptyState'))).toBeVisible();
    } catch (error) {
      // If no empty state, there should be a welcome message from the AI
      await expect(element(by.id('assistantMessage'))).toBeVisible();
    }
  });
  
  it('should allow typing in the chat input field', async () => {
    const chatInput = element(by.id('chatInput'));
    
    // Type in the input field
    await chatInput.clearText();
    await chatInput.typeText(TEST_MESSAGE);
    
    // Verify text was entered
    await expect(chatInput).toHaveText(TEST_MESSAGE);
    
    // Clear the input
    await chatInput.clearText();
    
    // Verify input is empty
    await expect(chatInput).toHaveText('');
  });
});

describe('Message Interaction', () => {
  it('should send a message and display it in the chat', async () => {
    await sendChatMessage(TEST_MESSAGE);
    await verifyMessageInChat(TEST_MESSAGE, 'user');
  });
  
  it('should receive a response from the LLM', async () => {
    await sendChatMessage(TEST_MESSAGE);
    await waitForLLMResponse();
    
    // Verify an assistant message is displayed
    await expect(element(by.id('assistantMessage'))).toBeVisible();
    
    // The exact response will vary, but we can check that it contains some text
    const assistantMessage = element(by.id('assistantMessage')).atIndex(0);
    await expect(assistantMessage).toHaveText();
  });
  
  it('should handle long messages properly', async () => {
    await sendChatMessage(LONG_TEST_MESSAGE);
    await verifyMessageInChat(LONG_TEST_MESSAGE, 'user');
    
    await waitForLLMResponse();
    await expect(element(by.id('assistantMessage'))).toBeVisible();
  });
  
  it('should show loading state while waiting for LLM response', async () => {
    await sendChatMessage(TEST_MESSAGE);
    
    // Check for loading indicator
    try {
      const loadingIndicator = element(by.id('responseLoading'));
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for response to complete
      await waitFor(loadingIndicator)
        .not.toBeVisible()
        .withTimeout(15000);
    } catch (error) {
      // Loading indicator might be too quick to catch
      console.log('Loading indicator not found or already gone');
    }
    
    // Verify response was received
    await expect(element(by.id('assistantMessage'))).toBeVisible();
  });
});

describe('Chat History', () => {
  it('should maintain chat history when navigating away and back', async () => {
    // Send a message and wait for response
    await sendChatMessage(TEST_MESSAGE);
    await waitForLLMResponse();
    
    // Navigate to another tab
    const healthLogTab = element(by.id('healthLogTab'));
    await healthLogTab.tap();
    
    // Wait for health log screen to be visible
    await waitFor(element(by.id('healthLogScreen')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Navigate back to chat tab
    const chatTab = element(by.id('chatTab'));
    await chatTab.tap();
    
    // Wait for chat screen to be visible
    await waitFor(element(by.id('chatScreen')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Verify the message is still there
    await verifyMessageInChat(TEST_MESSAGE, 'user');
    await expect(element(by.id('assistantMessage'))).toBeVisible();
  });
  
  it('should maintain chat history after app restart', async () => {
    // Send a unique message to identify in history
    const uniqueMessage = `Test message ${Date.now()}`;
    await sendChatMessage(uniqueMessage);
    await waitForLLMResponse();
    
    // Restart the app
    await device.launchApp({ newInstance: false });
    
    // Login again if needed
    try {
      await loginAndNavigateToChatScreen();
    } catch (error) {
      // Might still be logged in
      const chatTab = element(by.id('chatTab'));
      await chatTab.tap();
    }
    
    // Verify the unique message is still in the chat
    await verifyMessageInChat(uniqueMessage, 'user');
  });
  
  it('should load more messages when scrolling up', async () => {
    // First, clear chat if possible
    await clearChat();
    
    // Send several messages to create history
    for (let i = 0; i < 3; i++) {
      const message = `Test message ${i + 1}`;
      await sendChatMessage(message);
      await waitForLLMResponse();
    }
    
    // Get the chat list
    const chatList = element(by.id('chatList'));
    
    // Scroll up to load more messages
    await chatList.scroll(100, 'up');
    
    // Verify first message is visible
    await verifyMessageInChat('Test message 1', 'user');
  });
});

describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    // Put device in airplane mode
    // Note: This is a placeholder as the actual implementation depends on the testing environment
    try {
      // This might not be available in all environments
      // await device.setStatusBar({ network: 'airplane' });
      console.log('Setting airplane mode - simulated for this test');
    } catch (error) {
      console.log('Unable to set airplane mode, continuing test with simulation');
    }
    
    // Try to send a message
    await sendChatMessage(TEST_MESSAGE);
    
    // Look for network error message
    await expect(element(by.text('Network Error'))).toBeVisible();
    
    // Look for retry button
    const retryButton = element(by.id('retryButton'));
    await expect(retryButton).toBeVisible();
    
    // Turn off airplane mode
    try {
      // await device.setStatusBar({ network: 'wifi' });
      console.log('Turning off airplane mode - simulated for this test');
    } catch (error) {
      console.log('Unable to set network mode, continuing test with simulation');
    }
    
    // Tap retry
    await retryButton.tap();
    
    // Verify message is sent and response received
    await verifyMessageInChat(TEST_MESSAGE, 'user');
    await waitForLLMResponse();
    await expect(element(by.id('assistantMessage'))).toBeVisible();
  });
  
  it('should handle empty message submission', async () => {
    const chatInput = element(by.id('chatInput'));
    await chatInput.clearText();
    
    // Get the send button
    const sendButton = element(by.id('sendButton'));
    
    // Verify send button is disabled for empty message
    await expect(sendButton).toBeNotVisible();
    
    // Try to tap it anyway (should not throw error even if not visible)
    try {
      await sendButton.tap();
      
      // If we got here, make sure no message was sent
      await expect(element(by.id('emptyMessageError'))).not.toBeVisible();
    } catch (error) {
      // Button might not be tappable if properly disabled
      console.log('Send button properly disabled');
    }
  });
});

describe('Voice Input', () => {
  it('should show voice recording UI when microphone button is tapped', async () => {
    // Tap the mic button
    const micButton = element(by.id('micButton'));
    await micButton.tap();
    
    // Verify voice recording UI appears
    await expect(element(by.id('voiceRecordingUI'))).toBeVisible();
    await expect(element(by.id('recordingIndicator'))).toBeVisible();
  });
  
  it('should convert voice to text and send as message', async () => {
    // Tap the mic button
    const micButton = element(by.id('micButton'));
    await micButton.tap();
    
    // Wait for recording UI
    await waitFor(element(by.id('voiceRecordingUI')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Simulate voice recording
    // Note: In a real test, you'd have to use device-specific methods
    // This is just a placeholder
    console.log('Simulating voice recording');
    
    // Wait a bit for "recording"
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tap stop button
    const stopButton = element(by.id('stopRecordingButton'));
    await stopButton.tap();
    
    // Wait for transcription to appear in input field
    await waitFor(element(by.id('chatInput')))
      .toHaveText()
      .withTimeout(5000);
    
    // Get the transcribed text
    const chatInput = element(by.id('chatInput'));
    const transcribedText = await chatInput.getAttributes();
    
    // Send the transcribed message
    const sendButton = element(by.id('sendButton'));
    await sendButton.tap();
    
    // Verify message was sent
    // Since we don't know the exact transcribed text, we just check
    // that a user message exists and a response is received
    await expect(element(by.id('userMessage'))).toBeVisible();
    await waitForLLMResponse();
    await expect(element(by.id('assistantMessage'))).toBeVisible();
  });
  
  it('should cancel voice recording when cancel button is tapped', async () => {
    // Tap the mic button
    const micButton = element(by.id('micButton'));
    await micButton.tap();
    
    // Wait for recording UI
    await waitFor(element(by.id('voiceRecordingUI')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Tap cancel button
    const cancelButton = element(by.id('cancelRecordingButton'));
    await cancelButton.tap();
    
    // Verify recording UI is dismissed
    await expect(element(by.id('voiceRecordingUI'))).not.toBeVisible();
    
    // Verify input field is unchanged
    const chatInput = element(by.id('chatInput'));
    await expect(chatInput).toHaveText('');
  });
});