import { 
  formatDate,
  parseDate,
  isValidDate,
  formatAPIDate,
  formatDisplayDate,
  formatDisplayTime,
  formatDisplayDateTime,
  getDateRangeForDay,
  getRelativeDateLabel,
  groupByDate,
  DATE_FORMAT,
  DATETIME_FORMAT,
  DISPLAY_DATE_FORMAT,
  DISPLAY_TIME_FORMAT,
  DISPLAY_DATETIME_FORMAT
} from '../../src/utils/date.utils';
import { format, parse, isValid, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns'; // date-fns v2.29.3

describe('formatDate', () => {
  it('should format a valid Date object', () => {
    const date = new Date(2023, 4, 15, 14, 30, 0); // May 15, 2023 2:30 PM
    const result = formatDate(date, 'yyyy-MM-dd');
    expect(result).toBe('2023-05-15');
  });

  it('should format a valid date string', () => {
    const dateString = '2023-05-15T14:30:00Z';
    const result = formatDate(dateString, 'yyyy-MM-dd');
    expect(result).toBe('2023-05-15');
  });

  it('should format with different format strings', () => {
    const date = new Date(2023, 4, 15, 14, 30, 0);
    expect(formatDate(date, 'h:mm a')).toBe('2:30 PM');
    expect(formatDate(date, 'MMM d, yyyy')).toBe('May 15, 2023');
  });

  it('should return empty string for null input', () => {
    expect(formatDate(null, 'yyyy-MM-dd')).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(formatDate(undefined, 'yyyy-MM-dd')).toBe('');
  });

  it('should return empty string for invalid date input', () => {
    expect(formatDate('not a date', 'yyyy-MM-dd')).toBe('');
  });
});

describe('parseDate', () => {
  it('should parse a valid date string', () => {
    const dateString = '2023-05-15';
    const result = parseDate(dateString, 'yyyy-MM-dd');
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(4); // May is 4 in JS (0-indexed)
    expect(result.getDate()).toBe(15);
  });

  it('should parse with different format strings', () => {
    const dateString1 = 'May 15, 2023';
    const result1 = parseDate(dateString1, 'MMM d, yyyy');
    expect(result1.getFullYear()).toBe(2023);
    expect(result1.getMonth()).toBe(4);
    expect(result1.getDate()).toBe(15);

    const dateString2 = '15/05/2023';
    const result2 = parseDate(dateString2, 'dd/MM/yyyy');
    expect(result2.getFullYear()).toBe(2023);
    expect(result2.getMonth()).toBe(4);
    expect(result2.getDate()).toBe(15);
  });

  it('should return invalid date for empty string', () => {
    const result = parseDate('', 'yyyy-MM-dd');
    expect(isValid(result)).toBe(false);
  });

  it('should return invalid date for null input', () => {
    // @ts-ignore - Testing with null to ensure the function handles it gracefully
    const result = parseDate(null, 'yyyy-MM-dd');
    expect(isValid(result)).toBe(false);
  });

  it('should return invalid date for incorrect format', () => {
    const result = parseDate('2023/05/15', 'yyyy-MM-dd');
    expect(isValid(result)).toBe(false);
  });
});

describe('isValidDate', () => {
  it('should validate a Date object', () => {
    const date = new Date(2023, 4, 15);
    expect(isValidDate(date, 'yyyy-MM-dd')).toBe(true);
  });

  it('should validate a valid date string with correct format', () => {
    expect(isValidDate('2023-05-15', 'yyyy-MM-dd')).toBe(true);
  });

  it('should handle different format strings', () => {
    expect(isValidDate('May 15, 2023', 'MMM d, yyyy')).toBe(true);
    expect(isValidDate('15/05/2023', 'dd/MM/yyyy')).toBe(true);
  });

  it('should return false for null input', () => {
    expect(isValidDate(null, 'yyyy-MM-dd')).toBe(false);
  });

  it('should return false for undefined input', () => {
    expect(isValidDate(undefined, 'yyyy-MM-dd')).toBe(false);
  });

  it('should return false for invalid date strings', () => {
    expect(isValidDate('not a date', 'yyyy-MM-dd')).toBe(false);
    expect(isValidDate('2023-13-45', 'yyyy-MM-dd')).toBe(false);
  });

  it('should return false for incorrectly formatted date strings', () => {
    expect(isValidDate('2023/05/15', 'yyyy-MM-dd')).toBe(false);
  });
});

describe('formatAPIDate', () => {
  it('should format a Date object for API', () => {
    const date = new Date(2023, 4, 15);
    expect(formatAPIDate(date)).toBe('2023-05-15');
  });

  it('should format a date string for API', () => {
    expect(formatAPIDate('2023-05-15T14:30:00Z')).toBe('2023-05-15');
  });

  it('should return empty string for null input', () => {
    expect(formatAPIDate(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(formatAPIDate(undefined)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatAPIDate('not a date')).toBe('');
  });
});

describe('formatDisplayDate', () => {
  it('should format a Date object for display', () => {
    const date = new Date(2023, 4, 15);
    expect(formatDisplayDate(date)).toBe('May 15, 2023');
  });

  it('should format a date string for display', () => {
    expect(formatDisplayDate('2023-05-15T14:30:00Z')).toBe('May 15, 2023');
  });

  it('should return empty string for null input', () => {
    expect(formatDisplayDate(null)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDisplayDate('not a date')).toBe('');
  });
});

describe('formatDisplayTime', () => {
  it('should format a Date object for time display', () => {
    const date = new Date(2023, 4, 15, 14, 30, 0);
    expect(formatDisplayTime(date)).toBe('2:30 PM');
  });

  it('should format a date string for time display', () => {
    // Using a regex for the assertion since time might vary based on timezone
    expect(formatDisplayTime('2023-05-15T14:30:00Z')).toMatch(/\d+:\d+ (?:AM|PM)/);
  });

  it('should return empty string for null input', () => {
    expect(formatDisplayTime(null)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDisplayTime('not a date')).toBe('');
  });
});

describe('formatDisplayDateTime', () => {
  it('should format a Date object for datetime display', () => {
    const date = new Date(2023, 4, 15, 14, 30, 0);
    expect(formatDisplayDateTime(date)).toBe('May 15, 2023 2:30 PM');
  });

  it('should format a date string for datetime display', () => {
    const result = formatDisplayDateTime('2023-05-15T14:30:00Z');
    expect(result).toMatch(/[A-Z][a-z]+ \d+, \d{4} \d+:\d+ (?:AM|PM)/);
  });

  it('should return empty string for null input', () => {
    expect(formatDisplayDateTime(null)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDisplayDateTime('not a date')).toBe('');
  });
});

describe('getDateRangeForDay', () => {
  it('should get date range for a specific day from Date object', () => {
    const date = new Date(2023, 4, 15, 14, 30, 0);
    const range = getDateRangeForDay(date);
    
    expect(range.start.getFullYear()).toBe(2023);
    expect(range.start.getMonth()).toBe(4);
    expect(range.start.getDate()).toBe(15);
    
    expect(range.end.getFullYear()).toBe(2023);
    expect(range.end.getMonth()).toBe(4);
    expect(range.end.getDate()).toBe(15);
  });

  it('should get date range for a specific day from date string', () => {
    const range = getDateRangeForDay('2023-05-15T14:30:00Z');
    
    expect(range.start.getFullYear()).toBe(2023);
    expect(range.start.getMonth()).toBe(4);
    expect(range.start.getDate()).toBe(15);
    
    expect(range.end.getFullYear()).toBe(2023);
    expect(range.end.getMonth()).toBe(4);
    expect(range.end.getDate()).toBe(15);
  });

  it('should set start time to beginning of day', () => {
    const range = getDateRangeForDay(new Date(2023, 4, 15, 14, 30, 0));
    
    expect(range.start.getHours()).toBe(0);
    expect(range.start.getMinutes()).toBe(0);
    expect(range.start.getSeconds()).toBe(0);
    expect(range.start.getMilliseconds()).toBe(0);
  });

  it('should set end time to end of day', () => {
    const range = getDateRangeForDay(new Date(2023, 4, 15, 14, 30, 0));
    
    expect(range.end.getHours()).toBe(23);
    expect(range.end.getMinutes()).toBe(59);
    expect(range.end.getSeconds()).toBe(59);
    expect(range.end.getMilliseconds()).toBe(999);
  });
});

describe('getRelativeDateLabel', () => {
  // Mock current date for consistent testing
  const RealDate = Date;
  let mockToday: Date;
  
  beforeAll(() => {
    mockToday = new Date(2023, 4, 15); // May 15, 2023
    global.Date = class extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return mockToday;
        }
        return new RealDate(...args);
      }
    } as DateConstructor;
  });
  
  afterAll(() => {
    global.Date = RealDate;
  });
  
  it('should return "Today" for current date', () => {
    const today = new Date(2023, 4, 15);
    expect(getRelativeDateLabel(today)).toBe('Today');
  });
  
  it('should return "Yesterday" for previous day', () => {
    const yesterday = new Date(2023, 4, 14);
    expect(getRelativeDateLabel(yesterday)).toBe('Yesterday');
  });
  
  it('should return formatted date for other dates', () => {
    const pastDate = new Date(2023, 4, 10);
    expect(getRelativeDateLabel(pastDate)).toBe('May 10, 2023');
    
    const futureDate = new Date(2023, 4, 20);
    expect(getRelativeDateLabel(futureDate)).toBe('May 20, 2023');
  });
});

describe('groupByDate', () => {
  const testData = [
    { id: 1, timestamp: '2023-05-15T14:30:00Z', type: 'meal' },
    { id: 2, timestamp: '2023-05-15T18:00:00Z', type: 'symptom' },
    { id: 3, timestamp: '2023-05-14T09:15:00Z', type: 'labResult' },
    { id: 4, timestamp: '2023-05-14T12:00:00Z', type: 'meal' },
    { id: 5, timestamp: '2023-05-16T10:30:00Z', type: 'symptom' }
  ];
  
  it('should group items by date property', () => {
    const result = groupByDate(testData, 'timestamp');
    
    expect(Object.keys(result)).toHaveLength(3);
    expect(result['2023-05-15']).toHaveLength(2);
    expect(result['2023-05-14']).toHaveLength(2);
    expect(result['2023-05-16']).toHaveLength(1);
    
    expect(result['2023-05-15'][0].id).toBe(1);
    expect(result['2023-05-15'][1].id).toBe(2);
  });
  
  it('should handle nested date property paths', () => {
    const nestedData = [
      { id: 1, data: { timestamp: '2023-05-15T14:30:00Z' }, type: 'meal' },
      { id: 2, data: { timestamp: '2023-05-15T18:00:00Z' }, type: 'symptom' },
      { id: 3, data: { timestamp: '2023-05-14T09:15:00Z' }, type: 'labResult' }
    ];
    
    const result = groupByDate(nestedData, 'data.timestamp');
    
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['2023-05-15']).toHaveLength(2);
    expect(result['2023-05-14']).toHaveLength(1);
  });
  
  it('should handle empty array', () => {
    const result = groupByDate([], 'timestamp');
    expect(Object.keys(result)).toHaveLength(0);
  });
  
  it('should handle missing date properties', () => {
    const invalidData = [
      { id: 1, timestamp: '2023-05-15T14:30:00Z' },
      { id: 2 }, // Missing timestamp
      { id: 3, timestamp: null },
      { id: 4, timestamp: 'invalid-date' },
      { id: 5, timestamp: '2023-05-16T10:30:00Z' }
    ];
    
    const result = groupByDate(invalidData, 'timestamp');
    
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['2023-05-15']).toHaveLength(1);
    expect(result['2023-05-16']).toHaveLength(1);
  });
});

describe('Date format constants', () => {
  it('should export correct DATE_FORMAT string', () => {
    expect(DATE_FORMAT).toBe('yyyy-MM-dd');
  });

  it('should export correct DATETIME_FORMAT string', () => {
    expect(DATETIME_FORMAT).toBe("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
  });

  it('should export correct DISPLAY_DATE_FORMAT string', () => {
    expect(DISPLAY_DATE_FORMAT).toBe('MMM d, yyyy');
  });

  it('should export correct DISPLAY_TIME_FORMAT string', () => {
    expect(DISPLAY_TIME_FORMAT).toBe('h:mm a');
  });

  it('should export correct DISPLAY_DATETIME_FORMAT string', () => {
    expect(DISPLAY_DATETIME_FORMAT).toBe('MMM d, yyyy h:mm a');
  });
});