import { format, parse, isValid, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns'; // date-fns v2.29.3
import { get } from 'lodash'; // lodash v4.17.21

/**
 * Standard date format used for API requests and storage
 * Format: 2023-05-15
 */
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Standard datetime format used for API requests with full precision
 * Format: 2023-05-15T14:30:00.000Z
 */
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

/**
 * User-friendly date format for display in the UI
 * Format: May 15, 2023
 */
export const DISPLAY_DATE_FORMAT = 'MMM d, yyyy';

/**
 * User-friendly time format for display in the UI
 * Format: 2:30 PM
 */
export const DISPLAY_TIME_FORMAT = 'h:mm a';

/**
 * User-friendly datetime format for display in the UI
 * Format: May 15, 2023 2:30 PM
 */
export const DISPLAY_DATETIME_FORMAT = 'MMM d, yyyy h:mm a';

/**
 * Formats a date object or string into a formatted string
 * @param date Date object or string to format
 * @param formatStr Format string to use (from date-fns)
 * @returns Formatted date string or empty string if date is invalid
 * @example
 * formatDate(new Date(2023, 4, 15), 'yyyy-MM-dd') // '2023-05-15'
 * formatDate('2023-05-15T14:30:00Z', 'h:mm a') // '2:30 PM'
 * formatDate(null, 'yyyy-MM-dd') // ''
 */
export const formatDate = (
  date: Date | string | null | undefined,
  formatStr: string
): string => {
  if (date === null || date === undefined) {
    return '';
  }

  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (!isValid(dateObj)) {
    return '';
  }

  return format(dateObj, formatStr);
};

/**
 * Parses a date string into a Date object
 * @param dateStr Date string to parse
 * @param formatStr Format string to use for parsing (from date-fns)
 * @returns Parsed Date object or invalid Date if parsing fails
 * @example
 * parseDate('2023-05-15', 'yyyy-MM-dd') // Date object for May 15, 2023
 * parseDate('', 'yyyy-MM-dd') // Invalid Date
 */
export const parseDate = (dateStr: string, formatStr: string): Date => {
  if (!dateStr) {
    return new Date(NaN); // Invalid date
  }
  
  try {
    return parse(dateStr, formatStr, new Date());
  } catch (error) {
    return new Date(NaN); // Invalid date
  }
};

/**
 * Checks if a date is valid according to the specified format
 * @param date Date to validate (can be string, Date object, or null/undefined)
 * @param formatStr Format string to use for validation if date is a string
 * @returns True if date is valid, false otherwise
 * @example
 * isValidDate(new Date(), 'yyyy-MM-dd') // true
 * isValidDate('2023-05-15', 'yyyy-MM-dd') // true
 * isValidDate('not a date', 'yyyy-MM-dd') // false
 * isValidDate(null, 'yyyy-MM-dd') // false
 */
export const isValidDate = (
  date: string | Date | null | undefined,
  formatStr: string
): boolean => {
  if (date === null || date === undefined) {
    return false;
  }

  if (date instanceof Date) {
    return isValid(date);
  }

  if (typeof date === 'string') {
    // For direct string format validation, use parse and check validity
    try {
      const parsedDate = parse(date, formatStr, new Date());
      return isValid(parsedDate);
    } catch (error) {
      return false;
    }
  }

  return false;
};

/**
 * Formats a date for API requests using the standard API date format
 * @param date Date to format
 * @returns Formatted date string for API requests (yyyy-MM-dd)
 * @example
 * formatAPIDate(new Date(2023, 4, 15)) // '2023-05-15'
 */
export const formatAPIDate = (
  date: Date | string | null | undefined
): string => {
  return formatDate(date, DATE_FORMAT);
};

/**
 * Formats a date for user display using a human-readable format
 * @param date Date to format
 * @returns User-friendly formatted date string (e.g., 'May 15, 2023')
 * @example
 * formatDisplayDate(new Date(2023, 4, 15)) // 'May 15, 2023'
 */
export const formatDisplayDate = (
  date: Date | string | null | undefined
): string => {
  return formatDate(date, DISPLAY_DATE_FORMAT);
};

/**
 * Formats a time for user display using a human-readable format
 * @param date Date to extract and format time from
 * @returns User-friendly formatted time string (e.g., '2:30 PM')
 * @example
 * formatDisplayTime(new Date(2023, 4, 15, 14, 30)) // '2:30 PM'
 */
export const formatDisplayTime = (
  date: Date | string | null | undefined
): string => {
  return formatDate(date, DISPLAY_TIME_FORMAT);
};

/**
 * Formats a date and time for user display using a human-readable format
 * @param date Date to format
 * @returns User-friendly formatted date and time string (e.g., 'May 15, 2023 2:30 PM')
 * @example
 * formatDisplayDateTime(new Date(2023, 4, 15, 14, 30)) // 'May 15, 2023 2:30 PM'
 */
export const formatDisplayDateTime = (
  date: Date | string | null | undefined
): string => {
  return formatDate(date, DISPLAY_DATETIME_FORMAT);
};

/**
 * Gets the start and end timestamps for a specific day
 * Useful for date-based filtering of health records
 * @param date Date to get range for
 * @returns Object containing start (00:00:00) and end (23:59:59.999) of the day
 * @example
 * getDateRangeForDay(new Date(2023, 4, 15))
 * // { start: Date object for 2023-05-15 00:00:00, end: Date object for 2023-05-15 23:59:59.999 }
 */
export const getDateRangeForDay = (
  date: Date | string
): { start: Date; end: Date } => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return {
    start: startOfDay(dateObj),
    end: endOfDay(dateObj),
  };
};

/**
 * Gets a user-friendly relative date label (Today, Yesterday, or formatted date)
 * @param date Date to get label for
 * @returns Relative date label ('Today', 'Yesterday', or formatted date)
 * @example
 * // Assuming today is May 15, 2023
 * getRelativeDateLabel(new Date()) // 'Today'
 * getRelativeDateLabel(new Date(2023, 4, 14)) // 'Yesterday'
 * getRelativeDateLabel(new Date(2023, 4, 13)) // 'May 13, 2023'
 */
export const getRelativeDateLabel = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  return formatDisplayDate(dateObj);
};

/**
 * Groups an array of objects by date property
 * Useful for organizing health data entries by date
 * @param items Array of items to group
 * @param dateProperty Property path for the date (supports nested paths with dot notation)
 * @returns Object with dates as keys and arrays of items as values
 * @example
 * const healthData = [
 *   { id: 1, timestamp: '2023-05-15T14:30:00Z', type: 'meal' },
 *   { id: 2, timestamp: '2023-05-15T18:00:00Z', type: 'symptom' },
 *   { id: 3, timestamp: '2023-05-14T09:15:00Z', type: 'labResult' }
 * ];
 * 
 * groupByDate(healthData, 'timestamp')
 * // {
 * //   '2023-05-15': [
 * //     { id: 1, timestamp: '2023-05-15T14:30:00Z', type: 'meal' },
 * //     { id: 2, timestamp: '2023-05-15T18:00:00Z', type: 'symptom' }
 * //   ],
 * //   '2023-05-14': [
 * //     { id: 3, timestamp: '2023-05-14T09:15:00Z', type: 'labResult' }
 * //   ]
 * // }
 */
export const groupByDate = <T>(
  items: T[],
  dateProperty: string
): Record<string, T[]> => {
  const result: Record<string, T[]> = {};
  
  items.forEach(item => {
    const dateValue = get(item, dateProperty);
    if (!dateValue) return;
    
    // Format the date to use as a key
    const dateKey = formatDate(new Date(dateValue), DATE_FORMAT);
    
    if (!dateKey) return; // Skip if the date is invalid
    
    if (!result[dateKey]) {
      result[dateKey] = [];
    }
    
    result[dateKey].push(item);
  });
  
  return result;
};

// Re-export useful date-fns functions
export { isToday, isYesterday };