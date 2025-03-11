# Health Data API

## Introduction

The Health Data API provides endpoints for managing health information in the Health Advisor application. This includes creating, retrieving, updating, and deleting health records such as meals, lab results, and symptoms. All endpoints require authentication using JWT tokens.

## Base URL

```
/api/health
```

## Authentication

All endpoints require a valid JWT token in the Authorization header.

**Format:**
```
Authorization: Bearer {token}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": null
  }
}
```

## Data Types

### Health Data Types

| Type | Description |
|------|-------------|
| MEAL | Food consumption records with optional photos |
| LAB_RESULT | Medical test results with optional photos of lab reports |
| SYMPTOM | Health symptoms with severity and optional voice recordings |

### Input Sources

| Source | Description |
|--------|-------------|
| PHOTO | Data captured via camera (meals, lab results) |
| VOICE | Data captured via voice recording (symptoms) |
| TEXT | Data entered as text |

### Symptom Severity

| Level | Description |
|-------|-------------|
| MILD | Minor discomfort, minimal impact on daily activities |
| MODERATE | Noticeable discomfort, some impact on daily activities |
| SEVERE | Significant discomfort, major impact on daily activities |

### Meal Types

| Type | Description |
|------|-------------|
| BREAKFAST | Morning meal |
| LUNCH | Midday meal |
| DINNER | Evening meal |
| SNACK | Between-meal food consumption |

## Endpoints

### Create Health Data
**POST /**

Create a new health data record (meal, lab result, or symptom) with optional file attachments.

**Authentication:** Required

**Request Body:**
- Content Type: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Health data type (MEAL, LAB_RESULT, SYMPTOM) |
| data | JSON string | Yes | Health data content specific to the type |
| timestamp | string | No | ISO date string, defaults to current time |
| metadata | JSON string | No | Additional metadata |
| files | File(s) | No | Image files for meals/lab results or audio file for symptoms |

**Examples:**

*Meal Example:*
```
type: MEAL
data: {
  "description": "Grilled chicken salad with avocado",
  "mealType": "LUNCH"
}
timestamp: 2023-05-15T12:30:00Z
metadata: {
  "tags": ["protein", "salad", "healthy"]
}
files: [meal_photo.jpg]
```

*Lab Result Example:*
```
type: LAB_RESULT
data: {
  "testType": "Blood Test",
  "testDate": "2023-05-10T09:00:00Z",
  "notes": "Annual checkup results",
  "results": {
    "cholesterol": 180,
    "glucose": 95
  }
}
timestamp: 2023-05-15T10:15:00Z
files: [lab_report.jpg]
```

*Symptom Example:*
```
type: SYMPTOM
data: {
  "description": "Headache on right side of head",
  "severity": "MODERATE",
  "duration": "2 hours"
}
timestamp: 2023-05-15T14:45:00Z
files: [symptom_recording.m4a]
```

**Responses:**

*201 Created:*
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "type": "MEAL",
    "timestamp": "2023-05-15T12:30:00Z",
    "data": {
      "description": "Grilled chicken salad with avocado",
      "mealType": "LUNCH"
    },
    "files": [
      {
        "url": "https://api.healthadvisor.com/files/meal_60d21b4667d0d8992e610c85.jpg",
        "contentType": "image/jpeg"
      }
    ],
    "metadata": {
      "source": "PHOTO",
      "tags": ["protein", "salad", "healthy"]
    }
  },
  "error": null
}
```

*400 Bad Request:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid health data request",
    "details": {
      "type": "Health data type is required",
      "data": "Health data content is required"
    }
  }
}
```

*413 Payload Too Large:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File exceeds the maximum allowed size of 10MB"
  }
}
```

*415 Unsupported Media Type:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "File type not supported. Allowed types: jpg, jpeg, png for images; mp3, m4a, wav for audio"
  }
}
```

### Get Health Data
**GET /**

Retrieve health data records with filtering and pagination.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| date | string | No | | Filter by date (YYYY-MM-DD). Returns records for the specified date |
| type | string | No | | Filter by health data type (MEAL, LAB_RESULT, SYMPTOM) |
| search | string | No | | Search term to filter health data descriptions |
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Number of items per page (max 100) |

**Responses:**

*200 OK:*
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "type": "MEAL",
        "timestamp": "2023-05-15T12:30:00Z",
        "data": {
          "description": "Grilled chicken salad with avocado",
          "mealType": "LUNCH"
        },
        "files": [
          {
            "url": "https://api.healthadvisor.com/files/meal_60d21b4667d0d8992e610c85.jpg",
            "contentType": "image/jpeg"
          }
        ],
        "metadata": {
          "source": "PHOTO",
          "tags": ["protein", "salad", "healthy"]
        }
      },
      {
        "id": "60d21b4667d0d8992e610c86",
        "type": "SYMPTOM",
        "timestamp": "2023-05-15T14:45:00Z",
        "data": {
          "description": "Headache on right side of head",
          "severity": "MODERATE",
          "duration": "2 hours"
        },
        "files": [
          {
            "url": "https://api.healthadvisor.com/files/symptom_60d21b4667d0d8992e610c86.m4a",
            "contentType": "audio/m4a"
          }
        ],
        "metadata": {
          "source": "VOICE",
          "tags": ["headache", "pain"]
        }
      }
    ],
    "total": 5,
    "page": 1
  },
  "error": null
}
```

*400 Bad Request:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "date": "Invalid date format. Use YYYY-MM-DD",
      "type": "Invalid health data type"
    }
  }
}
```

### Get Health Data by ID
**GET /:id**

Retrieve a specific health data record by its ID.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Health data record ID |

**Responses:**

*200 OK:*
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "type": "MEAL",
    "timestamp": "2023-05-15T12:30:00Z",
    "data": {
      "description": "Grilled chicken salad with avocado",
      "mealType": "LUNCH"
    },
    "files": [
      {
        "url": "https://api.healthadvisor.com/files/meal_60d21b4667d0d8992e610c85.jpg",
        "contentType": "image/jpeg"
      }
    ],
    "metadata": {
      "source": "PHOTO",
      "tags": ["protein", "salad", "healthy"]
    }
  },
  "error": null
}
```

*404 Not Found:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Health data record not found"
  }
}
```

### Update Health Data
**PUT /:id**

Update an existing health data record with optional new files.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Health data record ID |

**Request Body:**
- Content Type: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| data | JSON string | No | Updated health data content |
| timestamp | string | No | Updated ISO date string |
| metadata | JSON string | No | Updated metadata |
| files | File(s) | No | New image files for meals/lab results or audio file for symptoms |

**Example:**
```
data: {
  "description": "Grilled chicken salad with avocado and olive oil dressing",
  "mealType": "LUNCH"
}
metadata: {
  "tags": ["protein", "salad", "healthy", "olive oil"]
}
files: [updated_meal_photo.jpg]
```

**Responses:**

*200 OK:*
```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "type": "MEAL",
    "timestamp": "2023-05-15T12:30:00Z",
    "data": {
      "description": "Grilled chicken salad with avocado and olive oil dressing",
      "mealType": "LUNCH"
    },
    "files": [
      {
        "url": "https://api.healthadvisor.com/files/meal_60d21b4667d0d8992e610c85_updated.jpg",
        "contentType": "image/jpeg"
      }
    ],
    "metadata": {
      "source": "PHOTO",
      "tags": ["protein", "salad", "healthy", "olive oil"]
    }
  },
  "error": null
}
```

*400 Bad Request:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid update data",
    "details": {
      "data": "Invalid health data format"
    }
  }
}
```

*404 Not Found:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Health data record not found"
  }
}
```

### Delete Health Data
**DELETE /:id**

Delete a health data record and its associated files.

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Health data record ID |

**Responses:**

*204 No Content:*
No response body is returned upon successful deletion.

*404 Not Found:*
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Health data record not found"
  }
}
```

### Get Health Context
**GET /context**

Retrieve recent health data for LLM context.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | number | No | 5 | Maximum number of records per health data type |

**Responses:**

*200 OK:*
```json
{
  "success": true,
  "data": {
    "recentMeals": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "type": "MEAL",
        "timestamp": "2023-05-15T12:30:00Z",
        "data": {
          "description": "Grilled chicken salad with avocado",
          "mealType": "LUNCH"
        },
        "files": [
          {
            "url": "https://api.healthadvisor.com/files/meal_60d21b4667d0d8992e610c85.jpg",
            "contentType": "image/jpeg"
          }
        ],
        "metadata": {
          "source": "PHOTO",
          "tags": ["protein", "salad", "healthy"]
        }
      }
    ],
    "recentLabResults": [
      {
        "id": "60d21b4667d0d8992e610c87",
        "type": "LAB_RESULT",
        "timestamp": "2023-05-15T10:15:00Z",
        "data": {
          "testType": "Blood Test",
          "testDate": "2023-05-10T09:00:00Z",
          "notes": "Annual checkup results",
          "results": {
            "cholesterol": 180,
            "glucose": 95
          }
        },
        "files": [
          {
            "url": "https://api.healthadvisor.com/files/lab_60d21b4667d0d8992e610c87.jpg",
            "contentType": "image/jpeg"
          }
        ],
        "metadata": {
          "source": "PHOTO",
          "tags": ["blood test", "annual checkup"]
        }
      }
    ],
    "recentSymptoms": [
      {
        "id": "60d21b4667d0d8992e610c86",
        "type": "SYMPTOM",
        "timestamp": "2023-05-15T14:45:00Z",
        "data": {
          "description": "Headache on right side of head",
          "severity": "MODERATE",
          "duration": "2 hours"
        },
        "files": [
          {
            "url": "https://api.healthadvisor.com/files/symptom_60d21b4667d0d8992e610c86.m4a",
            "contentType": "audio/m4a"
          }
        ],
        "metadata": {
          "source": "VOICE",
          "tags": ["headache", "pain"]
        }
      }
    ]
  },
  "error": null
}
```

## File Handling

### Supported File Types

| Category | MIME Types |
|----------|------------|
| Images | image/jpeg, image/png |
| Audio | audio/mp3, audio/mp4, audio/mpeg, audio/wav |

### File Size Limits

| Category | Maximum Size |
|----------|--------------|
| Images | 10MB per file |
| Audio | 5MB per file |

### File Storage

Files are stored securely and associated with the health data record. File URLs are provided in the response and are accessible only to the authenticated user who created the record.

## Client Implementation Examples

### Create Health Data Example

```typescript
import { createHealthData } from '../api/health.api';

const handleMealSubmit = async (description: string, mealType: string, photo: ImagePickerResult) => {
  try {
    const formData = new FormData();
    
    // Add health data details
    formData.append('type', 'MEAL');
    formData.append('data', JSON.stringify({
      description,
      mealType
    }));
    
    // Add photo if available
    if (photo && photo.assets && photo.assets[0]) {
      const photoAsset = photo.assets[0];
      formData.append('files', {
        uri: photoAsset.uri,
        type: photoAsset.type,
        name: 'meal_photo.jpg'
      });
    }
    
    // Add metadata
    formData.append('metadata', JSON.stringify({
      tags: ['meal', mealType.toLowerCase()]
    }));
    
    const response = await createHealthData(formData);
    return response.data;
  } catch (error) {
    console.error('Failed to create meal entry:', error);
    throw error;
  }
};
```

### Get Health Data Example

```typescript
import { getHealthData } from '../api/health.api';

const fetchHealthData = async (date?: string, type?: string, page: number = 1) => {
  try {
    const params: any = { page };
    
    if (date) {
      params.date = date; // Format: YYYY-MM-DD
    }
    
    if (type) {
      params.type = type; // 'MEAL', 'LAB_RESULT', or 'SYMPTOM'
    }
    
    const response = await getHealthData(params);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch health data:', error);
    throw error;
  }
};
```

### Delete Health Data Example

```typescript
import { deleteHealthData } from '../api/health.api';

const handleDeleteHealthData = async (id: string) => {
  try {
    await deleteHealthData(id);
    // Handle successful deletion (e.g., update UI, show confirmation)
    return true;
  } catch (error) {
    console.error('Failed to delete health data:', error);
    throw error;
  }
};
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Optional additional error details
    }
  }
}
```

### Common Errors

| Error Code | Status Code | Description |
|------------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| NOT_FOUND | 404 | Health data record not found |
| UNAUTHORIZED | 401 | Authentication required or token invalid |
| FORBIDDEN | 403 | User does not have permission to access the requested health data |
| FILE_TOO_LARGE | 413 | Uploaded file exceeds size limit |
| UNSUPPORTED_FILE_TYPE | 415 | File type not supported |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |

## Security Considerations

- **Data Privacy**: Health data is sensitive personal information. All data is stored securely and is only accessible to the authenticated user who created it.
- **Authentication**: All endpoints require a valid JWT token obtained through the Authentication API.
- **Authorization**: Users can only access their own health data. Attempting to access another user's data will result in a 403 Forbidden error.
- **HTTPS Requirement**: All API requests must be made over HTTPS to ensure data privacy during transmission.

## Rate Limiting

- **Limits**: 60 requests per minute per user for health data endpoints
- **Response**: When rate limit is exceeded, the API returns a 429 Too Many Requests status code with a Retry-After header

## Pagination

- **Implementation**: The GET / endpoint supports pagination through page and limit query parameters
- **Default Values**: page=1, limit=20
- **Maximum Limit**: 100
- **Response Format**: Paginated responses include items array, total count, and current page number