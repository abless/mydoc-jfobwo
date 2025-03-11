import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'; // v12.0.0
import ChatBubble from '../../../src/components/chat/ChatBubble';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';
import { ChatRole, ChatMessageStatus } from '../../../src/types/chat.types';

// Mock the date utility to ensure consistent testing with a fixed timestamp
jest.mock('../../../src/utils/date.utils', () => ({
  formatDisplayTime: jest.fn(() => '10:30 AM')
}));

describe('ChatBubble component', () => {
  // Test messages with different roles and content
  const userMessage = {
    id: '1',
    conversationId: 'conv1',
    role: ChatRole.USER,
    content: 'Hello, this is a test message',
    timestamp: new Date('2023-05-15T10:30:00Z'),
    status: ChatMessageStatus.SENT
  };

  const assistantMessage = {
    id: '2',
    conversationId: 'conv1',
    role: ChatRole.ASSISTANT,
    content: 'Hi there! I am the health advisor.',
    timestamp: new Date('2023-05-15T10:31:00Z'),
    status: ChatMessageStatus.SENT
  };

  // Helper function to render component with ThemeProvider
  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  test('renders correctly with user message', () => {
    renderWithTheme(<ChatBubble message={userMessage} />);
    
    // Verify message content is displayed
    expect(screen.getByText(userMessage.content)).toBeTruthy();
    
    // Verify timestamp is displayed
    expect(screen.getByText('10:30 AM')).toBeTruthy();
    
    // Verify accessibility role and label
    const bubbleElement = screen.getByAccessibilityRole('text');
    expect(bubbleElement).toBeTruthy();
    expect(bubbleElement.props.accessibilityLabel).toBe(`You: ${userMessage.content}`);
  });

  test('renders correctly with assistant message', () => {
    renderWithTheme(<ChatBubble message={assistantMessage} />);
    
    // Verify message content is displayed
    expect(screen.getByText(assistantMessage.content)).toBeTruthy();
    
    // Verify timestamp is displayed
    expect(screen.getByText('10:30 AM')).toBeTruthy();
    
    // Verify accessibility role and label
    const bubbleElement = screen.getByAccessibilityRole('text');
    expect(bubbleElement).toBeTruthy();
    expect(bubbleElement.props.accessibilityLabel).toBe(`Health Advisor: ${assistantMessage.content}`);
  });

  test('applies different styles based on sender', () => {
    // First render with user message
    const { rerender } = renderWithTheme(<ChatBubble message={userMessage} />);
    
    // Get the bubble element for user message
    const userBubble = screen.getByAccessibilityRole('text');
    
    // Verify user bubble has expected alignment in the container
    expect(userBubble.props.style[0].alignItems).toBe('flex-end');
    
    // Rerender with assistant message
    rerender(
      <ThemeProvider>
        <ChatBubble message={assistantMessage} />
      </ThemeProvider>
    );
    
    // Get the bubble element for assistant message
    const assistantBubble = screen.getByAccessibilityRole('text');
    
    // Verify assistant bubble has expected alignment in the container
    expect(assistantBubble.props.style[0].alignItems).toBe('flex-start');
  });

  test('displays message content correctly', () => {
    const specificContent = 'This is a specific test content to verify';
    const testMessage = {
      ...userMessage,
      content: specificContent
    };
    
    renderWithTheme(<ChatBubble message={testMessage} />);
    
    // Verify the exact message content is displayed
    expect(screen.getByText(specificContent)).toBeTruthy();
  });

  test('formats and displays timestamp correctly', () => {
    renderWithTheme(<ChatBubble message={userMessage} />);
    
    // Verify the formatted timestamp is displayed using our mocked value
    expect(screen.getByText('10:30 AM')).toBeTruthy();
  });

  test('shows loading indicator when message is sending', () => {
    const sendingMessage = {
      ...userMessage,
      status: ChatMessageStatus.SENDING
    };
    
    renderWithTheme(<ChatBubble message={sendingMessage} />);
    
    // Verify loading indicator is displayed
    expect(screen.getByAccessibilityLabel('Sending message')).toBeTruthy();
    
    // Verify message content is still displayed
    expect(screen.getByText(sendingMessage.content)).toBeTruthy();
  });

  test('shows error indicator when message has error', () => {
    const errorMessage = {
      ...userMessage,
      status: ChatMessageStatus.ERROR
    };
    
    renderWithTheme(<ChatBubble message={errorMessage} />);
    
    // Verify error message is displayed
    expect(screen.getByText('Error sending')).toBeTruthy();
    
    // Verify message content is still displayed
    expect(screen.getByText(errorMessage.content)).toBeTruthy();
  });

  test('applies custom style from props', () => {
    const customStyle = { marginVertical: 20 };
    
    const { container } = renderWithTheme(<ChatBubble message={userMessage} style={customStyle} />);
    
    // Get the top-level View component
    const bubbleContainer = screen.getByAccessibilityRole('text');
    
    // Verify custom style is applied (it should be merged with default styles)
    expect(bubbleContainer.props.style).toContainEqual(customStyle);
    
    // Verify component content renders correctly
    expect(screen.getByText(userMessage.content)).toBeTruthy();
  });
});