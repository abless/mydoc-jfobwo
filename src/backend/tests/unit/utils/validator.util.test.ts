import mongoose from 'mongoose'; // ^7.0.3
import {
  isValidEmail,
  isValidPassword,
  isValidObjectId,
  isValidDate,
  isValidUrl,
  sanitizeString,
  validateEnum,
  validateRequiredFields,
  validateMaxLength,
  validateMinLength,
  validateNumericRange
} from '../../../src/utils/validator.util';
import { ValidationError } from '../../../src/utils/error.util';

describe('isValidEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.com')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
    expect(isValidEmail('user@subdomain.example.com')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@.com')).toBe(false);
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('userexample.com')).toBe(false);
    expect(isValidEmail('user@exam ple.com')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidEmail('')).toBe(false);
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(isValidEmail(null)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('should return true for valid passwords meeting all criteria', () => {
    expect(isValidPassword('Pass1234!')).toBe(true);
    expect(isValidPassword('Complex123$')).toBe(true);
    expect(isValidPassword('Abcdef1@')).toBe(true);
    expect(isValidPassword('a1A@bcdefghijklmnop')).toBe(true);
  });

  it('should return false for passwords shorter than 8 characters', () => {
    expect(isValidPassword('Ab1!')).toBe(false);
    expect(isValidPassword('a1@')).toBe(false);
  });

  it('should return false for passwords without letters', () => {
    expect(isValidPassword('12345678!')).toBe(false);
    expect(isValidPassword('123456789@')).toBe(false);
  });

  it('should return false for passwords without numbers', () => {
    expect(isValidPassword('Password!')).toBe(false);
    expect(isValidPassword('Abcdefgh@')).toBe(false);
  });

  it('should return false for passwords without special characters', () => {
    expect(isValidPassword('Password123')).toBe(false);
    expect(isValidPassword('Abcdefg123')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidPassword('')).toBe(false);
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(() => isValidPassword(null)).toThrow();
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(() => isValidPassword(undefined)).toThrow();
  });
});

describe('isValidObjectId', () => {
  it('should return true for valid MongoDB ObjectId strings', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isValidObjectId('5f7a5d64fc13ae3694000000')).toBe(true);
    expect(isValidObjectId('000000000000000000000000')).toBe(true);
  });

  it('should return false for invalid ObjectId strings', () => {
    expect(isValidObjectId('invalid')).toBe(false);
    expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // Too short
    expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false); // Too long
    expect(isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false); // Invalid character
  });

  it('should handle edge cases', () => {
    expect(isValidObjectId('')).toBe(false);
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(isValidObjectId(null)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(isValidObjectId(undefined)).toBe(false);
  });

  it('should validate actual MongoDB ObjectIds correctly', () => {
    const objectId = new mongoose.Types.ObjectId();
    expect(isValidObjectId(objectId.toString())).toBe(true);
  });
});

describe('isValidDate', () => {
  it('should return true for valid date strings in various formats', () => {
    expect(isValidDate('2023-05-15')).toBe(true);
    expect(isValidDate('05/15/2023')).toBe(true);
    expect(isValidDate('2023-05-15T14:30:00Z')).toBe(true);
    expect(isValidDate('May 15, 2023')).toBe(true);
  });

  it('should return false for invalid date strings', () => {
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('2023-13-15')).toBe(false); // Invalid month
    expect(isValidDate('2023-05-32')).toBe(false); // Invalid day
  });

  it('should handle edge cases', () => {
    expect(isValidDate('')).toBe(false);
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(isValidDate(null)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(isValidDate(undefined)).toBe(false);
  });

  it('should validate ISO date strings correctly', () => {
    const now = new Date();
    const isoString = now.toISOString();
    expect(isValidDate(isoString)).toBe(true);
  });
});

describe('isValidUrl', () => {
  it('should return true for valid URLs with different protocols', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('ftp://example.com')).toBe(true);
    expect(isValidUrl('http://sub.example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidUrl('example')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false); // Missing protocol
    expect(isValidUrl('http:/example.com')).toBe(false); // Invalid protocol format
    expect(isValidUrl('http://example')).toBe(false); // Missing TLD
  });

  it('should handle edge cases', () => {
    expect(isValidUrl('')).toBe(false);
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(isValidUrl(null)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(isValidUrl(undefined)).toBe(false);
  });

  it('should validate URLs with query parameters and fragments correctly', () => {
    expect(isValidUrl('http://example.com?param=value')).toBe(true);
    expect(isValidUrl('http://example.com#section')).toBe(true);
    expect(isValidUrl('http://example.com/path?param=value#section')).toBe(true);
  });
});

describe('sanitizeString', () => {
  it('should remove HTML tags from strings', () => {
    expect(sanitizeString('<p>Test</p>')).toBe('&lt;p&gt;Test&lt;/p&gt;');
    expect(sanitizeString('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('should handle special characters correctly', () => {
    expect(sanitizeString('Test & Demo')).toBe('Test &amp; Demo');
    expect(sanitizeString('"Quoted text"')).toBe('&quot;Quoted text&quot;');
    expect(sanitizeString("It's a test")).toBe('It&#x27;s a test');
    expect(sanitizeString('Path/to/file')).toBe('Path&#x2F;to&#x2F;file');
  });

  it('should trim whitespace from the beginning and end', () => {
    expect(sanitizeString('  Test  ')).toBe('Test');
    expect(sanitizeString('\tTest\n')).toBe('Test');
  });

  it('should handle edge cases', () => {
    expect(sanitizeString('')).toBe('');
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(() => sanitizeString(null)).toThrow();
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(() => sanitizeString(undefined)).toThrow();
  });

  it('should preserve safe content while removing potentially harmful content', () => {
    const input = 'Hello <script>alert("XSS")</script> World';
    const expected = 'Hello &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; World';
    expect(sanitizeString(input)).toBe(expected);
  });
});

describe('validateEnum', () => {
  enum TestEnum {
    A = 'a',
    B = 'b',
    C = 'c'
  }

  enum NumericEnum {
    One = 1,
    Two = 2,
    Three = 3
  }

  it('should return true for values that exist in the enum', () => {
    expect(validateEnum('a', TestEnum)).toBe(true);
    expect(validateEnum('b', TestEnum)).toBe(true);
    expect(validateEnum('c', TestEnum)).toBe(true);
    expect(validateEnum(1, NumericEnum)).toBe(true);
    expect(validateEnum(2, NumericEnum)).toBe(true);
  });

  it("should return false for values that don't exist in the enum", () => {
    expect(validateEnum('d', TestEnum)).toBe(false);
    expect(validateEnum('X', TestEnum)).toBe(false);
    expect(validateEnum(4, NumericEnum)).toBe(false);
    expect(validateEnum('1', NumericEnum)).toBe(false); // String instead of number
  });

  it('should handle different enum types correctly', () => {
    expect(validateEnum('a', TestEnum)).toBe(true);
    expect(validateEnum(1, NumericEnum)).toBe(true);
  });

  it('should handle edge cases like null values and empty enums', () => {
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(validateEnum(null, TestEnum)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(validateEnum(undefined, TestEnum)).toBe(false);
    expect(validateEnum('a', {})).toBe(false); // Empty enum
  });
});

describe('validateRequiredFields', () => {
  it('should return isValid=true when all required fields are present', () => {
    const data = { name: 'John', email: 'john@example.com', age: 30 };
    const requiredFields = ['name', 'email'];
    const result = validateRequiredFields(data, requiredFields);
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it('should return isValid=false when some required fields are missing', () => {
    const data = { name: 'John', age: 30 };
    const requiredFields = ['name', 'email'];
    const result = validateRequiredFields(data, requiredFields);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('email');
  });

  it('should correctly identify missing fields in the missingFields array', () => {
    const data = { age: 30 };
    const requiredFields = ['name', 'email', 'phone'];
    const result = validateRequiredFields(data, requiredFields);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toEqual(['name', 'email', 'phone']);
  });

  it('should handle edge cases like empty objects and empty required fields arrays', () => {
    const emptyData = {};
    const requiredFields = ['name', 'email'];
    const result1 = validateRequiredFields(emptyData, requiredFields);
    expect(result1.isValid).toBe(false);
    expect(result1.missingFields).toEqual(['name', 'email']);

    const data = { name: 'John', email: 'john@example.com' };
    const emptyRequiredFields: string[] = [];
    const result2 = validateRequiredFields(data, emptyRequiredFields);
    expect(result2.isValid).toBe(true);
    expect(result2.missingFields).toEqual([]);
  });

  it('should treat dot-notation fields as regular fields, not nested paths', () => {
    const data = { 
      'user.name': 'John',
      'user.contact.email': 'john@example.com'
    };
    const requiredFields = ['user.name', 'user.contact.email', 'user.contact.phone'];
    const result = validateRequiredFields(data, requiredFields);
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain('user.contact.phone');
  });
});

describe('validateMaxLength', () => {
  it('should return true for strings shorter than or equal to maxLength', () => {
    expect(validateMaxLength('Test', 10)).toBe(true);
    expect(validateMaxLength('Test', 4)).toBe(true);
    expect(validateMaxLength('', 10)).toBe(true);
  });

  it('should return false for strings longer than maxLength', () => {
    expect(validateMaxLength('Testing', 5)).toBe(false);
    expect(validateMaxLength('Long string', 5)).toBe(false);
  });

  it('should handle edge cases like empty strings and null values', () => {
    expect(validateMaxLength('', 0)).toBe(true);
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(validateMaxLength(null, 10)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(validateMaxLength(undefined, 10)).toBe(false);
  });

  it('should return false for non-string values', () => {
    // @ts-ignore - Testing with number even though TypeScript doesn't allow it
    expect(validateMaxLength(123, 10)).toBe(false);
    // @ts-ignore - Testing with boolean even though TypeScript doesn't allow it
    expect(validateMaxLength(true, 10)).toBe(false);
    // @ts-ignore - Testing with object even though TypeScript doesn't allow it
    expect(validateMaxLength({}, 10)).toBe(false);
  });
});

describe('validateMinLength', () => {
  it('should return true for strings longer than or equal to minLength', () => {
    expect(validateMinLength('Testing', 5)).toBe(true);
    expect(validateMinLength('Test', 4)).toBe(true);
    expect(validateMinLength('Long string', 5)).toBe(true);
  });

  it('should return false for strings shorter than minLength', () => {
    expect(validateMinLength('Test', 5)).toBe(false);
    expect(validateMinLength('', 1)).toBe(false);
  });

  it('should handle edge cases like empty strings and null values', () => {
    expect(validateMinLength('', 0)).toBe(true);
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(validateMinLength(null, 10)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(validateMinLength(undefined, 10)).toBe(false);
  });

  it('should return false for non-string values', () => {
    // @ts-ignore - Testing with number even though TypeScript doesn't allow it
    expect(validateMinLength(123, 10)).toBe(false);
    // @ts-ignore - Testing with boolean even though TypeScript doesn't allow it
    expect(validateMinLength(true, 10)).toBe(false);
    // @ts-ignore - Testing with object even though TypeScript doesn't allow it
    expect(validateMinLength({}, 10)).toBe(false);
  });
});

describe('validateNumericRange', () => {
  it('should return true for numbers within the specified range', () => {
    expect(validateNumericRange(5, 1, 10)).toBe(true);
    expect(validateNumericRange(1, 1, 10)).toBe(true); // Min boundary
    expect(validateNumericRange(10, 1, 10)).toBe(true); // Max boundary
    expect(validateNumericRange(-5, -10, 0)).toBe(true); // Negative range
  });

  it('should return false for numbers outside the specified range', () => {
    expect(validateNumericRange(0, 1, 10)).toBe(false);
    expect(validateNumericRange(11, 1, 10)).toBe(false);
    expect(validateNumericRange(-11, -10, 0)).toBe(false);
  });

  it('should handle edge cases like min=max and null values', () => {
    expect(validateNumericRange(5, 5, 5)).toBe(true); // Min equals max
    // @ts-ignore - Testing with null even though TypeScript doesn't allow it
    expect(validateNumericRange(null, 1, 10)).toBe(false);
    // @ts-ignore - Testing with undefined even though TypeScript doesn't allow it
    expect(validateNumericRange(undefined, 1, 10)).toBe(false);
    expect(validateNumericRange(NaN, 1, 10)).toBe(false);
  });

  it('should return false for non-numeric values', () => {
    // @ts-ignore - Testing with string even though TypeScript doesn't allow it
    expect(validateNumericRange('5', 1, 10)).toBe(false);
    // @ts-ignore - Testing with boolean even though TypeScript doesn't allow it
    expect(validateNumericRange(true, 1, 10)).toBe(false);
    // @ts-ignore - Testing with object even though TypeScript doesn't allow it
    expect(validateNumericRange({}, 1, 10)).toBe(false);
  });
});