import React, { useState, useCallback } from 'react'; // react v18.2.0
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // ^6.x
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native'; // react-native v0.71.0

// Internal imports for screen components
import ChatScreen from '../screens/chat/ChatScreen';
import HealthLogScreen from '../screens/health/HealthLogScreen';
import InsightsScreen from '../screens/insights/InsightsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Internal imports for data entry options and navigation types
import DataEntryOptions from '../components/datainput/DataEntryOptions';
import { MainTabParamList } from '../types/navigation.types';

// Internal imports for navigation constants
import { MAIN_TAB_ROUTES } from '../constants/navigation';

// Internal imports for navigation service
import NavigationService from './NavigationService';

// Internal imports for icons
import ChatIcon from '../assets/icons/chat';
import HealthIcon from '../assets/icons/health';
import InsightsIcon from '../assets/icons/insights';
import ProfileIcon from '../assets/icons/profile';

// Internal imports for theme context
import { useTheme } from '../contexts/ThemeContext';

// Create a bottom tab navigator
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main navigation component that implements a bottom tab navigator for the main sections of the app
 * @returns Bottom tab navigator component
 */
const MainNavigator = (): JSX.Element => {
  // Initialize state for data entry options visibility
  const [showDataEntryOptions, setShowDataEntryOptions] = useState<boolean>(false);

  // Get current theme using useTheme hook
  const { theme } = useTheme();

  /**
   * Handles the press event for the Data Entry tab, showing the data entry options
   */
  const handleDataEntryPress = useCallback(() => {
    setShowDataEntryOptions(true);
  }, []);

  /**
   * Handles closing the data entry options modal
   */
  const handleCloseDataEntryOptions = useCallback(() => {
    setShowDataEntryOptions(false);
  }, []);

  /**
   * Handles navigation to the meal entry screen
   */
  const handleSelectMeal = useCallback(() => {
    NavigationService.navigateToMealEntry();
    setShowDataEntryOptions(false);
  }, []);

  /**
   * Handles navigation to the lab result entry screen
   */
  const handleSelectLabResult = useCallback(() => {
    NavigationService.navigateToLabResultEntry();
    setShowDataEntryOptions(false);
  }, []);

  /**
   * Handles navigation to the symptom entry screen
   */
  const handleSelectSymptom = useCallback(() => {
    NavigationService.navigateToSymptomEntry();
    setShowDataEntryOptions(false);
  }, []);

  /**
   * Custom button component for the data entry tab in the bottom navigation
   * @param props 
   * @returns Custom tab button component
   */
  const CustomTabButton = ({ ...props }: any) => {
    const { onPress } = props;
    const { theme } = useTheme();

    return (
      <TouchableOpacity
        style={{
          top: -22.5,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onPress}
        accessible={true}
        accessibilityLabel="Add health data"
        accessibilityRole="button"
      >
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.colors.PRIMARY,
          justifyContent: 'center',
          alignItems: 'center',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            },
            android: {
              elevation: 5,
            },
          }),
        }}>
          <Text style={{ fontSize: 30, color: 'white' }}>+</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === MAIN_TAB_ROUTES.CHAT) {
              return <ChatIcon size={size} color={color} />;
            } else if (route.name === MAIN_TAB_ROUTES.HEALTH_LOG) {
              return <HealthIcon size={size} color={color} />;
            } else if (route.name === MAIN_TAB_ROUTES.INSIGHTS) {
              return <InsightsIcon size={size} color={color} />;
            } else if (route.name === MAIN_TAB_ROUTES.PROFILE) {
              return <ProfileIcon size={size} color={color} />;
            }
            return null;
          },
          tabBarInactiveTintColor: theme.colors.DISABLED,
          tabBarActiveTintColor: theme.colors.PRIMARY,
          tabBarStyle: {
            height: 60,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 4,
            backgroundColor: theme.colors.CARD,
            borderTopWidth: 0,
            paddingBottom: 5,
            paddingTop: 5,
            ...Platform.select({
              ios: {
                borderTopColor: theme.colors.BORDER,
              },
              android: {
                borderTopColor: theme.colors.BORDER,
              },
            }),
          },
        })}
      >
        <Tab.Screen
          name={MAIN_TAB_ROUTES.CHAT}
          component={ChatScreen}
          options={{
            tabBarLabel: 'Chat',
          }}
        />
        <Tab.Screen
          name={MAIN_TAB_ROUTES.HEALTH_LOG}
          component={HealthLogScreen}
          options={{
            tabBarLabel: 'Health Log',
          }}
        />
        <Tab.Screen
          name={MAIN_TAB_ROUTES.DATA_ENTRY}
          component={() => null}
          options={{
            tabBarButton: (props) => (
              <CustomTabButton
                {...props}
                onPress={handleDataEntryPress}
              />
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tab.Screen
          name={MAIN_TAB_ROUTES.INSIGHTS}
          component={InsightsScreen}
          options={{
            tabBarLabel: 'Insights',
          }}
        />
        <Tab.Screen
          name={MAIN_TAB_ROUTES.PROFILE}
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>

      {showDataEntryOptions && (
        <DataEntryOptions
          onSelectMeal={handleSelectMeal}
          onSelectLabResult={handleSelectLabResult}
          onSelectSymptom={handleSelectSymptom}
          onCancel={handleCloseDataEntryOptions}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  tabButton: {
    top: -22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonView: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainNavigator;