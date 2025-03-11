import request from 'supertest'; // supertest version ^6.3.3
import mongoose from 'mongoose'; // mongoose version ^7.0.3
import { Express } from 'express';
import path from 'path'; // built-in
import fs from 'fs'; // built-in
import {
  setupTestDatabase,
  teardownTestDatabase,
  resetCollections,
  setupTestApp
} from '../setup';
import {
  mockUserId,
  mockUserDocument
} from '../mocks/user.mock';
import {
  mockHealthDataId,
  mockMealHealthData,
  mockLabResultHealthData,
  mockSymptomHealthData,
  mockHealthDataRequest,
  createMockHealthDataRequest
} from '../mocks/health.mock';
import { HealthDataModel } from '../../src/models/health-data.model';
import { UserModel } from '../../src/models/user.model';
import { generateToken } from '../../src/utils/jwt.util';
import { HealthDataType } from '../../src/types/health.types';
import { TokenType } from '../../src/types/auth.types';

let app: Express;
let authToken: string;
let testUser: any;

describe('Health Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    app = await setupTestApp();
    
    // Create a test user in the database
    testUser = await UserModel.create(mockUserDocument);
    
    // Generate a JWT token for authentication
    authToken = generateToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      iat: Math.floor(Date.now() / 1000)
    }, TokenType.ACCESS);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetCollections();
  });

  // POST /api/health - Create health data
  describe('POST /api/health', () => {
    it('should create meal health data successfully', async () => {
      // Create a mock meal health data request
      const mealDataRequest = createMockHealthDataRequest({
        type: HealthDataType.MEAL
      });

      // Send request
      const response = await request(app)
        .post('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mealDataRequest);

      // Assert response
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(HealthDataType.MEAL);
      expect(response.body.data).toMatchObject(mealDataRequest.data);

      // Verify data was saved to database
      const savedData = await HealthDataModel.findById(response.body.id);
      expect(savedData).toBeTruthy();
      expect(savedData?.type).toBe(HealthDataType.MEAL);
      expect(savedData?.userId.toString()).toBe(testUser._id.toString());
    });

    it('should create lab result health data successfully', async () => {
      // Create a mock lab result health data request
      const labResultDataRequest = createMockHealthDataRequest({
        type: HealthDataType.LAB_RESULT,
        data: mockLabResultHealthData.data
      });

      // Send request
      const response = await request(app)
        .post('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .send(labResultDataRequest);

      // Assert response
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(HealthDataType.LAB_RESULT);
      expect(response.body.data).toMatchObject(labResultDataRequest.data);

      // Verify data was saved to database
      const savedData = await HealthDataModel.findById(response.body.id);
      expect(savedData).toBeTruthy();
      expect(savedData?.type).toBe(HealthDataType.LAB_RESULT);
      expect(savedData?.userId.toString()).toBe(testUser._id.toString());
    });

    it('should create symptom health data successfully', async () => {
      // Create a mock symptom health data request
      const symptomDataRequest = createMockHealthDataRequest({
        type: HealthDataType.SYMPTOM,
        data: mockSymptomHealthData.data
      });

      // Send request
      const response = await request(app)
        .post('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .send(symptomDataRequest);

      // Assert response
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(HealthDataType.SYMPTOM);
      expect(response.body.data).toMatchObject(symptomDataRequest.data);

      // Verify data was saved to database
      const savedData = await HealthDataModel.findById(response.body.id);
      expect(savedData).toBeTruthy();
      expect(savedData?.type).toBe(HealthDataType.SYMPTOM);
      expect(savedData?.userId.toString()).toBe(testUser._id.toString());
    });

    it('should create health data with file upload', async () => {
      // Create a temporary test file for upload
      const tempFilePath = path.join(__dirname, 'test-upload.jpg');
      fs.writeFileSync(tempFilePath, 'test file content');

      // Create a mock health data request
      const mealDataRequest = {
        type: HealthDataType.MEAL,
        data: JSON.stringify({
          description: 'Test meal with image',
          mealType: 'breakfast'
        }),
        metadata: JSON.stringify({
          source: 'photo',
          tags: ['test', 'meal']
        }),
        timestamp: new Date().toISOString()
      };

      try {
        // Send multipart form request
        const response = await request(app)
          .post('/api/health')
          .set('Authorization', `Bearer ${authToken}`)
          .field('type', mealDataRequest.type)
          .field('data', mealDataRequest.data)
          .field('metadata', mealDataRequest.metadata)
          .field('timestamp', mealDataRequest.timestamp)
          .attach('file', tempFilePath);

        // Assert response
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.type).toBe(HealthDataType.MEAL);
        expect(response.body).toHaveProperty('files');
        expect(response.body.files).toHaveLength(1);
        expect(response.body.files[0]).toHaveProperty('url');

        // Verify data was saved to database
        const savedData = await HealthDataModel.findById(response.body.id);
        expect(savedData).toBeTruthy();
        expect(savedData?.fileIds).toHaveLength(1);
      } finally {
        // Clean up the test file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });

    it('should return 400 for invalid health data', async () => {
      // Create an invalid health data request (missing required fields)
      const invalidRequest = {
        type: HealthDataType.MEAL,
        // Missing data
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'text',
          tags: ['test']
        }
      };

      // Send request
      const response = await request(app)
        .post('/api/health')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body).toHaveProperty('details');
    });

    it('should return 401 when not authenticated', async () => {
      // Send request without auth token
      const response = await request(app)
        .post('/api/health')
        .send(mockHealthDataRequest);

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // GET /api/health - Get health data list
  describe('GET /api/health', () => {
    it('should retrieve all health data for user', async () => {
      // Seed database with test data
      await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });
      await HealthDataModel.create({
        ...mockLabResultHealthData,
        userId: testUser._id
      });
      await HealthDataModel.create({
        ...mockSymptomHealthData,
        userId: testUser._id
      });

      // Send request
      const response = await request(app)
        .get('/api/health')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(3);
      expect(response.body).toHaveProperty('total', 3);
      expect(response.body).toHaveProperty('page', 1);
    });

    it('should filter health data by date', async () => {
      // Seed database with data from different dates
      const date1 = new Date('2023-05-15');
      const date2 = new Date('2023-05-16');
      
      await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id,
        timestamp: date1
      });
      await HealthDataModel.create({
        ...mockLabResultHealthData,
        userId: testUser._id,
        timestamp: date2
      });

      // Send request with date filter
      const response = await request(app)
        .get(`/api/health?date=${date1.toISOString().split('T')[0]}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].timestamp.startsWith('2023-05-15')).toBeTruthy();
    });

    it('should filter health data by type', async () => {
      // Seed database with different types of data
      await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });
      await HealthDataModel.create({
        ...mockLabResultHealthData,
        userId: testUser._id
      });

      // Send request with type filter
      const response = await request(app)
        .get(`/api/health?type=${HealthDataType.MEAL}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].type).toBe(HealthDataType.MEAL);
    });

    it('should search health data by text', async () => {
      // Seed database with data containing different text
      await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id,
        data: { ...mockMealHealthData.data, description: 'Oatmeal with banana' }
      });
      await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id,
        data: { ...mockMealHealthData.data, description: 'Pancakes with syrup' }
      });

      // Send request with search term
      const response = await request(app)
        .get('/api/health?search=banana')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].data.description).toContain('banana');
    });

    it('should paginate health data results', async () => {
      // Seed database with multiple items
      const dataEntries = Array(15).fill(null).map((_, i) => ({
        ...mockMealHealthData,
        _id: new mongoose.Types.ObjectId(),
        userId: testUser._id,
        timestamp: new Date(2023, 4, 15, i) // Different hours for sorting
      }));
      
      await HealthDataModel.insertMany(dataEntries);

      // Send request with pagination
      const response = await request(app)
        .get('/api/health?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(5);
      expect(response.body).toHaveProperty('total', 15);
      expect(response.body).toHaveProperty('page', 2);
    });

    it('should return 401 when not authenticated', async () => {
      // Send request without auth token
      const response = await request(app)
        .get('/api/health');

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // GET /api/health/:id - Get specific health data
  describe('GET /api/health/:id', () => {
    it('should retrieve health data by ID', async () => {
      // Seed database with test data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Send request
      const response = await request(app)
        .get(`/api/health/${healthData._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', healthData._id.toString());
      expect(response.body).toHaveProperty('type', healthData.type);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 404 for non-existent health data', async () => {
      // Send request with non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/health/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 404 for health data belonging to another user', async () => {
      // Create another user
      const anotherUser = await UserModel.create({
        email: 'another@example.com',
        password: 'password123',
        role: 'user'
      });

      // Create health data for the other user
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: anotherUser._id
      });

      // Send request with the original user's auth token
      const response = await request(app)
        .get(`/api/health/${healthData._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      // Create health data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Send request without auth token
      const response = await request(app)
        .get(`/api/health/${healthData._id}`);

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // PUT /api/health/:id - Update health data
  describe('PUT /api/health/:id', () => {
    it('should update health data successfully', async () => {
      // Seed database with test data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Create update data
      const updateData = {
        data: {
          ...mockMealHealthData.data,
          description: 'Updated meal description'
        }
      };

      // Send request
      const response = await request(app)
        .put(`/api/health/${healthData._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', healthData._id.toString());
      expect(response.body.data.description).toBe('Updated meal description');

      // Verify data was updated in database
      const updatedData = await HealthDataModel.findById(healthData._id);
      expect(updatedData).toBeTruthy();
      expect(updatedData?.data.description).toBe('Updated meal description');
    });

    it('should update health data with file upload', async () => {
      // Seed database with test data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Create a temporary test file for upload
      const tempFilePath = path.join(__dirname, 'test-update.jpg');
      fs.writeFileSync(tempFilePath, 'updated file content');

      try {
        // Send request with file
        const response = await request(app)
          .put(`/api/health/${healthData._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .field('data', JSON.stringify({
            ...mockMealHealthData.data,
            description: 'Updated meal with new image'
          }))
          .attach('file', tempFilePath);

        // Assert response
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', healthData._id.toString());
        expect(response.body.data.description).toBe('Updated meal with new image');
        expect(response.body).toHaveProperty('files');
        expect(response.body.files).toHaveLength(1);

        // Verify data was updated in database
        const updatedData = await HealthDataModel.findById(healthData._id);
        expect(updatedData).toBeTruthy();
        expect(updatedData?.data.description).toBe('Updated meal with new image');
        expect(updatedData?.fileIds).toHaveLength(1);
      } finally {
        // Clean up the test file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });

    it('should return 404 for non-existent health data', async () => {
      // Send request with non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        data: {
          ...mockMealHealthData.data,
          description: 'Updated meal description'
        }
      };

      const response = await request(app)
        .put(`/api/health/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 404 for health data belonging to another user', async () => {
      // Create another user
      const anotherUser = await UserModel.create({
        email: 'another@example.com',
        password: 'password123',
        role: 'user'
      });

      // Create health data for the other user
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: anotherUser._id
      });

      // Create update data
      const updateData = {
        data: {
          ...mockMealHealthData.data,
          description: 'Updated meal description'
        }
      };

      // Send request with the original user's auth token
      const response = await request(app)
        .put(`/api/health/${healthData._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      // Seed database with test data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Create invalid update data
      const invalidUpdateData = {
        data: {
          // Missing required fields
        }
      };

      // Send request
      const response = await request(app)
        .put(`/api/health/${healthData._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData);

      // Assert response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 401 when not authenticated', async () => {
      // Create health data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Create update data
      const updateData = {
        data: {
          ...mockMealHealthData.data,
          description: 'Updated meal description'
        }
      };

      // Send request without auth token
      const response = await request(app)
        .put(`/api/health/${healthData._id}`)
        .send(updateData);

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // DELETE /api/health/:id - Delete health data
  describe('DELETE /api/health/:id', () => {
    it('should delete health data successfully', async () => {
      // Seed database with test data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Send request
      const response = await request(app)
        .delete(`/api/health/${healthData._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(204);

      // Verify data was deleted from database
      const deletedData = await HealthDataModel.findById(healthData._id);
      expect(deletedData).toBeNull();
    });

    it('should return 404 for non-existent health data', async () => {
      // Send request with non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/health/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 404 for health data belonging to another user', async () => {
      // Create another user
      const anotherUser = await UserModel.create({
        email: 'another@example.com',
        password: 'password123',
        role: 'user'
      });

      // Create health data for the other user
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: anotherUser._id
      });

      // Send request with the original user's auth token
      const response = await request(app)
        .delete(`/api/health/${healthData._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      // Create health data
      const healthData = await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id
      });

      // Send request without auth token
      const response = await request(app)
        .delete(`/api/health/${healthData._id}`);

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // GET /api/health/context - Get health context for LLM
  describe('GET /api/health/context', () => {
    it('should retrieve health context successfully', async () => {
      // Seed database with various health data entries
      await HealthDataModel.create({
        ...mockMealHealthData,
        userId: testUser._id,
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      });
      await HealthDataModel.create({
        ...mockLabResultHealthData,
        userId: testUser._id,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      });
      await HealthDataModel.create({
        ...mockSymptomHealthData,
        userId: testUser._id,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      });

      // Send request
      const response = await request(app)
        .get('/api/health/context')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recentMeals');
      expect(response.body).toHaveProperty('recentLabResults');
      expect(response.body).toHaveProperty('recentSymptoms');
      expect(response.body.recentMeals).toHaveLength(1);
      expect(response.body.recentLabResults).toHaveLength(1);
      expect(response.body.recentSymptoms).toHaveLength(1);
    });

    it('should limit health context results', async () => {
      // Seed database with multiple entries of each type
      for (let i = 0; i < 5; i++) {
        await HealthDataModel.create({
          ...mockMealHealthData,
          _id: new mongoose.Types.ObjectId(),
          userId: testUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * i) // i hours ago
        });
        await HealthDataModel.create({
          ...mockLabResultHealthData,
          _id: new mongoose.Types.ObjectId(),
          userId: testUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * i) // i hours ago
        });
        await HealthDataModel.create({
          ...mockSymptomHealthData,
          _id: new mongoose.Types.ObjectId(),
          userId: testUser._id,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * i) // i hours ago
        });
      }

      // Send request with limit parameter
      const response = await request(app)
        .get('/api/health/context?limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert response
      expect(response.status).toBe(200);
      expect(response.body.recentMeals).toHaveLength(2);
      expect(response.body.recentLabResults).toHaveLength(2);
      expect(response.body.recentSymptoms).toHaveLength(2);
    });

    it('should return 401 when not authenticated', async () => {
      // Send request without auth token
      const response = await request(app)
        .get('/api/health/context');

      // Assert response
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });
});