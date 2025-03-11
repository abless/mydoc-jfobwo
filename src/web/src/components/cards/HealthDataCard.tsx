import React from 'react'; // ^18.2.0
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native'; // ^0.71.0
import { HealthDataCardProps } from '../../types/components.types';
import { HealthDataType } from '../../types/health.types';
import Card from './Card';
import { useTheme } from '../../contexts/ThemeContext';
import { formatHealthDataTitle, formatDescription, formatHealthDataTimestamp } from '../../utils/format.utils';

/**
 * Extracts the appropriate image URL from a health data item based on its type
 * @param item Health data item
 * @returns The image URL to display for the health data item, if available
 */
const getImageUrl = (item: HealthDataResponse): string | undefined => {
  if (!item || !item.data) {
    return undefined;
  }

  switch (item.type) {
    case HealthDataType.MEAL:
      return (item.data as any).imageUrl;
    case HealthDataType.LAB_RESULT:
      return (item.data as any).imageUrl;
    case HealthDataType.SYMPTOM:
      // Symptoms don't typically have images
      return undefined;
    default:
      return undefined;
  }
};

/**
 * A card component that displays health data items (meals, lab results, symptoms)
 * with title, timestamp, description, and an optional image thumbnail.
 * Used in the Health Log screen to display health entries in a list format.
 * 
 * @param props Component props including the health data item, onPress handler, and style
 * @returns Rendered HealthDataCard component
 */
const HealthDataCard = ({ item, onPress, style }: HealthDataCardProps): JSX.Element => {
  const { theme } = useTheme();
  const { id, type, timestamp, data } = item;

  // Format the data for display
  const title = formatHealthDataTitle(type, data);
  const description = (data as any).description ? formatDescription((data as any).description) : '';
  const formattedTimestamp = formatHealthDataTimestamp(timestamp);
  const imageUrl = getImageUrl(item);

  // Create accessibility label for screen readers
  const accessibilityLabel = `${title}, ${formattedTimestamp}${description ? `, ${description}` : ''}`;

  return (
    <Card 
      style={[{ margin: theme.spacing.xs }, style]} 
      onPress={() => onPress(id)}
      elevation="small"
    >
      <View 
        style={[styles.contentContainer, { padding: theme.spacing.s }]}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <View style={[styles.textContainer, { paddingRight: theme.spacing.s }]}>
          <Text 
            style={[
              styles.title, 
              { 
                color: theme.colors.TEXT,
                fontFamily: theme.typography.fontFamily.semiBold,
                fontSize: theme.typography.fontSize.m,
                marginBottom: theme.spacing.xs
              }
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text 
            style={[
              styles.timestamp, 
              { 
                color: theme.colors.DISABLED,
                fontFamily: theme.typography.fontFamily.regular,
                fontSize: theme.typography.fontSize.xs,
                marginBottom: theme.spacing.xs
              }
            ]}
            numberOfLines={1}
          >
            {formattedTimestamp}
          </Text>
          {description ? (
            <Text 
              style={[
                styles.description, 
                { 
                  color: theme.colors.TEXT,
                  fontFamily: theme.typography.fontFamily.regular,
                  fontSize: theme.typography.fontSize.s
                }
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}
        </View>
        
        {imageUrl ? (
          <View style={[styles.imageContainer, { marginLeft: theme.spacing.s }]}>
            <Image 
              source={{ uri: imageUrl }} 
              style={[
                styles.thumbnail,
                { borderRadius: theme.borderRadius.small }
              ]}
              accessibilityLabel={`${title} image`}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {},
  timestamp: {},
  description: {},
  imageContainer: {},
  thumbnail: {
    width: 60,
    height: 60,
  },
});

export default HealthDataCard;