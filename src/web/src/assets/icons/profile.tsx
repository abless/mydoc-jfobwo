import React from 'react'; // ^18.2.0
import { Svg, Path, Circle, G } from 'react-native-svg'; // ^13.9.0
import { Theme } from '../../types/theme.types';

interface ProfileIconProps {
  size?: number;
  color?: string;
  theme?: Theme;
}

/**
 * Profile icon component that renders a person silhouette
 * Used primarily in the profile tab navigation and user-related interfaces
 */
const ProfileIcon = ({ 
  size = 24, 
  color, 
  theme 
}: ProfileIconProps): JSX.Element => {
  // Use provided color or fall back to theme's primary color or a default
  const fillColor = color || (theme?.colors?.PRIMARY) || '#4A90E2';
  
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      accessibilityLabel="Profile Icon"
    >
      <G>
        {/* Head circle */}
        <Circle cx="12" cy="8" r="4" fill={fillColor} />
        
        {/* Body/torso shape */}
        <Path 
          d="M4 20v-2c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6v2c0 0.6-0.4 1-1 1H5c-0.6 0-1-0.4-1-1z" 
          fill={fillColor} 
        />
      </G>
    </Svg>
  );
};

export default ProfileIcon;