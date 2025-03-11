import React from 'react'; // 18.2.0
import { render, screen, fireEvent } from '@testing-library/react-native'; // ^12.0.0
import ChatInput from '../../../src/components/chat/ChatInput';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';

describe('ChatInput component', () => {
  test('renders correctly with default props', () => {
    // Create mock functions
    const onChangeText = jest.fn();
    const onSend = jest.fn();
    const onVoiceInput = jest.fn();

    // Render the component with ThemeProvider
    render(
      <ThemeProvider>
        <ChatInput
          value=""
          onChangeText={onChangeText}
          onSend={onSend}
          onVoiceInput={onVoiceInput}
        />
      </ThemeProvider>
    );

    // Check that the TextInput is rendered
    const textInput = screen.getByPlaceholderText('Type a message...');
    expect(textInput).toBeTruthy();
    
    // Check that the send button is rendered and disabled (since input is empty)
    const sendButton = screen.getByAccessibilityLabel('Send message');
    expect(sendButton).toBeTruthy();
    expect(sendButton).toBeDisabled();
    
    // Check that the microphone button is rendered and enabled
    const micButton = screen.getByAccessibilityLabel('Voice input');
    expect(micButton).toBeTruthy();
    expect(micButton).not.toBeDisabled();
  });

  test('handles text input correctly', () => {
    // Create mock function for onChangeText
    const onChangeText = jest.fn();
    
    // Render component with initial value
    render(
      <ThemeProvider>
        <ChatInput
          value="Hello"
          onChangeText={onChangeText}
          onSend={jest.fn()}
        />
      </ThemeProvider>
    );
    
    // Find the input field
    const textInput = screen.getByPlaceholderText('Type a message...');
    
    // Simulate text change
    fireEvent.changeText(textInput, 'Hello World');
    
    // Verify onChangeText was called with the new text
    expect(onChangeText).toHaveBeenCalledWith('Hello World');
  });

  test('calls onSend when send button is pressed', () => {
    // Create mock function for onSend
    const onSend = jest.fn();
    
    // Render component with non-empty value to enable send button
    render(
      <ThemeProvider>
        <ChatInput
          value="Hello"
          onChangeText={jest.fn()}
          onSend={onSend}
        />
      </ThemeProvider>
    );
    
    // Find the send button and verify it's enabled
    const sendButton = screen.getByAccessibilityLabel('Send message');
    expect(sendButton).not.toBeDisabled();
    
    // Simulate button press
    fireEvent.press(sendButton);
    
    // Verify onSend was called exactly once
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  test('calls onVoiceInput when microphone button is pressed', () => {
    // Create mock function for onVoiceInput
    const onVoiceInput = jest.fn();
    
    // Render component
    render(
      <ThemeProvider>
        <ChatInput
          value=""
          onChangeText={jest.fn()}
          onSend={jest.fn()}
          onVoiceInput={onVoiceInput}
        />
      </ThemeProvider>
    );
    
    // Find the mic button
    const micButton = screen.getByAccessibilityLabel('Voice input');
    
    // Simulate button press
    fireEvent.press(micButton);
    
    // Verify onVoiceInput was called exactly once
    expect(onVoiceInput).toHaveBeenCalledTimes(1);
  });

  test('disables send button when input is empty', () => {
    // Create mock function for onSend
    const onSend = jest.fn();
    
    // Render with empty value
    const { rerender } = render(
      <ThemeProvider>
        <ChatInput
          value=""
          onChangeText={jest.fn()}
          onSend={onSend}
        />
      </ThemeProvider>
    );
    
    // Find the send button and verify it's disabled
    const sendButton = screen.getByAccessibilityLabel('Send message');
    expect(sendButton).toBeDisabled();
    
    // Simulate button press
    fireEvent.press(sendButton);
    
    // Verify onSend is not called
    expect(onSend).not.toHaveBeenCalled();
    
    // Rerender with non-empty value
    rerender(
      <ThemeProvider>
        <ChatInput
          value="Hello"
          onChangeText={jest.fn()}
          onSend={onSend}
        />
      </ThemeProvider>
    );
    
    // Verify send button is now enabled
    expect(sendButton).not.toBeDisabled();
    
    // Simulate press on the send button
    fireEvent.press(sendButton);
    
    // Verify onSend is now called
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  test('disables all interactions when disabled prop is true', () => {
    // Create mock functions
    const onChangeText = jest.fn();
    const onSend = jest.fn();
    const onVoiceInput = jest.fn();
    
    // Render with disabled prop set to true
    render(
      <ThemeProvider>
        <ChatInput
          value="Hello"
          onChangeText={onChangeText}
          onSend={onSend}
          onVoiceInput={onVoiceInput}
          disabled={true}
        />
      </ThemeProvider>
    );
    
    // Find input and buttons
    const textInput = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByAccessibilityLabel('Send message');
    const micButton = screen.getByAccessibilityLabel('Voice input');
    
    // Verify TextInput is disabled (by checking the onChangeText isn't called)
    fireEvent.changeText(textInput, 'New Text');
    expect(onChangeText).not.toHaveBeenCalled();
    
    // Verify buttons are disabled
    expect(sendButton).toBeDisabled();
    expect(micButton).toBeDisabled();
    
    // Simulate button presses
    fireEvent.press(sendButton);
    expect(onSend).not.toHaveBeenCalled();
    
    fireEvent.press(micButton);
    expect(onVoiceInput).not.toHaveBeenCalled();
  });

  test('shows loading indicator when loading prop is true', () => {
    // Render with loading prop set to true
    render(
      <ThemeProvider>
        <ChatInput
          value="Hello"
          onChangeText={jest.fn()}
          onSend={jest.fn()}
          onVoiceInput={jest.fn()}
          loading={true}
        />
      </ThemeProvider>
    );
    
    // Check that the ActivityIndicator is rendered
    const loadingIndicator = screen.getByAccessibilityLabel('Sending message');
    expect(loadingIndicator).toBeTruthy();
    
    // Verify that the send button is not visible during loading
    const sendButtons = screen.queryAllByAccessibilityLabel('Send message');
    expect(sendButtons.length).toBe(0);
    
    // Verify that the TextInput is still visible but disabled
    const textInput = screen.getByPlaceholderText('Type a message...');
    expect(textInput).toBeTruthy();
    
    // Verify that the microphone button is disabled
    const micButton = screen.getByAccessibilityLabel('Voice input');
    expect(micButton).toBeDisabled();
  });

  test('has correct accessibility properties', () => {
    // Render with default props
    render(
      <ThemeProvider>
        <ChatInput
          value=""
          onChangeText={jest.fn()}
          onSend={jest.fn()}
          onVoiceInput={jest.fn()}
        />
      </ThemeProvider>
    );
    
    // Verify TextInput has appropriate accessibility props
    const textInput = screen.getByPlaceholderText('Type a message...');
    expect(textInput).toBeTruthy();
    
    // Verify send button has correct accessibility label
    const sendButton = screen.getByAccessibilityLabel('Send message');
    expect(sendButton).toBeTruthy();
    expect(sendButton).toHaveAccessibilityState({ disabled: true });
    
    // Verify microphone button has correct accessibility label
    const micButton = screen.getByAccessibilityLabel('Voice input');
    expect(micButton).toBeTruthy();
    expect(micButton).toHaveAccessibilityState({ disabled: false });
    
    // Verify container has correct accessibility label
    const container = screen.getByAccessibilityLabel('Message input area');
    expect(container).toBeTruthy();
  });
});