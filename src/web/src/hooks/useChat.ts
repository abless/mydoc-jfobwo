/**
 * Custom React hook that provides chat functionality for the React Native mobile application,
 * enabling interaction with the LLM health advisor. This hook manages chat state, conversations,
 * messages, and handles communication with the backend API.
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react'; // ^18.2.0
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import {
  ChatMessage,
  Conversation,
  ChatRole,
  ChatMessageStatus,
  SendMessageResponse,
  ConversationsParams,
  ChatHistoryParams,
  PaginatedResponse
} from '../types/chat.types';
import {
  sendMessage as sendMessageService,
  getConversations as getConversationsService,
  getConversation as getConversationService,
  getMessages as getMessagesService,
  createConversation as createConversationService
} from '../services/chat.service';
import { useAuth } from './useAuth';
import { parseApiError } from '../utils/error.utils';

/**
 * Interface defining the return type of the useChat hook
 */
export interface UseChatResult {
  /** List of user conversations */
  conversations: Conversation[];
  /** Currently active conversation with messages */
  activeConversation: Conversation | null;
  /** Loading state for async operations */
  loading: boolean;
  /** Error message if an operation fails */
  error: string | null;
  /** Function to send a message to the LLM health advisor */
  sendMessage: (message: string, conversationId?: string) => Promise<SendMessageResponse>;
  /** Function to load user conversations with pagination */
  loadConversations: (params?: ConversationsParams) => Promise<void>;
  /** Function to load a specific conversation by ID */
  loadConversation: (conversationId: string) => Promise<void>;
  /** Function to create a new conversation */
  createNewConversation: () => Promise<string>;
}

/**
 * Custom hook that provides chat functionality and state management for the LLM health advisor
 * 
 * @returns Object containing chat state and methods for interacting with the LLM
 */
export const useChat = (): UseChatResult => {
  // State variables
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get authentication state from useAuth hook
  const { isAuthenticated, user } = useAuth();
  
  /**
   * Updates the status of a message in the active conversation
   * @param messageId ID of the message to update
   * @param status New status for the message
   */
  const updateMessageStatus = useCallback((messageId: string, status: ChatMessageStatus) => {
    setActiveConversation(prevConversation => {
      if (!prevConversation) return null;
      
      const updatedMessages = prevConversation.messages.map(message => {
        if (message.id === messageId) {
          return { ...message, status };
        }
        return message;
      });
      
      return {
        ...prevConversation,
        messages: updatedMessages
      };
    });
  }, []);

  /**
   * Adds a new message to the active conversation
   * @param message Message to add to the conversation
   */
  const addMessage = useCallback((message: ChatMessage) => {
    setActiveConversation(prevConversation => {
      if (!prevConversation) return null;
      
      return {
        ...prevConversation,
        messages: [...prevConversation.messages, message],
        lastMessageAt: new Date()
      };
    });
  }, []);
  
  /**
   * Loads user conversations with pagination
   * @param params Optional pagination parameters
   * @returns Promise that resolves when conversations are loaded
   */
  const loadConversations = useCallback(async (params?: ConversationsParams): Promise<void> => {
    if (!isAuthenticated) {
      setError('User must be authenticated to load conversations');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const defaultParams: ConversationsParams = {
        page: 1,
        limit: 20
      };
      
      const response = await getConversationsService({
        ...defaultParams,
        ...params
      });
      
      setConversations(prevConversations => {
        const conversationMap = new Map(prevConversations.map(c => [c.id, c]));
        
        response.items.forEach(conversation => {
          // Preserve existing messages if available
          const existingConversation = conversationMap.get(conversation.id);
          conversationMap.set(conversation.id, {
            ...conversation,
            messages: existingConversation?.messages || []
          });
        });
        
        return Array.from(conversationMap.values()).sort((a, b) => 
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  /**
   * Loads a specific conversation by ID and sets it as the active conversation
   * @param conversationId ID of the conversation to load
   * @returns Promise that resolves when the conversation is loaded
   */
  const loadConversation = useCallback(async (conversationId: string): Promise<void> => {
    if (!isAuthenticated) {
      setError('User must be authenticated to load conversation');
      return;
    }
    
    // Check if this conversation is already the active conversation with messages
    if (
      activeConversation && 
      activeConversation.id === conversationId && 
      activeConversation.messages.length > 0
    ) {
      // Already loaded, no need to reload
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get conversation details
      const conversation = await getConversationService(conversationId);
      
      // Load messages for the conversation
      const messagesResponse = await getMessagesService({
        conversationId,
        page: 1,
        limit: 100
      });
      
      // Add messages to the conversation
      conversation.messages = messagesResponse.items;
      
      // Set as active conversation
      setActiveConversation(conversation);
      
      // Update conversation in list
      setConversations(prevConversations => {
        const index = prevConversations.findIndex(c => c.id === conversationId);
        if (index >= 0) {
          const updatedConversations = [...prevConversations];
          updatedConversations[index] = {
            ...updatedConversations[index],
            ...conversation,
            messages: conversation.messages
          };
          return updatedConversations;
        }
        return [...prevConversations, conversation];
      });
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeConversation]);
  
  /**
   * Creates a new conversation and sets it as the active conversation
   * @returns Promise that resolves with the ID of the new conversation
   */
  const createNewConversation = useCallback(async (): Promise<string> => {
    if (!isAuthenticated) {
      setError('User must be authenticated to create a conversation');
      throw new Error('User must be authenticated to create a conversation');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newConversation = await createConversationService();
      
      // Add empty messages array
      newConversation.messages = [];
      
      // Set as active conversation
      setActiveConversation(newConversation);
      
      // Add to conversations list
      setConversations(prevConversations => [newConversation, ...prevConversations]);
      
      return newConversation.id;
    } catch (error) {
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      throw parsedError;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  /**
   * Sends a message to the LLM health advisor and handles the response
   * @param message The message text to send
   * @param conversationId Optional ID of an existing conversation
   * @returns Promise that resolves with the LLM response
   */
  const sendMessage = useCallback(async (message: string, conversationId?: string): Promise<SendMessageResponse> => {
    if (!isAuthenticated) {
      setError('User must be authenticated to send a message');
      throw new Error('User must be authenticated to send a message');
    }
    
    setError(null);
    
    // If no conversation ID is provided, create a new conversation or use active conversation
    if (!conversationId && !activeConversation) {
      conversationId = await createNewConversation();
    } else if (!conversationId && activeConversation) {
      conversationId = activeConversation.id;
    }
    
    // Create a temporary user message with status SENDING
    const tempMessageId = uuidv4();
    const userMessage: ChatMessage = {
      id: tempMessageId,
      conversationId: conversationId!,
      role: ChatRole.USER,
      content: message,
      timestamp: new Date(),
      status: ChatMessageStatus.SENDING
    };
    
    // Add the user message to the active conversation
    addMessage(userMessage);
    
    try {
      // Send the message to the LLM service
      const response = await sendMessageService(message, conversationId);
      
      // Update the user message status to SENT
      updateMessageStatus(tempMessageId, ChatMessageStatus.SENT);
      
      // Create the assistant message from the response
      const assistantMessage: ChatMessage = {
        id: uuidv4(), // Temporary ID until we load the conversation again
        conversationId: response.conversationId,
        role: ChatRole.ASSISTANT,
        content: response.response || 'I apologize, but I couldn\'t generate a response at this time.',
        timestamp: new Date(),
        status: ChatMessageStatus.SENT
      };
      
      // Add the assistant message to the conversation
      addMessage(assistantMessage);
      
      // If a new conversation was created by the server, update the active conversation
      if (conversationId !== response.conversationId) {
        await loadConversation(response.conversationId);
      }
      
      return response;
    } catch (error) {
      // Update the user message status to ERROR
      updateMessageStatus(tempMessageId, ChatMessageStatus.ERROR);
      
      const parsedError = parseApiError(error);
      setError(parsedError.message);
      throw parsedError;
    }
  }, [isAuthenticated, activeConversation, createNewConversation, updateMessageStatus, addMessage, loadConversation]);
  
  // Load conversations when the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);
  
  // Return the chat state and methods
  return {
    conversations,
    activeConversation,
    loading,
    error,
    sendMessage,
    loadConversations,
    loadConversation,
    createNewConversation
  };
};