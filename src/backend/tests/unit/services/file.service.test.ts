/**
 * Unit tests for FileService class
 * Tests the file handling functionality for the Health Advisor application
 */

import { Readable } from 'stream'; // ^0.0.2

// Import the service to test
import { FileService } from '../../../src/services/file.service';

// Import related types and utilities
import { FileRepository } from '../../../src/repositories/file.repository';
import { 
  FileType, 
  FileUploadRequest, 
  FileUploadResult, 
  FileDocument,
  FileRetrievalOptions
} from '../../../src/types/file.types';
import { 
  BadRequestError, 
  NotFoundError 
} from '../../../src/utils/error.util';

// Import test fixtures
import { mockUserId } from '../../mocks/user.mock';
import { mockHealthDataId, mockFileId } from '../../mocks/health.mock';

// Import test setup utilities
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  resetCollections 
} from '../../setup';

// Mock the FileRepository
jest.mock('../../../src/repositories/file.repository', () => ({
  FileRepository: jest.fn()
}));

/**
 * Creates a mock file upload request for testing
 */
const createMockFileUploadRequest = (overrides: Partial<FileUploadRequest> = {}): FileUploadRequest => {
  return {
    file: Buffer.from('test file content'),
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    userId: mockUserId,
    healthDataId: mockHealthDataId,
    tags: ['test', 'meal'],
    processImage: false,
    imageOptions: {
      resize: false,
      width: 800,
      height: 600,
      format: 'jpeg',
      quality: 80,
      createThumbnail: false,
      thumbnailWidth: 200,
      thumbnailHeight: 200
    },
    ...overrides
  };
};

/**
 * Creates a mock file upload result for testing
 */
const createMockFileUploadResult = (overrides: Partial<FileUploadResult> = {}): FileUploadResult => {
  return {
    fileId: mockFileId,
    filename: 'test-image.jpg',
    url: `/api/files/${mockFileId}`,
    contentType: 'image/jpeg',
    size: 1024,
    metadata: {
      userId: mockUserId,
      healthDataId: mockHealthDataId,
      originalname: 'test-image.jpg',
      filename: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      fileType: FileType.IMAGE,
      uploadDate: new Date(),
      tags: ['test', 'meal']
    },
    ...overrides
  };
};

/**
 * Creates a mock file document for testing
 */
const createMockFileDocument = (overrides: Partial<FileDocument> = {}): FileDocument => {
  return {
    _id: mockFileId,
    length: 1024,
    chunkSize: 261120,
    uploadDate: new Date(),
    filename: 'test-image.jpg',
    contentType: 'image/jpeg',
    metadata: {
      userId: mockUserId,
      healthDataId: mockHealthDataId,
      originalname: 'test-image.jpg',
      filename: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      fileType: FileType.IMAGE,
      uploadDate: new Date(),
      tags: ['test', 'meal']
    },
    ...overrides
  } as FileDocument;
};

describe('FileService', () => {
  let fileService: FileService;
  let mockFileRepository: jest.Mocked<FileRepository>;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileRepository = {
      uploadFile: jest.fn(),
      getFileById: jest.fn(),
      getFilesByHealthDataId: jest.fn(),
      getFilesByUserId: jest.fn(),
      deleteFile: jest.fn(),
      deleteFilesByHealthDataId: jest.fn(),
      createThumbnail: jest.fn(),
      getFileMetadata: jest.fn()
    } as unknown as jest.Mocked<FileRepository>;
    
    // Setup the mock for the FileRepository constructor
    (FileRepository as jest.Mock).mockImplementation(() => mockFileRepository);
    
    fileService = new FileService();
  });

  afterEach(async () => {
    await resetCollections();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest();
      const expectedResult = createMockFileUploadResult();
      mockFileRepository.uploadFile.mockResolvedValue(expectedResult);

      // Act
      const result = await fileService.uploadFile(uploadRequest);

      // Assert
      expect(mockFileRepository.uploadFile).toHaveBeenCalledWith(uploadRequest);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestError if missing required parameters', async () => {
      // Arrange
      const invalidRequest = createMockFileUploadRequest({
        file: undefined as unknown as Buffer
      });

      // Act & Assert
      await expect(fileService.uploadFile(invalidRequest))
        .rejects.toThrow(BadRequestError);
    });

    it('should process image if requested for image files', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest({
        processImage: true
      });
      const expectedResult = createMockFileUploadResult();
      mockFileRepository.uploadFile.mockResolvedValue(expectedResult);

      // Act
      const result = await fileService.uploadFile(uploadRequest);

      // Assert
      expect(mockFileRepository.uploadFile).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should create thumbnail for image files', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest();
      const expectedResult = createMockFileUploadResult();
      mockFileRepository.uploadFile.mockResolvedValue(expectedResult);
      mockFileRepository.createThumbnail.mockResolvedValue(expectedResult);

      // Act
      const result = await fileService.uploadFile(uploadRequest);

      // Assert
      expect(mockFileRepository.uploadFile).toHaveBeenCalled();
      expect(mockFileRepository.createThumbnail).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestError for unsupported file types', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest({
        mimetype: 'application/pdf'
      });

      // Act & Assert
      await expect(fileService.uploadFile(uploadRequest))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if file size exceeds limit', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest({
        size: 100 * 1024 * 1024 // 100MB, which exceeds the 10MB limit
      });

      // Act & Assert
      await expect(fileService.uploadFile(uploadRequest))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('getFileById', () => {
    it('should retrieve a file by ID', async () => {
      // Arrange
      const mockFile = createMockFileDocument();
      const mockBuffer = Buffer.from('test file content');
      mockFileRepository.getFileById.mockResolvedValue({ file: mockFile, buffer: mockBuffer });

      // Act
      const result = await fileService.getFileById(mockFileId);

      // Assert
      expect(mockFileRepository.getFileById).toHaveBeenCalledWith(mockFileId, { asStream: false, thumbnail: false, width: 200, height: 200 });
      expect(result).toEqual({ file: mockFile, buffer: mockBuffer });
    });

    it('should retrieve a file as stream if requested', async () => {
      // Arrange
      const mockFile = createMockFileDocument();
      const mockStream = new Readable();
      mockFileRepository.getFileById.mockResolvedValue({ file: mockFile, stream: mockStream });

      // Act
      const result = await fileService.getFileById(mockFileId, { asStream: true });

      // Assert
      expect(mockFileRepository.getFileById).toHaveBeenCalledWith(mockFileId, { asStream: true, thumbnail: false, width: 200, height: 200 });
      expect(result).toEqual({ file: mockFile, stream: mockStream });
    });

    it('should retrieve a thumbnail if requested', async () => {
      // Arrange
      const mockFile = createMockFileDocument();
      const mockBuffer = Buffer.from('thumbnail content');
      mockFileRepository.getFileById.mockResolvedValue({ file: mockFile, buffer: mockBuffer });

      // Act
      const result = await fileService.getFileById(mockFileId, { thumbnail: true });

      // Assert
      expect(mockFileRepository.getFileById).toHaveBeenCalledWith(mockFileId, { asStream: false, thumbnail: true, width: 200, height: 200 });
      expect(result).toEqual({ file: mockFile, buffer: mockBuffer });
    });

    it('should throw BadRequestError if file ID is missing', async () => {
      // Act & Assert
      await expect(fileService.getFileById(''))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if file is not found', async () => {
      // Arrange
      mockFileRepository.getFileById.mockRejectedValue(new NotFoundError('File not found', 'file'));

      // Act & Assert
      await expect(fileService.getFileById(mockFileId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getFilesByHealthDataId', () => {
    it('should retrieve all files associated with a health data entry', async () => {
      // Arrange
      const mockFiles = [createMockFileDocument(), createMockFileDocument()];
      mockFileRepository.getFilesByHealthDataId.mockResolvedValue(mockFiles);

      // Act
      const result = await fileService.getFilesByHealthDataId(mockHealthDataId);

      // Assert
      expect(mockFileRepository.getFilesByHealthDataId).toHaveBeenCalledWith(mockHealthDataId);
      expect(result).toEqual(mockFiles);
    });

    it('should throw BadRequestError if health data ID is missing', async () => {
      // Act & Assert
      await expect(fileService.getFilesByHealthDataId(''))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('getFilesByUserId', () => {
    it('should retrieve all files uploaded by a specific user', async () => {
      // Arrange
      const mockFiles = [createMockFileDocument(), createMockFileDocument()];
      mockFileRepository.getFilesByUserId.mockResolvedValue({ files: mockFiles, total: 2 });

      // Act
      const result = await fileService.getFilesByUserId(mockUserId);

      // Assert
      expect(mockFileRepository.getFilesByUserId).toHaveBeenCalledWith(mockUserId, { limit: 20, skip: 0 });
      expect(result).toEqual({ files: mockFiles, total: 2 });
    });

    it('should accept pagination options', async () => {
      // Arrange
      const mockFiles = [createMockFileDocument()];
      mockFileRepository.getFilesByUserId.mockResolvedValue({ files: mockFiles, total: 1 });

      // Act
      const result = await fileService.getFilesByUserId(mockUserId, { limit: 10, skip: 10 });

      // Assert
      expect(mockFileRepository.getFilesByUserId).toHaveBeenCalledWith(mockUserId, { limit: 10, skip: 10 });
      expect(result).toEqual({ files: mockFiles, total: 1 });
    });

    it('should throw BadRequestError if user ID is missing', async () => {
      // Act & Assert
      await expect(fileService.getFilesByUserId(''))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file by ID', async () => {
      // Arrange
      mockFileRepository.deleteFile.mockResolvedValue(true);

      // Act
      const result = await fileService.deleteFile(mockFileId);

      // Assert
      expect(mockFileRepository.deleteFile).toHaveBeenCalledWith(mockFileId);
      expect(result).toBe(true);
    });

    it('should throw BadRequestError if file ID is missing', async () => {
      // Act & Assert
      await expect(fileService.deleteFile(''))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if file is not found', async () => {
      // Arrange
      mockFileRepository.deleteFile.mockRejectedValue(new NotFoundError('File not found', 'file'));

      // Act & Assert
      await expect(fileService.deleteFile(mockFileId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteFilesByHealthDataId', () => {
    it('should delete all files associated with a health data entry', async () => {
      // Arrange
      mockFileRepository.deleteFilesByHealthDataId.mockResolvedValue(2);

      // Act
      const result = await fileService.deleteFilesByHealthDataId(mockHealthDataId);

      // Assert
      expect(mockFileRepository.deleteFilesByHealthDataId).toHaveBeenCalledWith(mockHealthDataId);
      expect(result).toBe(2);
    });

    it('should throw BadRequestError if health data ID is missing', async () => {
      // Act & Assert
      await expect(fileService.deleteFilesByHealthDataId(''))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('createThumbnail', () => {
    it('should create a thumbnail for an image file', async () => {
      // Arrange
      const mockResult = createMockFileUploadResult();
      mockFileRepository.createThumbnail.mockResolvedValue(mockResult);

      // Act
      const result = await fileService.createThumbnail(mockFileId);

      // Assert
      expect(mockFileRepository.createThumbnail).toHaveBeenCalledWith(mockFileId, 200, 200);
      expect(result).toEqual(mockResult);
    });

    it('should accept custom dimensions', async () => {
      // Arrange
      const width = 100;
      const height = 100;
      const mockResult = createMockFileUploadResult();
      mockFileRepository.createThumbnail.mockResolvedValue(mockResult);

      // Act
      const result = await fileService.createThumbnail(mockFileId, width, height);

      // Assert
      expect(mockFileRepository.createThumbnail).toHaveBeenCalledWith(mockFileId, width, height);
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestError if file ID is missing', async () => {
      // Act & Assert
      await expect(fileService.createThumbnail(''))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if file is not found', async () => {
      // Arrange
      mockFileRepository.createThumbnail.mockRejectedValue(new NotFoundError('File not found', 'file'));

      // Act & Assert
      await expect(fileService.createThumbnail(mockFileId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getFileUrl', () => {
    it('should generate a URL for accessing a file', async () => {
      // Arrange
      const mockFile = createMockFileDocument();
      mockFileRepository.getFileMetadata.mockResolvedValue(mockFile);

      // Act
      const result = await fileService.getFileUrl(mockFileId);

      // Assert
      expect(mockFileRepository.getFileMetadata).toHaveBeenCalledWith(mockFileId);
      expect(result).toBe(`/api/files/${mockFileId}`);
    });

    it('should generate a URL for accessing a thumbnail if requested', async () => {
      // Arrange
      const mockFile = createMockFileDocument();
      const thumbnailId = 'thumbnail-id';
      const mockThumbnailFile = createMockFileDocument({
        _id: thumbnailId,
        filename: 'test-image-thumbnail.jpg',
        metadata: {
          ...mockFile.metadata,
          originalFileId: mockFileId
        }
      });
      mockFileRepository.getFileMetadata.mockResolvedValue(mockFile);
      mockFileRepository.getFilesByHealthDataId.mockResolvedValue([mockThumbnailFile]);

      // Act
      const result = await fileService.getFileUrl(mockFileId, true);

      // Assert
      expect(mockFileRepository.getFileMetadata).toHaveBeenCalledWith(mockFileId);
      expect(mockFileRepository.getFilesByHealthDataId).toHaveBeenCalled();
      expect(result).toBe(`/api/files/${thumbnailId}`);
    });

    it('should throw BadRequestError if file ID is missing', async () => {
      // Act & Assert
      await expect(fileService.getFileUrl(''))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if file is not found', async () => {
      // Arrange
      mockFileRepository.getFileMetadata.mockRejectedValue(new NotFoundError('File not found', 'file'));

      // Act & Assert
      await expect(fileService.getFileUrl(mockFileId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('validateFile', () => {
    it('should validate a file successfully', () => {
      // Arrange
      const mimetype = 'image/jpeg';
      const size = 1024;
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024;

      // Act
      const result = fileService.validateFile(mimetype, size, allowedTypes, maxSize);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw BadRequestError if file type is not allowed', () => {
      // Arrange
      const mimetype = 'application/pdf';
      const size = 1024;
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024;

      // Act & Assert
      expect(() => fileService.validateFile(mimetype, size, allowedTypes, maxSize))
        .toThrow(BadRequestError);
    });

    it('should throw BadRequestError if file size exceeds limit', () => {
      // Arrange
      const mimetype = 'image/jpeg';
      const size = 20 * 1024 * 1024; // 20MB, exceeds 10MB limit
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 10 * 1024 * 1024;

      // Act & Assert
      expect(() => fileService.validateFile(mimetype, size, allowedTypes, maxSize))
        .toThrow(BadRequestError);
    });
  });

  describe('processHealthDataFile', () => {
    it('should process a meal photo correctly', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest();
      const expectedResult = createMockFileUploadResult();
      mockFileRepository.uploadFile.mockResolvedValue(expectedResult);
      mockFileRepository.createThumbnail.mockResolvedValue(expectedResult);

      // Act
      const result = await fileService.processHealthDataFile(uploadRequest, 'meal');

      // Assert
      expect(mockFileRepository.uploadFile).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should process a lab result image correctly', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest();
      const expectedResult = createMockFileUploadResult();
      mockFileRepository.uploadFile.mockResolvedValue(expectedResult);
      mockFileRepository.createThumbnail.mockResolvedValue(expectedResult);

      // Act
      const result = await fileService.processHealthDataFile(uploadRequest, 'labResult');

      // Assert
      expect(mockFileRepository.uploadFile).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should process a symptom voice recording correctly', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest({
        mimetype: 'audio/mp3'
      });
      const expectedResult = createMockFileUploadResult({
        contentType: 'audio/mp3',
        metadata: {
          ...createMockFileUploadResult().metadata,
          mimetype: 'audio/mp3',
          fileType: FileType.AUDIO
        }
      });
      mockFileRepository.uploadFile.mockResolvedValue(expectedResult);

      // Act
      const result = await fileService.processHealthDataFile(uploadRequest, 'symptom');

      // Assert
      expect(mockFileRepository.uploadFile).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestError for invalid health data type', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest();

      // Act & Assert
      await expect(fileService.processHealthDataFile(uploadRequest, 'invalidType'))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if file type is not allowed for health data type', async () => {
      // Arrange
      const uploadRequest = createMockFileUploadRequest({
        mimetype: 'audio/mp3'
      });

      // Act & Assert
      await expect(fileService.processHealthDataFile(uploadRequest, 'meal'))
        .rejects.toThrow(BadRequestError);
    });
  });
});