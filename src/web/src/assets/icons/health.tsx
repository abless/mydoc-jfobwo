import React from 'react'; // v18.2.0
import { Svg, Path, G } from 'react-native-svg'; // v13.9.0
import { Theme } from '../../types/theme.types';

/**
 * Props for the HealthIcon component
 */
interface HealthIconProps {
  /**
   * Width and height of the icon in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * Color to fill the icon
   * If not provided, will use theme's PRIMARY color
   */
  color?: string;
  
  /**
   * Application theme object containing color information
   */
  theme?: Theme;
}

/**
 * HealthIcon component that renders an SVG health/calendar icon
 * Used primarily in the Health Log tab navigation and health-related interfaces
 */
const HealthIcon = ({ 
  size = 24, 
  color,
  theme 
}: HealthIconProps): JSX.Element => {
  // Determine color - use provided color or fall back to theme primary color
  const fillColor = color || (theme?.colors?.PRIMARY || '#4A90E2');
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" testID="health-icon">
      <G>
        {/* Calendar base representing health log */}
        <Path
          d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"
          fill={fillColor}
        />
        {/* Heart symbol representing health aspect */}
        <Path 
          d="M12 17.5l-3.5-3.5c-1.1-1.1-1.1-2.9 0-4 .55-.55 1.27-.83 2-.83s1.45.28 2 .83c.55-.55 1.27-.83 2-.83s1.45.28 2 .83c1.1 1.1 1.1 2.9 0 4L12 17.5z" 
          fill={fillColor} 
        />
      </G>
    </Svg>
  );
};

export default HealthIcon;