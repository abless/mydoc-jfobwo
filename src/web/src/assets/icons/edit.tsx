import React from 'react'; // ^18.2.0
import { Svg, Path, G } from 'react-native-svg'; // ^13.9.0
import { Theme } from '../../types/theme.types';

interface EditIconProps {
  /**
   * The size of the icon in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * The color of the icon
   * If not provided, will use theme.colors.PRIMARY or default to #333333
   */
  color?: string;
  
  /**
   * The theme object for accessing design system colors
   */
  theme?: Theme;
}

/**
 * EditIcon component that renders an SVG pencil icon for edit actions
 * Used for content editing functionality in health data entries
 * 
 * @param props - Component props
 * @returns JSX.Element - The rendered SVG edit icon
 */
const EditIcon: React.FC<EditIconProps> = ({ 
  size = 24, 
  color, 
  theme 
}) => {
  // Determine color from props or theme, defaulting to black if neither is provided
  const fillColor = color || (theme?.colors?.PRIMARY) || '#333333';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G>
        {/* Pencil body */}
        <Path 
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" 
          fill={fillColor} 
        />
        {/* Pencil tip */}
        <Path 
          d="M20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" 
          fill={fillColor} 
        />
      </G>
    </Svg>
  );
};

export default EditIcon;