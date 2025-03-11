/**
 * Chat Routes Module
 * 
 * This module defines API endpoints for chat functionality in the Health Advisor application.
 * It enables users to interact with an LLM for personalized health advice, create and manage
 * conversations, and retrieve chat history.
 * 
 * The chat functionality provides contextualized health advice by incorporating the user's
 * health data (meals, lab results, symptoms) into the conversation with the LLM.
 */

import express from 'express'; // ^4.18.2
import { authenticate } from '../middlewares/auth.middleware';
import { 
  validateBody,
  validateQuery,
  validateParams
} from '../middlewares/validation.middleware';
import {
  validateSendMessageSchema,
  validateGetChatHistorySchema,
  validateGetConversationsSchema,
  validateConversationIdSchema
} from '../validators/chat.validator';
import {
  handleSendMessage,
  handleGetConversations,
  handleCreateConversation,
  handleGetConversation,
  handleGetChatHistory
} from '../controllers/chat.controller';

/**
 * Creates and configures an Express router for chat-related endpoints
 * 
 * @returns Configured Express router with chat endpoints
 */
function createChatRouter(): express.Router {
  const router = express.Router();

  // Apply authentication middleware to all chat routes
  router.use(authenticate);

  /**
   * POST /message
   * 
   * Sends a user message to the LLM and receives a personalized health response.
   * The LLM response is contextualized with the user's health data such as recent
   * meals, lab results, and symptoms to provide relevant health advice.
   * 
   * If a conversationId is provided, the message is added to that conversation.
   * Otherwise, a new conversation is created.
   */
  router.post(
    '/message',
    validateBody(validateSendMessageSchema()),
    handleSendMessage
  );

  /**
   * POST /conversations
   * 
   * Creates a new conversation with an initial message to the LLM.
   * This is useful for starting a fresh conversation thread about a new health topic.
   * Returns both the new conversation ID and the initial LLM response.
   */
  router.post(
    '/conversations',
    validateBody(validateSendMessageSchema()), // Reusing the schema as it needs initial message
    handleCreateConversation
  );

  /**
   * GET /conversations
   * 
   * Retrieves a paginated list of the user's conversations.
   * Each conversation includes metadata such as title, creation date, and last message time.
   * Useful for displaying a history of health discussions with the LLM.
   */
  router.get(
    '/conversations',
    validateQuery(validateGetConversationsSchema()),
    handleGetConversations
  );

  /**
   * GET /conversations/:id
   * 
   * Retrieves details for a specific conversation by ID, including all messages.
   * This provides the complete context of a health discussion between the user and the LLM.
   */
  router.get(
    '/conversations/:id',
    validateParams(validateConversationIdSchema()),
    handleGetConversation
  );

  /**
   * GET /conversations/:id/messages
   * 
   * Retrieves a paginated list of messages for a specific conversation.
   * Allows for viewing the chat history with support for pagination to handle
   * potentially long conversations efficiently.
   */
  router.get(
    '/conversations/:id/messages',
    validateParams(validateConversationIdSchema()),
    validateQuery(validateGetChatHistorySchema()),
    handleGetChatHistory
  );

  return router;
}

export default createChatRouter;