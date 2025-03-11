import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, StyleProp } from 'react-native'; // ^0.71.0
import { useTheme } from '@react-navigation/native'; // ^6.0.0
import { AvatarProps } from '../../types/components.types';
import placeholderImage from '../../assets/images/placeholder.png';

/**
 * Avatar component that displays either a user's profile image or a text-based placeholder
 * with the user's initials when no image is available.
 * 
 * @param uri - Image URI for the avatar
 * @param size - Size of the avatar in pixels (default: 50)
 * @param placeholder - Placeholder text to display when no image is available
 * @param style - Additional styles for the avatar image
 * @returns Rendered Avatar component
 */
const Avatar = ({ uri, size = 50, placeholder, style }: AvatarProps) => {
  // Get theme colors for styling
  const { colors } = useTheme();
  
  /**
   * Extracts initials from a name or email string
   * @param text The text to extract initials from
   * @returns One or two character initials
   */
  const getInitials = (text: string): string => {
    if (!text) return '';
    
    // Check if text is an email address
    if (text.includes('@')) {
      // For email, just use the first character of the username
      return text.split('@')[0].charAt(0).toUpperCase();
    }
    
    // For names, use first letter of first and last name
    const parts = text.split(' ');
    if (parts.length === 1) {
      // Just one word, use first character
      return parts[0].charAt(0).toUpperCase();
    }
    
    // First character of first and last word
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Calculate border radius for circle (half the size)
  const borderRadius = size / 2;
  
  // Define common style for all avatar types
  const avatarStyle = [
    {
      width: size,
      height: size,
      borderRadius,
    },
    style, // Apply any additional styles passed via props
  ];
  
  if (uri) {
    // Render image avatar if URI is provided
    return (
      <Image
        source={{ uri }}
        style={avatarStyle as StyleProp<ImageStyle>}
        defaultSource={placeholderImage}
        accessibilityLabel="User profile image"
      />
    );
  } else if (placeholder) {
    // Render text-based avatar with initials if placeholder text is provided
    const initials = getInitials(placeholder);
    return (
      <View
        style={[
          avatarStyle,
          styles.textContainer,
          { backgroundColor: colors.PRIMARY }, // Use theme primary color for background
        ]}
        accessibilityLabel={`Avatar for ${placeholder}`}
      >
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {initials}
        </Text>
      </View>
    );
  } else {
    // Render default placeholder image if neither URI nor placeholder is provided
    return (
      <Image
        source={placeholderImage}
        style={avatarStyle as StyleProp<ImageStyle>}
        accessibilityLabel="Default profile image"
      />
    );
  }
};

const styles = StyleSheet.create({
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Avatar;