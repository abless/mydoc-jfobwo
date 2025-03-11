import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import mongoose from 'mongoose'; // ^7.0.3
import { HealthController } from '../../../src/controllers/health.controller';
import { HealthService } from '../../../src/services/health.service';
import {
  HealthDataType,
  CreateHealthDataRequest,
  GetHealthDataRequest,
  HealthDataResponse,
  HealthContext
} from '../../../src/types/health.types';
import { NotFoundError, BadRequestError } from '../../../src/utils/error.util';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated
} from '../../../src/utils/response.util';
import { mockUserId } from '../../mocks/user.mock';
import {
  mockHealthDataId,
  mockHealthDataResponse,
  mockMealHealthData,
  mockLabResultHealthData,
  mockSymptomHealthData,
  mockHealthDataRequest,
  createMockHealthDataResponse
} from '../../mocks/health.mock';

// Mock dependencies
jest.mock('../../../src/services/health.service');
jest.mock('../../../src/utils/response.util');
jest.mock('../../../src/config/logger');

describe('HealthController', () => {
  let controller: HealthController;
  let mockConnection: mongoose.Connection;
  let mockHealthService: jest.Mocked<HealthService>;
  
  // Mock request, response, and next function
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  
  beforeEach(() => {
    // Initialize mocks
    mockConnection = {} as mongoose.Connection;
    
    // Create a mock instance with all service methods
    mockHealthService = {
      createHealthData: jest.fn(),
      getHealthDataById: jest.fn(),
      getHealthData: jest.fn(),
      updateHealthData: jest.fn(),
      deleteHealthData: jest.fn(),
      getHealthContext: jest.fn()
    } as unknown as jest.Mocked<HealthService>;
    
    // Mock the HealthService constructor to return our mock instance
    (HealthService as jest.MockedClass<typeof HealthService>).mockImplementation(() => mockHealthService);
    
    // Create controller with mocked service
    controller = new HealthController(mockConnection);
    
    // Reset request, response, and next function mocks
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    mockRequest = {};
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  // Test constructor
  it('should initialize HealthService with the provided connection', () => {
    expect(HealthService).toHaveBeenCalledWith(mockConnection);
    expect(controller).toBeInstanceOf(HealthController);
  });
  
  describe('createHealthData', () => {
    it('should create health data and return created response', async () => {
      // Mock request with authenticated user and health data request body
      mockRequest = {
        user: { id: mockUserId },
        body: mockHealthDataRequest
      };
      
      mockHealthService.createHealthData.mockResolvedValue(mockHealthDataResponse);
      
      // Call controller.createHealthData with mocked request, response, and next
      await controller.createHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.createHealthData to be called with correct parameters
      expect(mockHealthService.createHealthData).toHaveBeenCalledWith(
        mockHealthDataRequest,
        mockUserId,
        undefined
      );
      // Expect sendCreated to be called with response and health data
      expect(sendCreated).toHaveBeenCalledWith(
        mockResponse,
        mockHealthDataResponse,
        'Health data created successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should handle files in the request', async () => {
      // Mock request with authenticated user, health data request body, and files array
      const mockFiles = [{ fieldname: 'file' } as Express.Multer.File];
      mockRequest = {
        user: { id: mockUserId },
        body: mockHealthDataRequest,
        files: mockFiles
      };
      
      mockHealthService.createHealthData.mockResolvedValue(mockHealthDataResponse);
      
      // Call controller.createHealthData with mocked request, response, and next
      await controller.createHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.createHealthData to be called with request data, user ID, and files
      expect(mockHealthService.createHealthData).toHaveBeenCalledWith(
        mockHealthDataRequest,
        mockUserId,
        mockFiles
      );
      // Expect sendCreated to be called with response and health data
      expect(sendCreated).toHaveBeenCalledWith(
        mockResponse,
        mockHealthDataResponse,
        'Health data created successfully'
      );
    });
    
    it('should pass error to next function when service throws', async () => {
      // Mock request with authenticated user and health data request body
      mockRequest = {
        user: { id: mockUserId },
        body: mockHealthDataRequest
      };
      
      const mockError = new Error('Service error');
      mockHealthService.createHealthData.mockRejectedValue(mockError);
      
      // Call controller.createHealthData with mocked request, response, and next
      await controller.createHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with the thrown error
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(sendCreated).not.toHaveBeenCalled();
    });
  });
  
  describe('getHealthDataById', () => {
    it('should return health data when found', async () => {
      // Mock request with authenticated user and health data ID in params
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId }
      };
      
      mockHealthService.getHealthDataById.mockResolvedValue(mockHealthDataResponse);
      
      // Call controller.getHealthDataById with mocked request, response, and next
      await controller.getHealthDataById(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.getHealthDataById to be called with ID and user ID
      expect(mockHealthService.getHealthDataById).toHaveBeenCalledWith(
        mockHealthDataId,
        mockUserId
      );
      // Expect sendSuccess to be called with response and health data
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockHealthDataResponse,
        'Health data retrieved successfully'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should throw NotFoundError when health data not found', async () => {
      // Mock request with authenticated user and health data ID in params
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId }
      };
      
      mockHealthService.getHealthDataById.mockResolvedValue(null);
      
      // Call controller.getHealthDataById with mocked request, response, and next
      await controller.getHealthDataById(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with NotFoundError
      expect(mockNext).toHaveBeenCalled();
      const notFoundError = mockNext.mock.calls[0][0];
      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(notFoundError.message).toContain(mockHealthDataId);
    });
    
    it('should pass error to next function when service throws', async () => {
      // Mock request with authenticated user and health data ID in params
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId }
      };
      
      const mockError = new Error('Service error');
      mockHealthService.getHealthDataById.mockRejectedValue(mockError);
      
      // Call controller.getHealthDataById with mocked request, response, and next
      await controller.getHealthDataById(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with the thrown error
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getHealthData', () => {
    it('should return paginated health data', async () => {
      // Mock request with authenticated user and query parameters
      mockRequest = {
        user: { id: mockUserId },
        query: {}
      };
      
      const mockPaginatedResult = {
        items: [mockHealthDataResponse],
        total: 1,
        page: 1
      };
      mockHealthService.getHealthData.mockResolvedValue(mockPaginatedResult);
      
      // Call controller.getHealthData with mocked request, response, and next
      await controller.getHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.getHealthData to be called with options and user ID
      expect(mockHealthService.getHealthData).toHaveBeenCalledWith(
        expect.any(Object),
        mockUserId
      );
      // Expect sendPaginated to be called with response, items, total, and page
      expect(sendPaginated).toHaveBeenCalledWith(
        mockResponse,
        mockPaginatedResult.items,
        mockPaginatedResult.total,
        mockPaginatedResult.page,
        20,
        'Health data retrieved successfully'
      );
    });
    
    it('should handle query parameters correctly', async () => {
      // Mock request with authenticated user and various query parameters
      mockRequest = {
        user: { id: mockUserId },
        query: {
          date: '2023-05-15',
          type: 'meal',
          search: 'breakfast',
          page: '2',
          limit: '10'
        }
      };
      
      const mockPaginatedResult = {
        items: [mockHealthDataResponse],
        total: 1,
        page: 2
      };
      mockHealthService.getHealthData.mockResolvedValue(mockPaginatedResult);
      
      // Call controller.getHealthData with mocked request, response, and next
      await controller.getHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.getHealthData to be called with correctly parsed options
      expect(mockHealthService.getHealthData).toHaveBeenCalledWith(
        {
          date: '2023-05-15',
          type: 'meal',
          search: 'breakfast',
          page: 2,
          limit: 10
        },
        mockUserId
      );
      expect(sendPaginated).toHaveBeenCalledWith(
        mockResponse,
        mockPaginatedResult.items,
        mockPaginatedResult.total,
        mockPaginatedResult.page,
        10,
        'Health data retrieved successfully'
      );
    });
    
    it('should pass error to next function when service throws', async () => {
      // Mock request with authenticated user and query parameters
      mockRequest = {
        user: { id: mockUserId },
        query: {}
      };
      
      const mockError = new Error('Service error');
      mockHealthService.getHealthData.mockRejectedValue(mockError);
      
      // Call controller.getHealthData with mocked request, response, and next
      await controller.getHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with the thrown error
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(sendPaginated).not.toHaveBeenCalled();
    });
  });
  
  describe('updateHealthData', () => {
    it('should update health data and return success response', async () => {
      // Mock request with authenticated user, health data ID in params, and update data in body
      const updateData = { data: { description: 'Updated meal' } };
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId },
        body: updateData
      };
      
      const updatedHealthData = {
        ...mockHealthDataResponse,
        data: { ...mockHealthDataResponse.data, description: 'Updated meal' }
      };
      mockHealthService.updateHealthData.mockResolvedValue(updatedHealthData);
      
      // Call controller.updateHealthData with mocked request, response, and next
      await controller.updateHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.updateHealthData to be called with ID, user ID, update data
      expect(mockHealthService.updateHealthData).toHaveBeenCalledWith(
        mockHealthDataId,
        mockUserId,
        updateData,
        undefined
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        updatedHealthData,
        'Health data updated successfully'
      );
    });
    
    it('should handle files in the request', async () => {
      // Mock request with authenticated user, health data ID in params, update data in body, and files array
      const updateData = { data: { description: 'Updated meal' } };
      const mockFiles = [{ fieldname: 'file' } as Express.Multer.File];
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId },
        body: updateData,
        files: mockFiles
      };
      
      const updatedHealthData = {
        ...mockHealthDataResponse,
        data: { ...mockHealthDataResponse.data, description: 'Updated meal' }
      };
      mockHealthService.updateHealthData.mockResolvedValue(updatedHealthData);
      
      // Call controller.updateHealthData with mocked request, response, and next
      await controller.updateHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.updateHealthData to be called with ID, user ID, update data, and files
      expect(mockHealthService.updateHealthData).toHaveBeenCalledWith(
        mockHealthDataId,
        mockUserId,
        updateData,
        mockFiles
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        updatedHealthData,
        'Health data updated successfully'
      );
    });
    
    it('should throw NotFoundError when health data not found', async () => {
      // Mock request with authenticated user, health data ID in params, and update data in body
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId },
        body: {}
      };
      
      mockHealthService.updateHealthData.mockResolvedValue(null);
      
      // Call controller.updateHealthData with mocked request, response, and next
      await controller.updateHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with NotFoundError
      expect(mockNext).toHaveBeenCalled();
      const notFoundError = mockNext.mock.calls[0][0];
      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(notFoundError.message).toContain(mockHealthDataId);
    });
    
    it('should pass error to next function when service throws', async () => {
      // Mock request with authenticated user, health data ID in params, and update data in body
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId },
        body: {}
      };
      
      const mockError = new Error('Service error');
      mockHealthService.updateHealthData.mockRejectedValue(mockError);
      
      // Call controller.updateHealthData with mocked request, response, and next
      await controller.updateHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with the thrown error
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteHealthData', () => {
    it('should delete health data and return no content response', async () => {
      // Mock request with authenticated user and health data ID in params
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId }
      };
      
      mockHealthService.deleteHealthData.mockResolvedValue(true);
      
      // Call controller.deleteHealthData with mocked request, response, and next
      await controller.deleteHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.deleteHealthData to be called with ID and user ID
      expect(mockHealthService.deleteHealthData).toHaveBeenCalledWith(
        mockHealthDataId,
        mockUserId
      );
      expect(sendNoContent).toHaveBeenCalledWith(mockResponse);
    });
    
    it('should throw NotFoundError when health data not found', async () => {
      // Mock request with authenticated user and health data ID in params
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId }
      };
      
      mockHealthService.deleteHealthData.mockResolvedValue(false);
      
      // Call controller.deleteHealthData with mocked request, response, and next
      await controller.deleteHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with NotFoundError
      expect(mockNext).toHaveBeenCalled();
      const notFoundError = mockNext.mock.calls[0][0];
      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(notFoundError.message).toContain(mockHealthDataId);
    });
    
    it('should pass error to next function when service throws', async () => {
      // Mock request with authenticated user and health data ID in params
      mockRequest = {
        user: { id: mockUserId },
        params: { id: mockHealthDataId }
      };
      
      const mockError = new Error('Service error');
      mockHealthService.deleteHealthData.mockRejectedValue(mockError);
      
      // Call controller.deleteHealthData with mocked request, response, and next
      await controller.deleteHealthData(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with the thrown error
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(sendNoContent).not.toHaveBeenCalled();
    });
  });
  
  describe('getHealthContext', () => {
    it('should return health context data', async () => {
      // Mock request with authenticated user and optional limit in query
      mockRequest = {
        user: { id: mockUserId },
        query: { limit: '5' }
      };
      
      const mockHealthContext: HealthContext = {
        recentMeals: [mockHealthDataResponse],
        recentLabResults: [],
        recentSymptoms: []
      };
      mockHealthService.getHealthContext.mockResolvedValue(mockHealthContext);
      
      // Call controller.getHealthContext with mocked request, response, and next
      await controller.getHealthContext(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.getHealthContext to be called with user ID and limit
      expect(mockHealthService.getHealthContext).toHaveBeenCalledWith(
        mockUserId,
        5
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockHealthContext,
        'Health context retrieved successfully'
      );
    });
    
    it('should use default limit when not provided', async () => {
      // Mock request with authenticated user and no limit in query
      mockRequest = {
        user: { id: mockUserId },
        query: {}
      };
      
      const mockHealthContext: HealthContext = {
        recentMeals: [mockHealthDataResponse],
        recentLabResults: [],
        recentSymptoms: []
      };
      mockHealthService.getHealthContext.mockResolvedValue(mockHealthContext);
      
      // Call controller.getHealthContext with mocked request, response, and next
      await controller.getHealthContext(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect HealthService.getHealthContext to be called with user ID and default limit
      expect(mockHealthService.getHealthContext).toHaveBeenCalledWith(
        mockUserId,
        undefined
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockHealthContext,
        'Health context retrieved successfully'
      );
    });
    
    it('should pass error to next function when service throws', async () => {
      // Mock request with authenticated user and limit in query
      mockRequest = {
        user: { id: mockUserId },
        query: { limit: '5' }
      };
      
      const mockError = new Error('Service error');
      mockHealthService.getHealthContext.mockRejectedValue(mockError);
      
      // Call controller.getHealthContext with mocked request, response, and next
      await controller.getHealthContext(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );
      
      // Expect next to be called with the thrown error
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(sendSuccess).not.toHaveBeenCalled();
    });
  });
});