import React from 'react'; // 18.2.0
import { Svg, Path, G } from 'react-native-svg'; // ^13.9.0
import { Theme } from '../../types/theme.types';

/**
 * Props for the SearchIcon component
 */
interface SearchIconProps {
  /**
   * The size of the icon in pixels
   * @default 24
   */
  size?: number;
  /**
   * The color of the icon. If not provided, uses the theme's PRIMARY color
   */
  color?: string;
  /**
   * The theme object for accessing color values when no specific color is provided
   */
  theme?: Theme;
}

/**
 * Renders an SVG search icon with customizable size and color
 * Used in search interfaces like the Health Log search functionality
 */
const SearchIcon = ({ 
  size = 24, 
  color, 
  theme 
}: SearchIconProps): JSX.Element => {
  // Determine the fill color based on provided color or theme
  const fillColor = color || (theme?.colors?.PRIMARY || '#4A90E2');

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G>
        {/* Magnifying glass circle */}
        <Path 
          d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" 
          stroke={fillColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        {/* Magnifying glass handle */}
        <Path 
          d="M21 21L15.8 15.8" 
          stroke={fillColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </G>
    </Svg>
  );
};

export default SearchIcon;