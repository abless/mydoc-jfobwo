/**
 * File Service Module
 * 
 * This module provides high-level file operations for the Health Advisor application,
 * abstracting the file repository layer and implementing business logic for file handling.
 * It supports uploading, retrieving, and processing health-related files like meal photos,
 * lab result images, and symptom voice recordings.
 */

import path from 'path'; // ^1.8.1
import { Readable } from 'stream'; // ^0.0.2

import { FileRepository } from '../repositories/file.repository';
import { 
  FileType,
  FileMetadata,
  FileDocument,
  FileUploadRequest,
  FileUploadResult,
  FileRetrievalOptions,
  ImageProcessingOptions
} from '../types/file.types';

import { logger } from '../config';

import {
  processImage,
  createThumbnail,
  isImage,
  isAudio,
  validateFileType,
  validateFileSize,
  getFileType
} from '../utils/file.util';

import {
  BadRequestError,
  NotFoundError,
  InternalServerError
} from '../utils/error.util';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm'];

// Default thumbnail dimensions
const DEFAULT_THUMBNAIL_WIDTH = 200;
const DEFAULT_THUMBNAIL_HEIGHT = 200;

/**
 * Service class that provides high-level file operations for the Health Advisor application
 */
export class FileService {
  private fileRepository: FileRepository;

  /**
   * Initializes the FileService with a FileRepository instance
   */
  constructor() {
    // Create a new FileRepository instance
    this.fileRepository = new FileRepository();
    logger.info('File service initialized');
  }

  /**
   * Uploads a file with associated metadata and processes it if needed
   * 
   * @param request - File upload request parameters
   * @returns Result of the file upload operation
   * @throws BadRequestError if file validation fails
   * @throws InternalServerError if file upload fails
   */
  async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
    try {
      // Validate file upload request parameters
      if (!request.file || !request.originalname || !request.mimetype || !request.userId || !request.healthDataId) {
        throw new BadRequestError('Missing required file upload parameters');
      }

      // Check if file type is allowed
      const fileType = getFileType(request.mimetype);
      let allowedTypes: string[] = [];
      
      if (fileType === FileType.IMAGE) {
        allowedTypes = ALLOWED_IMAGE_TYPES;
      } else if (fileType === FileType.AUDIO) {
        allowedTypes = ALLOWED_AUDIO_TYPES;
      } else {
        throw new BadRequestError(`File type ${fileType} is not supported`);
      }

      // Validate file type and size
      this.validateFile(request.mimetype, request.size, allowedTypes, MAX_FILE_SIZE);

      // Process image if needed
      let fileToUpload = request.file;
      if (request.processImage && fileType === FileType.IMAGE) {
        logger.debug('Processing image before upload', { originalname: request.originalname });
        fileToUpload = await processImage(request.file, request.imageOptions);
        
        // Update file size after processing
        request.size = fileToUpload.length;
      }

      // Update the file in the request with the processed file
      const updatedRequest: FileUploadRequest = {
        ...request,
        file: fileToUpload
      };

      // Upload file to repository
      const uploadResult = await this.fileRepository.uploadFile(updatedRequest);

      // Create thumbnail if file is an image
      if (fileType === FileType.IMAGE) {
        try {
          await this.fileRepository.createThumbnail(
            uploadResult.fileId,
            DEFAULT_THUMBNAIL_WIDTH,
            DEFAULT_THUMBNAIL_HEIGHT
          );
          logger.debug('Created thumbnail for image', { fileId: uploadResult.fileId });
        } catch (error) {
          // Non-critical error, log but continue
          logger.warn('Failed to create thumbnail', {
            fileId: uploadResult.fileId,
            error: (error as Error).message
          });
        }
      }

      return uploadResult;
    } catch (error) {
      logger.error('Error uploading file', {
        originalname: request.originalname,
        error: (error as Error).message
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a file by its ID with options for streaming or buffering
   * 
   * @param fileId - ID of the file to retrieve
   * @param options - Options for file retrieval
   * @returns File document and either a readable stream or buffer
   * @throws NotFoundError if file is not found
   * @throws BadRequestError if file ID is invalid
   * @throws InternalServerError if file retrieval fails
   */
  async getFileById(
    fileId: string,
    options: FileRetrievalOptions = { asStream: false, thumbnail: false, width: DEFAULT_THUMBNAIL_WIDTH, height: DEFAULT_THUMBNAIL_HEIGHT }
  ): Promise<{ file: FileDocument, stream: Readable } | { file: FileDocument, buffer: Buffer }> {
    try {
      // Validate file ID
      if (!fileId) {
        throw new BadRequestError('File ID is required');
      }

      // Set default retrieval options if not provided
      options = {
        asStream: options.asStream || false,
        thumbnail: options.thumbnail || false,
        width: options.width || DEFAULT_THUMBNAIL_WIDTH,
        height: options.height || DEFAULT_THUMBNAIL_HEIGHT
      };

      // Retrieve file from repository
      const result = await this.fileRepository.getFileById(fileId, options);
      return result;
    } catch (error) {
      logger.error('Error retrieving file', {
        fileId,
        error: (error as Error).message
      });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to retrieve file: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves all files associated with a health data entry
   * 
   * @param healthDataId - ID of the health data entry
   * @returns Array of file documents
   * @throws BadRequestError if health data ID is invalid
   * @throws InternalServerError if file retrieval fails
   */
  async getFilesByHealthDataId(healthDataId: string): Promise<FileDocument[]> {
    try {
      // Validate health data ID
      if (!healthDataId) {
        throw new BadRequestError('Health data ID is required');
      }

      // Retrieve files from repository
      const files = await this.fileRepository.getFilesByHealthDataId(healthDataId);
      return files;
    } catch (error) {
      logger.error('Error retrieving files by health data ID', {
        healthDataId,
        error: (error as Error).message
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to retrieve files: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves all files uploaded by a specific user with pagination
   * 
   * @param userId - ID of the user
   * @param options - Pagination options (limit, skip)
   * @returns Array of file documents and total count
   * @throws BadRequestError if user ID is invalid
   * @throws InternalServerError if file retrieval fails
   */
  async getFilesByUserId(
    userId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<{ files: FileDocument[], total: number }> {
    try {
      // Validate user ID
      if (!userId) {
        throw new BadRequestError('User ID is required');
      }

      // Set default pagination options
      const paginationOptions = {
        limit: options.limit || 20,
        skip: options.skip || 0
      };

      // Retrieve files from repository
      const result = await this.fileRepository.getFilesByUserId(userId, paginationOptions);
      return result;
    } catch (error) {
      logger.error('Error retrieving files by user ID', {
        userId,
        error: (error as Error).message
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to retrieve user files: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a file by its ID
   * 
   * @param fileId - ID of the file to delete
   * @returns True if deletion was successful
   * @throws NotFoundError if file is not found
   * @throws BadRequestError if file ID is invalid
   * @throws InternalServerError if file deletion fails
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Validate file ID
      if (!fileId) {
        throw new BadRequestError('File ID is required');
      }

      // Delete file from repository
      const result = await this.fileRepository.deleteFile(fileId);
      
      logger.info('File deleted successfully', { fileId });
      return result;
    } catch (error) {
      logger.error('Error deleting file', {
        fileId,
        error: (error as Error).message
      });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to delete file: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes all files associated with a health data entry
   * 
   * @param healthDataId - ID of the health data entry
   * @returns Number of files deleted
   * @throws BadRequestError if health data ID is invalid
   * @throws InternalServerError if file deletion fails
   */
  async deleteFilesByHealthDataId(healthDataId: string): Promise<number> {
    try {
      // Validate health data ID
      if (!healthDataId) {
        throw new BadRequestError('Health data ID is required');
      }

      // Delete files from repository
      const deletedCount = await this.fileRepository.deleteFilesByHealthDataId(healthDataId);
      
      logger.info('Files deleted by health data ID', { healthDataId, count: deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting files by health data ID', {
        healthDataId,
        error: (error as Error).message
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to delete files: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a thumbnail version of an image file
   * 
   * @param fileId - ID of the image file
   * @param width - Width of the thumbnail (default: DEFAULT_THUMBNAIL_WIDTH)
   * @param height - Height of the thumbnail (default: DEFAULT_THUMBNAIL_HEIGHT)
   * @returns Result of the thumbnail creation
   * @throws NotFoundError if file is not found
   * @throws BadRequestError if file is not an image
   * @throws InternalServerError if thumbnail creation fails
   */
  async createThumbnail(
    fileId: string,
    width: number = DEFAULT_THUMBNAIL_WIDTH,
    height: number = DEFAULT_THUMBNAIL_HEIGHT
  ): Promise<FileUploadResult> {
    try {
      // Validate file ID
      if (!fileId) {
        throw new BadRequestError('File ID is required');
      }

      // Create thumbnail using repository method
      const result = await this.fileRepository.createThumbnail(fileId, width, height);
      return result;
    } catch (error) {
      logger.error('Error creating thumbnail', {
        fileId,
        error: (error as Error).message
      });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to create thumbnail: ${(error as Error).message}`);
    }
  }

  /**
   * Generates a URL for accessing a file
   * 
   * @param fileId - ID of the file
   * @param thumbnail - Whether to return URL for thumbnail version
   * @returns URL for accessing the file
   * @throws NotFoundError if file is not found
   * @throws BadRequestError if file ID is invalid
   * @throws InternalServerError if URL generation fails
   */
  async getFileUrl(fileId: string, thumbnail: boolean = false): Promise<string> {
    try {
      // Validate file ID
      if (!fileId) {
        throw new BadRequestError('File ID is required');
      }

      // Get file metadata
      const file = await this.fileRepository.getFileMetadata(fileId);
      
      // If thumbnail requested and file is an image, try to find thumbnail
      if (thumbnail && file.metadata.fileType === FileType.IMAGE) {
        try {
          // Attempt to get thumbnail metadata
          const thumbnailFiles = await this.fileRepository.getFilesByHealthDataId(file.metadata.healthDataId.toString());
          const thumbnailFile = thumbnailFiles.find(f => 
            f.metadata.originalFileId === fileId || 
            f.filename.includes('thumbnail')
          );
          
          if (thumbnailFile) {
            return `/api/files/${thumbnailFile._id}`;
          }
        } catch (error) {
          // If thumbnail not found, continue with original file
          logger.debug(`Thumbnail not found for file ${fileId}, returning original file URL`);
        }
      }
      
      // Return URL for accessing the file
      return `/api/files/${fileId}`;
    } catch (error) {
      logger.error('Error generating file URL', {
        fileId,
        error: (error as Error).message
      });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to generate file URL: ${(error as Error).message}`);
    }
  }

  /**
   * Validates a file's type and size
   * 
   * @param mimetype - MIME type of the file
   * @param size - Size of the file in bytes
   * @param allowedTypes - Array of allowed MIME types
   * @param maxSize - Maximum allowed file size
   * @returns True if file is valid
   * @throws BadRequestError if validation fails
   */
  validateFile(
    mimetype: string,
    size: number,
    allowedTypes: string[],
    maxSize: number = MAX_FILE_SIZE
  ): boolean {
    // Check if file type is allowed
    if (!validateFileType(mimetype, allowedTypes)) {
      throw new BadRequestError(`Invalid file type: ${mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check if file size is within limits
    if (!validateFileSize(size, maxSize)) {
      throw new BadRequestError(`File size ${size} bytes exceeds the maximum allowed size of ${maxSize} bytes`);
    }

    return true;
  }

  /**
   * Processes a file specifically for health data, handling different types appropriately
   * 
   * @param request - File upload request
   * @param healthDataType - Type of health data ('meal', 'labResult', 'symptom')
   * @returns Result of the file processing and upload
   * @throws BadRequestError if file type is not allowed for the health data type
   * @throws InternalServerError if file processing fails
   */
  async processHealthDataFile(
    request: FileUploadRequest,
    healthDataType: string
  ): Promise<FileUploadResult> {
    try {
      // Determine allowed file types and processing options based on health data type
      let allowedTypes: string[] = [];
      let shouldProcessImage = false;
      let imageOptions: ImageProcessingOptions = {
        resize: false,
        width: 800,
        height: 600,
        format: 'jpeg',
        quality: 80,
        createThumbnail: true,
        thumbnailWidth: DEFAULT_THUMBNAIL_WIDTH,
        thumbnailHeight: DEFAULT_THUMBNAIL_HEIGHT
      };

      switch (healthDataType) {
        case 'meal':
          // For meals, allow only images and process them
          allowedTypes = ALLOWED_IMAGE_TYPES;
          shouldProcessImage = true;
          imageOptions = {
            ...imageOptions,
            resize: true,
            width: 1200,
            height: 1200,
            format: 'jpeg',
            quality: 85
          };
          break;
          
        case 'labResult':
          // For lab results, allow only images and ensure high quality
          allowedTypes = ALLOWED_IMAGE_TYPES;
          shouldProcessImage = true;
          imageOptions = {
            ...imageOptions,
            resize: true,
            width: 1600,
            height: 1600,
            format: 'jpeg',
            quality: 90
          };
          break;
          
        case 'symptom':
          // For symptoms, allow audio files
          allowedTypes = ALLOWED_AUDIO_TYPES;
          shouldProcessImage = false;
          break;
          
        default:
          throw new BadRequestError(`Invalid health data type: ${healthDataType}`);
      }

      // Validate file against allowed types and size limits
      this.validateFile(request.mimetype, request.size, allowedTypes, MAX_FILE_SIZE);

      // Update request with processing options
      const updatedRequest: FileUploadRequest = {
        ...request,
        processImage: shouldProcessImage,
        imageOptions
      };

      // Upload and process file
      const result = await this.uploadFile(updatedRequest);
      return result;
    } catch (error) {
      logger.error('Error processing health data file', {
        healthDataType,
        originalname: request.originalname,
        error: (error as Error).message
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to process health data file: ${(error as Error).message}`);
    }
  }
}