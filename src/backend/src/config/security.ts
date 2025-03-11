/**
 * Security Configuration Module
 * 
 * This module centralizes security-related configurations for the Health Advisor backend,
 * including CORS settings, HTTP security headers via Helmet, and rate limiting options.
 * It provides consistent security settings across the application and can be customized
 * for different environments.
 * 
 * @module config/security
 */

import cors from 'cors'; // ^2.8.5
import helmet from 'helmet'; // ^6.0.1
import { RateLimitOptions } from 'express-rate-limit'; // ^6.7.0
import { CORS_ORIGIN, IS_PRODUCTION, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from './environment';

/**
 * Creates CORS configuration options based on environment settings.
 * 
 * Configures Cross-Origin Resource Sharing (CORS) policy to define
 * which origins, methods, and headers are allowed when browsers make
 * requests to the API from different origins.
 * 
 * @returns CORS configuration object
 */
export function getCorsOptions(): cors.CorsOptions {
  // Parse CORS_ORIGIN to determine allowed origins
  const origins = CORS_ORIGIN.split(',').map(origin => origin.trim());
  
  const corsOptions: cors.CorsOptions = {
    // Allow specified origins or all in development
    origin: IS_PRODUCTION 
      ? (origins.length === 1 && origins[0] === '*' ? '*' : origins) 
      : '*',
    // Allow credentials (cookies, authorization headers)
    credentials: true,
    // Cache preflight response for 1 hour (3600 seconds)
    maxAge: 3600,
    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Allowed request headers
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // Headers exposed to the browser
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
  };
  
  return corsOptions;
}

/**
 * Creates Helmet middleware configuration for security headers.
 * 
 * Configures HTTP headers to help protect the application from
 * well-known web vulnerabilities like XSS, clickjacking, etc.
 * 
 * @returns Helmet configuration object
 */
export function getHelmetOptions(): helmet.HelmetOptions {
  const helmetOptions: helmet.HelmetOptions = {
    // Content Security Policy configuration
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", ...(IS_PRODUCTION ? [] : ["*"])],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: IS_PRODUCTION ? [] : null
      }
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // Prevent clickjacking attacks
    frameguard: {
      action: 'deny'
    },
    // Enable XSS protection in older browsers
    xssFilter: true,
    // Control browser DNS prefetching
    dnsPrefetchControl: {
      allow: false
    },
    // Disable client-side caching
    // Only use in situations where it's necessary, as it can affect performance
    noCache: false,
    // Limit referrer information sent on requests
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    },
    // Prevent browser from preferring HTTPS URLs while on HTTP
    hsts: IS_PRODUCTION ? {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    } : false
  };
  
  return helmetOptions;
}

/**
 * Creates rate limiting configuration options for API endpoints.
 * 
 * Configures request rate limiting to protect against brute force
 * attacks, DDoS, and other abuse by limiting the number of requests
 * a client can make within a specific time window.
 * 
 * @returns Rate limiting configuration object
 */
export function getRateLimitOptions(): RateLimitOptions {
  const rateLimitOptions: RateLimitOptions = {
    // Time window in milliseconds
    windowMs: RATE_LIMIT_WINDOW_MS,
    // Maximum number of requests per window
    max: RATE_LIMIT_MAX,
    // Standardized headers for rate limit info (RateLimit-*)
    standardHeaders: true,
    // Legacy headers (X-RateLimit-*)
    legacyHeaders: true,
    // Skip rate limiting in development or for trusted IPs
    skip: (req) => {
      // Skip rate limiting in development
      if (!IS_PRODUCTION) {
        return true;
      }
      
      // Optional: Skip for specific IPs if needed
      // const trustedIps = ['127.0.0.1'];
      // return trustedIps.includes(req.ip);
      
      return false;
    },
    // Custom message when rate limit is exceeded
    message: {
      status: 429,
      message: 'Too many requests, please try again later.'
    },
    // Store to use for rate limiting counts
    // Default is memory, but for production a more robust store like Redis is recommended
    // This would require additional configuration not included here
  };
  
  return rateLimitOptions;
}

/**
 * Centralized security configuration object.
 * 
 * This exports pre-configured security options for direct use in the application.
 * For custom configurations, use the individual getter functions instead.
 */
export const securityConfig = {
  corsOptions: getCorsOptions(),
  helmetOptions: getHelmetOptions(),
  rateLimitOptions: getRateLimitOptions()
};