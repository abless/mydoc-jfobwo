import mongoose, { Types } from 'mongoose'; // ^7.0.3
import { HealthRepository } from '../repositories/health.repository';
import { FileService } from './file.service';
import {
  HealthData,
  HealthDataType,
  CreateHealthDataRequest,
  GetHealthDataRequest,
  HealthDataResponse,
  HealthContext,
  InputSource
} from '../types/health.types';
import { FileUploadRequest, FileUploadResult } from '../types/file.types';
import { NotFoundError, BadRequestError } from '../utils/error.util';
import { logger } from '../config/logger';

/**
 * Service class that provides business logic for health data operations
 */
export class HealthService {
  private healthRepository: HealthRepository;
  private fileService: FileService;

  /**
   * Initializes the HealthService with database connection
   * 
   * @param connection - MongoDB connection
   */
  constructor(private connection: mongoose.Connection) {
    this.healthRepository = new HealthRepository(connection);
    this.fileService = new FileService();
    logger.info('Health service initialized');
  }

  /**
   * Creates a new health data record with optional file attachments
   * 
   * @param request - Health data creation request
   * @param userId - ID of the user creating the record
   * @param files - Optional files to attach to the health data record
   * @returns The created health data record with file information
   */
  async createHealthData(
    request: CreateHealthDataRequest,
    userId: string,
    files?: Express.Multer.File[]
  ): Promise<HealthDataResponse> {
    try {
      logger.info('Creating health data', { userId, type: request.type });
      
      // Validate the request data
      this.validateHealthDataRequest(request);
      
      // Convert string userId to ObjectId
      const userObjectId = new Types.ObjectId(userId);
      
      // Create health data object
      const healthData: HealthData = {
        userId: userObjectId,
        type: request.type,
        timestamp: request.timestamp || new Date(),
        data: request.data,
        fileIds: [],
        metadata: request.metadata || {
          source: InputSource.TEXT,
          tags: [],
          location: {}
        }
      };
      
      // Create health data record (without files initially)
      const createdHealthData = await this.healthRepository.createHealthData(healthData);
      
      // Process and upload files if provided
      if (files && files.length > 0) {
        const uploadedFiles = await this.processHealthDataFiles(
          files, 
          request.type, 
          userId, 
          createdHealthData._id.toString()
        );
        
        // Add file IDs to health data
        const fileIds = uploadedFiles.map(file => new Types.ObjectId(file.fileId));
        
        // Update health data record with file IDs
        if (fileIds.length > 0) {
          // Set metadata with input source based on file type
          if (!healthData.metadata) {
            healthData.metadata = {
              source: request.type === HealthDataType.SYMPTOM ? InputSource.VOICE : InputSource.PHOTO,
              tags: [],
              location: {}
            };
          } else {
            healthData.metadata.source = request.type === HealthDataType.SYMPTOM ? InputSource.VOICE : InputSource.PHOTO;
          }
          
          // Update the health data with file IDs
          await this.healthRepository.updateHealthData(
            createdHealthData._id.toString(), 
            userId,
            { 
              fileIds, 
              metadata: healthData.metadata 
            }
          );
          
          // Refresh the health data object with the updated data
          const updatedHealthData = await this.healthRepository.findHealthDataById(
            createdHealthData._id.toString(), 
            userId
          );
          
          if (updatedHealthData) {
            // Format response with file URLs
            const formattedResponse = await this.formatHealthDataResponse(updatedHealthData);
            
            logger.info('Health data created successfully with files', { 
              id: updatedHealthData._id,
              userId,
              type: request.type,
              fileCount: fileIds.length
            });
            
            return formattedResponse;
          }
        }
      }
      
      // Format response with file URLs (if no files were added or update failed)
      const formattedResponse = await this.formatHealthDataResponse(createdHealthData);
      
      logger.info('Health data created successfully', { 
        id: createdHealthData._id,
        userId,
        type: request.type
      });
      
      return formattedResponse;
    } catch (error) {
      logger.error('Error creating health data', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId,
        type: request.type
      });
      
      throw error;
    }
  }

  /**
   * Retrieves a specific health data record by its ID
   * 
   * @param id - ID of the health data record
   * @param userId - ID of the user who owns the record
   * @returns The health data record if found, null otherwise
   */
  async getHealthDataById(id: string, userId: string): Promise<HealthDataResponse | null> {
    try {
      logger.debug('Getting health data by ID', { id, userId });
      
      // Find health data record
      const healthData = await this.healthRepository.findHealthDataById(id, userId);
      
      if (!healthData) {
        logger.debug('Health data not found', { id, userId });
        return null;
      }
      
      // Enrich health data with file information
      const enrichedHealthData = await this.healthRepository.enrichHealthDataWithFiles(healthData) as HealthData;
      
      // Format response
      const formattedResponse = await this.formatHealthDataResponse(enrichedHealthData);
      
      logger.debug('Health data retrieved successfully', { id, userId });
      
      return formattedResponse;
    } catch (error) {
      logger.error('Error retrieving health data by ID', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        id,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Retrieves health data records for a user with filtering and pagination
   * 
   * @param options - Options for filtering and pagination
   * @param userId - ID of the user who owns the records
   * @returns Paginated health data records with total count
   */
  async getHealthData(
    options: GetHealthDataRequest,
    userId: string
  ): Promise<{ items: HealthDataResponse[]; total: number; page: number }> {
    try {
      logger.debug('Getting health data list', { userId, options });
      
      // Set default pagination values
      const page = options.page || 1;
      const limit = options.limit || 20;
      
      // Retrieve health data records
      const { items, total } = await this.healthRepository.findHealthDataByUserId(
        userId,
        {
          date: options.date,
          type: options.type,
          search: options.search,
          page,
          limit
        }
      );
      
      // Enrich health data with file information
      const enrichedItems = await this.healthRepository.enrichHealthDataWithFiles(items) as HealthData[];
      
      // Format response items
      const formattedItems = await Promise.all(
        enrichedItems.map(item => this.formatHealthDataResponse(item))
      );
      
      logger.debug('Health data list retrieved successfully', { 
        userId, 
        count: items.length,
        total
      });
      
      return {
        items: formattedItems,
        total,
        page
      };
    } catch (error) {
      logger.error('Error retrieving health data list', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId,
        options
      });
      
      throw error;
    }
  }

  /**
   * Updates an existing health data record with optional new files
   * 
   * @param id - ID of the health data record
   * @param userId - ID of the user who owns the record
   * @param updateData - Partial health data for update
   * @param files - Optional new files to attach to the health data record
   * @returns The updated health data record if found, null otherwise
   */
  async updateHealthData(
    id: string,
    userId: string,
    updateData: Partial<CreateHealthDataRequest>,
    files?: Express.Multer.File[]
  ): Promise<HealthDataResponse | null> {
    try {
      logger.info('Updating health data', { id, userId });
      
      // Find existing health data to ensure it exists
      const existingHealthData = await this.healthRepository.findHealthDataById(id, userId);
      
      if (!existingHealthData) {
        logger.debug('Health data not found for update', { id, userId });
        return null;
      }
      
      // Create an update object that we'll populate
      const updates: Partial<HealthData> = { ...updateData as any };
      
      // Process and upload new files if provided
      if (files && files.length > 0) {
        const uploadedFiles = await this.processHealthDataFiles(
          files,
          updateData.type || existingHealthData.type,
          userId,
          id
        );
        
        // Combine existing file IDs with new file IDs
        const fileIds = [
          ...(existingHealthData.fileIds || []),
          ...uploadedFiles.map(file => new Types.ObjectId(file.fileId))
        ];
        
        updates.fileIds = fileIds;
        
        // Update metadata source if files are added
        if (existingHealthData.metadata) {
          updates.metadata = {
            ...existingHealthData.metadata,
            source: existingHealthData.type === HealthDataType.SYMPTOM ? InputSource.VOICE : InputSource.PHOTO
          };
        }
      }
      
      // Update health data record
      const updatedHealthData = await this.healthRepository.updateHealthData(
        id,
        userId,
        updates
      );
      
      if (!updatedHealthData) {
        logger.debug('Health data not found after update attempt', { id, userId });
        return null;
      }
      
      // Enrich updated health data with file information
      const enrichedHealthData = await this.healthRepository.enrichHealthDataWithFiles(updatedHealthData) as HealthData;
      
      // Format response
      const formattedResponse = await this.formatHealthDataResponse(enrichedHealthData);
      
      logger.info('Health data updated successfully', { id, userId });
      
      return formattedResponse;
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
   * Deletes a health data record and its associated files
   * 
   * @param id - ID of the health data record
   * @param userId - ID of the user who owns the record
   * @returns True if deletion was successful, false if record not found
   */
  async deleteHealthData(id: string, userId: string): Promise<boolean> {
    try {
      logger.info('Deleting health data', { id, userId });
      
      // Find health data record to ensure it exists
      const healthData = await this.healthRepository.findHealthDataById(id, userId);
      
      if (!healthData) {
        logger.debug('Health data not found for deletion', { id, userId });
        return false;
      }
      
      // Delete associated files
      if (healthData.fileIds && healthData.fileIds.length > 0) {
        await this.fileService.deleteFilesByHealthDataId(id);
      }
      
      // Delete health data record
      const deleted = await this.healthRepository.deleteHealthData(id, userId);
      
      logger.info('Health data deleted successfully', { id, userId });
      
      return deleted;
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
   * Retrieves recent health data for a user to provide context for LLM interactions
   * 
   * @param userId - ID of the user
   * @param limit - Maximum number of records to retrieve per type
   * @returns Recent health data grouped by type for LLM context
   */
  async getHealthContext(userId: string, limit: number = 5): Promise<HealthContext> {
    try {
      logger.debug('Getting health context for user', { userId, limit });
      
      // Get recent health data
      const recentData = await this.healthRepository.getRecentHealthData(userId, limit);
      
      // Enrich with file information
      const enrichedMeals = await this.healthRepository.enrichHealthDataWithFiles(recentData.meals) as HealthData[];
      const enrichedLabResults = await this.healthRepository.enrichHealthDataWithFiles(recentData.labResults) as HealthData[];
      const enrichedSymptoms = await this.healthRepository.enrichHealthDataWithFiles(recentData.symptoms) as HealthData[];
      
      // Format data
      const formattedMeals = await Promise.all(
        enrichedMeals.map(meal => this.formatHealthDataResponse(meal))
      );
      
      const formattedLabResults = await Promise.all(
        enrichedLabResults.map(labResult => this.formatHealthDataResponse(labResult))
      );
      
      const formattedSymptoms = await Promise.all(
        enrichedSymptoms.map(symptom => this.formatHealthDataResponse(symptom))
      );
      
      logger.debug('Health context retrieved successfully', { 
        userId,
        mealCount: formattedMeals.length,
        labResultCount: formattedLabResults.length,
        symptomCount: formattedSymptoms.length
      });
      
      return {
        recentMeals: formattedMeals,
        recentLabResults: formattedLabResults,
        recentSymptoms: formattedSymptoms
      };
    } catch (error) {
      logger.error('Error getting health context', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Formats a health data record into a standardized response format with file URLs
   * 
   * @param healthData - Health data record to format
   * @returns Formatted health data response
   */
  private async formatHealthDataResponse(healthData: HealthData): Promise<HealthDataResponse> {
    try {
      // Extract file information
      let files = [];
      
      // If files array is present from enrichment, use that
      if ((healthData as any).files) {
        files = (healthData as any).files;
      } 
      // Otherwise, get URLs for each file ID
      else if (healthData.fileIds && healthData.fileIds.length > 0) {
        files = await Promise.all(
          healthData.fileIds.map(async (fileId) => {
            try {
              const url = await this.fileService.getFileUrl(fileId.toString());
              return {
                url,
                contentType: 'unknown' // We would need to fetch file metadata to get this
              };
            } catch (error) {
              logger.warn(`Could not get URL for file ${fileId}`, {
                error: (error as Error).message
              });
              return null;
            }
          })
        );
        
        // Filter out null values from failed URL retrievals
        files = files.filter(file => file !== null);
      }
      
      // Format response
      const response: HealthDataResponse = {
        id: (healthData as any)._id?.toString() || '',
        type: healthData.type,
        timestamp: healthData.timestamp.toISOString(),
        data: healthData.data,
        files,
        metadata: healthData.metadata
      };
      
      return response;
    } catch (error) {
      logger.error('Error formatting health data response', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        healthDataId: (healthData as any)._id?.toString()
      });
      
      throw error;
    }
  }

  /**
   * Processes files for health data based on health data type
   * 
   * @param files - Files to process
   * @param healthDataType - Type of health data
   * @param userId - ID of the user
   * @param healthDataId - ID of the health data record (optional, for updates)
   * @returns Results of file processing and upload
   */
  private async processHealthDataFiles(
    files: Express.Multer.File[],
    healthDataType: HealthDataType,
    userId: string,
    healthDataId?: string
  ): Promise<FileUploadResult[]> {
    try {
      if (!files || files.length === 0) {
        return [];
      }
      
      // Process each file
      const uploadPromises = files.map(async (file) => {
        // Prepare upload request
        const uploadRequest: FileUploadRequest = {
          file: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          userId,
          healthDataId: healthDataId || 'temporary', // This will be updated after health data creation
          tags: [healthDataType],
          processImage: false,
          imageOptions: {
            resize: false,
            width: 800,
            height: 600,
            format: 'jpeg',
            quality: 80,
            createThumbnail: true,
            thumbnailWidth: 200,
            thumbnailHeight: 200
          }
        };
        
        // Process file based on health data type
        return await this.fileService.processHealthDataFile(uploadRequest, healthDataType);
      });
      
      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      return uploadResults;
    } catch (error) {
      logger.error('Error processing health data files', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        healthDataType,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Validates a health data request for required fields and data integrity
   * 
   * @param request - Health data request to validate
   * @throws BadRequestError if validation fails
   */
  private validateHealthDataRequest(request: CreateHealthDataRequest): void {
    // Check if request object is provided
    if (!request) {
      throw new BadRequestError('Health data request object is required');
    }
    
    // Check required fields
    if (!request.type) {
      throw new BadRequestError('Health data type is required');
    }
    
    if (!request.data) {
      throw new BadRequestError('Health data content is required');
    }
    
    // Validate data based on type
    switch (request.type) {
      case HealthDataType.MEAL:
        if (!request.data.description || !request.data.mealType) {
          throw new BadRequestError('Meal data must include description and mealType');
        }
        break;
        
      case HealthDataType.LAB_RESULT:
        if (!request.data.testType || !request.data.testDate) {
          throw new BadRequestError('Lab result data must include testType and testDate');
        }
        break;
        
      case HealthDataType.SYMPTOM:
        if (!request.data.description || !request.data.severity) {
          throw new BadRequestError('Symptom data must include description and severity');
        }
        break;
        
      default:
        throw new BadRequestError(`Invalid health data type: ${request.type}`);
    }
  }
}