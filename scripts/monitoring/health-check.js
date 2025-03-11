/**
 * Health Advisor Backend Health Check Script
 * 
 * This script performs health checks on the Health Advisor backend services,
 * verifying the availability and status of the API, database, and LLM integration.
 * It can be run as a standalone script or scheduled as a cron job for continuous monitoring.
 * 
 * Usage:
 *  - node health-check.js
 * 
 * Environment variables:
 *  - API_URL: URL of the backend API (default: http://localhost:5000)
 *  - LOG_LEVEL: Logging level (default: info)
 *  - ALERT_METHOD: Method for sending alerts (default: log)
 */

const axios = require('axios'); // axios ^1.3.0
const dotenv = require('dotenv'); // dotenv ^16.0.3
const winston = require('winston'); // winston ^3.8.2
const fs = require('fs');
const path = require('path');

// Global configuration
const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:5000',
  HEALTH_ENDPOINT: '/health',
  TIMEOUT_MS: 5000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  ALERT_THRESHOLD: 3,
  LOG_FILE: './logs/health-check.log'
};

// Simple in-memory storage for failure counts
let failureCounter = 0;
const counterFile = './healthcheck-failures.json';

/**
 * Configures Winston logger with console and file transports
 * @returns {winston.Logger} Configured Winston logger instance
 */
function setupLogger() {
  // Create log directory if it doesn't exist
  const logDir = path.dirname(CONFIG.LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Configure logger with console and file transports
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: 'health-check' },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      // File transport with daily rotation
      new winston.transports.File({
        filename: CONFIG.LOG_FILE,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    ]
  });

  return logger;
}

/**
 * Performs a health check on the backend API
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<object>} Health check result with status and details
 */
async function checkApiHealth(logger) {
  const healthUrl = `${CONFIG.API_URL}${CONFIG.HEALTH_ENDPOINT}`;
  logger.info(`Checking API health at: ${healthUrl}`);

  let attempts = 0;
  let lastError = null;

  while (attempts < CONFIG.RETRY_ATTEMPTS) {
    try {
      const response = await axios.get(healthUrl, {
        timeout: CONFIG.TIMEOUT_MS,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Validate response
      if (response.status === 200 && response.data) {
        logger.info('Health check successful', { 
          statusCode: response.status,
          responseTime: response.headers['x-response-time'] || 'unknown'
        });
        return response.data;
      } else {
        logger.warn('Unexpected health check response', { 
          statusCode: response.status,
          data: response.data
        });
        lastError = new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      attempts++;
      lastError = error;
      
      logger.warn(`Health check attempt ${attempts} failed`, { 
        error: error.message,
        code: error.code,
        isAxiosError: error.isAxiosError || false
      });

      if (attempts < CONFIG.RETRY_ATTEMPTS) {
        logger.info(`Retrying in ${CONFIG.RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
      }
    }
  }

  logger.error('Health check failed after multiple attempts', {
    attempts: CONFIG.RETRY_ATTEMPTS,
    lastError: lastError ? lastError.message : 'Unknown error'
  });

  // Return error status when all attempts fail
  return {
    status: 'error',
    api: {
      status: 'down',
      error: lastError ? lastError.message : 'Failed to connect to API'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Evaluates the health check results and determines overall system health
 * @param {object} healthResult - Health check result from API
 * @param {winston.Logger} logger - Logger instance
 * @returns {object} Evaluation result with overall status and component details
 */
function evaluateHealthStatus(healthResult, logger) {
  const result = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    components: {
      api: { status: 'unknown' },
      database: { status: 'unknown' },
      llm: { status: 'unknown' }
    }
  };

  // Check if we got a valid health result
  if (!healthResult || healthResult.status === 'error') {
    result.overall = 'unhealthy';
    result.components.api = {
      status: 'down',
      details: healthResult?.api?.error || 'API health check failed'
    };
    logger.error('API health check failed', { result });
    return result;
  }

  // Check API status
  result.components.api = {
    status: 'up',
    version: healthResult.version || 'unknown',
    uptime: healthResult.uptime || 'unknown'
  };

  // Check database status
  if (healthResult.database) {
    const dbStatus = healthResult.database.status === 'connected' ? 'up' : 'down';
    result.components.database = {
      status: dbStatus,
      details: healthResult.database.details || null,
      responseTime: healthResult.database.responseTime || null
    };
    
    if (dbStatus === 'down') {
      result.overall = 'unhealthy';
      logger.error('Database health check failed', { 
        database: result.components.database 
      });
    }
  } else {
    result.components.database = {
      status: 'unknown',
      details: 'No database information provided'
    };
    logger.warn('No database health information available');
  }

  // Check LLM status
  if (healthResult.llm) {
    const llmStatus = healthResult.llm.status === 'available' ? 'up' : 'down';
    result.components.llm = {
      status: llmStatus,
      provider: healthResult.llm.provider || 'unknown',
      details: healthResult.llm.details || null,
      responseTime: healthResult.llm.responseTime || null
    };
    
    if (llmStatus === 'down') {
      result.overall = 'degraded';
      logger.warn('LLM service is unavailable', { 
        llm: result.components.llm 
      });
    }
  } else {
    result.components.llm = {
      status: 'unknown',
      details: 'No LLM service information provided'
    };
    logger.warn('No LLM health information available');
  }

  // Log appropriate message based on overall status
  if (result.overall === 'healthy') {
    logger.info('All systems operational', { components: result.components });
  } else if (result.overall === 'degraded') {
    logger.warn('System is in degraded state', { components: result.components });
  } else {
    logger.error('System is unhealthy', { components: result.components });
  }

  return result;
}

/**
 * Sends alerts if health check fails repeatedly
 * @param {object} evaluationResult - Result of health evaluation
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<void>}
 */
async function sendAlertIfNeeded(evaluationResult, logger) {
  // Try to load previous failure count from file
  try {
    if (fs.existsSync(counterFile)) {
      const data = fs.readFileSync(counterFile, 'utf8');
      const counterData = JSON.parse(data);
      failureCounter = counterData.count || 0;
    }
  } catch (error) {
    logger.error('Error reading failure counter file', { error: error.message });
    // Continue with in-memory counter
  }

  if (evaluationResult.overall !== 'healthy') {
    failureCounter++;
    logger.warn(`System unhealthy, incrementing failure counter to ${failureCounter}`);
    
    if (failureCounter >= CONFIG.ALERT_THRESHOLD) {
      logger.error(`Alert threshold reached (${CONFIG.ALERT_THRESHOLD} failures)`);
      
      // In a real implementation, this would send an alert via email, SMS, or
      // integration with monitoring systems like PagerDuty, OpsGenie, etc.
      await sendAlert(evaluationResult, logger);
      
      // Reset counter after alert to prevent alert spam
      failureCounter = 0;
      logger.info('Alert sent, resetting failure counter');
    }
  } else {
    // Reset counter on successful health check
    if (failureCounter > 0) {
      logger.info(`System recovered, resetting failure counter from ${failureCounter} to 0`);
      failureCounter = 0;
    }
  }

  // Save failure counter to file
  try {
    const counterData = {
      count: failureCounter,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(counterFile, JSON.stringify(counterData, null, 2));
  } catch (error) {
    logger.error('Error writing failure counter to file', { error: error.message });
  }
}

/**
 * Send an alert through configured channels
 * @param {object} evaluationResult - Result of health evaluation
 * @param {winston.Logger} logger - Logger instance
 * @returns {Promise<void>}
 */
async function sendAlert(evaluationResult, logger) {
  logger.info('Sending alert', { 
    alertMethod: process.env.ALERT_METHOD || 'log', 
    evaluation: evaluationResult 
  });

  // This is a placeholder for actual alert implementation
  // In a real application, this would integrate with email, SMS, or monitoring systems
  
  // Example alert log with prominent formatting
  console.log('\n');
  console.log('='.repeat(80));
  console.log(`ALERT: Health Advisor System Unhealthy - ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  console.log('Components Status:');
  for (const [component, status] of Object.entries(evaluationResult.components)) {
    console.log(`- ${component.toUpperCase()}: ${status.status.toUpperCase()}`);
    if (status.details) {
      console.log(`  Details: ${status.details}`);
    }
  }
  console.log('='.repeat(80));
  console.log('\n');

  // Simulate alert sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Main function that orchestrates the health check process
 * @returns {Promise<void>}
 */
async function main() {
  // Load environment variables
  dotenv.config();
  
  // Set up logger
  const logger = setupLogger();
  logger.info('Starting health check for Health Advisor backend services');

  try {
    // Check API health
    const healthResult = await checkApiHealth(logger);
    
    // Evaluate health status
    const evaluationResult = evaluateHealthStatus(healthResult, logger);
    
    // Send alerts if needed
    await sendAlertIfNeeded(evaluationResult, logger);
    
    logger.info('Health check completed', { 
      timestamp: new Date().toISOString(),
      overall: evaluationResult.overall
    });

    // Exit with appropriate code
    if (evaluationResult.overall === 'healthy') {
      process.exit(0);
    } else if (evaluationResult.overall === 'degraded') {
      process.exit(1);
    } else {
      process.exit(2);
    }
  } catch (error) {
    logger.error('Unhandled error in health check process', {
      error: error.message,
      stack: error.stack
    });
    process.exit(3);
  }
}

// Run the script if it's called directly
if (require.main === module) {
  main();
}

// Export functions for use in other modules
module.exports = {
  checkApiHealth,
  evaluateHealthStatus,
  sendAlertIfNeeded,
  setupLogger,
  main
};