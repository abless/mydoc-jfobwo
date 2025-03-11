/**
 * File Upload Middleware
 * 
 * This module provides Express middleware for handling various types of file uploads
 * in the Health Advisor application. It configures multer for processing image, audio,
 * and document files with appropriate validation, storage, and error handling.
 * 
 * The middleware supports the following health data input requirements:
 * - Meal photos
 * - Lab result photos
 * - Voice recordings for symptom reporting
 * - Documents for additional health data
 */

import multer from 'multer'; // ^1.4.5-lts.1
import path from 'path'; // ^1.8.1
import fs from 'fs-extra'; // ^11.1.0
import { Request, Response, NextFunction } from 'express';

import { FileType } from '../types/file.types';
import { FileSizeLimits, FileStorageOptions } from '../types/file.types';
import { validateFileType, validateFileSize } from '../utils/file.util';
import { FileProcessingError } from '../utils/error.util';
import { logger } from '../config';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Maximum file sizes (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_HEALTH_DATA_FILES = 5; // Maximum number of files for health data uploads

// Upload directories
const UPLOAD_DIR = 'uploads/';
const IMAGE_UPLOAD_DIR = path.join(UPLOAD_DIR, 'images/');
const AUDIO_UPLOAD_DIR = path.join(UPLOAD_DIR, 'audio/');
const DOCUMENT_UPLOAD_DIR = path.join(UPLOAD_DIR, 'documents/');
const HEALTH_DATA_UPLOAD_DIR = path.join(UPLOAD_DIR, 'health-data/');

/**
 * Creates a file filter function for multer to validate file types
 * 
 * @param allowedTypes - Array of allowed MIME types
 * @returns File filter function for multer
 */
function createFileFilter(allowedTypes: string[]): multer.Options['fileFilter'] {
  return (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    if (!file) {
      logger.error('File validation failed: No file provided');
      return callback(new FileProcessingError('No file provided'));
    }

    const isValid = validateFileType(file.mimetype, allowedTypes);
    
    if (isValid) {
      logger.info(`File validation passed: ${file.originalname} (${file.mimetype})`);
      return callback(null, true);
    } else {
      logger.error(`File validation failed: ${file.originalname} (${file.mimetype}). Allowed types: ${allowedTypes.join(', ')}`);
      return callback(new FileProcessingError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  };
}

/**
 * Creates a multer disk storage configuration
 * 
 * @param destination - Directory path for file storage
 * @returns Configured multer storage engine
 */
function createStorageConfig(destination: string): multer.StorageEngine {
  // Ensure destination directory exists
  fs.ensureDirSync(destination);
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp and original extension
      const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniquePrefix + ext);
    }
  });
}

/**
 * Creates a multer middleware for file uploads with specific configuration
 * 
 * @param options - Configuration options for file storage
 * @returns Configured multer middleware
 */
function createUploadMiddleware(options: Partial<FileStorageOptions>): multer.Multer {
  // Set default options if not provided
  const destination = options.destination || UPLOAD_DIR;
  const storage = options.storage || createStorageConfig(destination);
  const limits = options.limits || { fileSize: MAX_IMAGE_SIZE, files: 1 };
  const fileFilter = options.fileFilter || createFileFilter(ALLOWED_IMAGE_TYPES);

  return multer({
    storage: storage,
    limits: limits,
    fileFilter: fileFilter
  });
}

/**
 * Middleware for handling image file uploads
 * 
 * Configures multer for processing image files with appropriate validation and storage.
 * Used for meal photos and lab result photos.
 * 
 * @returns Multer middleware configured for image uploads
 */
export function imageUpload(): multer.Multer {
  return createUploadMiddleware({
    destination: IMAGE_UPLOAD_DIR,
    limits: {
      fileSize: MAX_IMAGE_SIZE,
      files: 1
    },
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES)
  });
}

/**
 * Middleware for handling audio file uploads
 * 
 * Configures multer for processing audio files with appropriate validation and storage.
 * Used for symptom voice recordings.
 * 
 * @returns Multer middleware configured for audio uploads
 */
export function audioUpload(): multer.Multer {
  return createUploadMiddleware({
    destination: AUDIO_UPLOAD_DIR,
    limits: {
      fileSize: MAX_AUDIO_SIZE,
      files: 1
    },
    fileFilter: createFileFilter(ALLOWED_AUDIO_TYPES)
  });
}

/**
 * Middleware for handling document file uploads
 * 
 * Configures multer for processing document files with appropriate validation and storage.
 * 
 * @returns Multer middleware configured for document uploads
 */
export function documentUpload(): multer.Multer {
  return createUploadMiddleware({
    destination: DOCUMENT_UPLOAD_DIR,
    limits: {
      fileSize: MAX_DOCUMENT_SIZE,
      files: 1
    },
    fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES)
  });
}

/**
 * Middleware for handling health data file uploads (images, audio, documents)
 * 
 * Configures multer for processing multiple health data files with appropriate validation and storage.
 * This middleware supports mixed file types including images, audio, and documents.
 * 
 * @returns Multer middleware configured for health data uploads
 */
export function healthDataUpload(): multer.Multer {
  // Combine all allowed file types
  const allowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_AUDIO_TYPES,
    ...ALLOWED_DOCUMENT_TYPES
  ];

  return createUploadMiddleware({
    destination: HEALTH_DATA_UPLOAD_DIR,
    limits: {
      fileSize: MAX_AUDIO_SIZE, // Use the largest limit for mixed uploads
      files: MAX_HEALTH_DATA_FILES
    },
    fileFilter: createFileFilter(allowedTypes)
  });
}

/**
 * Error handling middleware for file upload errors
 * 
 * Processes multer and custom file processing errors and formats appropriate error responses.
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function handleUploadError(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error('File upload error', {
    error: err.message,
    stack: err.stack
  });

  // Handle multer-specific errors
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File is too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name in upload';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart form';
        break;
      default:
        message = `Multer error: ${err.code}`;
    }
    
    return next(new FileProcessingError(message));
  }
  
  // Pass other errors to the global error handler
  next(err);
}