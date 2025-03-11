import React, { useState, useEffect } from 'react'; // ^18.2.0
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal,
  useColorScheme
} from 'react-native'; // ^0.71.0
import { Calendar } from 'react-native-calendars'; // ^1.1294.0

import { DatePickerProps } from '../../types/components.types';
import { 
  formatDate, 
  parseDate, 
  DISPLAY_DATE_FORMAT 
} from '../../utils/date.utils';
import { spacing, borderRadius } from '../../theme';

/**
 * A reusable date picker component that allows users to select dates
 * in the Health Advisor application. It provides a user-friendly interface
 * for date selection with customizable formatting and validation,
 * primarily used for filtering health data by date.
 */
const DatePicker = ({ 
  selectedDate, 
  onDateChange, 
  format = DISPLAY_DATE_FORMAT,
  minDate,
  maxDate,
  style 
}: DatePickerProps): JSX.Element => {
  // State for modal visibility
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  
  // State for displayed date string
  const [displayDate, setDisplayDate] = useState<string>('');
  
  // Get current color scheme for theme-aware rendering
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Update display date when selectedDate changes
  useEffect(() => {
    setDisplayDate(formatDate(selectedDate, format));
  }, [selectedDate, format]);
  
  // Handle opening the date picker modal
  const handleOpenDatePicker = () => {
    setModalVisible(true);
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (date: { dateString: string }) => {
    const newDate = parseDate(date.dateString, 'yyyy-MM-dd');
    onDateChange(newDate);
    setModalVisible(false);
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  // Format selected date for calendar marking
  const markedDates = selectedDate ? {
    [formatDate(selectedDate, 'yyyy-MM-dd')]: {
      selected: true,
      selectedColor: isDarkMode ? '#4A6FA5' : '#4A90E2',
    }
  } : {};
  
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.dateInput,
          isDarkMode ? styles.dateInputDark : styles.dateInputLight,
        ]}
        onPress={handleOpenDatePicker}
        activeOpacity={0.7}
        accessibilityLabel="Select date"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.dateText,
            isDarkMode ? styles.dateTextDark : styles.dateTextLight,
          ]}
        >
          {displayDate}
        </Text>
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              isDarkMode ? styles.modalContentDark : styles.modalContentLight,
            ]}
          >
            <View style={styles.calendarHeader}>
              <Text
                style={[
                  styles.headerText,
                  isDarkMode ? styles.dateTextDark : styles.dateTextLight,
                ]}
              >
                Select Date
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
                accessibilityLabel="Close date picker"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    isDarkMode ? styles.dateTextDark : styles.dateTextLight,
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            
            <Calendar
              current={formatDate(selectedDate, 'yyyy-MM-dd')}
              minDate={minDate ? formatDate(minDate, 'yyyy-MM-dd') : undefined}
              maxDate={maxDate ? formatDate(maxDate, 'yyyy-MM-dd') : undefined}
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              theme={{
                backgroundColor: isDarkMode ? '#1A202C' : '#FFFFFF',
                calendarBackground: isDarkMode ? '#1A202C' : '#FFFFFF',
                textSectionTitleColor: isDarkMode ? '#E2E8F0' : '#333333',
                selectedDayBackgroundColor: isDarkMode ? '#4A6FA5' : '#4A90E2',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: isDarkMode ? '#63B3ED' : '#4A90E2',
                dayTextColor: isDarkMode ? '#E2E8F0' : '#333333',
                textDisabledColor: isDarkMode ? '#718096' : '#A0AEC0',
                arrowColor: isDarkMode ? '#4A6FA5' : '#4A90E2',
                monthTextColor: isDarkMode ? '#E2E8F0' : '#333333',
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dateInput: {
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
  },
  dateInputLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  dateInputDark: {
    backgroundColor: '#2D3748',
    borderColor: '#4A5568',
  },
  dateText: {
    fontSize: 16,
  },
  dateTextLight: {
    color: '#333333',
  },
  dateTextDark: {
    color: '#E2E8F0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
  },
  modalContentDark: {
    backgroundColor: '#1A202C',
    shadowColor: '#000000',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.s,
  },
  closeButtonText: {
    fontSize: 16,
  },
});

export default DatePicker;