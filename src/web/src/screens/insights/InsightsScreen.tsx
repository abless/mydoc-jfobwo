import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'; // ^0.71.0
import { Header } from '../../components/common';
import Card from '../../components/cards/Card';
import { MainTabScreenProps } from '../../types/navigation.types';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A placeholder screen for future health insights functionality.
 * This screen displays a simple message explaining that health insights
 * analysis will be available in a future update.
 * 
 * @param props - The navigation props from main tab navigator
 * @returns Rendered InsightsScreen component
 */
const InsightsScreen = ({ navigation }: MainTabScreenProps<'Insights'>): JSX.Element => {
  // Get the current theme values
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: theme.colors.BACKGROUND 
    }}>
      {/* Header with screen title */}
      <Header title="Insights" />
      
      {/* Main content container */}
      <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND }]}>
        <Card 
          style={styles.card} 
          elevation="medium"
        >
          {/* Graph icon placeholder */}
          <View style={[
            styles.graphIcon, 
            { backgroundColor: `${theme.colors.PRIMARY}15` }
          ]}>
            <Text style={[
              styles.graphIconText, 
              { color: theme.colors.PRIMARY }
            ]}>
              📊
            </Text>
          </View>
          
          {/* Coming soon title */}
          <Text style={[
            styles.title, 
            { 
              color: theme.colors.TEXT,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.xl
            }
          ]}
          accessibilityRole="header">
            Coming Soon: Health Insights
          </Text>
          
          {/* Description text */}
          <Text style={[
            styles.description, 
            { 
              color: theme.colors.TEXT,
              fontSize: theme.typography.fontSize.m 
            }
          ]}>
            We're working on analyzing your health data to provide personalized insights.
            Check back soon!
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
  },
  graphIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  graphIconText: {
    fontSize: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    lineHeight: 24,
  }
});

export default InsightsScreen;