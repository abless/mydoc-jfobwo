import axios from 'axios'; // ^1.3.5
import mongoose from 'mongoose'; // ^7.0.3

import { llm, logger } from '../config';
import { LLMMessage, LLMRequest, LLMResponse, ChatRole, HealthContext } from '../types';
import { ServiceUnavailableError } from '../utils/error.util';
import { getConversationHistory } from '../repositories/chat.repository';
import { HealthService } from './health.service';

/**
 * Service class that handles interactions with the LLM provider
 */
export class LLMService {
  private healthService: HealthService;
  private systemPrompts: {
    base: string;
    noContext: string;
    disclaimer: string;
  };
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  /**
   * Initializes the LLM service with database connection
   * 
   * @param connection - MongoDB connection
   */
  constructor(private connection: mongoose.Connection) {
    // Initialize HealthService with the connection
    this.healthService = new HealthService(connection);

    // Set up system prompts for different contexts
    this.systemPrompts = {
      base: `You are a helpful health advisor that provides general wellness information based on the user's health data. 
      You must NOT provide medical diagnosis, prescribe medication, or give treatment advice. 
      Always encourage users to consult healthcare professionals for medical concerns.
      Use the provided health context to give personalized wellness advice, but be clear about your limitations.
      Be conversational, empathetic, and focus on evidence-based information.`,

      noContext: `You are a helpful health advisor that provides general wellness information.
      Since I don't have access to your specific health information, my responses will be general in nature.
      I must NOT provide medical diagnosis, prescribe medication, or give treatment advice.
      Always consult healthcare professionals for medical concerns.`,

      disclaimer: `IMPORTANT: This information is for general wellness purposes only and not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers with questions about your health conditions.`
    };

    // Configure retry settings
    this.maxRetries = 3;
    this.retryDelay = 1000; // Base delay in ms

    logger.info('LLM service initialized');
  }

  /**
   * Sends a user message to the LLM with health context and conversation history
   * 
   * @param message - User message text
   * @param userId - User ID for context retrieval
   * @param conversationId - Optional conversation ID for history retrieval
   * @returns The processed response from the LLM
   * @throws ServiceUnavailableError if the LLM service is unavailable after retries
   */
  async sendMessage(
    message: string,
    userId: string,
    conversationId?: string
  ): Promise<LLMResponse> {
    try {
      logger.info('Sending message to LLM', { userId, conversationId: conversationId || 'new' });

      // Build context from user's health data and conversation history
      const context = await this.buildContext(userId, conversationId);

      // Construct prompt with system instructions, context, and user message
      const messages = this.constructPrompt(message, context);

      // Send request to LLM provider with retry logic
      const response = await this.sendRequest(messages, userId);

      // Process and validate the response
      const processedResponse = this.processResponse(response);

      // Add health disclaimer if not already present
      if (!processedResponse.content.includes(this.systemPrompts.disclaimer)) {
        processedResponse.content = this.addHealthDisclaimer(processedResponse.content);
      }

      logger.info('LLM response processed successfully', { userId, conversationId: conversationId || 'new' });
      return processedResponse;

    } catch (error) {
      logger.error('Error sending message to LLM', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId,
        conversationId
      });

      // If it's a service unavailable error, return a fallback response
      if (error instanceof ServiceUnavailableError) {
        logger.warn('Using fallback response due to LLM service unavailability', { userId });
        return this.getFallbackResponse();
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Builds context for LLM from user's health data and conversation history
   * 
   * @param userId - User ID for health data retrieval
   * @param conversationId - Optional conversation ID for history retrieval
   * @returns Formatted context string for LLM prompt
   */
  async buildContext(userId: string, conversationId?: string): Promise<string> {
    try {
      logger.debug('Building context for LLM prompt', { userId, conversationId });

      // Get user's recent health data
      const healthContext = await this.healthService.getHealthContext(userId, 5);

      // Get recent conversation history if conversationId provided
      let conversationHistory: any[] = [];
      if (conversationId) {
        conversationHistory = await getConversationHistory(conversationId, 10);
      }

      // Format health data into context sections
      let contextSections: string[] = [];

      // Format recent meals
      if (healthContext.recentMeals && healthContext.recentMeals.length > 0) {
        const mealSection = `Recent meals: ${healthContext.recentMeals.map(meal => 
          `${new Date(meal.timestamp).toLocaleString()}: ${meal.data.description}`
        ).join('; ')}`;
        contextSections.push(mealSection);
      }

      // Format recent lab results
      if (healthContext.recentLabResults && healthContext.recentLabResults.length > 0) {
        const labSection = `Recent lab results: ${healthContext.recentLabResults.map(lab => 
          `${lab.data.testType} (${new Date(lab.timestamp).toLocaleDateString()}): ${
            JSON.stringify(lab.data.results || {})
          }`
        ).join('; ')}`;
        contextSections.push(labSection);
      }

      // Format recent symptoms
      if (healthContext.recentSymptoms && healthContext.recentSymptoms.length > 0) {
        const symptomSection = `Recent symptoms: ${healthContext.recentSymptoms.map(symptom => 
          `${symptom.data.description} (Severity: ${symptom.data.severity}, Duration: ${symptom.data.duration || 'Not specified'}, Reported: ${new Date(symptom.timestamp).toLocaleString()})`
        ).join('; ')}`;
        contextSections.push(symptomSection);
      }

      // If we have conversation history, include recent messages
      if (conversationHistory.length > 0) {
        const conversationSection = `Recent conversation: ${conversationHistory.map(msg => 
          `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
        ).join(' | ')}`;
        contextSections.push(conversationSection);
      }

      // If no health data available, return empty string (will use no-context prompt)
      if (contextSections.length === 0) {
        logger.debug('No health context available for user', { userId });
        return '';
      }

      // Combine all context sections
      const formattedContext = `
        USER HEALTH CONTEXT:
        ${contextSections.join('\n')}
      `;

      logger.debug('Context built successfully', { 
        userId, 
        contextLength: formattedContext.length,
        sections: contextSections.length
      });

      return formattedContext;
    } catch (error) {
      logger.error('Error building context', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId
      });
      
      // Return empty context on error, allowing conversation to continue without context
      return '';
    }
  }

  /**
   * Constructs a complete prompt for the LLM with system instructions, context, and user message
   * 
   * @param message - User message text
   * @param context - Formatted health context string
   * @returns Array of messages forming the complete prompt
   */
  constructPrompt(message: string, context: string): LLMMessage[] {
    // Initialize messages array
    const messages: LLMMessage[] = [];

    // Add system message with instructions
    messages.push({
      role: ChatRole.SYSTEM,
      content: context ? this.systemPrompts.base : this.systemPrompts.noContext
    });

    // Add context as a separate system message if available
    if (context && context.trim() !== '') {
      messages.push({
        role: ChatRole.SYSTEM,
        content: context
      });
    }

    // Add user message
    messages.push({
      role: ChatRole.USER,
      content: message
    });

    return messages;
  }

  /**
   * Sends a request to the LLM provider with retry logic for failures
   * 
   * @param messages - Array of messages for the LLM
   * @param userId - User ID for tracking
   * @returns The response from the LLM provider
   * @throws ServiceUnavailableError if the LLM service is unavailable after retries
   */
  async sendRequest(messages: LLMMessage[], userId: string): Promise<any> {
    // Prepare request payload
    const requestPayload = {
      model: llm.model,
      messages: messages,
      max_tokens: llm.requestDefaults.maxTokens,
      temperature: llm.requestDefaults.temperature,
      top_p: llm.requestDefaults.topP,
      frequency_penalty: llm.requestDefaults.frequencyPenalty,
      presence_penalty: llm.requestDefaults.presencePenalty,
      user: userId // For tracking
    };

    // Set up request config
    const requestConfig = {
      headers: llm.provider.headers,
      timeout: llm.provider.timeout
    };

    let lastError: Error | null = null;
    let attempt = 0;

    // Implement retry logic with exponential backoff
    while (attempt < this.maxRetries) {
      try {
        logger.debug(`LLM request attempt ${attempt + 1}/${this.maxRetries}`, { userId });
        
        // Send request to LLM provider
        const response = await axios.post(
          llm.provider.baseUrl,
          requestPayload,
          requestConfig
        );

        // Return response data
        return response.data;
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        logger.warn(`LLM request failed (attempt ${attempt}/${this.maxRetries})`, {
          error: (error as any).message,
          userId,
          statusCode: (error as any).response?.status
        });

        // If we've reached max retries, break out of the loop
        if (attempt >= this.maxRetries) {
          break;
        }

        // Calculate exponential backoff delay with jitter
        const delay = Math.min(
          this.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
          10000 // Maximum 10s delay
        );

        logger.debug(`Retrying LLM request in ${delay}ms`, { userId, attempt });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we've exhausted retries, throw a ServiceUnavailableError
    logger.error('LLM service unavailable after maximum retry attempts', {
      error: lastError?.message,
      userId,
      maxRetries: this.maxRetries
    });

    throw new ServiceUnavailableError(
      'Unable to communicate with LLM service after multiple attempts',
      'LLM Provider'
    );
  }

  /**
   * Processes and validates the LLM response
   * 
   * @param response - Raw response from LLM provider
   * @returns Processed and validated response
   */
  processResponse(response: any): LLMResponse {
    try {
      // Extract the assistant's message from the response
      // Structure depends on the LLM provider's API format
      let content = '';

      // Handle OpenAI-style response format
      if (response.choices && response.choices.length > 0) {
        if (response.choices[0].message) {
          content = response.choices[0].message.content;
        } else if (response.choices[0].text) {
          content = response.choices[0].text;
        }
      }

      // Handle direct completion response format
      if (!content && response.content) {
        content = response.content;
      }

      // Validate that we have extracted content
      if (!content) {
        logger.error('Invalid LLM response format', { response });
        throw new Error('Invalid response format from LLM provider');
      }

      // Apply safety filters
      content = this.applySafetyFilters(content);

      // Format response
      const formattedResponse: LLMResponse = {
        content,
        metadata: {
          model: response.model || llm.model,
          processedAt: new Date().toISOString(),
          tokenUsage: response.usage
        }
      };

      return formattedResponse;
    } catch (error) {
      logger.error('Error processing LLM response', {
        error: (error as Error).message,
        response
      });
      throw error;
    }
  }

  /**
   * Applies safety filters to LLM content to remove potentially harmful advice
   * 
   * @param content - LLM response content
   * @returns Filtered content
   */
  private applySafetyFilters(content: string): string {
    // Replace any language that makes medical claims with more cautious language
    const safetyRules = [
      {
        pattern: /\b(diagnose|diagnosis|diagnoses|diagnosing)\b/gi,
        replacement: 'potentially indicate'
      },
      {
        pattern: /\b(prescribe|prescription|treatment plan)\b/gi,
        replacement: 'consider discussing with your doctor'
      },
      {
        pattern: /\b(cure|treat|heal)\b/gi,
        replacement: 'potentially help with'
      },
      {
        pattern: /\b(should take|must take|need to take)\b/gi,
        replacement: 'might consider discussing with your doctor'
      }
    ];

    let filteredContent = content;
    for (const rule of safetyRules) {
      filteredContent = filteredContent.replace(rule.pattern, rule.replacement);
    }

    return filteredContent;
  }

  /**
   * Adds a health advice disclaimer to the LLM response
   * 
   * @param content - LLM response content
   * @returns Content with added disclaimer
   */
  addHealthDisclaimer(content: string): string {
    // Check if content already contains a disclaimer
    if (content.includes('not a substitute for professional medical advice') || 
        content.includes('not medical advice') ||
        content.includes('consult healthcare professionals') ||
        content.includes(this.systemPrompts.disclaimer)) {
      return content;
    }

    // Add disclaimer at the end
    return `${content}\n\n${this.systemPrompts.disclaimer}`;
  }

  /**
   * Provides a fallback response when the LLM service is unavailable
   * 
   * @returns Generic fallback response
   */
  getFallbackResponse(): LLMResponse {
    return {
      content: `I apologize, but I'm currently unable to provide a personalized response. Our service is experiencing technical difficulties. Please try again in a few minutes. If you have an urgent health concern, please contact your healthcare provider directly.`,
      metadata: {
        fallback: true,
        processedAt: new Date().toISOString()
      }
    };
  }
}