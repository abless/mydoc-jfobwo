import jest from 'jest'; // ^29.5.0
import { getUserProfile, formatUserProfile } from '../../../src/services/user.service';
import { getUserById } from '../../../src/repositories/user.repository';
import { NotFoundError } from '../../../src/utils/error.util';
import { UserErrorType } from '../../../src/types/user.types';
import { 
  mockUserId, 
  mockUserDocument,
  mockUserProfileResponse,
  createMockUserDocument
} from '../../mocks/user.mock';

// Mock the user repository
jest.mock('../../../src/repositories/user.repository');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile when valid ID is provided', async () => {
      // Arrange
      (getUserById as jest.Mock).mockResolvedValue(mockUserDocument);

      // Act
      const result = await getUserProfile(mockUserId);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        email: mockUserDocument.email,
        createdAt: mockUserDocument.createdAt.toISOString()
      }));
      expect(getUserById).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';
      const notFoundError = new NotFoundError(
        `User with ID ${nonExistentId} not found`,
        UserErrorType.USER_NOT_FOUND
      );
      (getUserById as jest.Mock).mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(getUserProfile(nonExistentId)).rejects.toThrow(NotFoundError);
      await expect(getUserProfile(nonExistentId)).rejects.toThrow(
        `User with ID ${nonExistentId} not found`
      );
      expect(getUserById).toHaveBeenCalledWith(nonExistentId);
    });

    it('should rethrow any other error that occurs', async () => {
      // Arrange
      const genericError = new Error('Database connection failed');
      (getUserById as jest.Mock).mockRejectedValue(genericError);

      // Act & Assert
      await expect(getUserProfile(mockUserId)).rejects.toThrow('Database connection failed');
      expect(getUserById).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('formatUserProfile', () => {
    it('should format user document into profile response', () => {
      // Act
      const result = formatUserProfile(mockUserDocument);

      // Assert
      expect(result).toEqual({
        id: mockUserDocument._id.toString(),
        email: mockUserDocument.email,
        createdAt: mockUserDocument.createdAt.toISOString()
      });
      
      // Verify specific transformations
      expect(result.id).toBe(mockUserDocument._id.toString());
      expect(typeof result.id).toBe('string');
      expect(result.email).toBe(mockUserDocument.email);
      expect(result.createdAt).toBe(mockUserDocument.createdAt.toISOString());
      
      // Verify sensitive data is excluded
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('_id');
    });

    it('should handle custom date formats', () => {
      // Arrange
      const customDate = new Date('2023-06-15T14:30:45.123Z');
      const customUserDoc = createMockUserDocument({
        createdAt: customDate
      });

      // Act
      const result = formatUserProfile(customUserDoc);

      // Assert
      expect(result.createdAt).toBe(customDate.toISOString());
      expect(result.createdAt).toBe('2023-06-15T14:30:45.123Z');
    });
  });
});