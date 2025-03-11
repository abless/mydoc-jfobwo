import { Request, Response, NextFunction } from 'express'; // express version ^4.18.2
import { UserController } from '../../../src/controllers/user.controller';
import * as userService from '../../../src/services/user.service';
import * as responseUtil from '../../../src/utils/response.util';
import { NotFoundError } from '../../../src/utils/error.util';
import { UserErrorType } from '../../../src/types/user.types';
import { mockUserProfileResponse, mockUserId } from '../../mocks/user.mock';
import logger from '../../../src/config/logger';

// Mock dependencies
jest.mock('../../../src/services/user.service');
jest.mock('../../../src/utils/response.util');
jest.mock('../../../src/config/logger');

describe('UserController', () => {
  // Setup test variables
  let mockRequest: Partial<Request> & { user?: { id: string; email: string } };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create mock request with authenticated user
    mockRequest = {
      user: {
        id: mockUserId,
        email: 'test@example.com'
      }
    };
    
    // Create mock response with jest functions
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Create mock next function
    mockNext = jest.fn();
  });

  describe('getCurrentUser', () => {
    it('should return user profile when user is authenticated', async () => {
      // Mock getUserProfile to return mockUserProfileResponse
      (userService.getUserProfile as jest.Mock).mockResolvedValue(mockUserProfileResponse);
      
      // Call getCurrentUser with mock request, response, and next
      await UserController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify getUserProfile was called with correct user ID
      expect(userService.getUserProfile).toHaveBeenCalledWith(mockUserId);
      
      // Verify sendSuccess was called with correct parameters
      expect(responseUtil.sendSuccess).toHaveBeenCalledWith(
        mockResponse,
        mockUserProfileResponse,
        'User profile retrieved successfully'
      );
      
      // Verify next was not called
      expect(mockNext).not.toHaveBeenCalled();
      
      // Verify logger.info was called
      expect(logger.info).toHaveBeenCalledWith('User profile retrieved', { userId: mockUserId });
    });

    it('should handle user not found error', async () => {
      // Create NotFoundError instance with USER_NOT_FOUND error type
      const notFoundError = new NotFoundError(
        `User with ID ${mockUserId} not found`,
        UserErrorType.USER_NOT_FOUND
      );
      
      // Mock getUserProfile to throw the error
      (userService.getUserProfile as jest.Mock).mockRejectedValue(notFoundError);
      
      // Call getCurrentUser with mock request, response, and next
      await UserController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify getUserProfile was called with correct user ID
      expect(userService.getUserProfile).toHaveBeenCalledWith(mockUserId);
      
      // Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      
      // Verify logger.error was called
      expect(logger.error).toHaveBeenCalledWith(
        'Error retrieving user profile',
        expect.objectContaining({
          error: expect.any(String),
          userId: mockUserId
        })
      );
    });

    it('should handle unexpected errors', async () => {
      // Create generic Error instance
      const unexpectedError = new Error('Unexpected error');
      
      // Mock getUserProfile to throw the error
      (userService.getUserProfile as jest.Mock).mockRejectedValue(unexpectedError);
      
      // Call getCurrentUser with mock request, response, and next
      await UserController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify getUserProfile was called with correct user ID
      expect(userService.getUserProfile).toHaveBeenCalledWith(mockUserId);
      
      // Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      
      // Verify logger.error was called
      expect(logger.error).toHaveBeenCalledWith(
        'Error retrieving user profile',
        expect.objectContaining({
          error: 'Unexpected error',
          userId: mockUserId
        })
      );
    });

    it('should handle missing user in request', async () => {
      // Set mockRequest.user to undefined
      mockRequest.user = undefined;
      
      // Call getCurrentUser with mock request, response, and next
      await UserController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Verify next was called with an error
      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      
      // Verify the error is an instance of Error
      expect(error).toBeInstanceOf(Error);
      
      // Verify the error message indicates missing user
      expect(error.message).toContain('Cannot read properties of undefined');
    });
  });
});