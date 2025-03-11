import React from 'react'; // ^18.2.0
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native'; // ^0.71.0
import { HeaderProps } from '../../types/components.types';
import IconButton from '../buttons/IconButton';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * A reusable header component for the Health Advisor mobile application
 * that displays a screen title with optional left and right icon buttons
 * for navigation and actions. This component provides consistent header
 * styling across all screens in the application.
 */
const Header = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  style,
}: HeaderProps) => {
  // Get current theme using useTheme hook
  const { theme } = useTheme();

  // Set status bar style based on theme (light or dark)
  const statusBarStyle = theme.isDark ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.CARD }}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={theme.colors.CARD}
      />
      <View 
        style={[
          styles.container, 
          {
            backgroundColor: theme.colors.CARD,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.BORDER,
            paddingHorizontal: theme.spacing.m,
            ...Platform.select({
              ios: {
                paddingBottom: theme.spacing.s,
              },
              android: {
                paddingBottom: theme.spacing.s,
                elevation: 4,
              },
            }),
          },
          style
        ]}
      >
        <View style={styles.headerContent}>
          {leftIcon ? (
            <IconButton
              icon={leftIcon}
              onPress={onLeftPress}
              color={theme.colors.PRIMARY}
              accessibilityLabel={`${title} back button`}
              disabled={!onLeftPress}
            />
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
          
          <View style={styles.titleContainer}>
            <Text 
              style={[
                styles.title, 
                {
                  fontFamily: theme.typography.fontFamily.semiBold,
                  fontSize: theme.typography.fontSize.l,
                  color: theme.colors.TEXT,
                }
              ]}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {title}
            </Text>
          </View>
          
          {rightIcon ? (
            <IconButton
              icon={rightIcon}
              onPress={onRightPress}
              color={theme.colors.PRIMARY}
              accessibilityLabel={`${title} action button`}
              disabled={!onRightPress}
            />
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// Static styles that don't depend on theme
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Platform.OS === 'ios' ? 44 : 56, // Different heights for iOS and Android
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    textAlign: 'center',
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
  },
});

export default Header;