import React, { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native'; // ^0.71.0
import { useNavigation } from '@react-navigation/native'; // ^6.0.0
import { StackNavigationProp } from '@react-navigation/stack'; // ^6.0.0

// Custom hooks and type definitions
import { HealthDataResponse, HealthDataType } from '../../types/health.types';
import { useHealthData } from '../../hooks/useHealthData';

// UI Components
import HealthItemList from '../../components/health/HealthItemList';
import CalendarView from '../../components/health/CalendarView';
import SearchBar from '../../components/common/SearchBar';
import Header from '../../components/common/Header';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorMessage from '../../components/common/ErrorMessage';

// Services, utilities and constants
import NavigationService from '../../navigation/NavigationService';
import { formatAPIDate } from '../../utils/date.utils';
import { HEALTH_ROUTES } from '../../constants/navigation';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Screen component that displays the user's health data history with filtering and search capabilities.
 * Users can filter data by date using a calendar view and search for specific entries.
 * The screen supports pagination, pull-to-refresh, and displays appropriate loading and error states.
 */
const HealthLogScreen = (): JSX.Element => {
  // Get theme for consistent styling
  const { theme } = useTheme();

  // State for date selection, search, and UI states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dateFiltered, setDateFiltered] = useState<boolean>(false);

  // Get health data and related functions from custom hook
  const {
    healthData,
    isLoading,
    error,
    totalItems,
    currentPage,
    fetchHealthData,
    fetchHealthDataByDate,
    searchHealthDataItems
  } = useHealthData();

  // Get navigation object
  const navigation = useNavigation<StackNavigationProp<any>>();

  // Fetch health data on component mount
  useEffect(() => {
    fetchHealthData({ page: 1, limit: 20 });
  }, [fetchHealthData]);

  /**
   * Handles date selection from calendar view
   * Fetches health data for the selected date
   */
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    setDateFiltered(true);
    setSearchQuery('');
    
    // Format the date to API format (YYYY-MM-DD)
    const formattedDate = formatAPIDate(date);
    fetchHealthDataByDate(formattedDate);
  }, [fetchHealthDataByDate]);

  /**
   * Handles search input
   * Searches health data with the provided query
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setDateFiltered(false);
    
    if (query.trim()) {
      searchHealthDataItems(query.trim());
    } else {
      // If search query is cleared, reset to unfiltered data
      fetchHealthData({ page: 1, limit: 20 });
    }
  }, [searchHealthDataItems, fetchHealthData]);

  /**
   * Handles item press
   * Navigates to health data detail screen with the selected item ID
   */
  const handleItemPress = useCallback((id: string) => {
    NavigationService.navigateToHealthDataDetail(id);
  }, []);

  /**
   * Handles refresh action (pull-to-refresh)
   * Reloads health data based on current filters
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      if (searchQuery.trim()) {
        await searchHealthDataItems(searchQuery.trim());
      } else if (dateFiltered) {
        const formattedDate = formatAPIDate(selectedDate);
        await fetchHealthDataByDate(formattedDate);
      } else {
        await fetchHealthData({ page: 1, limit: 20 });
      }
    } catch (error) {
      console.error('Error refreshing health data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, dateFiltered, selectedDate, searchHealthDataItems, fetchHealthDataByDate, fetchHealthData]);

  /**
   * Handles loading more data when reaching the end of the list
   * Implements pagination by fetching the next page of data
   */
  const handleLoadMore = useCallback(() => {
    // Only load more if not already loading and there are more items to load
    if (!isLoading && healthData.length < totalItems) {
      const nextPage = currentPage + 1;
      
      if (searchQuery.trim()) {
        searchHealthDataItems(searchQuery.trim(), undefined, nextPage);
      } else if (dateFiltered) {
        const formattedDate = formatAPIDate(selectedDate);
        fetchHealthDataByDate(formattedDate, undefined, nextPage);
      } else {
        fetchHealthData({ page: nextPage, limit: 20 });
      }
    }
  }, [
    isLoading, 
    healthData.length, 
    totalItems, 
    currentPage, 
    searchQuery, 
    dateFiltered, 
    selectedDate, 
    searchHealthDataItems, 
    fetchHealthDataByDate, 
    fetchHealthData
  ]);

  /**
   * Toggles the visibility of the calendar view
   */
  const toggleCalendar = useCallback(() => {
    setShowCalendar(prevState => !prevState);
  }, []);

  /**
   * Clears date filter and resets to all health data
   */
  const clearDateFilter = useCallback(() => {
    setDateFiltered(false);
    setSearchQuery('');
    fetchHealthData({ page: 1, limit: 20 });
  }, [fetchHealthData]);

  /**
   * Creates a calendar icon for the header
   */
  const CalendarIcon = useCallback(() => (
    <TouchableOpacity 
      onPress={toggleCalendar}
      accessibilityLabel="Toggle calendar view"
      accessibilityRole="button"
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
    >
      <Text style={{ fontSize: 20 }}>📅</Text>
    </TouchableOpacity>
  ), [toggleCalendar]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.BACKGROUND }]}>
      <Header 
        title="Health Log" 
        rightIcon={<CalendarIcon />}
        onRightPress={toggleCalendar}
      />
      
      <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND }]}>
        {/* Search bar */}
        <SearchBar 
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmit={() => searchQuery.trim() && searchHealthDataItems(searchQuery.trim())}
          placeholder="Search health data..."
          style={[styles.searchBar, { backgroundColor: theme.colors.CARD }]}
        />

        {/* Date filter indicator when active */}
        {dateFiltered && (
          <View style={[styles.filterIndicator, { backgroundColor: theme.colors.PRIMARY + '20' }]}>
            <Text style={[styles.filterText, { color: theme.colors.TEXT }]}>
              Showing data for: {formatAPIDate(selectedDate)}
            </Text>
            <TouchableOpacity 
              onPress={clearDateFilter}
              accessibilityLabel="Clear date filter"
              accessibilityRole="button"
              style={styles.clearButton}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.PRIMARY }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Calendar view */}
        {showCalendar && (
          <CalendarView 
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            style={styles.calendar}
          />
        )}
        
        {/* Error handling */}
        {error ? (
          <ErrorMessage 
            message={`Error loading health data: ${error}`} 
            onRetry={handleRefresh}
            style={styles.errorContainer}
          />
        ) : (
          <>
            {/* Show loading indicator when initially loading */}
            {isLoading && healthData.length === 0 ? (
              <View style={styles.centerContainer}>
                <LoadingIndicator size="large" />
              </View>
            ) : (
              /* Health data list */
              <HealthItemList 
                items={healthData}
                onItemPress={handleItemPress}
                loading={isLoading && !refreshing}
                onEndReached={handleLoadMore}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                style={styles.list}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 8,
    marginHorizontal: 0,
  },
  calendar: {
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: 20,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HealthLogScreen;