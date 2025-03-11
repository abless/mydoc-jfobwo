/**
 * TypeScript type definitions for file handling in the Health Advisor application
 * Defines interfaces for file metadata, upload requests/results, storage options, and enums for file types
 * Used across the backend for consistent file operations when handling health data images, audio recordings, and documents
 */

import { Request } from 'express'; // v4.18.2
import * as Multer from 'multer'; // v1.4.5
import { ObjectId } from 'mongoose'; // v6.0.0

/**
 * Enum defining supported file types in the application
 */
export enum FileType {
  IMAGE = 'image',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

/**
 * Interface for file metadata information stored with files
 */
export interface FileMetadata {
  userId: ObjectId;
  healthDataId: ObjectId;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  fileType: FileType;
  uploadDate: Date;
  tags: string[];
}

/**
 * Interface for GridFS file document structure
 */
export interface FileDocument {
  _id: ObjectId;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  filename: string;
  contentType: string;
  metadata: FileMetadata;
}

/**
 * Interface for file upload request parameters
 */
export interface FileUploadRequest {
  file: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  userId: string;
  healthDataId: string;
  tags: string[];
  processImage: boolean;
  imageOptions: ImageProcessingOptions;
}

/**
 * Interface for file upload result information
 */
export interface FileUploadResult {
  fileId: string;
  filename: string;
  url: string;
  contentType: string;
  size: number;
  metadata: FileMetadata;
}

/**
 * Interface for file retrieval options
 */
export interface FileRetrievalOptions {
  asStream: boolean;
  thumbnail: boolean;
  width: number;
  height: number;
}

/**
 * Interface for file storage configuration options
 */
export interface FileStorageOptions {
  destination: string;
  limits: FileSizeLimits;
  fileFilter: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
  storage: Multer.StorageEngine;
}

/**
 * Interface for file size and count limits
 */
export interface FileSizeLimits {
  fileSize: number;
  files: number;
}

/**
 * Interface for image processing options
 */
export interface ImageProcessingOptions {
  resize: boolean;
  width: number;
  height: number;
  format: string;
  quality: number;
  createThumbnail: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

/**
 * Extension of Express Request with files property
 */
export interface FileWithRequest extends Request {
  files: Record<string, Express.Multer.File[]>;
  file: Express.Multer.File;
}