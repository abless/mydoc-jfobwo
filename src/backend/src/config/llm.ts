/**
 * LLM Configuration Module
 * 
 * This module provides configuration settings for integrating with the Large Language Model
 * (LLM) provider. It defines connection parameters, model settings, and default request
 * configurations for optimal interaction with the LLM API.
 * 
 * The configuration includes:
 * - Provider API connection details (API key, URL, headers, timeout)
 * - Model specification for the LLM
 * - Default request parameters that control response generation
 * 
 * These settings are specifically tuned for generating health advice that is
 * factual, clear, and appropriately detailed.
 * 
 * @module config/llm
 */

import { environment } from './environment';
import logger from './logger';

/**
 * Validates that all required LLM configuration parameters are present
 * 
 * This function checks if the necessary environment variables for LLM integration
 * are defined and logs warnings for any missing values.
 */
export function validateLLMConfig(): void {
  const missingParams: string[] = [];
  
  if (!environment.LLM_PROVIDER_API_KEY) {
    missingParams.push('LLM_PROVIDER_API_KEY');
  }
  
  if (!environment.LLM_PROVIDER_URL) {
    missingParams.push('LLM_PROVIDER_URL');
  }
  
  if (!environment.LLM_MODEL) {
    missingParams.push('LLM_MODEL');
  }
  
  if (missingParams.length > 0) {
    logger.debug(`Missing LLM configuration parameters: ${missingParams.join(', ')}`);
  } else {
    logger.debug('All LLM configuration parameters are present');
  }
}

/**
 * LLM configuration settings
 */
export const llmConfig = {
  /**
   * LLM provider API connection settings
   */
  provider: {
    /**
     * API key for authenticating with the LLM provider
     */
    apiKey: environment.LLM_PROVIDER_API_KEY,
    
    /**
     * Base URL for the LLM provider API
     */
    baseUrl: environment.LLM_PROVIDER_URL,
    
    /**
     * HTTP headers for API requests
     */
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.LLM_PROVIDER_API_KEY}`
    },
    
    /**
     * Request timeout in milliseconds
     * Increased to accommodate potentially longer LLM processing times for health queries
     * Default: 30 seconds
     */
    timeout: 30000
  },
  
  /**
   * LLM model identifier
   */
  model: environment.LLM_MODEL,
  
  /**
   * Default parameters for LLM requests
   * These parameters are optimized for generating health-related advice
   * that balances factual accuracy with conversational tone.
   */
  requestDefaults: {
    /**
     * Controls randomness in response generation (0.0-1.0)
     * Set lower for health advice to favor consistent, factual responses
     * Default: 0.5 (more deterministic for health information)
     */
    temperature: 0.5,
    
    /**
     * Maximum number of tokens in the response
     * Set higher to allow for comprehensive health explanations when needed
     * Default: 1500 tokens
     */
    maxTokens: 1500,
    
    /**
     * Controls diversity via nucleus sampling (0.0-1.0)
     * Default: 1.0 (consider all tokens)
     */
    topP: 1.0,
    
    /**
     * Reduces repetition of token sequences
     * Set higher for health advice to avoid repeating the same information
     * Default: 0.1 (slight frequency penalty)
     */
    frequencyPenalty: 0.1,
    
    /**
     * Encourages the model to talk about new topics
     * Slightly increased to encourage addressing different aspects of health questions
     * Default: 0.1 (slight presence penalty)
     */
    presencePenalty: 0.1
  }
};