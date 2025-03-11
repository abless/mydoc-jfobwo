/**
 * LLM Mock Module
 * 
 * Provides mock data and factory functions for LLM-related test cases in the Health Advisor application.
 * This module helps simulate interactions with the Large Language Model service for unit and integration tests.
 */

import { LLMResponse, LLMMessage, ChatRole } from '../../src/types/chat.types';
import { llmConfig } from '../../src/config/llm';
import axios from 'axios'; // ^1.3.4
import MockAdapter from 'axios-mock-adapter'; // ^1.21.4

// Mock response constants for different testing scenarios
export const DEFAULT_MOCK_RESPONSE = "I'm your Health Advisor AI. Based on your health data, I recommend maintaining a balanced diet and regular exercise. Remember, this is general advice and not a medical diagnosis.";

export const HEALTH_CONTEXT_MOCK_RESPONSE = "Based on your recent meal logs, I notice you've been consuming foods high in processed sugars. This could potentially trigger headaches in some people. Your recent lab results show normal blood glucose levels, which is positive. For your reported headache symptoms, I would suggest tracking when they occur in relation to your meals to identify potential triggers.";

export const ERROR_MOCK_RESPONSE = "I apologize, but I'm unable to provide health advice at the moment. Please try again later.";

export const DISCLAIMER_TEXT = "Remember, I'm an AI assistant and not a medical professional. This information should not replace professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.";

/**
 * Creates a mock LLM response object for testing
 * 
 * @param content - The response content, defaults to DEFAULT_MOCK_RESPONSE if not provided
 * @param metadata - Optional metadata to include in the response
 * @returns A mock LLM response with the provided content and metadata
 */
export function createMockLLMResponse(content?: string, metadata?: Record<string, any>): LLMResponse {
  return {
    content: content || DEFAULT_MOCK_RESPONSE,
    metadata: metadata || {
      model: llmConfig.model,
      usage: {
        promptTokens: 120,
        completionTokens: 85,
        totalTokens: 205
      },
      responseId: `mock-response-${Date.now()}`
    }
  };
}

/**
 * Creates a mock LLM message object for testing
 * 
 * @param role - The role of the message sender
 * @param content - The message content
 * @returns A mock LLM message with the provided role and content
 */
export function createMockLLMMessage(role: ChatRole, content: string): LLMMessage {
  return {
    role,
    content
  };
}

/**
 * Sets up a mock adapter to simulate successful LLM API responses
 * 
 * @param mockAdapter - The axios mock adapter instance
 * @param responseContent - Optional response content, defaults to DEFAULT_MOCK_RESPONSE
 */
export function setupMockLLMSuccess(mockAdapter: MockAdapter, responseContent?: string): void {
  const content = responseContent || DEFAULT_MOCK_RESPONSE;
  
  mockAdapter.onPost(llmConfig.provider.baseUrl).reply(200, {
    id: `chatcmpl-mock-${Date.now()}`,
    object: 'chat.completion',
    created: Date.now(),
    model: llmConfig.model,
    choices: [
      {
        message: {
          role: 'assistant',
          content: content
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
  });
}

/**
 * Sets up a mock adapter to simulate failed LLM API responses
 * 
 * @param mockAdapter - The axios mock adapter instance
 * @param statusCode - The error status code to return, defaults to 500
 * @param errorResponse - Optional custom error response object
 */
export function setupMockLLMFailure(
  mockAdapter: MockAdapter, 
  statusCode: number = 500, 
  errorResponse?: object
): void {
  const errorObj = errorResponse || {
    error: {
      message: 'Error communicating with LLM service',
      type: 'service_error',
      code: 'server_error'
    }
  };
  
  mockAdapter.onPost(llmConfig.provider.baseUrl).reply(statusCode, errorObj);
}

/**
 * Sets up a mock adapter to simulate initial failures followed by success for testing retry logic
 * 
 * @param mockAdapter - The axios mock adapter instance
 * @param failCount - Number of times to fail before succeeding, defaults to 2
 * @param successResponse - The success response content to return after failures
 */
export function setupMockLLMRetry(
  mockAdapter: MockAdapter, 
  failCount: number = 2, 
  successResponse?: string
): void {
  let requestCount = 0;
  
  mockAdapter.onPost(llmConfig.provider.baseUrl).reply(() => {
    requestCount++;
    
    if (requestCount <= failCount) {
      // Return error for initial requests
      return [
        500, 
        {
          error: {
            message: `Error attempt ${requestCount}/${failCount}`,
            type: 'service_error',
            code: 'server_error'
          }
        }
      ];
    } else {
      // Return success for subsequent requests
      return [
        200, 
        {
          id: `chatcmpl-mock-${Date.now()}`,
          object: 'chat.completion',
          created: Date.now(),
          model: llmConfig.model,
          choices: [
            {
              message: {
                role: 'assistant',
                content: successResponse || DEFAULT_MOCK_RESPONSE
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
        }
      ];
    }
  });
}

/**
 * Creates a mock LLM service object for testing
 * 
 * @param customImplementations - Optional overrides for specific service methods
 * @returns A mock LLM service with the specified implementations
 */
export function mockLLMService(customImplementations?: object): object {
  // Default mock implementations
  const defaultMock = {
    // Send a message to the LLM and get a response
    sendMessage: jest.fn().mockResolvedValue(createMockLLMResponse()),
    
    // Build context from user's health data
    buildContext: jest.fn().mockReturnValue(createContextWithHealthData()),
    
    // Construct prompt with user message and context
    constructPrompt: jest.fn().mockImplementation((message: string, context: string) => {
      return [
        createMockLLMMessage(ChatRole.SYSTEM, "You are a health advisor AI. Provide personalized advice based on the user's health data."),
        createMockLLMMessage(ChatRole.USER, `Context: ${context}\n\nUser message: ${message}`)
      ];
    }),
    
    // Send request to LLM provider
    sendRequest: jest.fn().mockResolvedValue(createMockLLMResponse()),
    
    // Process LLM response
    processResponse: jest.fn().mockImplementation((response: LLMResponse) => {
      return addHealthDisclaimerToResponse(response.content);
    })
  };
  
  // Merge default implementations with custom overrides
  return {
    ...defaultMock,
    ...(customImplementations || {})
  };
}

/**
 * Creates a mock context string with health data for testing
 * 
 * @returns A formatted context string with mock health data
 */
export function createContextWithHealthData(): string {
  return `
RECENT MEALS:
- Breakfast (Today, 8:30 AM): Oatmeal with berries and honey
- Lunch (Yesterday, 12:15 PM): Grilled chicken salad with avocado
- Dinner (Yesterday, 7:00 PM): Pasta with tomato sauce and cheese
- Snack (Today, 3:30 PM): Chocolate bar and coffee

RECENT LAB RESULTS:
- Blood Test (1 week ago): Normal blood glucose levels, slightly elevated cholesterol
- Blood Pressure (3 days ago): 125/82

RECENT SYMPTOMS:
- Headache (Yesterday, 2:45 PM): Moderate pain, lasted about 1 hour
- Fatigue (Past 3 days): Mild tiredness in the afternoons
`;
}

/**
 * Adds a health disclaimer to a response string if not already present
 * 
 * @param content - The response content to add a disclaimer to
 * @returns Content with added disclaimer
 */
export function addHealthDisclaimerToResponse(content: string): string {
  // Check if content already has a disclaimer
  if (content.includes("not a medical professional") || 
      content.includes("not medical advice") ||
      content.includes("consult with a qualified healthcare provider")) {
    return content;
  }
  
  // Add disclaimer
  return `${content}\n\n${DISCLAIMER_TEXT}`;
}