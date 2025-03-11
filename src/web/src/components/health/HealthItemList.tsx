import React from 'react'; // ^18.2.0
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'; // ^0.71.0
import { HealthItemListProps } from '../../types/components.types';
import { HealthDataResponse } from '../../types/health.types';
import HealthDataCard from '../cards/HealthDataCard';
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorMessage from '../common/ErrorMessage';
import { getRelativeDateLabel, groupByDate } from '../../utils/date.utils';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Renders a section header with the date for grouped health data items
 * @param date Date string to display
 * @returns Rendered section header component
 */
const renderSectionHeader = (date: string): JSX.Element => {
  const { theme } = useTheme();
  const dateLabel = getRelativeDateLabel(new Date(date));
  
  return (
    <View 
      style={[
        styles.sectionHeader, 
        { 
          backgroundColor: theme.colors.BACKGROUND,
          paddingVertical: theme.spacing.s,
          paddingHorizontal: theme.spacing.m 
        }
      ]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`Health data for ${dateLabel}`}
    >
      <Text 
        style={[
          styles.sectionHeaderText, 
          { 
            color: theme.colors.TEXT,
            fontFamily: theme.typography.fontFamily.semiBold,
            fontSize: theme.typography.fontSize.m
          }
        ]}
      >
        {dateLabel}
      </Text>
    </View>
  );
};

/**
 * Renders an individual health data item using HealthDataCard
 * @param renderItemProps Object containing the item data
 * @returns Rendered HealthDataCard component
 */
const renderItem = ({ item, onItemPress }: { 
  item: HealthDataResponse,
  onItemPress: (id: string) => void
}): JSX.Element => {
  return (
    <HealthDataCard 
      item={item} 
      onPress={onItemPress} 
      style={styles.card}
    />
  );
};

/**
 * Renders an empty state message when no health data items are available
 * @returns Rendered empty state component
 */
const renderListEmpty = (): JSX.Element => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        styles.emptyContainer, 
        { 
          padding: theme.spacing.xl,
          marginTop: theme.spacing.xl 
        }
      ]}
      accessible={true}
      accessibilityLabel="No health data available"
    >
      <Text 
        style={[
          styles.emptyText, 
          { 
            color: theme.colors.DISABLED,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m
          }
        ]}
      >
        No health data available. Tap the + button to add your first health entry.
      </Text>
    </View>
  );
};

/**
 * Renders a loading indicator at the bottom of the list when loading more items
 * @returns Loading indicator or null if not loading
 */
const renderFooter = (loading: boolean): JSX.Element | null => {
  if (!loading) return null;
  
  return (
    <View style={styles.footerContainer}>
      <LoadingIndicator size="small" />
    </View>
  );
};

/**
 * A component that displays a list of health data items with support for
 * loading states, error handling, pull-to-refresh, and infinite scrolling.
 * 
 * @param props Component props including items, callbacks, and styling
 * @returns Rendered HealthItemList component
 */
const HealthItemList: React.FC<HealthItemListProps> = ({
  items,
  onItemPress,
  loading = false,
  onEndReached,
  refreshing = false,
  onRefresh,
  style,
}) => {
  const { theme } = useTheme();
  
  // Group items by date for section headers
  const groupedItems = React.useMemo(() => {
    return groupByDate(items, 'timestamp');
  }, [items]);
  
  // Convert the grouped object into an array for FlatList rendering
  const sections = React.useMemo(() => {
    return Object.entries(groupedItems)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, dateItems]) => ({ date, items: dateItems }));
  }, [groupedItems]);
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.BACKGROUND },
        style
      ]}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Health data list"
    >
      <FlatList
        data={sections}
        keyExtractor={section => section.date}
        renderItem={({ item: section }) => (
          <View>
            {renderSectionHeader(section.date)}
            {section.items.map(item => (
              <View key={item.id}>
                {renderItem({ item, onItemPress })}
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={!loading && items.length === 0 ? renderListEmpty : null}
        ListFooterComponent={() => renderFooter(loading)}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionHeaderText: {
    fontWeight: '600',
  },
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default HealthItemList;