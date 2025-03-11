import { formatDisplayDate, formatDisplayTime } from './date.utils'; // date-fns v2.29.3
import { HealthDataType, SymptomSeverity, MealType } from '../types/health.types';
import { truncate } from 'lodash'; // lodash v4.17.21

// Constants for text formatting
export const MAX_DESCRIPTION_LENGTH = 100;
export const MAX_CHAT_PREVIEW_LENGTH = 50;
export const DECIMAL_PRECISION = 2;

/**
 * Formats a health data item title based on its type
 * @param type Type of health data
 * @param data Data object containing type-specific information
 * @returns Formatted title for the health data item
 */
export const formatHealthDataTitle = (
  type: HealthDataType,
  data: any
): string => {
  if (!data) {
    return 'Health Data';
  }
  
  switch (type) {
    case HealthDataType.MEAL:
      return data.mealType ? formatMealType(data.mealType) : 'Meal';
    case HealthDataType.LAB_RESULT:
      return data.testType || 'Lab Result';
    case HealthDataType.SYMPTOM:
      return 'Symptom';
    default:
      return 'Health Data';
  }
};

/**
 * Formats a health data timestamp into a user-friendly format
 * @param timestamp Date string or Date object
 * @returns Formatted timestamp (e.g., 'May 15, 2023 - 2:30 PM')
 */
export const formatHealthDataTimestamp = (
  timestamp: string | Date
): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const formattedDate = formatDisplayDate(date);
  const formattedTime = formatDisplayTime(date);
  
  return `${formattedDate} - ${formattedTime}`;
};

/**
 * Truncates text to a specified length with ellipsis
 * @param text Text to truncate
 * @param length Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (
  text: string,
  length: number
): string => {
  if (text === null || text === undefined) {
    return '';
  }
  
  return truncate(text, { 
    length: length,
    separator: /,? +/ // This will try to cut at spaces or commas followed by spaces
  });
};

/**
 * Formats and truncates a description for display
 * @param description Description text
 * @returns Formatted and truncated description
 */
export const formatDescription = (
  description: string
): string => {
  if (!description) {
    return '';
  }
  
  return truncateText(description.trim(), MAX_DESCRIPTION_LENGTH);
};

/**
 * Formats a chat message for preview display
 * @param message Chat message text
 * @returns Formatted chat preview
 */
export const formatChatPreview = (
  message: string
): string => {
  if (!message) {
    return '';
  }
  
  return truncateText(message.trim(), MAX_CHAT_PREVIEW_LENGTH);
};

/**
 * Formats symptom severity enum value to user-friendly text
 * @param severity Symptom severity enum value
 * @returns User-friendly severity text (e.g., 'Mild', 'Moderate', 'Severe')
 */
export const formatSymptomSeverity = (
  severity: SymptomSeverity
): string => {
  switch (severity) {
    case SymptomSeverity.MILD:
      return 'Mild';
    case SymptomSeverity.MODERATE:
      return 'Moderate';
    case SymptomSeverity.SEVERE:
      return 'Severe';
    default:
      return 'Unknown';
  }
};

/**
 * Formats meal type enum value to user-friendly text
 * @param mealType Meal type enum value
 * @returns User-friendly meal type text (e.g., 'Breakfast', 'Lunch', 'Dinner', 'Snack')
 */
export const formatMealType = (
  mealType: MealType
): string => {
  switch (mealType) {
    case MealType.BREAKFAST:
      return 'Breakfast';
    case MealType.LUNCH:
      return 'Lunch';
    case MealType.DINNER:
      return 'Dinner';
    case MealType.SNACK:
      return 'Snack';
    default:
      return 'Meal';
  }
};

/**
 * Formats a number with specified decimal precision
 * @param value Number to format
 * @param precision Number of decimal places (defaults to DECIMAL_PRECISION)
 * @returns Formatted number string with specified precision
 */
export const formatNumber = (
  value: number,
  precision: number = DECIMAL_PRECISION
): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  return value.toFixed(precision);
};

/**
 * Formats a file size in bytes to a human-readable format
 * @param bytes File size in bytes
 * @returns Human-readable file size (e.g., '2.5 MB')
 */
export const formatFileSize = (
  bytes: number
): string => {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${formatNumber(size, unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

/**
 * Capitalizes the first letter of a string
 * @param text Text to capitalize
 * @returns String with first letter capitalized
 */
export const capitalizeFirstLetter = (
  text: string
): string => {
  if (!text) {
    return '';
  }
  
  return text.charAt(0).toUpperCase() + text.slice(1);
};