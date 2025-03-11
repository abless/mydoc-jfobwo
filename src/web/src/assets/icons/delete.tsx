import React from 'react'; // 18.2.0
import { Svg, Path, G } from 'react-native-svg'; // ^13.9.0
import { Theme } from '../../types/theme.types';

interface DeleteIconProps {
  size?: number;
  color?: string;
  theme?: Theme;
}

/**
 * Renders an SVG delete (trash) icon with customizable size and color
 * Used throughout the application for content deletion actions
 */
const DeleteIcon = ({ 
  size = 24, 
  color, 
  theme 
}: DeleteIconProps): JSX.Element => {
  // Use provided color or fall back to theme's error color or default red
  const iconColor = color || (theme?.colors?.ERROR || '#FF3B30');

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={iconColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {/* Trash can top handle */}
        <Path d="M3 6h18" />
        
        {/* Trash can body */}
        <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
        
        {/* Trash can lid */}
        <Path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        
        {/* Deletion lines inside the trash can */}
        <Path d="M10 11v6" />
        <Path d="M14 11v6" />
      </G>
    </Svg>
  );
};

export default DeleteIcon;