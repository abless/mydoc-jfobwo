import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import ChatList from '../../components/chat/ChatList';
import ChatInput from '../../components/chat/ChatInput';
import Header from '../../components/common/Header';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';
import useChat from '../../hooks/useChat';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { useTheme } from '../../contexts/ThemeContext';
import { MainTabScreenProps } from '../../types/navigation.types';

/**
 * The main chat screen component that displays chat messages and input field for 
 * interacting with the LLM health advisor.
 * 
 * @param props Navigation props
 * @returns Rendered ChatScreen component
 */
const ChatScreen = ({ navigation }: MainTabScreenProps<'Chat'>): JSX.Element => {
  // Get chat functionality from hook
  const { 
    activeConversation, 
    loading, 
    error, 
    sendMessage, 
    loadConversation, 
    createNewConversation 
  } = useChat();
  
  // Get theme colors and styles
  const { theme } = useTheme();
  
  // State for message input field
  const [messageInput, setMessageInput] = useState<string>('');
  
  // Voice recorder functionality for voice input
  const { 
    isRecording,
    isTranscribing,
    startRecording, 
    stopRecording, 
    reset: resetVoiceRecorder 
  } = useVoiceRecorder({
    autoTranscribe: true,
    onTranscriptionComplete: (text) => {
      if (text.trim()) {
        setMessageInput(text);
      }
    },
    onError: (error) => {
      console.error('Voice recording error:', error);
    }
  });
  
  // Reference for keyboard avoiding view
  const keyboardAvoidingRef = useRef<KeyboardAvoidingView>(null);
  
  // Initialize conversation on component mount
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        if (!activeConversation) {
          await createNewConversation();
        }
      } catch (err) {
        console.error('Error initializing conversation:', err);
      }
    };
    
    initializeConversation();
  }, [activeConversation, createNewConversation]);
  
  /**
   * Handles sending a message to the LLM
   */
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || loading) return;
    
    try {
      const trimmedMessage = messageInput.trim();
      setMessageInput('');
      await sendMessage(trimmedMessage);
      
      // Only reset voice recorder if we're not actively recording or transcribing
      if (!isRecording && !isTranscribing) {
        resetVoiceRecorder();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }, [messageInput, loading, sendMessage, resetVoiceRecorder, isRecording, isTranscribing]);
  
  /**
   * Handles voice input button press
   */
  const handleVoiceInput = useCallback(async () => {
    try {
      if (isRecording) {
        await stopRecording();
      } else {
        setMessageInput(''); // Clear existing input when starting recording
        await startRecording();
      }
    } catch (err) {
      console.error('Error with voice recording:', err);
    }
  }, [isRecording, startRecording, stopRecording, setMessageInput]);
  
  /**
   * Handles loading more messages when scrolling up
   */
  const handleLoadMoreMessages = useCallback(() => {
    // Implemented for future pagination support
    // Currently, all messages are loaded at once
  }, []);
  
  /**
   * Handles pull-to-refresh to reload conversation
   */
  const handleRefresh = useCallback(async () => {
    if (activeConversation) {
      await loadConversation(activeConversation.id);
    }
  }, [activeConversation, loadConversation]);
  
  /**
   * Handles retry when an error occurs
   */
  const handleRetry = useCallback(async () => {
    try {
      if (activeConversation) {
        await loadConversation(activeConversation.id);
      } else {
        await createNewConversation();
      }
    } catch (err) {
      console.error('Error retrying operation:', err);
    }
  }, [activeConversation, loadConversation, createNewConversation]);
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.BACKGROUND }
      ]}
      accessible={true}
      accessibilityLabel="Chat with Health Advisor"
      accessibilityRole="none"
    >
      <Header title="Health Advisor" />
      
      <KeyboardAvoidingView
        ref={keyboardAvoidingRef}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {error ? (
          <ErrorMessage 
            message={error}
            onRetry={handleRetry}
            style={styles.errorContainer}
          />
        ) : null}
        
        {activeConversation ? (
          <ChatList
            messages={activeConversation.messages}
            loading={loading}
            onEndReached={handleLoadMoreMessages}
            refreshing={loading}
            onRefresh={handleRefresh}
            style={styles.chatList}
          />
        ) : (
          <LoadingIndicator 
            size="large" 
            color={theme.colors.PRIMARY}
            style={styles.loadingIndicator}
          />
        )}
        
        <ChatInput
          value={messageInput}
          onChangeText={setMessageInput}
          onSend={handleSendMessage}
          onVoiceInput={handleVoiceInput}
          disabled={loading || !activeConversation}
          loading={loading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  chatList: {
    flex: 1,
  },
  errorContainer: {
    margin: 16,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;