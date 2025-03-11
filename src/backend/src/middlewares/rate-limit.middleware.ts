/**
 * Rate Limiting Middleware
 * 
 * This middleware implements rate limiting for the Express backend to prevent
 * abuse and ensure fair usage of API resources. It provides configurable rate
 * limiting for different types of endpoints with specific focus on authentication
 * and chat endpoints.
 * 
 * @module middlewares/rate-limit.middleware
 */

import rateLimit from 'express-rate-limit'; // ^6.7.0
import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { environment } from '../config/environment';
import { securityConfig } from '../config/security';
import logger from '../config/logger';

/**
 * Creates a rate limit middleware with custom configuration
 * 
 * @param options - Custom rate limiting options to override defaults
 * @returns Configured rate limit middleware
 */
export function createRateLimitMiddleware(options = {}) {
  // Merge provided options with default options from security config
  const rateLimitOptions = {
    ...securityConfig.rateLimitOptions,
    ...options,
    // Custom handler to log rate limit exceeded and provide standardized response
    handler: (req: Request, res: Response, _next: NextFunction, optionsUsed: any) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
      
      // Use message from options if provided, or default message
      let responseMessage = 'Too many requests, please try again later.';
      
      if (optionsUsed.message) {
        if (typeof optionsUsed.message === 'object' && optionsUsed.message.message) {
          responseMessage = optionsUsed.message.message;
        } else if (typeof optionsUsed.message === 'string') {
          responseMessage = optionsUsed.message;
        }
      }
      
      // Send the response
      res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message: responseMessage,
        retryAfter: Math.ceil(optionsUsed.windowMs / 1000)
      });
    }
  };

  return rateLimit(rateLimitOptions);
}

/**
 * Default rate limiting middleware for general API endpoints
 * Uses the default configuration from security settings
 */
export const rateLimitMiddleware = createRateLimitMiddleware();

/**
 * Stricter rate limiting middleware for authentication endpoints
 * This helps prevent brute force attacks on login and signup endpoints
 */
export const authRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    message: 'Too many authentication attempts, please try again later.'
  },
  // Rate limiter key based on IP address to prevent authentication brute force
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  }
});

/**
 * Specialized rate limiting middleware for chat endpoints
 * Ensures fair usage of LLM resources
 */
export const chatRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    message: 'Chat request limit reached, please slow down your requests.'
  }
});