import mongoose, { Schema, Model, Document, Types } from 'mongoose'; // v7.0.0
import {
  HealthData,
  HealthDataType,
  MealData,
  LabResultData,
  SymptomData,
  HealthDataMetadata,
  InputSource
} from '../types/health.types';

/**
 * Interface for the HealthData document (extends both HealthData and Document)
 */
interface HealthDataDocument extends HealthData, Document {}

/**
 * Interface for the HealthData model (defines static methods)
 */
interface HealthDataModel extends Model<HealthDataDocument> {
  findByUserId(userId: Types.ObjectId, page?: number, limit?: number): Promise<{ items: HealthDataDocument[], total: number }>;
  findByIdAndUserId(id: string, userId: Types.ObjectId): Promise<HealthDataDocument | null>;
  findByDateRange(userId: Types.ObjectId, startDate: Date, endDate: Date, page?: number, limit?: number): Promise<{ items: HealthDataDocument[], total: number }>;
  findByType(userId: Types.ObjectId, type: HealthDataType, page?: number, limit?: number): Promise<{ items: HealthDataDocument[], total: number }>;
  searchByText(userId: Types.ObjectId, searchText: string, page?: number, limit?: number): Promise<{ items: HealthDataDocument[], total: number }>;
}

/**
 * Schema definition for the HealthData collection
 */
const healthDataSchema = new Schema<HealthDataDocument, HealthDataModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(HealthDataType),
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(this: HealthDataDocument, value: any) {
          if (!value) return false;
          
          const type = this.type;
          
          if (type === HealthDataType.MEAL) {
            return value.description && value.mealType;
          } else if (type === HealthDataType.LAB_RESULT) {
            return value.testType && value.testDate;
          } else if (type === HealthDataType.SYMPTOM) {
            return value.description && value.severity;
          }
          
          return false;
        },
        message: 'Data must be valid for the specified type'
      }
    },
    fileIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: 'fs.files',
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(value: any) {
          return value && 
                 Object.values(InputSource).includes(value.source) && 
                 Array.isArray(value.tags);
        },
        message: 'Metadata must include a valid source and tags array'
      }
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for common query patterns
healthDataSchema.index({ userId: 1, timestamp: -1 }); // For date-based queries by user
healthDataSchema.index({ userId: 1, type: 1 }); // For type filtering by user
healthDataSchema.index({ userId: 1, 'metadata.tags': 1 }); // For tag-based search

/**
 * Find all health data entries for a specific user with pagination
 */
healthDataSchema.statics.findByUserId = async function(
  userId: Types.ObjectId,
  page: number = 1,
  limit: number = 20
): Promise<{ items: HealthDataDocument[], total: number }> {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    this.find({ userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.countDocuments({ userId })
  ]);
  
  return { items, total };
};

/**
 * Find a specific health data entry by ID and user ID
 * This ensures users can only access their own data
 */
healthDataSchema.statics.findByIdAndUserId = async function(
  id: string,
  userId: Types.ObjectId
): Promise<HealthDataDocument | null> {
  return this.findOne({ _id: id, userId }).exec();
};

/**
 * Find health data entries within a date range for a specific user
 */
healthDataSchema.statics.findByDateRange = async function(
  userId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
  page: number = 1,
  limit: number = 20
): Promise<{ items: HealthDataDocument[], total: number }> {
  const skip = (page - 1) * limit;
  const query = {
    userId,
    timestamp: { $gte: startDate, $lte: endDate },
  };
  
  const [items, total] = await Promise.all([
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.countDocuments(query)
  ]);
  
  return { items, total };
};

/**
 * Find health data entries of a specific type for a user
 */
healthDataSchema.statics.findByType = async function(
  userId: Types.ObjectId,
  type: HealthDataType,
  page: number = 1,
  limit: number = 20
): Promise<{ items: HealthDataDocument[], total: number }> {
  const skip = (page - 1) * limit;
  const query = { userId, type };
  
  const [items, total] = await Promise.all([
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.countDocuments(query)
  ]);
  
  return { items, total };
};

/**
 * Search health data entries by text for a specific user
 * Searches across multiple fields including description, test type, notes, and transcription
 */
healthDataSchema.statics.searchByText = async function(
  userId: Types.ObjectId,
  searchText: string,
  page: number = 1,
  limit: number = 20
): Promise<{ items: HealthDataDocument[], total: number }> {
  const skip = (page - 1) * limit;
  
  // If searchText is empty, return all items
  if (!searchText || searchText.trim() === '') {
    return this.findByUserId(userId, page, limit);
  }
  
  // Create a regex search query across multiple fields
  const query = {
    userId,
    $or: [
      { 'data.description': { $regex: searchText, $options: 'i' } },
      { 'data.testType': { $regex: searchText, $options: 'i' } },
      { 'data.notes': { $regex: searchText, $options: 'i' } },
      { 'data.transcription': { $regex: searchText, $options: 'i' } },
      { 'metadata.tags': { $in: [new RegExp(searchText, 'i')] } }
    ]
  };
  
  const [items, total] = await Promise.all([
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.countDocuments(query)
  ]);
  
  return { items, total };
};

// Create the HealthData model
const HealthDataModel = mongoose.model<HealthDataDocument, HealthDataModel>('HealthData', healthDataSchema);

export { HealthDataModel, healthDataSchema };