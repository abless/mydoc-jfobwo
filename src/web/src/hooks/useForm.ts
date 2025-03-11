import { useState, useCallback, useEffect } from 'react'; // v18.2.0
import { isFormValid, sanitizeInput } from '../utils/validation.utils';

/**
 * Type for form values object with string keys and any values
 */
export type FormValues = Record<string, any>;

/**
 * Type for form errors object with string keys and string error messages
 */
export type FormErrors = Record<string, string>;

/**
 * Type for tracking touched form fields with string keys and boolean values
 */
export type FormTouched = Record<string, boolean>;

/**
 * Type for form validation function that takes values and returns errors
 */
export type ValidationFunction = (values: FormValues) => FormErrors;

/**
 * Type for form submission function that takes values and returns a promise or void
 */
export type SubmitFunction = (values: FormValues) => Promise<void> | void;

/**
 * Return type of the useForm hook with form state and handlers
 */
export interface UseFormReturn {
  values: FormValues;
  errors: FormErrors;
  touched: FormTouched;
  isSubmitting: boolean;
  handleChange: (name: string) => (value: any) => void;
  handleBlur: (name: string) => () => void;
  setFieldValue: (name: string, value: any) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  setErrors: (errors: FormErrors) => void;
}

/**
 * Custom React hook for form state management, validation, and submission handling
 * 
 * @param initialValues - Initial state for form values
 * @param validateFn - Function to validate form values and return errors
 * @param onSubmit - Function to handle form submission
 * @returns Form state and handlers for managing form interactions
 */
export const useForm = (
  initialValues: FormValues,
  validateFn: ValidationFunction,
  onSubmit: SubmitFunction
): UseFormReturn => {
  // Form state
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset errors when values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      // Only validate if user has interacted with the form
      const validationErrors = validateFn(values);
      setErrors(validationErrors);
    }
  }, [values, validateFn, touched]);

  /**
   * Handles input changes and updates form values
   * @param name - Field name to update
   * @returns Function that accepts the new value and updates the state
   */
  const handleChange = useCallback((name: string) => (value: any) => {
    // Handle string inputs with sanitization
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    setValues(prevValues => ({
      ...prevValues,
      [name]: sanitizedValue
    }));
  }, []);

  /**
   * Marks a field as touched when the user interacts with it
   * @param name - Field name to mark as touched
   * @returns Function that updates the touched state for the field
   */
  const handleBlur = useCallback((name: string) => () => {
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
  }, []);

  /**
   * Directly sets a field's value
   * @param name - Field name to update
   * @param value - New value for the field
   */
  const setFieldValue = useCallback((name: string, value: any) => {
    // Handle string inputs with sanitization
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    setValues(prevValues => ({
      ...prevValues,
      [name]: sanitizedValue
    }));
    // Mark field as touched when directly setting value
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
  }, []);

  /**
   * Validates form and submits if valid
   * @returns Promise that resolves when submission is complete
   */
  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as FormTouched);
    
    setTouched(allTouched);
    
    // Validate the form
    const validationErrors = validateFn(values);
    setErrors(validationErrors);
    
    // Only proceed if form is valid
    if (isFormValid(validationErrors)) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
        if (error instanceof Error) {
          setErrors(prev => ({
            ...prev,
            form: error.message
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            form: 'An unexpected error occurred during submission'
          }));
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateFn, onSubmit]);

  /**
   * Resets the form to its initial state
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldValue,
    handleSubmit,
    resetForm,
    setErrors
  };
};

export default useForm;