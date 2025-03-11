import {
  isValidEmail,
  isValidPassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateEnum,
  validateDate,
  validateLoginForm,
  validateSignupForm,
  validateMealForm,
  validateLabResultForm,
  validateSymptomForm,
  isFormValid,
  sanitizeInput
} from '../../src/utils/validation.utils';
import { HealthDataType, MealType, SymptomSeverity } from '../../src/types/health.types';
import { LoginRequest, SignupRequest } from '../../src/types/auth.types';

describe('isValidEmail', () => {
  it('should return true for properly formatted emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.com')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });
  
  it('should validate emails with different domains', () => {
    expect(isValidEmail('user@gmail.com')).toBe(true);
    expect(isValidEmail('user@yahoo.co.uk')).toBe(true);
    expect(isValidEmail('user@company-name.org')).toBe(true);
  });
  
  it('should validate emails with subdomains', () => {
    expect(isValidEmail('user@sub.example.com')).toBe(true);
    expect(isValidEmail('user@mail.sub.domain.co')).toBe(true);
  });
  
  it('should reject emails without @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
    expect(isValidEmail('user.example.com')).toBe(false);
  });
  
  it('should reject emails without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });
  
  it('should reject emails with invalid characters', () => {
    expect(isValidEmail('user name@example.com')).toBe(false);
    expect(isValidEmail('user<>@example.com')).toBe(false);
  });
  
  it('should reject empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
  
  it('should reject null and undefined', () => {
    expect(isValidEmail(null as any)).toBe(false);
    expect(isValidEmail(undefined as any)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('should validate strong passwords with letters, numbers, and special characters', () => {
    expect(isValidPassword('Password123!')).toBe(true);
    expect(isValidPassword('Secure@Password789')).toBe(true);
    expect(isValidPassword('H3llo_W0rld#')).toBe(true);
  });
  
  it('should validate minimum length requirement', () => {
    expect(isValidPassword('Pw1!Pw2@')).toBe(true); // Exactly 8 characters
    expect(isValidPassword('LongP@ssw0rd')).toBe(true); // More than 8 characters
  });
  
  it('should reject passwords without letters', () => {
    expect(isValidPassword('12345678!')).toBe(false);
    expect(isValidPassword('123456789@#')).toBe(false);
  });
  
  it('should reject passwords without numbers', () => {
    expect(isValidPassword('Password!')).toBe(false);
    expect(isValidPassword('StrongPassword@')).toBe(false);
  });
  
  it('should reject passwords without special characters', () => {
    expect(isValidPassword('Password123')).toBe(false);
    expect(isValidPassword('SecurePass456')).toBe(false);
  });
  
  it('should reject passwords shorter than 8 characters', () => {
    expect(isValidPassword('Pw1!')).toBe(false);
    expect(isValidPassword('Ab1@')).toBe(false);
  });
  
  it('should reject empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });
  
  it('should reject null and undefined', () => {
    expect(isValidPassword(null as any)).toBe(false);
    expect(isValidPassword(undefined as any)).toBe(false);
  });
});

describe('validateRequired', () => {
  it('should validate non-empty string', () => {
    expect(validateRequired('test', 'Field')).toBeNull();
    expect(validateRequired('  test  ', 'Field')).toBeNull();
  });
  
  it('should validate non-zero number', () => {
    expect(validateRequired(123, 'Field')).toBeNull();
    expect(validateRequired(0, 'Field')).toBeNull();
  });
  
  it('should validate boolean values', () => {
    expect(validateRequired(true, 'Field')).toBeNull();
    expect(validateRequired(false, 'Field')).toBeNull();
  });
  
  it('should validate objects and arrays', () => {
    expect(validateRequired({}, 'Field')).toBeNull();
    expect(validateRequired([], 'Field')).toBeNull();
    expect(validateRequired({ name: 'test' }, 'Field')).toBeNull();
  });
  
  it('should reject empty string', () => {
    expect(validateRequired('', 'Field')).toBe('Field is required');
  });
  
  it('should reject null and undefined', () => {
    expect(validateRequired(null, 'Field')).toBe('Field is required');
    expect(validateRequired(undefined, 'Field')).toBe('Field is required');
  });
  
  it('should include field name in error message', () => {
    expect(validateRequired('', 'Email')).toBe('Email is required');
    expect(validateRequired(null, 'Password')).toBe('Password is required');
    expect(validateRequired(undefined, 'Username')).toBe('Username is required');
  });
});

describe('validateMinLength', () => {
  it('should validate string longer than minimum length', () => {
    expect(validateMinLength('password', 6, 'Password')).toBeNull();
    expect(validateMinLength('longer text', 5, 'Text')).toBeNull();
  });
  
  it('should validate string equal to minimum length', () => {
    expect(validateMinLength('passwo', 6, 'Password')).toBeNull();
    expect(validateMinLength('12345', 5, 'Text')).toBeNull();
  });
  
  it('should reject string shorter than minimum length', () => {
    expect(validateMinLength('pass', 6, 'Password')).toBe('Password must be at least 6 characters');
    expect(validateMinLength('1234', 5, 'Text')).toBe('Text must be at least 5 characters');
  });
  
  it('should reject empty string', () => {
    expect(validateMinLength('', 5, 'Field')).toBe('Field must be at least 5 characters');
  });
  
  it('should reject null and undefined', () => {
    expect(validateMinLength(null as any, 5, 'Field')).toBe('Field must be a string');
    expect(validateMinLength(undefined as any, 5, 'Field')).toBe('Field must be a string');
  });
  
  it('should include field name and minimum length in error message', () => {
    expect(validateMinLength('abc', 5, 'Username')).toBe('Username must be at least 5 characters');
    expect(validateMinLength('a', 10, 'Description')).toBe('Description must be at least 10 characters');
  });
});

describe('validateMaxLength', () => {
  it('should validate string shorter than maximum length', () => {
    expect(validateMaxLength('short', 10, 'Text')).toBeNull();
    expect(validateMaxLength('small', 20, 'Field')).toBeNull();
  });
  
  it('should validate string equal to maximum length', () => {
    expect(validateMaxLength('1234567890', 10, 'Text')).toBeNull();
    expect(validateMaxLength('abcde', 5, 'Field')).toBeNull();
  });
  
  it('should reject string longer than maximum length', () => {
    expect(validateMaxLength('this is too long', 10, 'Text')).toBe('Text must not exceed 10 characters');
    expect(validateMaxLength('abcdef', 5, 'Field')).toBe('Field must not exceed 5 characters');
  });
  
  it('should validate empty string', () => {
    expect(validateMaxLength('', 10, 'Text')).toBeNull();
  });
  
  it('should reject null and undefined', () => {
    expect(validateMaxLength(null as any, 5, 'Field')).toBe('Field must be a string');
    expect(validateMaxLength(undefined as any, 5, 'Field')).toBe('Field must be a string');
  });
  
  it('should include field name and maximum length in error message', () => {
    expect(validateMaxLength('this is too long for the field', 10, 'Description')).toBe('Description must not exceed 10 characters');
    expect(validateMaxLength('exceeds limit', 5, 'Name')).toBe('Name must not exceed 5 characters');
  });
});

describe('validateEmail', () => {
  it('should validate a properly formatted email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
    expect(validateEmail('user.name@example.com')).toBeNull();
    expect(validateEmail('user+tag@domain.co.uk')).toBeNull();
  });
  
  it('should reject invalid email formats', () => {
    expect(validateEmail('user@')).toBe('Please enter a valid email address');
    expect(validateEmail('user.example.com')).toBe('Please enter a valid email address');
    expect(validateEmail('user@domain')).toBe('Please enter a valid email address');
  });
  
  it('should reject empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });
  
  it('should reject null and undefined', () => {
    expect(validateEmail(null as any)).toBe('Email is required');
    expect(validateEmail(undefined as any)).toBe('Email is required');
  });
  
  it('should return error message for required field', () => {
    expect(validateEmail('')).toBe('Email is required');
  });
  
  it('should return error message for invalid format', () => {
    expect(validateEmail('invalid-format')).toBe('Please enter a valid email address');
  });
});

describe('validatePassword', () => {
  it('should validate a strong password', () => {
    expect(validatePassword('Password123!')).toBeNull();
    expect(validatePassword('Secure@Pass789')).toBeNull();
    expect(validatePassword('Complex$123Password')).toBeNull();
  });
  
  it('should reject weak passwords', () => {
    const weakPasswordError = 'Password must be at least 8 characters and include at least one letter, one number, and one special character';
    expect(validatePassword('password')).toBe(weakPasswordError);
    expect(validatePassword('Pass123')).toBe(weakPasswordError);
    expect(validatePassword('Password')).toBe(weakPasswordError);
    expect(validatePassword('12345678')).toBe(weakPasswordError);
    expect(validatePassword('Pass!')).toBe(weakPasswordError);
  });
  
  it('should reject empty string', () => {
    expect(validatePassword('')).toBe('Password is required');
  });
  
  it('should reject null and undefined', () => {
    expect(validatePassword(null as any)).toBe('Password is required');
    expect(validatePassword(undefined as any)).toBe('Password is required');
  });
  
  it('should return error message for required field', () => {
    expect(validatePassword('')).toBe('Password is required');
  });
  
  it('should return error message for weak password', () => {
    expect(validatePassword('weak')).toBe('Password must be at least 8 characters and include at least one letter, one number, and one special character');
  });
});

describe('validatePasswordMatch', () => {
  it('should validate matching passwords', () => {
    expect(validatePasswordMatch('Password123!', 'Password123!')).toBeNull();
    expect(validatePasswordMatch('AnotherPassword@456', 'AnotherPassword@456')).toBeNull();
  });
  
  it('should reject non-matching passwords', () => {
    expect(validatePasswordMatch('Password123!', 'Password456!')).toBe('Passwords do not match');
    expect(validatePasswordMatch('SecurePass!1', 'SecurePass!2')).toBe('Passwords do not match');
  });
  
  it('should handle case sensitivity', () => {
    expect(validatePasswordMatch('Password123!', 'password123!')).toBe('Passwords do not match');
    expect(validatePasswordMatch('SecurePass!1', 'securepass!1')).toBe('Passwords do not match');
  });
  
  it('should handle whitespace differences', () => {
    expect(validatePasswordMatch('Password123!', 'Password123! ')).toBe('Passwords do not match');
    expect(validatePasswordMatch(' SecurePass!1', 'SecurePass!1')).toBe('Passwords do not match');
  });
  
  it('should return error message for password mismatch', () => {
    expect(validatePasswordMatch('Password123!', 'DifferentPassword123!')).toBe('Passwords do not match');
  });
});

describe('validateEnum', () => {
  it('should validate valid enum value for HealthDataType', () => {
    expect(validateEnum(HealthDataType.MEAL, HealthDataType, 'Health data type')).toBeNull();
    expect(validateEnum(HealthDataType.LAB_RESULT, HealthDataType, 'Health data type')).toBeNull();
    expect(validateEnum(HealthDataType.SYMPTOM, HealthDataType, 'Health data type')).toBeNull();
  });
  
  it('should validate valid enum value for MealType', () => {
    expect(validateEnum(MealType.BREAKFAST, MealType, 'Meal type')).toBeNull();
    expect(validateEnum(MealType.LUNCH, MealType, 'Meal type')).toBeNull();
    expect(validateEnum(MealType.DINNER, MealType, 'Meal type')).toBeNull();
    expect(validateEnum(MealType.SNACK, MealType, 'Meal type')).toBeNull();
  });
  
  it('should validate valid enum value for SymptomSeverity', () => {
    expect(validateEnum(SymptomSeverity.MILD, SymptomSeverity, 'Severity')).toBeNull();
    expect(validateEnum(SymptomSeverity.MODERATE, SymptomSeverity, 'Severity')).toBeNull();
    expect(validateEnum(SymptomSeverity.SEVERE, SymptomSeverity, 'Severity')).toBeNull();
  });
  
  it('should reject invalid enum values', () => {
    expect(validateEnum('invalid' as any, HealthDataType, 'Health data type')).toContain('Health data type must be one of the following values');
    expect(validateEnum('brunch' as any, MealType, 'Meal type')).toContain('Meal type must be one of the following values');
    expect(validateEnum('critical' as any, SymptomSeverity, 'Severity')).toContain('Severity must be one of the following values');
  });
  
  it('should reject null and undefined', () => {
    expect(validateEnum(null, HealthDataType, 'Health data type')).toBe('Health data type is required');
    expect(validateEnum(undefined, MealType, 'Meal type')).toBe('Meal type is required');
  });
  
  it('should include field name and valid options in error message', () => {
    const error = validateEnum('invalid' as any, MealType, 'Meal type');
    expect(error).toContain('Meal type must be one of the following values');
    expect(error).toContain('breakfast');
    expect(error).toContain('lunch');
    expect(error).toContain('dinner');
    expect(error).toContain('snack');
  });
});

describe('validateDate', () => {
  it('should validate valid date string in ISO format', () => {
    expect(validateDate('2023-05-15', 'Test date')).toBeNull();
    expect(validateDate('2023-12-31', 'Test date')).toBeNull();
    expect(validateDate(new Date().toISOString(), 'Test date')).toBeNull();
  });
  
  it('should validate valid date string in MM/DD/YYYY format', () => {
    expect(validateDate('05/15/2023', 'Test date')).toBeNull();
    expect(validateDate('12/31/2023', 'Test date')).toBeNull();
  });
  
  it('should reject invalid date formats', () => {
    expect(validateDate('not-a-date', 'Test date')).toBe('Test date must be a valid date');
    expect(validateDate('15-05-2023', 'Test date')).toBe('Test date must be a valid date');
    expect(validateDate('2023/13/32', 'Test date')).toBe('Test date must be a valid date');
  });
  
  it('should reject impossible dates', () => {
    expect(validateDate('2023-02-30', 'Test date')).toBe('Test date must be a valid date');
    expect(validateDate('02/30/2023', 'Test date')).toBe('Test date must be a valid date');
    expect(validateDate('2023-13-01', 'Test date')).toBe('Test date must be a valid date');
  });
  
  it('should reject empty string', () => {
    expect(validateDate('', 'Test date')).toBe('Test date is required');
  });
  
  it('should reject null and undefined', () => {
    expect(validateDate(null as any, 'Test date')).toBe('Test date is required');
    expect(validateDate(undefined as any, 'Test date')).toBe('Test date is required');
  });
  
  it('should include field name in error message', () => {
    expect(validateDate('invalid', 'Appointment date')).toBe('Appointment date must be a valid date');
  });
});

describe('validateLoginForm', () => {
  it('should validate valid login form data', () => {
    const validForm: LoginRequest = {
      email: 'user@example.com',
      password: 'Password123!'
    };
    const errors = validateLoginForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should reject form with invalid email', () => {
    const invalidForm: LoginRequest = {
      email: 'invalid-email',
      password: 'Password123!'
    };
    const errors = validateLoginForm(invalidForm);
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeUndefined();
  });
  
  it('should reject form with invalid password', () => {
    const invalidForm: LoginRequest = {
      email: 'user@example.com',
      password: 'weak'
    };
    const errors = validateLoginForm(invalidForm);
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeDefined();
  });
  
  it('should reject form with missing email', () => {
    const invalidForm: LoginRequest = {
      email: '',
      password: 'Password123!'
    };
    const errors = validateLoginForm(invalidForm);
    expect(errors.email).toBeDefined();
    expect(errors.email).toBe('Email is required');
  });
  
  it('should reject form with missing password', () => {
    const invalidForm: LoginRequest = {
      email: 'user@example.com',
      password: ''
    };
    const errors = validateLoginForm(invalidForm);
    expect(errors.password).toBeDefined();
    expect(errors.password).toBe('Password is required');
  });
  
  it('should provide error messages for each field', () => {
    const invalidForm: LoginRequest = {
      email: 'invalid',
      password: 'weak'
    };
    const errors = validateLoginForm(invalidForm);
    expect(errors.email).toBe('Please enter a valid email address');
    expect(errors.password).toBe('Password must be at least 8 characters and include at least one letter, one number, and one special character');
  });
});

describe('validateSignupForm', () => {
  it('should validate valid signup form data', () => {
    const validForm: SignupRequest = {
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    const errors = validateSignupForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should reject form with invalid email', () => {
    const invalidForm: SignupRequest = {
      email: 'invalid-email',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    const errors = validateSignupForm(invalidForm);
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeUndefined();
    expect(errors.confirmPassword).toBeUndefined();
  });
  
  it('should reject form with invalid password', () => {
    const invalidForm: SignupRequest = {
      email: 'user@example.com',
      password: 'weak',
      confirmPassword: 'weak'
    };
    const errors = validateSignupForm(invalidForm);
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeDefined();
    expect(errors.confirmPassword).toBeUndefined();
  });
  
  it('should reject form with non-matching passwords', () => {
    const invalidForm: SignupRequest = {
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword456!'
    };
    const errors = validateSignupForm(invalidForm);
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeUndefined();
    expect(errors.confirmPassword).toBeDefined();
    expect(errors.confirmPassword).toBe('Passwords do not match');
  });
  
  it('should reject form with missing fields', () => {
    const invalidForm: Partial<SignupRequest> = {};
    const errors = validateSignupForm(invalidForm as SignupRequest);
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
    expect(errors.confirmPassword).toBeDefined();
  });
  
  it('should provide error messages for each field', () => {
    const invalidForm: SignupRequest = {
      email: 'invalid',
      password: 'weak',
      confirmPassword: 'different'
    };
    const errors = validateSignupForm(invalidForm);
    expect(errors.email).toBe('Please enter a valid email address');
    expect(errors.password).toBe('Password must be at least 8 characters and include at least one letter, one number, and one special character');
    expect(errors.confirmPassword).toBe('Passwords do not match');
  });
});

describe('validateMealForm', () => {
  it('should validate valid meal form data', () => {
    const validForm = {
      mealType: MealType.LUNCH,
      description: 'Grilled chicken salad',
      image: { uri: 'file://photo.jpg', type: 'image/jpeg', name: 'photo.jpg' }
    };
    const errors = validateMealForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should validate form with optional description', () => {
    const validForm = {
      mealType: MealType.DINNER,
      image: { uri: 'file://photo.jpg', type: 'image/jpeg', name: 'photo.jpg' }
    };
    const errors = validateMealForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should reject form with invalid meal type', () => {
    const invalidForm = {
      mealType: 'invalid' as MealType,
      description: 'Grilled chicken salad',
      image: { uri: 'file://photo.jpg', type: 'image/jpeg', name: 'photo.jpg' }
    };
    const errors = validateMealForm(invalidForm);
    expect(errors.mealType).toBeDefined();
  });
  
  it('should reject form with missing image', () => {
    const invalidForm = {
      mealType: MealType.BREAKFAST,
      description: 'Oatmeal with berries'
    };
    const errors = validateMealForm(invalidForm);
    expect(errors.image).toBeDefined();
    expect(errors.image).toBe('Image is required');
  });
  
  it('should reject form with description exceeding max length', () => {
    const invalidForm = {
      mealType: MealType.SNACK,
      description: 'a'.repeat(1001), // More than 1000 characters
      image: { uri: 'file://photo.jpg', type: 'image/jpeg', name: 'photo.jpg' }
    };
    const errors = validateMealForm(invalidForm);
    expect(errors.description).toBeDefined();
    expect(errors.description).toBe('Description must not exceed 1000 characters');
  });
});

describe('validateLabResultForm', () => {
  it('should validate valid lab result form data', () => {
    const validForm = {
      testType: 'Blood Test',
      testDate: '2023-05-15',
      notes: 'Routine checkup',
      image: { uri: 'file://lab.jpg', type: 'image/jpeg', name: 'lab.jpg' }
    };
    const errors = validateLabResultForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should validate form with optional notes', () => {
    const validForm = {
      testType: 'Cholesterol',
      testDate: '2023-05-15',
      image: { uri: 'file://lab.jpg', type: 'image/jpeg', name: 'lab.jpg' }
    };
    const errors = validateLabResultForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should reject form with missing test type', () => {
    const invalidForm = {
      testDate: '2023-05-15',
      image: { uri: 'file://lab.jpg', type: 'image/jpeg', name: 'lab.jpg' }
    };
    const errors = validateLabResultForm(invalidForm);
    expect(errors.testType).toBeDefined();
    expect(errors.testType).toBe('Test type is required');
  });
  
  it('should reject form with invalid test date', () => {
    const invalidForm = {
      testType: 'Blood Test',
      testDate: 'not-a-date',
      image: { uri: 'file://lab.jpg', type: 'image/jpeg', name: 'lab.jpg' }
    };
    const errors = validateLabResultForm(invalidForm);
    expect(errors.testDate).toBeDefined();
    expect(errors.testDate).toBe('Test date must be a valid date');
  });
  
  it('should reject form with missing image', () => {
    const invalidForm = {
      testType: 'Blood Test',
      testDate: '2023-05-15',
      notes: 'Routine checkup'
    };
    const errors = validateLabResultForm(invalidForm);
    expect(errors.image).toBeDefined();
    expect(errors.image).toBe('Image is required');
  });
  
  it('should reject form with notes exceeding max length', () => {
    const invalidForm = {
      testType: 'Blood Test',
      testDate: '2023-05-15',
      notes: 'a'.repeat(1001), // More than 1000 characters
      image: { uri: 'file://lab.jpg', type: 'image/jpeg', name: 'lab.jpg' }
    };
    const errors = validateLabResultForm(invalidForm);
    expect(errors.notes).toBeDefined();
    expect(errors.notes).toBe('Notes must not exceed 1000 characters');
  });
});

describe('validateSymptomForm', () => {
  it('should validate valid symptom form data with audio', () => {
    const validForm = {
      description: 'Headache',
      severity: SymptomSeverity.MODERATE,
      duration: '2 hours',
      audio: { uri: 'file://audio.m4a', type: 'audio/m4a', name: 'audio.m4a' }
    };
    const errors = validateSymptomForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should validate valid symptom form data with transcription', () => {
    const validForm = {
      description: 'Headache',
      severity: SymptomSeverity.MODERATE,
      duration: '2 hours',
      transcription: 'I have been experiencing headaches after meals'
    };
    const errors = validateSymptomForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  
  it('should reject form with missing description', () => {
    const invalidForm = {
      severity: SymptomSeverity.MODERATE,
      duration: '2 hours',
      audio: { uri: 'file://audio.m4a', type: 'audio/m4a', name: 'audio.m4a' }
    };
    const errors = validateSymptomForm(invalidForm);
    expect(errors.description).toBeDefined();
    expect(errors.description).toBe('Description is required');
  });
  
  it('should reject form with invalid severity', () => {
    const invalidForm = {
      description: 'Headache',
      severity: 'high' as SymptomSeverity,
      duration: '2 hours',
      audio: { uri: 'file://audio.m4a', type: 'audio/m4a', name: 'audio.m4a' }
    };
    const errors = validateSymptomForm(invalidForm);
    expect(errors.severity).toBeDefined();
  });
  
  it('should reject form with missing duration', () => {
    const invalidForm = {
      description: 'Headache',
      severity: SymptomSeverity.MODERATE,
      audio: { uri: 'file://audio.m4a', type: 'audio/m4a', name: 'audio.m4a' }
    };
    const errors = validateSymptomForm(invalidForm);
    expect(errors.duration).toBeDefined();
    expect(errors.duration).toBe('Duration is required');
  });
  
  it('should reject form with neither audio nor transcription', () => {
    const invalidForm = {
      description: 'Headache',
      severity: SymptomSeverity.MODERATE,
      duration: '2 hours'
    };
    const errors = validateSymptomForm(invalidForm);
    expect(errors.transcription).toBeDefined();
    expect(errors.transcription).toBe('Either audio recording or text description is required');
  });
  
  it('should reject form with description exceeding max length', () => {
    const invalidForm = {
      description: 'a'.repeat(1001), // More than 1000 characters
      severity: SymptomSeverity.MODERATE,
      duration: '2 hours',
      audio: { uri: 'file://audio.m4a', type: 'audio/m4a', name: 'audio.m4a' }
    };
    const errors = validateSymptomForm(invalidForm);
    expect(errors.description).toBeDefined();
    expect(errors.description).toBe('Description must not exceed 1000 characters');
  });
});

describe('isFormValid', () => {
  it('should return true for empty errors object', () => {
    expect(isFormValid({})).toBe(true);
  });
  
  it('should return true for object with null/empty error values', () => {
    expect(isFormValid({ field1: null, field2: '' })).toBe(true);
  });
  
  it('should return false for object with any error message', () => {
    expect(isFormValid({ field1: null, field2: 'Error message' })).toBe(false);
  });
  
  it('should handle mixed valid/invalid fields', () => {
    expect(isFormValid({ field1: null, field2: 'Error', field3: '' })).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('should sanitize string with HTML tags', () => {
    expect(sanitizeInput('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(sanitizeInput('<div>text</div>')).toBe('&lt;div&gt;text&lt;/div&gt;');
  });
  
  it('should sanitize string with script tags', () => {
    expect(sanitizeInput('<script>malicious code</script>')).toBe('&lt;script&gt;malicious code&lt;/script&gt;');
    expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
  });
  
  it('should sanitize string with special characters', () => {
    expect(sanitizeInput('&"\'<>')).toBe('&amp;&quot;&#39;&lt;&gt;');
    expect(sanitizeInput('Test & Test')).toBe('Test &amp; Test');
  });
  
  it('should trim whitespace', () => {
    expect(sanitizeInput('  test  ')).toBe('test');
    expect(sanitizeInput('\n\ttest\n\t')).toBe('test');
  });
  
  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });
  
  it('should handle null and undefined', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
  });
});