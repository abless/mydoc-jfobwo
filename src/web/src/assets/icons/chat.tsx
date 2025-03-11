import React from 'react'; // 18.2.0
import { Svg, Path, G } from 'react-native-svg'; // 13.9.0
import { Theme } from '../../types/theme.types';

/**
 * Props for the ChatIcon component
 */
interface ChatIconProps {
  /** Width and height of the icon in pixels */
  size?: number;
  /** Color of the icon (overrides theme color) */
  color?: string;
  /** Application theme for consistent styling */
  theme?: Theme;
}

/**
 * ChatIcon component that renders a chat bubble SVG icon
 * Used in the bottom navigation tab and chat-related interfaces
 * 
 * @param props - Component properties
 * @returns JSX.Element - Rendered SVG chat icon
 */
const ChatIcon = ({ 
  size = 24, 
  color, 
  theme 
}: ChatIconProps): JSX.Element => {
  // Determine the fill color with fallbacks
  const fillColor = color || (theme?.colors?.PRIMARY) || '#4A90E2';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        {/* Main chat bubble shape */}
        <Path
          d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H18L22 22V4C22 2.9 21.1 2 20 2Z"
          fill={fillColor}
        />
        
        {/* Optional tail for the speech bubble that extends from the main shape */}
        <Path
          d="M18 18L20 20V18H18Z"
          fill={fillColor}
        />
      </G>
    </Svg>
  );
};

export default ChatIcon;