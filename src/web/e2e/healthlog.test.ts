import { device, element, by, expect, waitFor } from 'detox'; // detox ^20.0.0
import { ensureLoggedIn } from './authentication.test';

// Global constants
const TEST_SEARCH_TERM = 'headache';

/**
 * Setup function that runs before all tests
 */
beforeAll(async () => {
  await device.launchApp();
  await ensureLoggedIn();
  await navigateToHealthLog();
});

/**
 * Setup function that runs before each test
 */
beforeEach(async () => {
  // Ensure we're on the Health Log screen
  await navigateToHealthLog();
});

/**
 * Cleanup function that runs after all tests
 */
afterAll(async () => {
  // Clean up any test data created during tests
  // Reset the app to its initial state
});

/**
 * Helper function to navigate to the Health Log screen
 */
async function navigateToHealthLog(): Promise<void> {
  const healthLogTab = element(by.id('healthLogTab'));
  await healthLogTab.tap();
  await waitFor(element(by.id('healthLogScreen')))
    .toBeVisible()
    .withTimeout(2000);
  await expect(element(by.text('Health Log'))).toBeVisible();
}

/**
 * Helper function to open the calendar view for date filtering
 */
async function openCalendarView(): Promise<void> {
  const dateFilterButton = element(by.id('dateFilterButton'));
  await dateFilterButton.tap();
  await waitFor(element(by.id('calendarView')))
    .toBeVisible()
    .withTimeout(2000);
  await expect(element(by.id('calendarView'))).toBeVisible();
}

/**
 * Helper function to select a date in the calendar view
 */
async function selectDate(date: string): Promise<void> {
  await openCalendarView();
  
  const dateElement = element(by.text(date));
  await dateElement.tap();
  
  // Calendar should close and filter should be applied
  await waitFor(element(by.id('calendarView')))
    .not.toBeVisible()
    .withTimeout(2000);
  
  // Verify the selected date is displayed in the filter
  await expect(element(by.id('selectedDateFilter'))).toHaveText(date);
}

/**
 * Helper function to search for health data
 */
async function searchHealthData(searchTerm: string): Promise<void> {
  const searchInput = element(by.id('healthLogSearchInput'));
  await searchInput.tap();
  await searchInput.typeText(searchTerm);
  
  // Tap search button on keyboard
  await element(by.traits(['button'])).atIndex(0).tap();
  
  // Wait for search results to load
  await waitFor(element(by.id('searchResultsList')))
    .toBeVisible()
    .withTimeout(3000);
  
  // Verify search results are displayed
  await expect(element(by.id('searchResultsContainer'))).toBeVisible();
}

/**
 * Helper function to clear the search input
 */
async function clearSearch(): Promise<void> {
  const clearSearchButton = element(by.id('clearSearchButton'));
  await clearSearchButton.tap();
  
  // Verify search input is empty
  await expect(element(by.id('healthLogSearchInput'))).toHaveText('');
  
  // Verify all health data items are displayed
  await expect(element(by.id('healthDataList'))).toBeVisible();
}

/**
 * Helper function to open a health data detail screen
 */
async function openHealthDataDetail(itemType: string): Promise<void> {
  // Find a health data item of specified type
  const healthDataItem = element(by.id(`healthData-${itemType}`)).atIndex(0);
  await healthDataItem.tap();
  
  // Wait for detail screen to appear
  await waitFor(element(by.id('healthDataDetailScreen')))
    .toBeVisible()
    .withTimeout(2000);
  
  // Verify detail screen shows correct data type
  await expect(element(by.text(`${itemType}`))).toBeVisible();
}

/**
 * Helper function to delete a health data item
 */
async function deleteHealthData(): Promise<void> {
  // Open a health data detail screen for any item type
  await openHealthDataDetail('meal');
  
  // Find and tap delete button
  const deleteButton = element(by.id('deleteButton'));
  await deleteButton.tap();
  
  // Wait for confirmation modal
  await waitFor(element(by.id('deleteConfirmationModal')))
    .toBeVisible()
    .withTimeout(2000);
  
  // Tap confirm button
  const confirmButton = element(by.id('confirmDeleteButton'));
  await confirmButton.tap();
  
  // Wait for deletion and navigation back to Health Log
  await waitFor(element(by.id('healthLogScreen')))
    .toBeVisible()
    .withTimeout(3000);
  
  // Verify we're back on the Health Log screen
  await expect(element(by.text('Health Log'))).toBeVisible();
}

/**
 * Helper function to refresh the Health Log screen
 */
async function refreshHealthLog(): Promise<void> {
  // Perform pull-to-refresh
  const healthDataList = element(by.id('healthDataList'));
  await healthDataList.swipe('down', 'slow', 0.5);
  
  // Wait for refresh indicator
  await waitFor(element(by.id('refreshIndicator')))
    .toBeVisible()
    .withTimeout(1000);
  
  // Wait for refresh to complete
  await waitFor(element(by.id('refreshIndicator')))
    .not.toBeVisible()
    .withTimeout(3000);
  
  // Verify health log data is refreshed
  await expect(element(by.id('healthDataList'))).toBeVisible();
}

/**
 * Helper function to verify a health data item in the list
 */
async function verifyHealthDataItem(itemType: string, expectedText: string): Promise<void> {
  // Find health data items
  const healthDataItem = element(by.id(`healthData-${itemType}`))
    .withDescendant(by.text(expectedText));
  
  // Verify item exists and contains expected text
  await expect(healthDataItem).toBeVisible();
  
  // Verify item displays correct type icon
  await expect(element(by.id(`icon-${itemType}`)).atIndex(0)).toBeVisible();
}

describe('Health Log Screen', () => {
  it('should display Health Log screen with all elements', async () => {
    await expect(element(by.text('Health Log'))).toBeVisible();
    await expect(element(by.id('healthLogSearchInput'))).toBeVisible();
    await expect(element(by.id('dateFilterButton'))).toBeVisible();
    await expect(element(by.id('healthDataList'))).toBeVisible();
  });

  it('should display health data items grouped by date', async () => {
    // Wait for health data to load
    await waitFor(element(by.id('healthDataList')))
      .toBeVisible()
      .withTimeout(3000);
    
    // Verify date section headers
    await expect(element(by.id('dateSectionHeader'))).toBeVisible();
    
    // Verify Today section appears for today's entries
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    await expect(element(by.text(`Today, ${today}`))).toBeVisible();
  });

  it('should display empty state when no health data exists', async () => {
    // This test requires a clean account or clearing all health data
    // For testing purposes, we'll check if the empty state is visible when no results are found
    
    // Enter a search term that won't match any data
    await searchHealthData('nonexistentdataitem12345');
    
    // Verify empty state message is displayed
    await expect(element(by.id('emptyStateMessage'))).toBeVisible();
    await expect(element(by.text('No health data found'))).toBeVisible();
    
    // Verify suggestion to add health data is shown
    await expect(element(by.text('Tap + to add health data'))).toBeVisible();
    
    // Clear search to restore normal state
    await clearSearch();
  });
});

describe('Date Filtering', () => {
  it('should open calendar view when date filter is tapped', async () => {
    await openCalendarView();
    
    // Verify current month is shown by default
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await expect(element(by.text(currentMonth))).toBeVisible();
  });

  it('should filter health data by selected date', async () => {
    // Select a specific date - using "15" as an example day
    await selectDate('15');
    
    // Verify date filter shows selected date
    await expect(element(by.id('selectedDateFilter'))).toBeVisible();
    
    // Verify only health data from selected date is displayed
    // This assumes there is data for the 15th - in a real test we would ensure this
    const dateHeader = element(by.id('dateSectionHeader')).atIndex(0);
    await expect(dateHeader).toHaveText(expect.stringContaining('15'));
  });

  it('should navigate between months in calendar view', async () => {
    await openCalendarView();
    
    // Get current month
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await expect(element(by.text(currentMonth))).toBeVisible();
    
    // Tap next month button
    await element(by.id('nextMonthButton')).tap();
    
    // Verify next month is displayed
    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await expect(element(by.text(nextMonth))).toBeVisible();
    
    // Tap previous month button twice to go back to previous month
    await element(by.id('previousMonthButton')).tap();
    await element(by.id('previousMonthButton')).tap();
    
    // Verify previous month is displayed
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    await expect(element(by.text(prevMonth))).toBeVisible();
    
    // Close calendar
    await element(by.id('closeCalendarButton')).tap();
  });

  it('should clear date filter when reset button is tapped', async () => {
    // Select a date filter first
    await selectDate('15');
    
    // Verify date filter is applied
    await expect(element(by.id('selectedDateFilter'))).toBeVisible();
    
    // Tap reset filter button
    await element(by.id('resetFilterButton')).tap();
    
    // Verify date filter is cleared
    await expect(element(by.id('selectedDateFilter'))).not.toBeVisible();
    
    // Verify all health data items are displayed
    await expect(element(by.id('healthDataList'))).toBeVisible();
  });
});

describe('Search Functionality', () => {
  it('should search health data by term', async () => {
    await searchHealthData(TEST_SEARCH_TERM);
    
    // Verify only matching health data items are displayed
    await expect(element(by.text(TEST_SEARCH_TERM))).toBeVisible();
    
    // Verify search results highlight the search term
    await expect(element(by.id('highlightedText'))).toBeVisible();
  });

  it('should show empty state for no search results', async () => {
    // Enter a search term that won't match any data
    await searchHealthData('nonexistentdataitem12345');
    
    // Verify no results message is displayed
    await expect(element(by.text('No results found'))).toBeVisible();
    
    // Verify option to clear search is shown
    await expect(element(by.id('clearSearchButton'))).toBeVisible();
  });

  it('should clear search when clear button is tapped', async () => {
    // Perform a search first
    await searchHealthData(TEST_SEARCH_TERM);
    
    // Clear search
    await clearSearch();
    
    // Verify all health data items are displayed again
    await expect(element(by.id('healthDataList'))).toBeVisible();
  });

  it('should combine search with date filter', async () => {
    // Select a date filter
    await selectDate('15');
    
    // Perform a search
    await searchHealthData(TEST_SEARCH_TERM);
    
    // Verify results match both date and search criteria
    // Note: This assumes there is matching data. In a real test environment,
    // we would need to ensure test data exists for this specific case.
    await expect(element(by.text(TEST_SEARCH_TERM))).toBeVisible();
    
    // Clear search and verify date filter still applies
    await clearSearch();
    await expect(element(by.id('selectedDateFilter'))).toBeVisible();
    
    // Clear date filter and verify search is gone too (since we cleared it)
    await element(by.id('resetFilterButton')).tap();
    await expect(element(by.id('selectedDateFilter'))).not.toBeVisible();
  });
});

describe('Health Data Detail', () => {
  it('should navigate to meal detail screen when meal item is tapped', async () => {
    await openHealthDataDetail('meal');
    
    // Verify meal detail screen is displayed
    await expect(element(by.id('mealDetailScreen'))).toBeVisible();
    
    // Verify meal image is shown
    await expect(element(by.id('mealImage'))).toBeVisible();
    
    // Verify meal description and metadata are displayed
    await expect(element(by.id('mealDescription'))).toBeVisible();
    await expect(element(by.id('mealMetadata'))).toBeVisible();
    
    // Navigate back
    await element(by.id('backButton')).tap();
  });

  it('should navigate to lab result detail screen when lab result item is tapped', async () => {
    await openHealthDataDetail('labResult');
    
    // Verify lab result detail screen is displayed
    await expect(element(by.id('labResultDetailScreen'))).toBeVisible();
    
    // Verify lab result image is shown
    await expect(element(by.id('labResultImage'))).toBeVisible();
    
    // Verify test type, date, and notes are displayed
    await expect(element(by.id('testType'))).toBeVisible();
    await expect(element(by.id('testDate'))).toBeVisible();
    await expect(element(by.id('testNotes'))).toBeVisible();
    
    // Navigate back
    await element(by.id('backButton')).tap();
  });

  it('should navigate to symptom detail screen when symptom item is tapped', async () => {
    await openHealthDataDetail('symptom');
    
    // Verify symptom detail screen is displayed
    await expect(element(by.id('symptomDetailScreen'))).toBeVisible();
    
    // Verify symptom description is shown
    await expect(element(by.id('symptomDescription'))).toBeVisible();
    
    // Verify severity and timestamp are displayed
    await expect(element(by.id('symptomSeverity'))).toBeVisible();
    await expect(element(by.id('symptomTimestamp'))).toBeVisible();
    
    // Navigate back
    await element(by.id('backButton')).tap();
  });

  it('should navigate back to Health Log when back button is tapped', async () => {
    // Open any health data detail
    await openHealthDataDetail('meal');
    
    // Tap back button
    await element(by.id('backButton')).tap();
    
    // Verify navigation back to Health Log screen
    await expect(element(by.id('healthLogScreen'))).toBeVisible();
    await expect(element(by.text('Health Log'))).toBeVisible();
  });
});

describe('Health Data Management', () => {
  it('should delete health data item when delete is confirmed', async () => {
    // Get count of health data items before deletion
    const healthDataItemsBefore = await element(by.id('healthDataItem')).getAttributes();
    const countBefore = healthDataItemsBefore.length;
    
    // Delete a health data item
    await deleteHealthData();
    
    // Get count after deletion
    const healthDataItemsAfter = await element(by.id('healthDataItem')).getAttributes();
    const countAfter = healthDataItemsAfter.length;
    
    // Verify item was deleted
    expect(countAfter).toBeLessThan(countBefore);
  });

  it('should cancel deletion when cancel is tapped', async () => {
    // Open a health data detail screen
    await openHealthDataDetail('meal');
    
    // Tap delete button
    await element(by.id('deleteButton')).tap();
    
    // Wait for confirmation modal
    await waitFor(element(by.id('deleteConfirmationModal')))
      .toBeVisible()
      .withTimeout(2000);
    
    // Tap cancel button
    await element(by.id('cancelDeleteButton')).tap();
    
    // Verify modal is dismissed
    await expect(element(by.id('deleteConfirmationModal'))).not.toBeVisible();
    
    // Verify still on detail screen
    await expect(element(by.id('healthDataDetailScreen'))).toBeVisible();
    
    // Navigate back
    await element(by.id('backButton')).tap();
  });

  it('should navigate to chat when Ask AI button is tapped', async () => {
    // Open a health data detail screen
    await openHealthDataDetail('meal');
    
    // Tap Ask AI button
    await element(by.id('askAiButton')).tap();
    
    // Verify navigation to Chat screen
    await expect(element(by.id('chatScreen'))).toBeVisible();
    
    // Verify message about health data is sent to AI
    await expect(element(by.id('userMessage'))).toBeVisible();
    
    // Navigate back to Health Log
    await navigateToHealthLog();
  });

  it('should refresh health data when pull-to-refresh is performed', async () => {
    await refreshHealthLog();
    
    // Verification of refresh is implicit in the refreshHealthLog function
    // Additional verification could be added here if needed
  });
});

describe('Pagination and Loading', () => {
  it('should show loading indicator when Health Log is first loaded', async () => {
    // Reload the app to see initial loading state
    await device.reloadReactNative();
    await navigateToHealthLog();
    
    // Verify loading indicator is displayed
    await expect(element(by.id('loadingIndicator'))).toBeVisible();
    
    // Wait for data to load
    await waitFor(element(by.id('loadingIndicator')))
      .not.toBeVisible()
      .withTimeout(5000);
    
    // Verify data is loaded
    await expect(element(by.id('healthDataList'))).toBeVisible();
  });

  it('should load more items when scrolled to bottom', async () => {
    // Count visible items before scrolling
    const initialItems = await element(by.id('healthDataItem')).getAttributes();
    const initialCount = initialItems.length;
    
    // Scroll to bottom
    await element(by.id('healthDataList')).scrollTo('bottom');
    
    // Verify loading indicator appears at bottom
    await expect(element(by.id('paginationLoadingIndicator'))).toBeVisible();
    
    // Wait for additional items to load
    await waitFor(element(by.id('paginationLoadingIndicator')))
      .not.toBeVisible()
      .withTimeout(5000);
    
    // Count items after loading more
    const updatedItems = await element(by.id('healthDataItem')).getAttributes();
    const updatedCount = updatedItems.length;
    
    // Verify more items were loaded
    expect(updatedCount).toBeGreaterThan(initialCount);
  });

  it('should show loading indicator during search', async () => {
    // Tap search field
    await element(by.id('healthLogSearchInput')).tap();
    
    // Type search term
    await element(by.id('healthLogSearchInput')).typeText(TEST_SEARCH_TERM);
    
    // Submit search
    await element(by.traits(['button'])).atIndex(0).tap();
    
    // Verify loading indicator is displayed
    await expect(element(by.id('searchLoadingIndicator'))).toBeVisible();
    
    // Wait for results to load
    await waitFor(element(by.id('searchLoadingIndicator')))
      .not.toBeVisible()
      .withTimeout(5000);
    
    // Verify results are loaded
    await expect(element(by.id('searchResultsList'))).toBeVisible();
    
    // Clear search
    await clearSearch();
  });

  it('should handle network errors gracefully', async () => {
    // Put device in airplane mode
    // Note: This is a placeholder as actual implementation depends on testing environment
    try {
      // This API may not be available in all Detox environments
      // await device.setStatusBar({ network: 'airplane' });
    } catch (error) {
      console.log('Unable to set airplane mode, continuing test with simulation');
    }
    
    // Try to refresh data
    await refreshHealthLog();
    
    // Verify network error message is displayed
    await expect(element(by.text('Network error'))).toBeVisible();
    
    // Verify retry button is shown
    await expect(element(by.id('retryButton'))).toBeVisible();
    
    // Turn off airplane mode
    try {
      // await device.setStatusBar({ network: 'wifi' });
    } catch (error) {
      console.log('Unable to reset network mode, continuing test with simulation');
    }
    
    // Tap retry button
    await element(by.id('retryButton')).tap();
    
    // Verify data loads successfully
    await expect(element(by.id('healthDataList'))).toBeVisible();
  });
});