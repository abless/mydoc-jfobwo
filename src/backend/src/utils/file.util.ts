/**
 * File Utility Module
 * 
 * This module provides file handling functions for the Health Advisor application,
 * including file type validation, image processing, thumbnail generation, and
 * filename management for health data files.
 * 
 * These utilities support the application's health data input features, allowing
 * users to upload images (meals, lab results) and audio recordings (symptoms).
 */

import fs from 'fs-extra'; // ^11.1.0
import path from 'path'; // ^1.8.1
import crypto from 'crypto'; // ^1.0.1
import sharp from 'sharp'; // ^0.32.0
import mime from 'mime-types'; // ^2.1.35
import { Readable } from 'stream';

import { FileType, ImageProcessingOptions } from '../types/file.types';
import { FileProcessingError } from '../utils/error.util';
import { logger } from '../config';

// Allowed file types for the application
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Default configuration for image processing
const DEFAULT_IMAGE_QUALITY = 80;
const DEFAULT_THUMBNAIL_WIDTH = 200;
const DEFAULT_THUMBNAIL_HEIGHT = 200;

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates if a file's MIME type is allowed based on expected file type
 * 
 * @param mimetype - MIME type of the file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is valid, false otherwise
 */
export function validateFileType(mimetype: string, allowedTypes: string[]): boolean {
  if (!mimetype) {
    return false;
  }
  return allowedTypes.includes(mimetype.toLowerCase());
}

/**
 * Validates if a file's size is within the allowed limit
 * 
 * @param fileSize - Size of the file in bytes
 * @param maxSize - Maximum allowed size in bytes (defaults to MAX_FILE_SIZE)
 * @returns True if file size is valid, false otherwise
 */
export function validateFileSize(fileSize: number, maxSize: number = MAX_FILE_SIZE): boolean {
  if (!fileSize || fileSize <= 0) {
    return false;
  }
  return fileSize <= maxSize;
}

/**
 * Generates a unique filename based on original filename and timestamp
 * 
 * @param originalFilename - Original name of the uploaded file
 * @returns Unique filename with timestamp and random hash
 */
export function generateUniqueFilename(originalFilename: string): string {
  const fileExt = path.extname(originalFilename).toLowerCase();
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomHash}${fileExt}`;
}

/**
 * Determines the file type (IMAGE, AUDIO, DOCUMENT) based on MIME type
 * 
 * @param mimetype - MIME type of the file
 * @returns Determined file type enum value
 * @throws FileProcessingError if mimetype is not supported
 */
export function getFileType(mimetype: string): FileType {
  if (!mimetype) {
    throw new FileProcessingError('MIME type is required to determine file type');
  }

  const lowerMimetype = mimetype.toLowerCase();

  if (ALLOWED_IMAGE_TYPES.includes(lowerMimetype)) {
    return FileType.IMAGE;
  }

  if (ALLOWED_AUDIO_TYPES.includes(lowerMimetype)) {
    return FileType.AUDIO;
  }

  if (ALLOWED_DOCUMENT_TYPES.includes(lowerMimetype)) {
    return FileType.DOCUMENT;
  }

  throw new FileProcessingError(`Unsupported file type: ${mimetype}`);
}

/**
 * Creates a directory if it doesn't exist
 * 
 * @param dirPath - Path to the directory to create
 * @returns Promise that resolves when directory is ensured
 * @throws FileProcessingError if directory creation fails
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    const exists = await fs.pathExists(dirPath);
    if (!exists) {
      await fs.mkdirp(dirPath);
      logger.info(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    logger.error('Failed to ensure directory exists', {
      path: dirPath,
      error: (error as Error).message
    });
    throw new FileProcessingError(`Failed to ensure directory exists: ${(error as Error).message}`);
  }
}

/**
 * Processes an image with resizing, format conversion, and quality optimization
 * 
 * @param imageBuffer - Buffer containing the image data
 * @param options - Image processing options for customization
 * @returns Processed image as a buffer
 * @throws FileProcessingError if image processing fails
 */
export async function processImage(
  imageBuffer: Buffer,
  options?: ImageProcessingOptions
): Promise<Buffer> {
  try {
    // Set default options if not provided
    const opts = {
      resize: options?.resize || false,
      width: options?.width || 800,
      height: options?.height || 600,
      format: options?.format || 'jpeg',
      quality: options?.quality || DEFAULT_IMAGE_QUALITY,
      createThumbnail: options?.createThumbnail || false,
      thumbnailWidth: options?.thumbnailWidth || DEFAULT_THUMBNAIL_WIDTH,
      thumbnailHeight: options?.thumbnailHeight || DEFAULT_THUMBNAIL_HEIGHT,
    };

    // Create sharp instance
    let image = sharp(imageBuffer);

    // Resize if requested
    if (opts.resize) {
      image = image.resize(opts.width, opts.height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Set output format and quality
    if (opts.format === 'jpeg' || opts.format === 'jpg') {
      image = image.jpeg({ quality: opts.quality });
    } else if (opts.format === 'png') {
      image = image.png({ quality: opts.quality });
    } else if (opts.format === 'webp') {
      image = image.webp({ quality: opts.quality });
    }

    // Process and return the image
    return await image.toBuffer();
  } catch (error) {
    logger.error('Image processing failed', {
      error: (error as Error).message
    });
    throw new FileProcessingError(`Image processing failed: ${(error as Error).message}`);
  }
}

/**
 * Creates a thumbnail version of an image
 * 
 * @param imageBuffer - Buffer containing the image data
 * @param width - Width of the thumbnail (default: DEFAULT_THUMBNAIL_WIDTH)
 * @param height - Height of the thumbnail (default: DEFAULT_THUMBNAIL_HEIGHT)
 * @returns Thumbnail image as a buffer
 * @throws FileProcessingError if thumbnail creation fails
 */
export async function createThumbnail(
  imageBuffer: Buffer,
  width: number = DEFAULT_THUMBNAIL_WIDTH,
  height: number = DEFAULT_THUMBNAIL_HEIGHT
): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    logger.error('Thumbnail creation failed', {
      error: (error as Error).message
    });
    throw new FileProcessingError(`Thumbnail creation failed: ${(error as Error).message}`);
  }
}

/**
 * Gets the width and height of an image
 * 
 * @param imageBuffer - Buffer containing the image data
 * @returns Object containing width and height in pixels
 * @throws FileProcessingError if metadata retrieval fails
 */
export async function getImageDimensions(
  imageBuffer: Buffer
): Promise<{width: number, height: number}> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    logger.error('Failed to get image dimensions', {
      error: (error as Error).message
    });
    throw new FileProcessingError(`Failed to get image dimensions: ${(error as Error).message}`);
  }
}

/**
 * Checks if a file is an image based on its MIME type
 * 
 * @param mimetype - MIME type of the file
 * @returns True if file is an image, false otherwise
 */
export function isImage(mimetype: string): boolean {
  if (!mimetype) return false;
  return ALLOWED_IMAGE_TYPES.includes(mimetype.toLowerCase());
}

/**
 * Checks if a file is an audio file based on its MIME type
 * 
 * @param mimetype - MIME type of the file
 * @returns True if file is an audio file, false otherwise
 */
export function isAudio(mimetype: string): boolean {
  if (!mimetype) return false;
  return ALLOWED_AUDIO_TYPES.includes(mimetype.toLowerCase());
}

/**
 * Checks if a file is a document based on its MIME type
 * 
 * @param mimetype - MIME type of the file
 * @returns True if file is a document, false otherwise
 */
export function isDocument(mimetype: string): boolean {
  if (!mimetype) return false;
  return ALLOWED_DOCUMENT_TYPES.includes(mimetype.toLowerCase());
}

/**
 * Gets the file extension from a MIME type
 * 
 * @param mimetype - MIME type of the file
 * @returns File extension (e.g., '.jpg', '.mp3')
 */
export function getExtensionFromMimeType(mimetype: string): string {
  if (!mimetype) return '.bin';
  
  const extension = mime.extension(mimetype);
  if (!extension) return '.bin';
  
  return extension.startsWith('.') ? extension : `.${extension}`;
}

/**
 * Gets the MIME type from a file extension
 * 
 * @param extension - File extension (with or without leading dot)
 * @returns MIME type (e.g., 'image/jpeg', 'audio/mp3')
 */
export function getMimeTypeFromExtension(extension: string): string {
  if (!extension) return 'application/octet-stream';
  
  // Remove leading dot if present
  const cleanExtension = extension.startsWith('.') ? extension.substring(1) : extension;
  
  const mimetype = mime.lookup(cleanExtension);
  return mimetype || 'application/octet-stream';
}

/**
 * Converts a buffer to a readable stream
 * 
 * @param buffer - Buffer to convert to stream
 * @returns Readable stream from buffer
 */
export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Converts a readable stream to a buffer
 * 
 * @param stream - Readable stream to convert to buffer
 * @returns Promise resolving to buffer
 */
export function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    stream.on('error', (error) => {
      reject(new FileProcessingError(`Stream to buffer conversion failed: ${error.message}`));
    });
  });
}