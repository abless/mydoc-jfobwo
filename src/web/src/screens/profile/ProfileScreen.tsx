import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MainTabScreenProps } from '../../types/navigation.types';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/buttons/Button';
import { formatDate } from '../../utils/date.utils';
import { APP_CONFIG } from '../../constants/config';
import { useTheme } from '../../contexts/ThemeContext';
import { ButtonVariant } from '../../types/components.types';

/**
 * ProfileScreen component that displays user information and provides logout functionality
 * Implements F-005: User Profile Management requirement
 * 
 * @param props Navigation props from React Navigation
 * @returns Rendered Profile screen component
 */
const ProfileScreen = ({ navigation }: MainTabScreenProps<'Profile'>) => {
  // Access theme for styling
  const { theme } = useTheme();
  
  // Access user data and logout function from auth context
  const { user, logout, loading } = useAuth();

  /**
   * Handles the logout process with confirmation
   */
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  }, [logout]);

  // Format the account creation date if available
  const memberSinceDate = user?.createdAt 
    ? formatDate(user.createdAt, 'MMM d, yyyy')
    : 'N/A';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.BACKGROUND }]}>
      <Header title="Profile" />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { padding: theme.spacing.m }]}
      >
        {loading ? (
          <ActivityIndicator 
            size="large" 
            style={styles.loading} 
            color={theme.colors.PRIMARY}
          />
        ) : (
          <>
            <View style={styles.profileHeader}>
              <Avatar 
                uri={''} 
                placeholder={user?.email || ''}
                size={80}
              />
              <Text style={[
                styles.email, 
                { 
                  color: theme.colors.TEXT,
                  fontFamily: theme.typography.fontFamily.medium
                }
              ]}>
                {user?.email}
              </Text>
            </View>

            <View style={[
              styles.section, 
              { 
                backgroundColor: theme.colors.CARD,
                borderRadius: theme.borderRadius.medium,
                ...theme.elevation.small
              }
            ]}>
              <Text style={[
                styles.sectionTitle, 
                {
                  color: theme.colors.TEXT,
                  fontFamily: theme.typography.fontFamily.semiBold
                }
              ]}>
                Account Information
              </Text>
              
              <View style={styles.infoRow}>
                <Text style={[
                  styles.infoLabel,
                  {
                    color: theme.colors.TEXT,
                    fontFamily: theme.typography.fontFamily.medium
                  }
                ]}>
                  Email:
                </Text>
                <Text style={[
                  styles.infoValue,
                  {
                    color: theme.colors.TEXT,
                    fontFamily: theme.typography.fontFamily.regular
                  }
                ]}>
                  {user?.email}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[
                  styles.infoLabel,
                  {
                    color: theme.colors.TEXT,
                    fontFamily: theme.typography.fontFamily.medium
                  }
                ]}>
                  Member since:
                </Text>
                <Text style={[
                  styles.infoValue,
                  {
                    color: theme.colors.TEXT,
                    fontFamily: theme.typography.fontFamily.regular
                  }
                ]}>
                  {memberSinceDate}
                </Text>
              </View>
            </View>

            <Button 
              label="Log Out"
              onPress={handleLogout}
              variant={ButtonVariant.PRIMARY}
              style={styles.logoutButton}
            />

            <Text style={[
              styles.versionText,
              {
                color: theme.colors.DISABLED,
                fontFamily: theme.typography.fontFamily.regular
              }
            ]}>
              App Version: {APP_CONFIG.APP_VERSION}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  loading: {
    marginTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 24,
  },
  email: {
    fontSize: 16,
    marginTop: 8,
  },
  section: {
    width: '100%',
    padding: 16,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 16,
  },
  logoutButton: {
    width: '100%',
    marginVertical: 16,
  },
  versionText: {
    marginTop: 16,
    fontSize: 12,
  },
});

export default ProfileScreen;