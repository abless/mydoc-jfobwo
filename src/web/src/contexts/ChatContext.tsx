/**
 * ChatContext.tsx
 * 
 * React Context provider for chat functionality in the Health Advisor mobile application.
 * Manages chat state, conversations, and interactions with the LLM health advisor
 * through the backend API.
 * 
 * Implements F-004: LLM Health Chat requirement - provides the chat interface 
 * allowing users to interact with an LLM for personalized health advice.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'; // ^18.2.0
import { v4 as uuidv4 } from 'uuid'; // ^8.3.2

import {
  ChatContextType,
  ChatContextData,
  ChatContextActions,
  ChatMessage,
  Conversation,
  SendMessageResponse,
  ConversationsParams,
  ChatRole,
  ChatMessageStatus
} from '../types/chat.types';
import {
  sendMessage as apiSendMessage,
  getConversations as apiGetConversations,
  getConversation as apiGetConversation,
  getMessages as apiGetMessages,
  createConversation as apiCreateConversation
} from '../services/chat.service';
import { useAuth } from '../hooks/useAuth';
import { parseApiError } from '../utils/error.utils';

/**
 * Initial state for chat context
 */
const initialChatState: ChatContextData = {
  conversations: [],
  activeConversation: null,
  loading: false,
  error: null
};

/**
 * Create the context with default values
 */
export const ChatContext = createContext<ChatContextType>({
  data: initialChatState,
  actions: {
    sendMessage: async () => ({ response: '', conversationId: '' }),
    loadConversations: async () => {},
    loadConversation: async () => {},
    createNewConversation: async () => ''
  }
});

/**
 * Chat Provider Component
 * Provides chat functionality to child components
 */
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Chat state
  const [chatState, setChatState] = useState<ChatContextData>(initialChatState);
  
  // Get authentication status
  const { isAuthenticated } = useAuth();

  /**
   * Initialize chat state when authentication changes
   */
  const initializeChat = useCallback(async () => {
    if (isAuthenticated) {
      try {
        // Load conversations if authenticated
        await loadConversations({ page: 1, limit: 10 });
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    } else {
      // Reset chat state if not authenticated
      setChatState(initialChatState);
    }
  }, [isAuthenticated]);

  // Initialize chat when authentication status changes
  useEffect(() => {
    initializeChat();
  }, [isAuthenticated, initializeChat]);

  /**
   * Load user's chat conversations with pagination
   * 
   * @param params Pagination parameters
   */
  const loadConversations = useCallback(async (params: ConversationsParams = { page: 1, limit: 10 }): Promise<void> => {
    if (!isAuthenticated) return;

    setChatState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiGetConversations(params);
      
      setChatState(prev => ({
        ...prev,
        conversations: response.items,
        loading: false
      }));
    } catch (error) {
      const parsedError = parseApiError(error);
      
      setChatState(prev => ({
        ...prev,
        loading: false,
        error: parsedError.message
      }));
    }
  }, [isAuthenticated]);

  /**
   * Load a specific conversation by ID, including its messages
   * 
   * @param conversationId ID of the conversation to load
   */
  const loadConversation = useCallback(async (conversationId: string): Promise<void> => {
    if (!isAuthenticated) return;

    setChatState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Get conversation details
      const conversation = await apiGetConversation(conversationId);
      
      // Get conversation messages
      const messagesResponse = await apiGetMessages({
        conversationId,
        page: 1,
        limit: 100 // Retrieve a reasonably large number of messages
      });
      
      // Update conversation with messages
      const conversationWithMessages: Conversation = {
        ...conversation,
        messages: messagesResponse.items
      };
      
      setChatState(prev => ({
        ...prev,
        activeConversation: conversationWithMessages,
        loading: false
      }));
    } catch (error) {
      const parsedError = parseApiError(error);
      
      setChatState(prev => ({
        ...prev,
        loading: false,
        error: parsedError.message
      }));
    }
  }, [isAuthenticated]);

  /**
   * Create a new conversation
   * 
   * @returns Promise resolving to the new conversation ID
   */
  const createNewConversation = useCallback(async (): Promise<string> => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to create a conversation');
    }

    setChatState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const newConversation = await apiCreateConversation();
      
      setChatState(prev => ({
        ...prev,
        conversations: [newConversation, ...prev.conversations],
        activeConversation: { ...newConversation, messages: [] },
        loading: false
      }));
      
      return newConversation.id;
    } catch (error) {
      const parsedError = parseApiError(error);
      
      setChatState(prev => ({
        ...prev,
        loading: false,
        error: parsedError.message
      }));
      
      throw parsedError;
    }
  }, [isAuthenticated]);

  /**
   * Send a message to the LLM health advisor and handle the response
   * 
   * @param message Text message to send
   * @param conversationId Optional ID of an existing conversation
   * @returns Promise resolving to the LLM response
   */
  const sendMessage = useCallback(async (
    message: string,
    conversationId?: string
  ): Promise<SendMessageResponse> => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to send messages');
    }

    setChatState(prev => ({ ...prev, loading: true, error: null }));
    
    let targetConversationId = conversationId;
    
    // If no conversation ID is provided and no active conversation exists, create one
    if (!targetConversationId && !chatState.activeConversation) {
      try {
        targetConversationId = await createNewConversation();
      } catch (error) {
        setChatState(prev => ({ ...prev, loading: false }));
        throw error;
      }
    } else if (!targetConversationId && chatState.activeConversation) {
      targetConversationId = chatState.activeConversation.id;
    }
    
    // Create a temporary message with a pending status
    const tempUserMessage: ChatMessage = {
      id: uuidv4(), // Temporary ID until server response
      conversationId: targetConversationId!,
      role: ChatRole.USER,
      content: message,
      timestamp: new Date(),
      status: ChatMessageStatus.SENDING
    };
    
    // Optimistically add user message to the conversation
    setChatState(prev => {
      // Find the target conversation
      const updatedConversation = prev.activeConversation?.id === targetConversationId
        ? {
            ...prev.activeConversation,
            messages: [...(prev.activeConversation?.messages || []), tempUserMessage]
          }
        : prev.conversations.find(c => c.id === targetConversationId)
          ? {
              ...prev.conversations.find(c => c.id === targetConversationId)!,
              messages: [tempUserMessage]
            }
          : null;
      
      return {
        ...prev,
        activeConversation: updatedConversation
      };
    });
    
    try {
      // Send message to API
      const response = await apiSendMessage(message, targetConversationId);
      
      // Create assistant message from response
      const assistantMessage: ChatMessage = {
        id: uuidv4(), // Temporary ID until we refresh the conversation
        conversationId: targetConversationId!,
        role: ChatRole.ASSISTANT,
        content: response.response,
        timestamp: new Date(),
        status: ChatMessageStatus.SENT
      };
      
      // Update user message status to SENT and add assistant response
      setChatState(prev => {
        if (!prev.activeConversation) return prev;
        
        const updatedMessages = prev.activeConversation.messages.map(msg => 
          msg.id === tempUserMessage.id 
            ? { ...msg, status: ChatMessageStatus.SENT } 
            : msg
        );
        
        const updatedConversation = {
          ...prev.activeConversation,
          messages: [...updatedMessages, assistantMessage],
          lastMessageAt: new Date()
        };
        
        // Update the conversation in the list if it exists there
        const updatedConversations = prev.conversations.map(conv => 
          conv.id === targetConversationId 
            ? { ...conv, lastMessageAt: new Date() } 
            : conv
        );
        
        return {
          ...prev,
          conversations: updatedConversations,
          activeConversation: updatedConversation,
          loading: false
        };
      });
      
      return response;
    } catch (error) {
      const parsedError = parseApiError(error);
      
      // Update message status to ERROR
      setChatState(prev => {
        if (!prev.activeConversation) return prev;
        
        const updatedMessages = prev.activeConversation.messages.map(msg => 
          msg.id === tempUserMessage.id 
            ? { ...msg, status: ChatMessageStatus.ERROR } 
            : msg
        );
        
        return {
          ...prev,
          activeConversation: {
            ...prev.activeConversation,
            messages: updatedMessages
          },
          loading: false,
          error: parsedError.message
        };
      });
      
      throw parsedError;
    }
  }, [isAuthenticated, chatState.activeConversation, createNewConversation]);

  // Create context value
  const contextValue = useMemo(() => ({
    data: chatState,
    actions: {
      sendMessage,
      loadConversations,
      loadConversation,
      createNewConversation
    }
  }), [chatState, sendMessage, loadConversations, loadConversation, createNewConversation]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Custom hook for using the chat context
 * @returns Chat context with state and actions
 */
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};