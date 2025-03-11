import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import mongoose from 'mongoose'; // ^7.0.3
import { HealthService } from '../services/health.service';
import {
  CreateHealthDataRequest,
  GetHealthDataRequest,
  HealthDataResponse,
  HealthContext
} from '../types/health.types';
import { AuthenticatedRequest } from '../types/auth.types';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sendError
} from '../utils/response.util';
import { NotFoundError, BadRequestError } from '../utils/error.util';
import { logger } from '../config/logger';

/**
 * Controller class that handles HTTP requests for health data operations
 */
export class HealthController {
  private healthService: HealthService;

  /**
   * Initializes the HealthController with database connection
   * 
   * @param connection - MongoDB connection
   */
  constructor(connection: mongoose.Connection) {
    this.healthService = new HealthService(connection);
    logger.info('Health controller initialized');
  }

  /**
   * Creates a new health data record with optional file attachments
   * 
   * @param req - Authenticated request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async createHealthData(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('Creating health data', { userId: req.user.id });
      
      const userId = req.user.id;
      const healthDataRequest = req.body as CreateHealthDataRequest;
      const files = req.files as Express.Multer.File[] | undefined;
      
      const createdHealthData = await this.healthService.createHealthData(
        healthDataRequest,
        userId,
        files
      );
      
      sendCreated(res, createdHealthData, 'Health data created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific health data record by its ID
   * 
   * @param req - Authenticated request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getHealthDataById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const userId = req.user.id;
      
      logger.info('Getting health data by ID', { id, userId });
      
      const healthData = await this.healthService.getHealthDataById(id, userId);
      
      if (!healthData) {
        throw new NotFoundError(`Health data with ID ${id} not found`, 'healthData');
      }
      
      sendSuccess(res, healthData, 'Health data retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves health data records for a user with filtering and pagination
   * 
   * @param req - Authenticated request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getHealthData(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info('Getting health data list', { userId: req.user.id });
      
      const userId = req.user.id;
      const { date, type, search, page, limit } = req.query;
      
      const options: GetHealthDataRequest = {
        date: date as string,
        type: type as any,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };
      
      const { items, total, page: currentPage } = await this.healthService.getHealthData(
        options,
        userId
      );
      
      sendPaginated(
        res,
        items,
        total,
        currentPage,
        options.limit || 20,
        'Health data retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing health data record with optional new files
   * 
   * @param req - Authenticated request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async updateHealthData(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const userId = req.user.id;
      
      logger.info('Updating health data', { id, userId });
      
      const updateData = req.body;
      const files = req.files as Express.Multer.File[] | undefined;
      
      const updatedHealthData = await this.healthService.updateHealthData(
        id,
        userId,
        updateData,
        files
      );
      
      if (!updatedHealthData) {
        throw new NotFoundError(`Health data with ID ${id} not found`, 'healthData');
      }
      
      sendSuccess(res, updatedHealthData, 'Health data updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a health data record and its associated files
   * 
   * @param req - Authenticated request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async deleteHealthData(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;
      const userId = req.user.id;
      
      logger.info('Deleting health data', { id, userId });
      
      const deleted = await this.healthService.deleteHealthData(id, userId);
      
      if (!deleted) {
        throw new NotFoundError(`Health data with ID ${id} not found`, 'healthData');
      }
      
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves recent health data for a user to provide context for LLM interactions
   * 
   * @param req - Authenticated request object
   * @param res - Express response object
   * @param next - Express next function
   */
  async getHealthContext(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      
      logger.info('Getting health context', { userId });
      
      const healthContext = await this.healthService.getHealthContext(userId, limit);
      
      sendSuccess(res, healthContext, 'Health context retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}