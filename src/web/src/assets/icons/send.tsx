import React from 'react'; // react version 18.2.0
import { Svg, Path } from 'react-native-svg'; // react-native-svg version 13.4.0

interface SendIconProps {
  /**
   * Color of the icon. Defaults to primary color if not provided.
   */
  color?: string;
  /**
   * Size of the icon in pixels. Defaults to 24 if not provided.
   */
  size?: number;
  /**
   * Additional styles to apply to the SVG container.
   */
  style?: any;
}

/**
 * SendIcon component for the chat interface.
 * Renders an SVG icon representing the action of sending a message to the LLM health advisor.
 * Used primarily in the chat input section of the application.
 */
const SendIcon: React.FC<SendIconProps> = ({ 
  color = '#4A90E2', // Default primary color from theme
  size = 24, 
  style 
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path 
        d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" 
        fill={color} 
      />
    </Svg>
  );
};

export default SendIcon;