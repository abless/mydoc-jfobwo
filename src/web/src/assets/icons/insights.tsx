import React from 'react'; // v18.2.0
import { Svg, Path, G } from 'react-native-svg'; // v13.9.0
import { Theme } from '../../types/theme.types';

/**
 * Props for the InsightsIcon component
 */
interface InsightsIconProps {
  /** Width and height of the icon in pixels */
  size?: number;
  /** Custom color for the icon, overrides theme color */
  color?: string;
  /** Theme object for getting default colors */
  theme?: Theme;
}

/**
 * Renders an SVG chart/graph icon used in the Insights tab navigation and insights-related interfaces
 * The icon represents a bar chart to visually communicate data analysis and health insights
 * 
 * @param props - Component props including size, color, and theme
 * @returns SVG insights icon as a React component
 */
const InsightsIcon = ({ 
  size = 24, 
  color, 
  theme 
}: InsightsIconProps): JSX.Element => {
  // Determine fill color - use provided color, fallback to theme primary, or default to a standard color
  const fillColor = color || (theme?.colors?.PRIMARY) || '#4A90E2';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        {/* Bar chart columns of varying heights */}
        <Path 
          d="M4 18V12M9 18V8M14 18V4M19 18V10"
          stroke={fillColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Base line (x-axis) */}
        <Path 
          d="M2 20h20"
          stroke={fillColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

export default InsightsIcon;