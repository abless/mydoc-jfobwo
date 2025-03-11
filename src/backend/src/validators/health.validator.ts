import Joi from 'joi'; // ^17.9.0
import { 
  HealthDataType, 
  InputSource, 
  SymptomSeverity, 
  MealType, 
  CreateHealthDataRequest,
  GetHealthDataRequest
} from '../types/health.types';
import { isValidObjectId, validateEnum } from '../utils/validator.util';
import { ValidationError } from '../utils/error.util';

/**
 * Validates a health data creation request
 * @param data - The data to validate
 * @returns Validated data or throws ValidationError
 */
export function validateCreateHealthData(data: any): CreateHealthDataRequest {
  const { error, value } = validateCreateHealthDataSchema().validate(data, { 
    abortEarly: false,
    allowUnknown: false
  });
  
  if (error) {
    const validationErrors: Record<string, string> = {};
    error.details.forEach(detail => {
      validationErrors[detail.path.join('.')] = detail.message;
    });
    throw new ValidationError('Health data validation failed', validationErrors);
  }
  
  return value;
}

/**
 * Validates health data retrieval query parameters
 * @param query - The query parameters to validate
 * @returns Validated query or throws ValidationError
 */
export function validateGetHealthData(query: any): GetHealthDataRequest {
  const { error, value } = validateGetHealthDataSchema().validate(query, {
    abortEarly: false,
    allowUnknown: false
  });
  
  if (error) {
    const validationErrors: Record<string, string> = {};
    error.details.forEach(detail => {
      validationErrors[detail.path.join('.')] = detail.message;
    });
    throw new ValidationError('Query parameter validation failed', validationErrors);
  }
  
  return value;
}

/**
 * Validates a health data ID parameter
 * @param id - The ID to validate
 * @returns Validated ID or throws ValidationError
 */
export function validateHealthDataId(id: string): string {
  const { error, value } = validateHealthDataIdSchema().validate({ id }, {
    abortEarly: false
  });
  
  if (error) {
    const validationErrors: Record<string, string> = {};
    error.details.forEach(detail => {
      validationErrors[detail.path.join('.')] = detail.message;
    });
    throw new ValidationError('Invalid health data ID', validationErrors);
  }
  
  return value.id;
}

/**
 * Returns a Joi schema for validating health data creation requests
 * @returns Joi schema for health data creation validation
 */
export function validateCreateHealthDataSchema(): Joi.ObjectSchema {
  // Base schema for all health data types
  const baseSchema = Joi.object({
    type: Joi.string()
      .valid(...Object.values(HealthDataType))
      .required()
      .messages({
        'any.required': 'Health data type is required',
        'any.only': 'Invalid health data type'
      }),
    timestamp: Joi.date()
      .default(Date.now)
      .messages({
        'date.base': 'Timestamp must be a valid date'
      }),
    metadata: Joi.object({
      source: Joi.string()
        .valid(...Object.values(InputSource))
        .required()
        .messages({
          'any.required': 'Input source is required',
          'any.only': 'Invalid input source'
        }),
      tags: Joi.array()
        .items(Joi.string().trim().min(1).max(50))
        .default([])
        .messages({
          'array.base': 'Tags must be an array',
          'string.min': 'Tag must not be empty',
          'string.max': 'Tag must be at most 50 characters'
        }),
      location: Joi.object({
        latitude: Joi.number()
          .min(-90)
          .max(90)
          .messages({
            'number.base': 'Latitude must be a number',
            'number.min': 'Latitude must be at least -90',
            'number.max': 'Latitude must be at most 90'
          }),
        longitude: Joi.number()
          .min(-180)
          .max(180)
          .messages({
            'number.base': 'Longitude must be a number',
            'number.min': 'Longitude must be at least -180',
            'number.max': 'Longitude must be at most 180'
          }),
        name: Joi.string()
          .trim()
          .max(100)
          .messages({
            'string.max': 'Location name must be at most 100 characters'
          })
      }).default({})
    }).default({
      source: InputSource.TEXT,
      tags: [],
      location: {}
    })
  });

  // Meal-specific schema
  const mealSchema = Joi.object({
    data: Joi.object({
      description: Joi.string()
        .trim()
        .min(1)
        .max(1000)
        .required()
        .messages({
          'any.required': 'Meal description is required',
          'string.empty': 'Meal description cannot be empty',
          'string.min': 'Meal description cannot be empty',
          'string.max': 'Meal description must be at most 1000 characters'
        }),
      mealType: Joi.string()
        .valid(...Object.values(MealType))
        .required()
        .messages({
          'any.required': 'Meal type is required',
          'any.only': 'Invalid meal type'
        }),
      imageUrl: Joi.string()
        .uri()
        .allow('')
        .default('')
        .messages({
          'string.uri': 'Image URL must be a valid URI'
        })
    }).required()
  });

  // Lab result-specific schema
  const labResultSchema = Joi.object({
    data: Joi.object({
      testType: Joi.string()
        .trim()
        .min(1)
        .max(100)
        .required()
        .messages({
          'any.required': 'Test type is required',
          'string.empty': 'Test type cannot be empty',
          'string.min': 'Test type cannot be empty',
          'string.max': 'Test type must be at most 100 characters'
        }),
      testDate: Joi.date()
        .required()
        .messages({
          'any.required': 'Test date is required',
          'date.base': 'Test date must be a valid date'
        }),
      results: Joi.object()
        .default({}),
      notes: Joi.string()
        .trim()
        .max(1000)
        .allow('')
        .default('')
        .messages({
          'string.max': 'Notes must be at most 1000 characters'
        }),
      imageUrl: Joi.string()
        .uri()
        .allow('')
        .default('')
        .messages({
          'string.uri': 'Image URL must be a valid URI'
        })
    }).required()
  });

  // Symptom-specific schema
  const symptomSchema = Joi.object({
    data: Joi.object({
      description: Joi.string()
        .trim()
        .min(1)
        .max(1000)
        .required()
        .messages({
          'any.required': 'Symptom description is required',
          'string.empty': 'Symptom description cannot be empty',
          'string.min': 'Symptom description cannot be empty',
          'string.max': 'Symptom description must be at most 1000 characters'
        }),
      severity: Joi.string()
        .valid(...Object.values(SymptomSeverity))
        .required()
        .messages({
          'any.required': 'Symptom severity is required',
          'any.only': 'Invalid symptom severity'
        }),
      duration: Joi.string()
        .trim()
        .max(100)
        .allow('')
        .default('')
        .messages({
          'string.max': 'Duration must be at most 100 characters'
        }),
      audioUrl: Joi.string()
        .uri()
        .allow('')
        .default('')
        .messages({
          'string.uri': 'Audio URL must be a valid URI'
        }),
      transcription: Joi.string()
        .trim()
        .max(5000)
        .allow('')
        .default('')
        .messages({
          'string.max': 'Transcription must be at most 5000 characters'
        })
    }).required()
  });

  // Combine schemas with conditional validation based on health data type
  return baseSchema.when(
    Joi.object({ type: Joi.string().valid(HealthDataType.MEAL).required() }).unknown(),
    {
      then: mealSchema
    }
  ).when(
    Joi.object({ type: Joi.string().valid(HealthDataType.LAB_RESULT).required() }).unknown(),
    {
      then: labResultSchema
    }
  ).when(
    Joi.object({ type: Joi.string().valid(HealthDataType.SYMPTOM).required() }).unknown(),
    {
      then: symptomSchema
    }
  );
}

/**
 * Returns a Joi schema for validating health data retrieval queries
 * @returns Joi schema for health data retrieval validation
 */
export function validateGetHealthDataSchema(): Joi.ObjectSchema {
  return Joi.object({
    date: Joi.string()
      .custom((value, helpers) => {
        if (value && !isValidDate(value)) {
          return helpers.error('date.format');
        }
        return value;
      })
      .messages({
        'date.format': 'Invalid date format'
      }),
    type: Joi.string()
      .valid(...Object.values(HealthDataType))
      .messages({
        'any.only': 'Invalid health data type'
      }),
    search: Joi.string()
      .trim()
      .max(100)
      .allow('')
      .messages({
        'string.max': 'Search term must be at most 100 characters'
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must be at most 100'
      })
  });
}

/**
 * Returns a Joi schema for validating health data ID parameters
 * @returns Joi schema for health data ID validation
 */
export function validateHealthDataIdSchema(): Joi.ObjectSchema {
  return Joi.object({
    id: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!isValidObjectId(value)) {
          return helpers.error('id.objectId');
        }
        return value;
      })
      .messages({
        'any.required': 'Health data ID is required',
        'id.objectId': 'Invalid health data ID format'
      })
  });
}

/**
 * Helper function to check if a string is a valid date
 * @param dateString - The string to validate as a date
 * @returns True if the string is a valid date, false otherwise
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Export all validation schemas for potential reuse
export {
  validateCreateHealthDataSchema,
  validateGetHealthDataSchema,
  validateHealthDataIdSchema
};