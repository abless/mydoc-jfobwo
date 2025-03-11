import mongoose from 'mongoose';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { LLMService } from '../../../src/services/llm.service';
import { HealthService } from '../../../src/services/health.service';
import { ServiceUnavailableError } from '../../../src/utils/error.util';
import { getConversationHistory } from '../../../src/repositories/chat.repository';
import { LLMMessage, LLMResponse, ChatRole } from '../../../src/types/chat.types';
import { llmConfig } from '../../../src/config/llm';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  resetCollections 
} from '../../setup';
import { 
  mockUserId,
  mockConversationId,
  createMockChatMessageArray,
  createMockHealthContext,
  DEFAULT_MOCK_RESPONSE,
  HEALTH_CONTEXT_MOCK_RESPONSE,
  DISCLAIMER_TEXT,
  createMockLLMResponse,
  setupMockLLMSuccess,
  setupMockLLMFailure,
  setupMockLLMRetry,
  createContextWithHealthData 
} from '../../mocks/llm.mock';

describe('LLMService', () => {
  let mockAxios: MockAdapter;
  let connection: mongoose.Connection;
  let llmService: LLMService;
  
  beforeAll(async () => {
    await setupTestDatabase();
    connection = mongoose.connection;
    llmService = new LLMService(connection);
    mockAxios = new MockAdapter(axios);
  });
  
  afterAll(async () => {
    mockAxios.restore();
    await teardownTestDatabase();
  });
  
  beforeEach(async () => {
    await resetCollections();
    mockAxios.reset();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with database connection', () => {
      const service = new LLMService(connection);
      expect(service).toBeDefined();
      // Verify service has necessary properties
      expect((service as any).healthService).toBeDefined();
      expect((service as any).systemPrompts).toBeDefined();
      expect((service as any).maxRetries).toBeDefined();
      expect((service as any).retryDelay).toBeDefined();
    });
  });
  
  describe('buildContext', () => {
    it('should build context from user health data and conversation history', async () => {
      // Mock the health service getHealthContext method
      jest.spyOn(HealthService.prototype, 'getHealthContext')
        .mockResolvedValue(createMockHealthContext());
      
      // Mock the getConversationHistory function
      jest.spyOn(require('../../../src/repositories/chat.repository'), 'getConversationHistory')
        .mockResolvedValue(createMockChatMessageArray());
      
      const context = await llmService.buildContext(mockUserId, mockConversationId);
      
      expect(context).toBeDefined();
      expect(context).toContain('USER HEALTH CONTEXT');
      expect(context).toContain('Recent meals');
      expect(context).toContain('Recent lab results');
      expect(context).toContain('Recent symptoms');
      expect(context).toContain('Recent conversation');
    });
    
    it('should handle empty health data', async () => {
      // Mock the health service getHealthContext method with empty data
      jest.spyOn(HealthService.prototype, 'getHealthContext')
        .mockResolvedValue({
          recentMeals: [],
          recentLabResults: [],
          recentSymptoms: []
        });
      
      // Mock the getConversationHistory function with empty array
      jest.spyOn(require('../../../src/repositories/chat.repository'), 'getConversationHistory')
        .mockResolvedValue([]);
      
      const context = await llmService.buildContext(mockUserId, mockConversationId);
      
      expect(context).toBe('');
    });
    
    it('should include conversation history in context', async () => {
      // Mock the health service getHealthContext method
      jest.spyOn(HealthService.prototype, 'getHealthContext')
        .mockResolvedValue(createMockHealthContext());
      
      // Create a substantial conversation history
      const mockConversation = createMockChatMessageArray(mockConversationId, mockUserId, 10);
      
      // Mock the getConversationHistory function
      jest.spyOn(require('../../../src/repositories/chat.repository'), 'getConversationHistory')
        .mockResolvedValue(mockConversation);
      
      const context = await llmService.buildContext(mockUserId, mockConversationId);
      
      expect(context).toContain('Recent conversation');
      expect(context).toContain('user:');
      expect(context).toContain('assistant:');
      // Verify conversation is properly formatted
      expect(context).toMatch(/Recent conversation: .*\|.*/);
    });
  });
  
  describe('constructPrompt', () => {
    it('should construct prompt with system instructions and user message', () => {
      const userMessage = 'What diet should I follow for my headaches?';
      const context = '';
      
      const prompt = llmService.constructPrompt(userMessage, context);
      
      expect(prompt).toBeInstanceOf(Array);
      expect(prompt.length).toBe(2); // System message and user message
      expect(prompt[0].role).toBe(ChatRole.SYSTEM);
      expect(prompt[0].content).toContain('You are a helpful health advisor');
      expect(prompt[1].role).toBe(ChatRole.USER);
      expect(prompt[1].content).toBe(userMessage);
    });
    
    it('should include context in prompt when provided', () => {
      const userMessage = 'What diet should I follow for my headaches?';
      const context = createContextWithHealthData();
      
      const prompt = llmService.constructPrompt(userMessage, context);
      
      expect(prompt).toBeInstanceOf(Array);
      expect(prompt.length).toBe(3); // System message, context message, and user message
      expect(prompt[0].role).toBe(ChatRole.SYSTEM);
      expect(prompt[0].content).toContain('You are a helpful health advisor');
      expect(prompt[1].role).toBe(ChatRole.SYSTEM);
      expect(prompt[1].content).toBe(context);
      expect(prompt[2].role).toBe(ChatRole.USER);
      expect(prompt[2].content).toBe(userMessage);
    });
  });
  
  describe('sendRequest', () => {
    it('should send request to LLM provider and return response', async () => {
      // Setup mock LLM success response
      setupMockLLMSuccess(mockAxios);
      
      const messages: LLMMessage[] = [
        { role: ChatRole.SYSTEM, content: 'You are a health advisor.' },
        { role: ChatRole.USER, content: 'What diet should I follow for headaches?' }
      ];
      
      const response = await llmService.sendRequest(messages, mockUserId);
      
      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices[0].message.content).toBe(DEFAULT_MOCK_RESPONSE);
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe(llmConfig.provider.baseUrl);
      
      // Verify request payload
      const requestData = JSON.parse(mockAxios.history.post[0].data);
      expect(requestData.messages).toEqual(messages);
      expect(requestData.model).toBe(llmConfig.model);
      expect(requestData.user).toBe(mockUserId);
    });
    
    it('should retry on transient errors', async () => {
      // Setup mock to fail twice and then succeed
      setupMockLLMRetry(mockAxios, 2, DEFAULT_MOCK_RESPONSE);
      
      const messages: LLMMessage[] = [
        { role: ChatRole.SYSTEM, content: 'You are a health advisor.' },
        { role: ChatRole.USER, content: 'What diet should I follow for headaches?' }
      ];
      
      const response = await llmService.sendRequest(messages, mockUserId);
      
      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices[0].message.content).toBe(DEFAULT_MOCK_RESPONSE);
      expect(mockAxios.history.post.length).toBe(3); // Initial request + 2 retries
    });
    
    it('should throw ServiceUnavailableError after max retries', async () => {
      // Setup mock to always fail
      setupMockLLMFailure(mockAxios, 500);
      
      const messages: LLMMessage[] = [
        { role: ChatRole.SYSTEM, content: 'You are a health advisor.' },
        { role: ChatRole.USER, content: 'What diet should I follow for headaches?' }
      ];
      
      await expect(llmService.sendRequest(messages, mockUserId))
        .rejects.toThrow(ServiceUnavailableError);
      
      // LLMService.maxRetries is set to 3 in the constructor
      expect(mockAxios.history.post.length).toBe(3); // Initial request + 2 retries
      expect(mockAxios.history.post[0].url).toBe(llmConfig.provider.baseUrl);
    });
  });
  
  describe('processResponse', () => {
    it('should process and validate LLM response', () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              role: 'assistant',
              content: DEFAULT_MOCK_RESPONSE
            },
            index: 0,
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 85,
          total_tokens: 205
        }
      };
      
      const processedResponse = llmService.processResponse(mockResponse);
      
      expect(processedResponse).toBeDefined();
      expect(processedResponse.content).toBe(DEFAULT_MOCK_RESPONSE);
      expect(processedResponse.metadata).toBeDefined();
      expect(processedResponse.metadata.model).toBe('gpt-3.5-turbo');
      expect(processedResponse.metadata.tokenUsage).toEqual({
        prompt_tokens: 120,
        completion_tokens: 85,
        total_tokens: 205
      });
      expect(processedResponse.metadata.processedAt).toBeDefined();
    });
    
    it('should handle malformed responses', () => {
      const malformedResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-3.5-turbo',
        // Missing choices array
        usage: {
          prompt_tokens: 120,
          completion_tokens: 85,
          total_tokens: 205
        }
      };
      
      expect(() => llmService.processResponse(malformedResponse))
        .toThrow('Invalid response format from LLM provider');
    });
  });
  
  describe('addHealthDisclaimer', () => {
    it('should add disclaimer to response without existing disclaimer', () => {
      const response = 'You should drink more water and get regular exercise.';
      
      const withDisclaimer = llmService.addHealthDisclaimer(response);
      
      expect(withDisclaimer).toContain(response);
      expect(withDisclaimer).toContain('IMPORTANT: This information is for general wellness purposes only');
      expect(withDisclaimer).not.toBe(response); // Should be different if disclaimer was added
    });
    
    it('should not add disclaimer if one already exists', () => {
      // Response that already includes a disclaimer
      const response = `You should drink more water and get regular exercise. 

IMPORTANT: This information is for general wellness purposes only and not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers with questions about your health conditions.`;
      
      const withDisclaimer = llmService.addHealthDisclaimer(response);
      
      // The response should remain unchanged
      expect(withDisclaimer).toBe(response);
    });
  });
  
  describe('sendMessage', () => {
    it('should send message to LLM and return processed response', async () => {
      // Mock the buildContext method
      jest.spyOn(llmService, 'buildContext')
        .mockResolvedValue(createContextWithHealthData());
      
      // Mock the constructPrompt method
      const mockPrompt = [
        { role: ChatRole.SYSTEM, content: 'You are a health advisor.' },
        { role: ChatRole.SYSTEM, content: createContextWithHealthData() },
        { role: ChatRole.USER, content: 'What diet should I follow for my headaches?' }
      ];
      jest.spyOn(llmService, 'constructPrompt')
        .mockReturnValue(mockPrompt);
      
      // Mock the sendRequest method
      const mockLLMResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              role: 'assistant',
              content: HEALTH_CONTEXT_MOCK_RESPONSE
            },
            index: 0,
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 85,
          total_tokens: 205
        }
      };
      jest.spyOn(llmService, 'sendRequest')
        .mockResolvedValue(mockLLMResponse);
      
      // Mock the processResponse method
      const processedResponse: LLMResponse = {
        content: HEALTH_CONTEXT_MOCK_RESPONSE,
        metadata: {
          model: 'gpt-3.5-turbo',
          processedAt: new Date().toISOString(),
          tokenUsage: {
            prompt_tokens: 120,
            completion_tokens: 85,
            total_tokens: 205
          }
        }
      };
      jest.spyOn(llmService, 'processResponse')
        .mockReturnValue(processedResponse);
      
      // Add spy for the addHealthDisclaimer method
      jest.spyOn(llmService, 'addHealthDisclaimer')
        .mockImplementation((content) => `${content}\n\n${DISCLAIMER_TEXT}`);
      
      const message = 'What diet should I follow for my headaches?';
      const response = await llmService.sendMessage(message, mockUserId, mockConversationId);
      
      expect(response).toBeDefined();
      expect(response.content).toContain(HEALTH_CONTEXT_MOCK_RESPONSE);
      expect(response.content).toContain(DISCLAIMER_TEXT);
      expect(llmService.buildContext).toHaveBeenCalledWith(mockUserId, mockConversationId);
      expect(llmService.constructPrompt).toHaveBeenCalledWith(message, expect.any(String));
      expect(llmService.sendRequest).toHaveBeenCalledWith(mockPrompt, mockUserId);
      expect(llmService.processResponse).toHaveBeenCalledWith(mockLLMResponse);
      expect(llmService.addHealthDisclaimer).toHaveBeenCalledWith(HEALTH_CONTEXT_MOCK_RESPONSE);
    });
    
    it('should handle errors and return fallback response', async () => {
      // Mock the buildContext method
      jest.spyOn(llmService, 'buildContext')
        .mockResolvedValue(createContextWithHealthData());
      
      // Mock the constructPrompt method
      const mockPrompt = [
        { role: ChatRole.SYSTEM, content: 'You are a health advisor.' },
        { role: ChatRole.SYSTEM, content: createContextWithHealthData() },
        { role: ChatRole.USER, content: 'What diet should I follow for my headaches?' }
      ];
      jest.spyOn(llmService, 'constructPrompt')
        .mockReturnValue(mockPrompt);
      
      // Mock the sendRequest method to throw ServiceUnavailableError
      jest.spyOn(llmService, 'sendRequest')
        .mockRejectedValue(new ServiceUnavailableError(
          'Unable to communicate with LLM service after multiple attempts',
          'LLM Provider'
        ));
      
      const message = 'What diet should I follow for my headaches?';
      const response = await llmService.sendMessage(message, mockUserId, mockConversationId);
      
      expect(response).toBeDefined();
      expect(response.content).toContain('I apologize');
      expect(response.content).toContain('technical difficulties');
      expect(response.metadata).toBeDefined();
      expect(response.metadata.fallback).toBe(true);
      expect(response.metadata.processedAt).toBeDefined();
    });
  });
});