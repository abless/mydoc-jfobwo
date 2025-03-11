import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars'; // v1.1294.0
import { CalendarViewProps } from '../../types/components.types';
import { formatDate, DATE_FORMAT } from '../../utils/date.utils';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A reusable calendar component for the Health Advisor mobile application
 * that displays a monthly calendar view with date selection functionality
 * and marked dates for health data entries.
 * 
 * @param selectedDate - Currently selected date
 * @param onDateSelect - Function called when a date is selected
 * @param markedDates - Object mapping date strings to marker data for dates with health entries
 * @param style - Additional styles for the calendar container
 * @returns Rendered CalendarView component
 */
const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateSelect,
  markedDates = {},
  style,
}) => {
  const { theme } = useTheme();
  
  // Format the selected date to match the calendar's expected format (YYYY-MM-DD)
  const formattedSelectedDate = formatDate(selectedDate, DATE_FORMAT);

  // Create theme object for the calendar component based on the application theme
  const calendarTheme = useMemo(() => ({
    backgroundColor: 'transparent',
    calendarBackground: theme.colors.CARD,
    textSectionTitleColor: theme.colors.TEXT,
    selectedDayBackgroundColor: theme.colors.PRIMARY,
    selectedDayTextColor: theme.colors.WHITE,
    todayTextColor: theme.colors.ACCENT,
    dayTextColor: theme.colors.TEXT,
    textDisabledColor: theme.colors.DISABLED,
    dotColor: theme.colors.PRIMARY,
    selectedDotColor: theme.colors.WHITE,
    arrowColor: theme.colors.PRIMARY,
    monthTextColor: theme.colors.TEXT,
    indicatorColor: theme.colors.PRIMARY,
    textDayFontFamily: theme.typography.fontFamily.regular,
    textMonthFontFamily: theme.typography.fontFamily.bold,
    textDayHeaderFontFamily: theme.typography.fontFamily.medium,
    textDayFontSize: theme.typography.fontSize.s,
    textMonthFontSize: theme.typography.fontSize.m,
    textDayHeaderFontSize: theme.typography.fontSize.s,
  }), [theme]);

  // Combine provided markedDates with the selected date to ensure it's highlighted
  const markedDatesWithSelection = useMemo(() => {
    const result = { ...markedDates };
    
    // Add or update the selected date entry
    result[formattedSelectedDate] = {
      ...(markedDates[formattedSelectedDate] || {}),
      selected: true,
      marked: markedDates[formattedSelectedDate]?.marked || false,
      dotColor: markedDates[formattedSelectedDate]?.dotColor || theme.colors.PRIMARY,
    };
    
    return result;
  }, [formattedSelectedDate, markedDates, theme.colors.PRIMARY]);

  // Handle date selection from the calendar
  const handleDateSelect = useCallback((day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    onDateSelect(selectedDate);
  }, [onDateSelect]);

  // Compute container styles based on theme and passed style prop
  const containerStyle = useMemo(() => [
    styles.container, 
    { 
      backgroundColor: theme.colors.CARD,
      borderRadius: theme.borderRadius.medium,
      ...theme.elevation.small,
      marginVertical: theme.spacing.s,
    },
    style
  ], [theme, style]);

  return (
    <View style={containerStyle}>
      <Calendar
        current={formattedSelectedDate}
        markedDates={markedDatesWithSelection}
        onDayPress={handleDateSelect}
        theme={calendarTheme}
        enableSwipeMonths={true}
        hideExtraDays={false}
        firstDay={0} // Sunday as first day
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default CalendarView;