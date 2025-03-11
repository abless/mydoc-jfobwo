/**
 * Integration Tests for Chat Routes
 * 
 * This file contains integration tests for the chat-related API endpoints in the
 * Health Advisor application, testing the complete request-response cycle for
 * sending messages to the LLM, retrieving chat history, and managing conversations.
 */

import request from 'supertest'; // v6.3.3
import express from 'express'; // v4.18.2
import mongoose from 'mongoose'; // v7.0.3
import { 
  setupTestDatabase,
  teardownTestDatabase,
  resetCollections,
  setupTestApp
} from '../setup';
import { createJwtToken } from '../../src/utils/jwt.util';
import { 
  mockUserId,
  mockUserEmail,
  createMockUser
} from '../mocks/user.mock';
import {
  mockConversationId,
  createMockChatConversation,
  createMockChatMessageArray,
  createMockConversationArray
} from '../mocks/chat.mock';
import { DEFAULT_MOCK_RESPONSE } from '../mocks/llm.mock';
import { User } from '../../src/models/user.model';
import { ChatConversation } from '../../src/models/chat-conversation.model';
import { ChatMessage } from '../../src/models/chat-message.model';

describe('Chat Routes', () => {
  let app: express.Application;
  let authToken: string;
  
  beforeAll(async () => {
    // Setup test environment - initialize database and create app
    await setupTestDatabase();
    app = await setupTestApp();
    
    // Create token for authenticated requests
    authToken = createJwtToken(mockUserId, mockUserEmail);
  });
  
  afterAll(async () => {
    // Cleanup resources after all tests
    await teardownTestDatabase();
  });
  
  beforeEach(async () => {
    // Reset database state before each test
    await resetCollections();
    
    // Create fresh test user
    await createMockUser();
  });
  
  /**
   * Tests sending a message to the LLM
   */
  test('should send a message to the LLM and receive a response', async () => {
    const message = 'What foods can help reduce headaches?';
    
    const response = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message });
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(response.body).toHaveProperty('conversationId');
    expect(typeof response.body.response).toBe('string');
    expect(typeof response.body.conversationId).toBe('string');
    
    // Verify message was saved in database
    const messages = await ChatMessage.find().exec();
    expect(messages.length).toBe(2); // User message and AI response
    
    // Verify conversation was created
    const conversations = await ChatConversation.find().exec();
    expect(conversations.length).toBe(1);
  });
  
  /**
   * Tests sending a message to an existing conversation
   */
  test('should send a message to an existing conversation', async () => {
    // Create a test conversation first
    const conversation = await createMockChatConversation({
      userId: new mongoose.Types.ObjectId(mockUserId)
    });
    await new ChatConversation(conversation).save();
    
    const message = 'How does my recent diet affect my headaches?';
    
    const response = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        message,
        conversationId: conversation._id.toString()
      });
      
    expect(response.status).toBe(200);
    expect(response.body.conversationId).toBe(conversation._id.toString());
    
    // Verify message was added to the existing conversation
    const messages = await ChatMessage.find({ 
      conversationId: conversation._id 
    }).exec();
    
    expect(messages.length).toBe(2); // User message and AI response
  });
  
  /**
   * Tests that authentication is required for sending messages
   */
  test('should return 401 when sending message without authentication', async () => {
    const response = await request(app)
      .post('/api/chat/message')
      .send({ message: 'Test message' });
      
    expect(response.status).toBe(401);
  });
  
  /**
   * Tests validation for message data
   */
  test('should return 400 when sending invalid message data', async () => {
    // Test with empty message
    const response1 = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: '' });
      
    expect(response1.status).toBe(400);
    
    // Test with very long message (assuming max is 1000 characters)
    const longMessage = 'A'.repeat(1001);
    const response2 = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: longMessage });
      
    expect(response2.status).toBe(400);
    
    // Test with invalid conversationId format
    const response3 = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        message: 'Valid message',
        conversationId: 'not-a-valid-id'
      });
      
    expect(response3.status).toBe(400);
  });
  
  /**
   * Tests sending a message to a nonexistent conversation
   */
  test('should return 404 when sending message to nonexistent conversation', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const response = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        message: 'Test message',
        conversationId: nonExistentId
      });
      
    expect(response.status).toBe(404);
  });
  
  /**
   * Tests creating a new conversation
   */
  test('should create a new conversation', async () => {
    const response = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ 
        title: 'Health Diet Questions',
        initialMessage: 'How can I improve my diet?'
      });
      
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('conversationId');
    expect(response.body).toHaveProperty('initialResponse');
    
    // Verify conversation was created in database
    const conversations = await ChatConversation.find().exec();
    expect(conversations.length).toBe(1);
    expect(conversations[0].title).toBe('Health Diet Questions');
    
    // Verify initial messages were created
    const messages = await ChatMessage.find().exec();
    expect(messages.length).toBe(2); // User message and AI response
  });
  
  /**
   * Tests retrieving a list of conversations
   */
  test('should get user conversations', async () => {
    // Create multiple conversations
    const conversationsData = createMockConversationArray(mockUserId, 3);
    for (const conv of conversationsData) {
      await new ChatConversation(conv).save();
    }
    
    // Request conversations list
    const response = await request(app)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversations');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body.conversations.length).toBe(3);
    expect(response.body.total).toBe(3);
  });
  
  /**
   * Tests pagination for conversations list
   */
  test('should get paginated conversations', async () => {
    // Create 5 conversations
    const conversationsData = createMockConversationArray(mockUserId, 5);
    for (const conv of conversationsData) {
      await new ChatConversation(conv).save();
    }
    
    // Request first page (2 items)
    const response1 = await request(app)
      .get('/api/chat/conversations?page=1&limit=2')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response1.status).toBe(200);
    expect(response1.body.conversations.length).toBe(2);
    expect(response1.body.total).toBe(5);
    expect(response1.body.page).toBe(1);
    
    // Request second page (2 items)
    const response2 = await request(app)
      .get('/api/chat/conversations?page=2&limit=2')
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response2.status).toBe(200);
    expect(response2.body.conversations.length).toBe(2);
    expect(response2.body.total).toBe(5);
    expect(response2.body.page).toBe(2);
  });
  
  /**
   * Tests retrieving a specific conversation
   */
  test('should get a specific conversation', async () => {
    // Create a conversation
    const conversation = await createMockChatConversation({
      userId: new mongoose.Types.ObjectId(mockUserId)
    });
    await new ChatConversation(conversation).save();
    
    // Request the conversation
    const response = await request(app)
      .get(`/api/chat/conversations/${conversation._id.toString()}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id', conversation._id.toString());
    expect(response.body).toHaveProperty('title', conversation.title);
  });
  
  /**
   * Tests retrieving a nonexistent conversation
   */
  test('should return 404 for nonexistent conversation', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const response = await request(app)
      .get(`/api/chat/conversations/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(404);
  });
  
  /**
   * Tests retrieving chat history for a conversation
   */
  test('should get chat history for a conversation', async () => {
    // Create a conversation
    const conversation = await createMockChatConversation({
      userId: new mongoose.Types.ObjectId(mockUserId)
    });
    await new ChatConversation(conversation).save();
    
    // Create messages
    const messagesData = createMockChatMessageArray(
      conversation._id.toString(),
      mockUserId,
      6
    );
    
    // Save messages to database
    for (const msg of messagesData) {
      await new ChatMessage(msg).save();
    }
    
    // Request chat history
    const response = await request(app)
      .get(`/api/chat/conversations/${conversation._id.toString()}/messages`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('messages');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body.messages.length).toBe(6);
    expect(response.body.total).toBe(6);
  });
  
  /**
   * Tests pagination for chat history
   */
  test('should get paginated chat history', async () => {
    // Create a conversation
    const conversation = await createMockChatConversation({
      userId: new mongoose.Types.ObjectId(mockUserId)
    });
    await new ChatConversation(conversation).save();
    
    // Create 10 messages
    const messagesData = createMockChatMessageArray(
      conversation._id.toString(),
      mockUserId,
      10
    );
    
    // Save messages to database
    for (const msg of messagesData) {
      await new ChatMessage(msg).save();
    }
    
    // Request first page (3 items)
    const response1 = await request(app)
      .get(`/api/chat/conversations/${conversation._id.toString()}/messages?page=1&limit=3`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response1.status).toBe(200);
    expect(response1.body.messages.length).toBe(3);
    expect(response1.body.total).toBe(10);
    expect(response1.body.page).toBe(1);
    
    // Request second page (3 items)
    const response2 = await request(app)
      .get(`/api/chat/conversations/${conversation._id.toString()}/messages?page=2&limit=3`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response2.status).toBe(200);
    expect(response2.body.messages.length).toBe(3);
    expect(response2.body.total).toBe(10);
    expect(response2.body.page).toBe(2);
  });
  
  /**
   * Tests retrieving chat history for a nonexistent conversation
   */
  test('should return 404 when getting chat history for nonexistent conversation', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const response = await request(app)
      .get(`/api/chat/conversations/${nonExistentId}/messages`)
      .set('Authorization', `Bearer ${authToken}`);
      
    expect(response.status).toBe(404);
  });
  
  /**
   * Tests security - accessing another user's conversation should be prevented
   */
  test('should not allow accessing another user\'s conversation', async () => {
    // Create another user
    const anotherUserId = new mongoose.Types.ObjectId();
    await User.create({
      _id: anotherUserId,
      email: 'another@example.com',
      password: 'hashedpassword123'
    });
    
    // Create a conversation for the other user
    const conversation = await createMockChatConversation({
      userId: anotherUserId
    });
    await new ChatConversation(conversation).save();
    
    // Try to access with our user's token
    const response = await request(app)
      .get(`/api/chat/conversations/${conversation._id.toString()}`)
      .set('Authorization', `Bearer ${authToken}`);
      
    // Should return 404 (not revealing that the conversation exists)
    expect(response.status).toBe(404);
  });
});