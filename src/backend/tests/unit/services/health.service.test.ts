import mongoose from 'mongoose'; // mongoose version ^7.0.3
import { HealthService } from '../../../src/services/health.service';
import { HealthRepository } from '../../../src/repositories/health.repository';
import { FileService } from '../../../src/services/file.service';
import { 
  HealthDataType, 
  CreateHealthDataRequest, 
  GetHealthDataRequest, 
  HealthDataResponse
} from '../../../src/types/health.types';
import { NotFoundError, BadRequestError } from '../../../src/utils/error.util';
import { 
  mockMealHealthData, 
  mockLabResultHealthData, 
  mockSymptomHealthData,
  mockHealthDataRequest,
  mockHealthDataResponse,
  createMockHealthData,
  createMockHealthDataRequest,
  mockUserId,
  mockFileId,
  mockHealthDataId
} from '../../mocks/health.mock';

// Mock the dependencies
jest.mock('../../../src/repositories/health.repository');
jest.mock('../../../src/services/file.service');

describe('HealthService', () => {
  let healthService: HealthService;
  let mockMongooseConnection: mongoose.Connection;
  let healthRepositoryMock: jest.Mocked<HealthRepository>;
  let fileServiceMock: jest.Mocked<FileService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock MongoDB connection
    mockMongooseConnection = {} as mongoose.Connection;

    // Create mock instances
    healthRepositoryMock = {
      createHealthData: jest.fn(),
      findHealthDataById: jest.fn(),
      findHealthDataByUserId: jest.fn(),
      updateHealthData: jest.fn(),
      deleteHealthData: jest.fn(),
      enrichHealthDataWithFiles: jest.fn(),
      getRecentHealthData: jest.fn()
    } as unknown as jest.Mocked<HealthRepository>;

    fileServiceMock = {
      processHealthDataFile: jest.fn(),
      deleteFilesByHealthDataId: jest.fn(),
      getFileUrl: jest.fn()
    } as unknown as jest.Mocked<FileService>;

    // Create HealthService instance with mocked dependencies
    healthService = new HealthService(mockMongooseConnection);
    
    // Override repository and service instances with mocks
    (healthService as any).healthRepository = healthRepositoryMock;
    (healthService as any).fileService = fileServiceMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHealthData', () => {
    it('should create health data without files', async () => {
      // Setup
      const request = mockHealthDataRequest;
      const userId = mockUserId;
      
      // Mock repository response
      healthRepositoryMock.createHealthData.mockResolvedValue(mockMealHealthData);
      
      // Call the method
      const result = await healthService.createHealthData(request, userId);
      
      // Assertions
      expect(healthRepositoryMock.createHealthData).toHaveBeenCalledWith(expect.objectContaining({
        userId: expect.any(mongoose.Types.ObjectId),
        type: request.type,
        data: request.data
      }));
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: request.type,
        data: request.data
      }));
    });

    it('should create health data with files', async () => {
      // Setup
      const request = mockHealthDataRequest;
      const userId = mockUserId;
      const files = [{ buffer: Buffer.from('test'), mimetype: 'image/jpeg', originalname: 'test.jpg' }] as Express.Multer.File[];
      
      // Mock repository responses
      healthRepositoryMock.createHealthData.mockResolvedValue(mockMealHealthData);
      healthRepositoryMock.findHealthDataById.mockResolvedValue(mockMealHealthData);
      healthRepositoryMock.updateHealthData.mockResolvedValue(mockMealHealthData);
      
      // Mock file service response
      fileServiceMock.processHealthDataFile.mockResolvedValue({
        fileId: mockFileId,
        filename: 'test.jpg',
        url: `/api/files/${mockFileId}`,
        contentType: 'image/jpeg',
        size: 100,
        metadata: {} as any
      });
      
      // Call the method
      const result = await healthService.createHealthData(request, userId, files);
      
      // Assertions
      expect(healthRepositoryMock.createHealthData).toHaveBeenCalled();
      expect(fileServiceMock.processHealthDataFile).toHaveBeenCalled();
      expect(healthRepositoryMock.updateHealthData).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: request.type,
        data: request.data
      }));
    });

    it('should handle errors during file processing', async () => {
      // Setup
      const request = mockHealthDataRequest;
      const userId = mockUserId;
      const files = [{ buffer: Buffer.from('test'), mimetype: 'image/jpeg', originalname: 'test.jpg' }] as Express.Multer.File[];
      
      // Mock repository responses
      healthRepositoryMock.createHealthData.mockResolvedValue(mockMealHealthData);
      
      // Mock file service error
      fileServiceMock.processHealthDataFile.mockRejectedValue(new Error('File processing failed'));
      
      // Call the method and expect the error to be thrown
      await expect(healthService.createHealthData(request, userId, files))
        .rejects.toThrow('File processing failed');
      
      // Assertions
      expect(healthRepositoryMock.createHealthData).toHaveBeenCalled();
      expect(fileServiceMock.processHealthDataFile).toHaveBeenCalled();
    });

    it('should throw BadRequestError for invalid health data request', async () => {
      // Setup
      const invalidRequest = { type: HealthDataType.MEAL } as CreateHealthDataRequest;
      const userId = mockUserId;
      
      // Call the method and expect error
      await expect(healthService.createHealthData(invalidRequest, userId))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('getHealthDataById', () => {
    it('should retrieve health data by ID', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataById.mockResolvedValue(mockMealHealthData);
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(mockMealHealthData);
      
      // Call the method
      const result = await healthService.getHealthDataById(healthDataId, userId);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
      expect(healthRepositoryMock.enrichHealthDataWithFiles).toHaveBeenCalledWith(mockMealHealthData);
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: mockMealHealthData.type,
        data: mockMealHealthData.data
      }));
    });

    it('should return null if health data not found', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      
      // Mock repository response for not found
      healthRepositoryMock.findHealthDataById.mockResolvedValue(null);
      
      // Call the method
      const result = await healthService.getHealthDataById(healthDataId, userId);
      
      // Assertions
      expect(result).toBeNull();
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
      expect(healthRepositoryMock.enrichHealthDataWithFiles).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      
      // Mock repository error
      healthRepositoryMock.findHealthDataById.mockRejectedValue(new Error('Database connection failed'));
      
      // Call the method and expect error
      await expect(healthService.getHealthDataById(healthDataId, userId))
        .rejects.toThrow('Database connection failed');
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
    });
  });

  describe('getHealthData', () => {
    it('should retrieve health data with default pagination', async () => {
      // Setup
      const userId = mockUserId;
      const options: GetHealthDataRequest = {};
      const items = [mockMealHealthData, mockLabResultHealthData];
      const total = items.length;
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataByUserId.mockResolvedValue({ items, total });
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(items);
      
      // Call the method
      const result = await healthService.getHealthData(options, userId);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          page: 1,
          limit: 20
        })
      );
      expect(healthRepositoryMock.enrichHealthDataWithFiles).toHaveBeenCalledWith(items);
      expect(result).toEqual({
        items: expect.any(Array),
        total,
        page: 1
      });
      expect(result.items.length).toBe(items.length);
    });

    it('should retrieve health data with custom pagination', async () => {
      // Setup
      const userId = mockUserId;
      const options: GetHealthDataRequest = { page: 2, limit: 10 };
      const items = [mockMealHealthData];
      const total = 15; // Simulating more items than returned
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataByUserId.mockResolvedValue({ items, total });
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(items);
      
      // Call the method
      const result = await healthService.getHealthData(options, userId);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          page: 2,
          limit: 10
        })
      );
      expect(result).toEqual({
        items: expect.any(Array),
        total,
        page: 2
      });
    });

    it('should retrieve health data filtered by date', async () => {
      // Setup
      const userId = mockUserId;
      const options: GetHealthDataRequest = { date: '2023-05-15' };
      const items = [mockMealHealthData, mockLabResultHealthData];
      const total = items.length;
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataByUserId.mockResolvedValue({ items, total });
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(items);
      
      // Call the method
      const result = await healthService.getHealthData(options, userId);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          date: '2023-05-15'
        })
      );
      expect(result.items.length).toBe(items.length);
    });

    it('should retrieve health data filtered by type', async () => {
      // Setup
      const userId = mockUserId;
      const options: GetHealthDataRequest = { type: HealthDataType.MEAL };
      const items = [mockMealHealthData];
      const total = items.length;
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataByUserId.mockResolvedValue({ items, total });
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(items);
      
      // Call the method
      const result = await healthService.getHealthData(options, userId);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          type: HealthDataType.MEAL
        })
      );
      expect(result.items.length).toBe(items.length);
      expect(result.items[0].type).toBe(HealthDataType.MEAL);
    });

    it('should retrieve health data filtered by search term', async () => {
      // Setup
      const userId = mockUserId;
      const options: GetHealthDataRequest = { search: 'oatmeal' };
      const items = [mockMealHealthData];
      const total = items.length;
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataByUserId.mockResolvedValue({ items, total });
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(items);
      
      // Call the method
      const result = await healthService.getHealthData(options, userId);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataByUserId).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          search: 'oatmeal'
        })
      );
      expect(result.items.length).toBe(items.length);
    });

    it('should handle empty result sets', async () => {
      // Setup
      const userId = mockUserId;
      const options: GetHealthDataRequest = { search: 'nonexistent' };
      
      // Mock repository responses for empty results
      healthRepositoryMock.findHealthDataByUserId.mockResolvedValue({ items: [], total: 0 });
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue([]);
      
      // Call the method
      const result = await healthService.getHealthData(options, userId);
      
      // Assertions
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('updateHealthData', () => {
    it('should update health data without files', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      const updateData = { data: { description: 'Updated meal description', mealType: 'breakfast' } };
      const existingData = mockMealHealthData;
      const updatedData = { ...mockMealHealthData, data: { ...mockMealHealthData.data, ...updateData.data } };
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataById.mockResolvedValue(existingData);
      healthRepositoryMock.updateHealthData.mockResolvedValue(updatedData);
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(updatedData);
      
      // Call the method
      const result = await healthService.updateHealthData(healthDataId, userId, updateData);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
      expect(healthRepositoryMock.updateHealthData).toHaveBeenCalledWith(
        healthDataId,
        userId,
        expect.objectContaining(updateData)
      );
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: updatedData.type,
        data: expect.objectContaining(updateData.data)
      }));
    });

    it('should update health data with new files', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      const updateData = { data: { description: 'Updated meal with new photo', mealType: 'breakfast' } };
      const existingData = mockMealHealthData;
      const updatedData = { ...mockMealHealthData, data: { ...mockMealHealthData.data, ...updateData.data } };
      const files = [{ buffer: Buffer.from('test'), mimetype: 'image/jpeg', originalname: 'updated.jpg' }] as Express.Multer.File[];
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataById.mockResolvedValue(existingData);
      healthRepositoryMock.updateHealthData.mockResolvedValue(updatedData);
      healthRepositoryMock.enrichHealthDataWithFiles.mockResolvedValue(updatedData);
      
      // Mock file service response
      fileServiceMock.processHealthDataFile.mockResolvedValue({
        fileId: mockFileId,
        filename: 'updated.jpg',
        url: `/api/files/${mockFileId}`,
        contentType: 'image/jpeg',
        size: 100,
        metadata: {} as any
      });
      
      // Call the method
      const result = await healthService.updateHealthData(healthDataId, userId, updateData, files);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
      expect(fileServiceMock.processHealthDataFile).toHaveBeenCalled();
      expect(healthRepositoryMock.updateHealthData).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: updatedData.type,
        data: expect.objectContaining(updateData.data)
      }));
    });

    it('should return null if health data not found', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      const updateData = { data: { description: 'Updated description' } };
      
      // Mock repository response for not found
      healthRepositoryMock.findHealthDataById.mockResolvedValue(null);
      
      // Call the method
      const result = await healthService.updateHealthData(healthDataId, userId, updateData);
      
      // Assertions
      expect(result).toBeNull();
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
      expect(healthRepositoryMock.updateHealthData).not.toHaveBeenCalled();
    });
  });

  describe('deleteHealthData', () => {
    it('should delete health data successfully', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      const existingData = { ...mockMealHealthData, fileIds: [new mongoose.Types.ObjectId(mockFileId)] };
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataById.mockResolvedValue(existingData);
      healthRepositoryMock.deleteHealthData.mockResolvedValue(true);
      fileServiceMock.deleteFilesByHealthDataId.mockResolvedValue(1);
      
      // Call the method
      const result = await healthService.deleteHealthData(healthDataId, userId);
      
      // Assertions
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
      expect(fileServiceMock.deleteFilesByHealthDataId).toHaveBeenCalledWith(healthDataId);
      expect(healthRepositoryMock.deleteHealthData).toHaveBeenCalledWith(healthDataId, userId);
      expect(result).toBe(true);
    });

    it('should return false if health data not found', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      
      // Mock repository response for not found
      healthRepositoryMock.findHealthDataById.mockResolvedValue(null);
      
      // Call the method
      const result = await healthService.deleteHealthData(healthDataId, userId);
      
      // Assertions
      expect(result).toBe(false);
      expect(healthRepositoryMock.findHealthDataById).toHaveBeenCalledWith(healthDataId, userId);
      expect(healthRepositoryMock.deleteHealthData).not.toHaveBeenCalled();
      expect(fileServiceMock.deleteFilesByHealthDataId).not.toHaveBeenCalled();
    });

    it('should delete health data with no associated files', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      const existingData = { ...mockMealHealthData, fileIds: [] };
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataById.mockResolvedValue(existingData);
      healthRepositoryMock.deleteHealthData.mockResolvedValue(true);
      
      // Call the method
      const result = await healthService.deleteHealthData(healthDataId, userId);
      
      // Assertions
      expect(healthRepositoryMock.deleteHealthData).toHaveBeenCalledWith(healthDataId, userId);
      expect(fileServiceMock.deleteFilesByHealthDataId).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle file deletion errors gracefully', async () => {
      // Setup
      const healthDataId = mockHealthDataId;
      const userId = mockUserId;
      const existingData = { ...mockMealHealthData, fileIds: [new mongoose.Types.ObjectId(mockFileId)] };
      
      // Mock repository responses
      healthRepositoryMock.findHealthDataById.mockResolvedValue(existingData);
      healthRepositoryMock.deleteHealthData.mockResolvedValue(true);
      
      // Mock file service error
      fileServiceMock.deleteFilesByHealthDataId.mockRejectedValue(new Error('File deletion failed'));
      
      // Call the method
      await expect(healthService.deleteHealthData(healthDataId, userId))
        .rejects.toThrow('File deletion failed');
      
      // Assertions
      expect(fileServiceMock.deleteFilesByHealthDataId).toHaveBeenCalledWith(healthDataId);
      expect(healthRepositoryMock.deleteHealthData).not.toHaveBeenCalled();
    });
  });

  describe('getHealthContext', () => {
    it('should retrieve health context data with default limit', async () => {
      // Setup
      const userId = mockUserId;
      const recentData = {
        meals: [mockMealHealthData],
        labResults: [mockLabResultHealthData],
        symptoms: [mockSymptomHealthData]
      };
      
      // Mock repository responses
      healthRepositoryMock.getRecentHealthData.mockResolvedValue(recentData);
      healthRepositoryMock.enrichHealthDataWithFiles.mockImplementation(data => data);
      
      // Call the method
      const result = await healthService.getHealthContext(userId);
      
      // Assertions
      expect(healthRepositoryMock.getRecentHealthData).toHaveBeenCalledWith(userId, 5);
      expect(healthRepositoryMock.enrichHealthDataWithFiles).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        recentMeals: expect.any(Array),
        recentLabResults: expect.any(Array),
        recentSymptoms: expect.any(Array)
      });
      expect(result.recentMeals.length).toBe(1);
      expect(result.recentLabResults.length).toBe(1);
      expect(result.recentSymptoms.length).toBe(1);
    });

    it('should retrieve health context data with custom limit', async () => {
      // Setup
      const userId = mockUserId;
      const limit = 10;
      const recentData = {
        meals: [mockMealHealthData, mockMealHealthData],
        labResults: [mockLabResultHealthData],
        symptoms: [mockSymptomHealthData, mockSymptomHealthData, mockSymptomHealthData]
      };
      
      // Mock repository responses
      healthRepositoryMock.getRecentHealthData.mockResolvedValue(recentData);
      healthRepositoryMock.enrichHealthDataWithFiles.mockImplementation(data => data);
      
      // Call the method
      const result = await healthService.getHealthContext(userId, limit);
      
      // Assertions
      expect(healthRepositoryMock.getRecentHealthData).toHaveBeenCalledWith(userId, limit);
      expect(result.recentMeals.length).toBe(2);
      expect(result.recentLabResults.length).toBe(1);
      expect(result.recentSymptoms.length).toBe(3);
    });

    it('should handle empty health context gracefully', async () => {
      // Setup
      const userId = mockUserId;
      const emptyData = {
        meals: [],
        labResults: [],
        symptoms: []
      };
      
      // Mock repository responses
      healthRepositoryMock.getRecentHealthData.mockResolvedValue(emptyData);
      healthRepositoryMock.enrichHealthDataWithFiles.mockImplementation(data => data);
      
      // Call the method
      const result = await healthService.getHealthContext(userId);
      
      // Assertions
      expect(result.recentMeals).toEqual([]);
      expect(result.recentLabResults).toEqual([]);
      expect(result.recentSymptoms).toEqual([]);
    });
  });

  describe('validateHealthDataRequest', () => {
    it('should throw BadRequestError with appropriate message if request is missing', async () => {
      // Setup
      const userId = mockUserId;
      const request = null as unknown as CreateHealthDataRequest;
      
      // Call the method and expect specific error message
      await expect(healthService.createHealthData(request, userId))
        .rejects.toThrow(/Health data request object is required/);
    });

    it('should throw BadRequestError with appropriate message if type is missing', async () => {
      // Setup
      const userId = mockUserId;
      const request = { data: mockMealHealthData.data } as CreateHealthDataRequest;
      
      // Call the method and expect specific error message
      await expect(healthService.createHealthData(request, userId))
        .rejects.toThrow(/Health data type is required/);
    });

    it('should throw BadRequestError with appropriate message if data is missing', async () => {
      // Setup
      const userId = mockUserId;
      const request = { type: HealthDataType.MEAL } as CreateHealthDataRequest;
      
      // Call the method and expect specific error message
      await expect(healthService.createHealthData(request, userId))
        .rejects.toThrow(/Health data content is required/);
    });

    it('should throw BadRequestError for invalid meal data', async () => {
      // Setup
      const userId = mockUserId;
      const request = { 
        type: HealthDataType.MEAL, 
        data: { description: 'Missing meal type' } 
      } as CreateHealthDataRequest;
      
      // Call the method and expect error
      await expect(healthService.createHealthData(request, userId))
        .rejects.toThrow(/Meal data must include description and mealType/);
    });

    it('should throw BadRequestError for invalid lab result data', async () => {
      // Setup
      const userId = mockUserId;
      const request = { 
        type: HealthDataType.LAB_RESULT, 
        data: { testType: 'Missing test date' } 
      } as CreateHealthDataRequest;
      
      // Call the method and expect error
      await expect(healthService.createHealthData(request, userId))
        .rejects.toThrow(/Lab result data must include testType and testDate/);
    });

    it('should throw BadRequestError for invalid symptom data', async () => {
      // Setup
      const userId = mockUserId;
      const request = { 
        type: HealthDataType.SYMPTOM, 
        data: { description: 'Missing severity' } 
      } as CreateHealthDataRequest;
      
      // Call the method and expect error
      await expect(healthService.createHealthData(request, userId))
        .rejects.toThrow(/Symptom data must include description and severity/);
    });

    it('should throw BadRequestError for invalid health data type', async () => {
      // Setup
      const userId = mockUserId;
      const request = { 
        type: 'invalid' as HealthDataType, 
        data: {} 
      } as CreateHealthDataRequest;
      
      // Call the method and expect error
      await expect(healthService.createHealthData(request, userId))
        .rejects.toThrow(/Invalid health data type/);
    });
  });
});