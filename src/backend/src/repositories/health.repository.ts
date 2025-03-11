import mongoose, { Types } from 'mongoose'; // ^7.0.3
import { HealthDataModel } from '../models/health-data.model';
import { HealthData, HealthDataType } from '../types/health.types';
import { FileRepository } from './file.repository';
import { NotFoundError } from '../utils/error.util';
import { logger } from '../config/logger';

/**
 * Repository class that provides an abstraction layer for health data operations in MongoDB
 */
export class HealthRepository {
  private fileRepository: FileRepository;

  /**
   * Initializes the HealthRepository with database connection
   * 
   * @param connection - MongoDB connection
   */
  constructor(private connection: mongoose.Connection) {
    this.fileRepository = new FileRepository();
    logger.info('Health repository initialized');
  }

  /**
   * Creates a new health data record in the database
   * 
   * @param healthData - Health data to create
   * @returns The created health data record
   */
  async createHealthData(healthData: HealthData): Promise<HealthData> {
    try {
      logger.debug('Creating health data', { 
        userId: healthData.userId, 
        type: healthData.type 
      });
      
      const newHealthData = new HealthDataModel(healthData);
      await newHealthData.save();
      
      logger.info('Health data created successfully', { 
        id: newHealthData._id, 
        userId: healthData.userId.toString(),
        type: healthData.type
      });
      
      return newHealthData.toObject();
    } catch (error) {
      logger.error('Error creating health data', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId: healthData.userId.toString(),
        type: healthData.type
      });
      
      throw error;
    }
  }

  /**
   * Finds a health data record by its ID and user ID
   * 
   * @param id - ID of the health data record
   * @param userId - ID of the user who owns the record
   * @returns The health data record if found, null otherwise
   */
  async findHealthDataById(id: string, userId: string): Promise<HealthData | null> {
    try {
      logger.debug('Finding health data by ID', { id, userId });
      
      const userObjectId = new Types.ObjectId(userId);
      const healthData = await HealthDataModel.findByIdAndUserId(id, userObjectId);
      
      if (!healthData) {
        logger.debug('Health data not found', { id, userId });
        return null;
      }
      
      logger.debug('Health data found successfully', { id, userId });
      return healthData.toObject();
    } catch (error) {
      logger.error('Error finding health data by ID', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        id,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Finds health data records for a user with filtering and pagination
   * 
   * @param userId - ID of the user
   * @param options - Options for filtering and pagination
   * @returns Paginated health data records with total count
   */
  async findHealthDataByUserId(
    userId: string,
    options: {
      date?: string;
      type?: HealthDataType;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ items: HealthData[]; total: number }> {
    try {
      logger.debug('Finding health data for user', { userId, options });
      
      const { date, type, search, page = 1, limit = 20 } = options;
      const userObjectId = new Types.ObjectId(userId);
      
      // Initialize result to hold query results
      let result: { items: HealthData[]; total: number };
      
      // Apply filters based on options
      if (date) {
        // Convert date string to date range (start of day to end of day)
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        result = await HealthDataModel.findByDateRange(userObjectId, startDate, endDate, page, limit);
      } else if (type) {
        result = await HealthDataModel.findByType(userObjectId, type, page, limit);
      } else if (search) {
        result = await HealthDataModel.searchByText(userObjectId, search, page, limit);
      } else {
        result = await HealthDataModel.findByUserId(userObjectId, page, limit);
      }
      
      logger.debug('Health data found successfully', { 
        userId, 
        count: result.items.length,
        total: result.total
      });
      
      return {
        items: result.items.map(item => item.toObject()),
        total: result.total
      };
    } catch (error) {
      logger.error('Error finding health data for user', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId,
        options
      });
      
      throw error;
    }
  }

  /**
   * Updates an existing health data record
   * 
   * @param id - ID of the health data record
   * @param userId - ID of the user who owns the record
   * @param updateData - Partial health data for update
   * @returns The updated health data record if found, null otherwise
   */
  async updateHealthData(
    id: string,
    userId: string,
    updateData: Partial<HealthData>
  ): Promise<HealthData | null> {
    try {
      logger.debug('Updating health data', { id, userId });
      
      // Convert IDs to ObjectIds
      const userObjectId = new Types.ObjectId(userId);
      
      // First, find the record to ensure it exists
      const healthData = await HealthDataModel.findByIdAndUserId(id, userObjectId);
      
      if (!healthData) {
        logger.debug('Health data not found for update', { id, userId });
        return null;
      }
      
      // Update the record with the new data
      Object.assign(healthData, updateData);
      await healthData.save();
      
      logger.info('Health data updated successfully', { id, userId });
      
      return healthData.toObject();
    } catch (error) {
      logger.error('Error updating health data', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        id,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Deletes a health data record by its ID and user ID
   * 
   * @param id - ID of the health data record
   * @param userId - ID of the user who owns the record
   * @returns True if deletion was successful, false if record not found
   */
  async deleteHealthData(id: string, userId: string): Promise<boolean> {
    try {
      logger.debug('Deleting health data', { id, userId });
      
      const userObjectId = new Types.ObjectId(userId);
      
      // First, find the record to ensure it exists
      const healthData = await HealthDataModel.findByIdAndUserId(id, userObjectId);
      
      if (!healthData) {
        logger.debug('Health data not found for deletion', { id, userId });
        return false;
      }
      
      // Delete the health data record
      await healthData.deleteOne();
      
      logger.info('Health data deleted successfully', { id, userId });
      
      // If the health data has associated files, delete them
      if (healthData.fileIds && healthData.fileIds.length > 0) {
        try {
          // We're not awaiting this as it's not critical for the deletion operation
          // File cleanup can happen asynchronously
          this.fileRepository.deleteFilesByHealthDataId(id);
        } catch (fileError) {
          logger.error('Error deleting associated files', {
            error: (fileError as Error).message,
            id,
            userId
          });
          // We continue even if file deletion fails
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error deleting health data', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        id,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Enriches health data records with associated file information
   * 
   * @param healthData - Health data record or array of records to enrich
   * @returns Health data enriched with file information
   */
  async enrichHealthDataWithFiles(
    healthData: HealthData | HealthData[]
  ): Promise<HealthData | HealthData[]> {
    try {
      // If healthData is a single record, handle it directly
      if (!Array.isArray(healthData)) {
        if (healthData.fileIds && healthData.fileIds.length > 0) {
          const healthDataIdString = (healthData as any)._id?.toString();
          if (healthDataIdString) {
            const files = await this.fileRepository.getFilesByHealthDataId(healthDataIdString);
            // Attach file information to the health data record
            return {
              ...healthData,
              files: files.map(file => ({
                id: file._id.toString(),
                url: `/api/files/${file._id}`,
                contentType: file.contentType,
                filename: file.metadata.originalname
              }))
            };
          }
        }
        return healthData;
      }
      
      // If healthData is an array, process each record
      const enrichedData = await Promise.all(
        healthData.map(async (item) => {
          if (item.fileIds && item.fileIds.length > 0) {
            const healthDataIdString = (item as any)._id?.toString();
            if (healthDataIdString) {
              const files = await this.fileRepository.getFilesByHealthDataId(healthDataIdString);
              return {
                ...item,
                files: files.map(file => ({
                  id: file._id.toString(),
                  url: `/api/files/${file._id}`,
                  contentType: file.contentType,
                  filename: file.metadata.originalname
                }))
              };
            }
          }
          return item;
        })
      );
      
      return enrichedData;
    } catch (error) {
      logger.error('Error enriching health data with files', {
        error: (error as Error).message,
        stack: (error as Error).stack
      });
      
      throw error;
    }
  }

  /**
   * Retrieves recent health data records for a user, grouped by type
   * 
   * @param userId - ID of the user
   * @param limit - Maximum number of records to retrieve per type
   * @returns Recent health data grouped by type
   */
  async getRecentHealthData(
    userId: string,
    limit: number = 5
  ): Promise<{
    meals: HealthData[];
    labResults: HealthData[];
    symptoms: HealthData[];
  }> {
    try {
      logger.debug('Getting recent health data for user', { userId, limit });
      
      const userObjectId = new Types.ObjectId(userId);
      
      // Get recent data for each type
      const [meals, labResults, symptoms] = await Promise.all([
        HealthDataModel.findByType(userObjectId, HealthDataType.MEAL, 1, limit),
        HealthDataModel.findByType(userObjectId, HealthDataType.LAB_RESULT, 1, limit),
        HealthDataModel.findByType(userObjectId, HealthDataType.SYMPTOM, 1, limit)
      ]);
      
      logger.debug('Recent health data retrieved successfully', { 
        userId, 
        mealCount: meals.items.length,
        labResultCount: labResults.items.length,
        symptomCount: symptoms.items.length
      });
      
      return {
        meals: meals.items.map(item => item.toObject()),
        labResults: labResults.items.map(item => item.toObject()),
        symptoms: symptoms.items.map(item => item.toObject())
      };
    } catch (error) {
      logger.error('Error getting recent health data', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId
      });
      
      throw error;
    }
  }
}