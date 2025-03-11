/**
 * File Repository Module
 * 
 * This module provides an abstraction layer for file storage and retrieval operations
 * in the Health Advisor application using MongoDB's GridFS system.
 * 
 * It handles:
 * - Storage of health-related files (meal photos, lab results, voice recordings)
 * - Retrieval of files by various criteria (ID, health data ID, user ID)
 * - File metadata management
 * - Thumbnail generation for images
 * - File deletion
 */

import mongoose from 'mongoose'; // ^7.0.0
import { ObjectId } from 'mongodb'; // ^5.1.0
import { Readable } from 'stream'; // ^0.0.2

import {
  FileType,
  FileMetadata,
  FileDocument,
  FileUploadRequest,
  FileUploadResult,
  FileRetrievalOptions
} from '../types/file.types';

import { logger } from '../config';

import {
  NotFoundError,
  InternalServerError,
  BadRequestError
} from '../utils/error.util';

import {
  processImage,
  createThumbnail,
  generateUniqueFilename,
  getFileType,
  bufferToStream,
  streamToBuffer
} from '../utils/file.util';

// GridFS bucket name for health advisor files
const BUCKET_NAME = 'healthAdvisorFiles';
// GridFS chunk size (255KB)
const CHUNK_SIZE = 261120;

/**
 * Repository class that handles file storage and retrieval operations using GridFS
 */
export class FileRepository {
  private bucket: mongoose.mongo.GridFSBucket;
  private db: mongodb.Db;

  /**
   * Initializes the FileRepository with a GridFS bucket
   */
  constructor() {
    // Get the MongoDB database connection from mongoose
    this.db = mongoose.connection.db;
    
    // Create a GridFS bucket with the specified bucket name and chunk size
    this.bucket = new mongoose.mongo.GridFSBucket(this.db, {
      bucketName: BUCKET_NAME,
      chunkSizeBytes: CHUNK_SIZE
    });
    
    logger.info('File repository initialized with GridFS bucket', {
      bucketName: BUCKET_NAME,
      chunkSize: CHUNK_SIZE
    });
  }

  /**
   * Uploads a file to GridFS with metadata
   * 
   * @param request - File upload request containing file data and metadata
   * @returns Result of the file upload operation
   * @throws BadRequestError if request parameters are invalid
   * @throws InternalServerError if file upload fails
   */
  async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
    try {
      const {
        file,
        originalname,
        mimetype,
        size,
        userId,
        healthDataId,
        tags = [],
        processImage: shouldProcessImage = false,
        imageOptions = {}
      } = request;

      // Validate the upload request parameters
      if (!file || !originalname || !mimetype || !userId || !healthDataId) {
        throw new BadRequestError('Missing required file upload parameters');
      }

      // Generate a unique filename for the file
      const filename = generateUniqueFilename(originalname);
      
      // Determine file type based on MIME type
      const fileType = getFileType(mimetype);

      // Process image if requested and file is an image
      let fileToUpload = file;
      if (shouldProcessImage && fileType === FileType.IMAGE) {
        logger.debug('Processing image before upload', { originalname });
        fileToUpload = await processImage(file, imageOptions);
      }

      // Create a readable stream from the file buffer
      const fileStream = bufferToStream(fileToUpload);

      // Create metadata object with user ID, health data ID, and other metadata
      const metadata: FileMetadata = {
        userId: new mongoose.Types.ObjectId(userId),
        healthDataId: new mongoose.Types.ObjectId(healthDataId),
        originalname,
        filename,
        mimetype,
        size: fileToUpload.length,
        fileType,
        uploadDate: new Date(),
        tags
      };

      // Upload the file to GridFS using openUploadStream with metadata
      const uploadStream = this.bucket.openUploadStream(filename, {
        metadata,
        contentType: mimetype
      });

      // Promisify the stream upload process
      const uploadPromise = new Promise<mongoose.mongo.GridFSFile>((resolve, reject) => {
        uploadStream.on('finish', (file) => resolve(file));
        uploadStream.on('error', (error) => reject(new InternalServerError(`Failed to upload file: ${error.message}`)));
      });

      // Pipe the file stream to the upload stream
      fileStream.pipe(uploadStream);

      // Wait for the upload to complete
      const uploadedFile = await uploadPromise;

      // Return upload result with file ID, filename, and metadata
      return {
        fileId: uploadedFile._id.toString(),
        filename: uploadedFile.filename,
        url: `/api/files/${uploadedFile._id}`,
        contentType: uploadedFile.contentType || mimetype,
        size: uploadedFile.length,
        metadata
      };
    } catch (error) {
      logger.error('Error uploading file', {
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a file from GridFS by its ID
   * 
   * @param fileId - ID of the file to retrieve
   * @param options - Options for file retrieval (e.g., stream vs buffer, thumbnail)
   * @returns File document and either a readable stream or buffer
   * @throws NotFoundError if file is not found
   * @throws InternalServerError if file retrieval fails
   */
  async getFileById(
    fileId: string,
    options: FileRetrievalOptions = { asStream: false, thumbnail: false, width: 200, height: 200 }
  ): Promise<{ file: FileDocument; stream: Readable } | { file: FileDocument; buffer: Buffer }> {
    try {
      // Validate the file ID
      if (!fileId || !ObjectId.isValid(fileId)) {
        throw new BadRequestError('Invalid file ID');
      }

      // Find the file by ID in the GridFS files collection
      const fileObjectId = new ObjectId(fileId);
      const file = await this.db.collection(`${BUCKET_NAME}.files`).findOne({ _id: fileObjectId }) as unknown as FileDocument;

      // If file not found, throw NotFoundError
      if (!file) {
        throw new NotFoundError(`File with ID ${fileId} not found`, 'file');
      }

      // If thumbnail requested and file is an image, try to find thumbnail
      let fileIdToRetrieve = fileObjectId;
      if (options.thumbnail && file.metadata.fileType === FileType.IMAGE) {
        // Look for thumbnail with naming pattern: originalFileId-thumbnail
        const thumbnailFile = await this.db.collection(`${BUCKET_NAME}.files`).findOne({
          'metadata.originalFileId': fileId
        }) as unknown as FileDocument;

        if (thumbnailFile) {
          fileIdToRetrieve = thumbnailFile._id;
        } else {
          logger.debug(`Thumbnail not found for file ${fileId}, returning original file`);
        }
      }

      // Create a download stream for the file
      const downloadStream = this.bucket.openDownloadStream(fileIdToRetrieve);

      // If asStream option is true, return file document and stream
      if (options.asStream) {
        return { file, stream: downloadStream };
      }

      // Otherwise, convert stream to buffer and return file document and buffer
      const buffer = await streamToBuffer(downloadStream);
      return { file, buffer };
    } catch (error) {
      logger.error('Error retrieving file', {
        fileId,
        error: (error as Error).message,
        stack: (error as Error).stack
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
      // Validate the health data ID
      if (!healthDataId || !ObjectId.isValid(healthDataId)) {
        throw new BadRequestError('Invalid health data ID');
      }

      // Query the GridFS files collection for files with matching healthDataId in metadata
      const files = await this.db.collection(`${BUCKET_NAME}.files`)
        .find({
          'metadata.healthDataId': new ObjectId(healthDataId)
        })
        .toArray() as unknown as FileDocument[];

      return files;
    } catch (error) {
      logger.error('Error retrieving files by health data ID', {
        healthDataId,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to retrieve files: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves all files uploaded by a specific user
   * 
   * @param userId - ID of the user
   * @param options - Options for pagination (limit, skip)
   * @returns Array of file documents and total count
   * @throws BadRequestError if user ID is invalid
   * @throws InternalServerError if file retrieval fails
   */
  async getFilesByUserId(
    userId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<{ files: FileDocument[]; total: number }> {
    try {
      // Validate the user ID
      if (!userId || !ObjectId.isValid(userId)) {
        throw new BadRequestError('Invalid user ID');
      }

      // Set up pagination options (limit, skip)
      const limit = options.limit || 20;
      const skip = options.skip || 0;

      // Query the GridFS files collection for files with matching userId in metadata
      const query = { 'metadata.userId': new ObjectId(userId) };
      
      // Count total matching documents for pagination
      const total = await this.db.collection(`${BUCKET_NAME}.files`).countDocuments(query);
      
      // Get the files with pagination
      const files = await this.db.collection(`${BUCKET_NAME}.files`)
        .find(query)
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .toArray() as unknown as FileDocument[];

      return { files, total };
    } catch (error) {
      logger.error('Error retrieving files by user ID', {
        userId,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to retrieve user files: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a file from GridFS by its ID
   * 
   * @param fileId - ID of the file to delete
   * @returns True if deletion was successful
   * @throws NotFoundError if file is not found
   * @throws InternalServerError if file deletion fails
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Validate the file ID
      if (!fileId || !ObjectId.isValid(fileId)) {
        throw new BadRequestError('Invalid file ID');
      }

      // Find the file by ID to ensure it exists
      const fileObjectId = new ObjectId(fileId);
      const file = await this.db.collection(`${BUCKET_NAME}.files`).findOne({ _id: fileObjectId });

      // If file not found, throw NotFoundError
      if (!file) {
        throw new NotFoundError(`File with ID ${fileId} not found`, 'file');
      }

      // Delete the file from GridFS using delete method
      await this.bucket.delete(fileObjectId);

      // Also check and delete thumbnail if exists
      const thumbnailFile = await this.db.collection(`${BUCKET_NAME}.files`).findOne({
        'metadata.originalFileId': fileId
      });

      if (thumbnailFile) {
        await this.bucket.delete(thumbnailFile._id);
        logger.debug(`Deleted thumbnail for file ${fileId}`);
      }

      // Log successful deletion
      logger.info(`Successfully deleted file with ID ${fileId}`);

      // Return true if deletion was successful
      return true;
    } catch (error) {
      logger.error('Error deleting file', {
        fileId,
        error: (error as Error).message,
        stack: (error as Error).stack
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
      // Validate the health data ID
      if (!healthDataId || !ObjectId.isValid(healthDataId)) {
        throw new BadRequestError('Invalid health data ID');
      }

      // Find all files with matching healthDataId in metadata
      const files = await this.db.collection(`${BUCKET_NAME}.files`).find({
        'metadata.healthDataId': new ObjectId(healthDataId)
      }).toArray();

      // If no files found, return 0
      if (files.length === 0) {
        return 0;
      }

      // Delete each file using the bucket.delete method
      let deletedCount = 0;
      for (const file of files) {
        await this.bucket.delete(file._id);
        deletedCount++;

        // Also check and delete thumbnail if exists
        const thumbnailFile = await this.db.collection(`${BUCKET_NAME}.files`).findOne({
          'metadata.originalFileId': file._id.toString()
        });

        if (thumbnailFile) {
          await this.bucket.delete(thumbnailFile._id);
          deletedCount++;
        }
      }

      // Log number of files deleted
      logger.info(`Deleted ${deletedCount} files associated with health data ID ${healthDataId}`);

      // Return count of deleted files
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting files by health data ID', {
        healthDataId,
        error: (error as Error).message,
        stack: (error as Error).stack
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
   * @param fileId - ID of the original image file
   * @param width - Width of the thumbnail (default: 200)
   * @param height - Height of the thumbnail (default: 200)
   * @returns Result of the thumbnail creation
   * @throws NotFoundError if file is not found
   * @throws BadRequestError if file is not an image
   * @throws InternalServerError if thumbnail creation fails
   */
  async createThumbnail(
    fileId: string,
    width: number = 200,
    height: number = 200
  ): Promise<FileUploadResult> {
    try {
      // Validate the file ID
      if (!fileId || !ObjectId.isValid(fileId)) {
        throw new BadRequestError('Invalid file ID');
      }

      // Retrieve the original file
      const { file, buffer } = await this.getFileById(fileId) as { file: FileDocument; buffer: Buffer };

      // Verify the file is an image
      if (file.metadata.fileType !== FileType.IMAGE) {
        throw new BadRequestError('Thumbnails can only be created for image files');
      }

      // Generate a thumbnail filename
      const thumbnailFilename = `${file.filename.split('.')[0]}-thumbnail.jpg`;

      // Create thumbnail using the createThumbnail utility
      const thumbnailBuffer = await createThumbnail(buffer, width, height);

      // Create a readable stream from the thumbnail buffer
      const thumbnailStream = bufferToStream(thumbnailBuffer);

      // Prepare thumbnail metadata
      const thumbnailMetadata: FileMetadata = {
        ...file.metadata,
        originalFileId: fileId,
        filename: thumbnailFilename,
        originalname: `thumbnail-${file.metadata.originalname}`,
        size: thumbnailBuffer.length
      };

      // Upload the thumbnail with reference to the original file
      const uploadStream = this.bucket.openUploadStream(thumbnailFilename, {
        metadata: thumbnailMetadata,
        contentType: 'image/jpeg'
      });

      // Promisify the stream upload process
      const uploadPromise = new Promise<mongoose.mongo.GridFSFile>((resolve, reject) => {
        uploadStream.on('finish', (file) => resolve(file));
        uploadStream.on('error', (error) => reject(new InternalServerError(`Failed to upload thumbnail: ${error.message}`)));
      });

      // Pipe the thumbnail stream to the upload stream
      thumbnailStream.pipe(uploadStream);

      // Wait for the upload to complete
      const uploadedThumbnail = await uploadPromise;

      // Return thumbnail file information
      return {
        fileId: uploadedThumbnail._id.toString(),
        filename: uploadedThumbnail.filename,
        url: `/api/files/${uploadedThumbnail._id}`,
        contentType: uploadedThumbnail.contentType || 'image/jpeg',
        size: uploadedThumbnail.length,
        metadata: thumbnailMetadata
      };
    } catch (error) {
      logger.error('Error creating thumbnail', {
        fileId,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to create thumbnail: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves metadata for a file without downloading the file content
   * 
   * @param fileId - ID of the file
   * @returns File document with metadata
   * @throws NotFoundError if file is not found
   * @throws BadRequestError if file ID is invalid
   * @throws InternalServerError if metadata retrieval fails
   */
  async getFileMetadata(fileId: string): Promise<FileDocument> {
    try {
      // Validate the file ID
      if (!fileId || !ObjectId.isValid(fileId)) {
        throw new BadRequestError('Invalid file ID');
      }

      // Query the GridFS files collection for the file
      const file = await this.db.collection(`${BUCKET_NAME}.files`).findOne({
        _id: new ObjectId(fileId)
      }) as unknown as FileDocument;

      // If file not found, throw NotFoundError
      if (!file) {
        throw new NotFoundError(`File with ID ${fileId} not found`, 'file');
      }

      // Return file document with metadata
      return file;
    } catch (error) {
      logger.error('Error retrieving file metadata', {
        fileId,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to retrieve file metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Updates metadata for an existing file
   * 
   * @param fileId - ID of the file to update
   * @param metadata - Partial metadata object with fields to update
   * @returns Updated file document
   * @throws NotFoundError if file is not found
   * @throws BadRequestError if file ID is invalid
   * @throws InternalServerError if metadata update fails
   */
  async updateFileMetadata(
    fileId: string,
    metadata: Partial<FileMetadata>
  ): Promise<FileDocument> {
    try {
      // Validate the file ID and metadata
      if (!fileId || !ObjectId.isValid(fileId)) {
        throw new BadRequestError('Invalid file ID');
      }

      if (!metadata || Object.keys(metadata).length === 0) {
        throw new BadRequestError('No metadata provided for update');
      }

      // Find the file by ID to ensure it exists
      const fileObjectId = new ObjectId(fileId);
      const existingFile = await this.db.collection(`${BUCKET_NAME}.files`).findOne({
        _id: fileObjectId
      });

      // If file not found, throw NotFoundError
      if (!existingFile) {
        throw new NotFoundError(`File with ID ${fileId} not found`, 'file');
      }

      // Update the file's metadata in the GridFS files collection
      const updateResult = await this.db.collection(`${BUCKET_NAME}.files`).updateOne(
        { _id: fileObjectId },
        { $set: { 'metadata': { ...existingFile.metadata, ...metadata } } }
      );

      if (updateResult.matchedCount === 0) {
        throw new InternalServerError('Failed to update file metadata');
      }

      // Get the updated file document
      const updatedFile = await this.db.collection(`${BUCKET_NAME}.files`).findOne({
        _id: fileObjectId
      }) as unknown as FileDocument;

      // Return updated file document
      return updatedFile;
    } catch (error) {
      logger.error('Error updating file metadata', {
        fileId,
        error: (error as Error).message,
        stack: (error as Error).stack
      });

      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }

      throw new InternalServerError(`Failed to update file metadata: ${(error as Error).message}`);
    }
  }
}