import React from 'react'; // ^18.2.0
import { SafeAreaProvider } from 'react-native-safe-area-context'; // ^4.5.0
import { StatusBar } from 'react-native'; // ^0.71.0
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // ^2.9.0

// Internal imports
import AppNavigator from './src/navigation';
import { AuthProvider, ThemeProvider, ChatProvider, HealthProvider } from './src/contexts';

/**
 * Root component of the Health Advisor mobile application
 * @returns The rendered application with all providers and navigation
 */
const App = (): JSX.Element => {
  return (
    // LD1: Wrap the application with GestureHandlerRootView for gesture support
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* LD1: Wrap with SafeAreaProvider to handle safe area insets */}
      <SafeAreaProvider>
        {/* LD1: Wrap with ThemeProvider to provide theme context */}
        <ThemeProvider>
          {/* LD1: Wrap with AuthProvider to provide authentication context */}
          <AuthProvider>
            {/* LD1: Wrap with HealthProvider to provide health data context */}
            <HealthProvider>
              {/* LD1: Wrap with ChatProvider to provide chat functionality */}
              <ChatProvider>
                {/* LD1: Render StatusBar with appropriate styling */}
                <StatusBar barStyle="default" backgroundColor="transparent" translucent={true} />
                {/* LD1: Render AppNavigator as the main navigation component */}
                <AppNavigator />
              </ChatProvider>
            </HealthProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// LD3: Export the App component as the default export
export default App;