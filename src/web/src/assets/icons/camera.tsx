import React from 'react'; // v18.2.0
import { Svg, Path, Circle, G } from 'react-native-svg'; // v13.9.0
import { Theme } from '../../types/theme.types';

interface CameraIconProps {
  size?: number;
  color?: string;
  theme?: Theme;
}

/**
 * Renders an SVG camera icon with customizable size and color
 * Used in photo capture interfaces for meal and lab result data entry
 */
const CameraIcon = ({ 
  size = 24, 
  color, 
  theme 
}: CameraIconProps): JSX.Element => {
  // Determine the color to use, either from props or theme
  const fillColor = color || (theme?.colors?.PRIMARY || '#4A90E2');

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Camera body */}
      <Path 
        d="M20 5h-3.17L15.17 3H8.83L7.17 5H4C2.9 5 2 5.9 2 7v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12z" 
        fill={fillColor}
      />
      {/* Camera lens */}
      <Circle cx="12" cy="12" r="3.5" fill={fillColor} />
      {/* Flash/button */}
      <Path 
        d="M17 9.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z" 
        fill={fillColor}
      />
    </Svg>
  );
};

export default CameraIcon;