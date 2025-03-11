import express, { Router } from 'express'; // ^4.18.2
import mongoose from 'mongoose';
import { HealthController } from '../controllers/health.controller';
import { authenticate } from '../middlewares/auth.middleware';
import {
  validateBody,
  validateQuery,
  validateParams
} from '../middlewares/validation.middleware';
import {
  healthDataUpload,
  handleUploadError
} from '../middlewares/file.middleware';
import {
  validateCreateHealthDataSchema,
  validateGetHealthDataSchema,
  validateHealthDataIdSchema
} from '../validators/health.validator';

/**
 * Creates and configures the Express router for health data endpoints
 * 
 * This function sets up all routes for handling health data operations including
 * creating, retrieving, updating, and deleting health records (meals, lab results, symptoms).
 * It applies appropriate middleware for authentication, validation, and file handling.
 * 
 * @param connection - MongoDB connection instance for database operations
 * @returns Configured Express router with health data routes
 */
function createHealthRouter(connection: mongoose.Connection): Router {
  // Create a new Express router
  const router = express.Router();
  
  // Initialize the HealthController with the database connection
  const healthController = new HealthController(connection);
  
  // POST /health - Create health data (meal, lab result, symptom)
  router.post(
    '/',
    authenticate,
    healthDataUpload().array('files', 5), // Allow up to 5 files
    handleUploadError,
    validateBody(validateCreateHealthDataSchema()),
    healthController.createHealthData
  );
  
  // GET /health - Get all health data with filtering and pagination
  router.get(
    '/',
    authenticate,
    validateQuery(validateGetHealthDataSchema()),
    healthController.getHealthData
  );
  
  // GET /health/llm-context - Get health context for LLM
  // This must be defined before the :id route to avoid route conflicts
  router.get(
    '/llm-context',
    authenticate,
    healthController.getHealthContext
  );
  
  // GET /health/:id - Get specific health data by ID
  router.get(
    '/:id',
    authenticate,
    validateParams(validateHealthDataIdSchema()),
    healthController.getHealthDataById
  );
  
  // PUT /health/:id - Update health data
  router.put(
    '/:id',
    authenticate,
    healthDataUpload().array('files', 5), // Allow up to 5 files
    handleUploadError,
    validateBody(validateCreateHealthDataSchema()),
    validateParams(validateHealthDataIdSchema()),
    healthController.updateHealthData
  );
  
  // DELETE /health/:id - Delete health data
  router.delete(
    '/:id',
    authenticate,
    validateParams(validateHealthDataIdSchema()),
    healthController.deleteHealthData
  );
  
  return router;
}

export default createHealthRouter;