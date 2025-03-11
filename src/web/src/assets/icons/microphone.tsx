import React from 'react'; // 18.2.0
import { Svg, Path, G, Circle } from 'react-native-svg'; // ^13.9.0
import { Theme } from '../../types/theme.types';

interface MicrophoneIconProps {
  size?: number;
  color?: string;
  theme?: Theme;
}

/**
 * Renders an SVG microphone icon for use in the voice recording interface
 * for symptom reporting in the Health Advisor application.
 * 
 * @param props - The component props including size, color and theme
 * @returns The rendered SVG microphone icon
 */
const MicrophoneIcon = ({ 
  size = 24, 
  color, 
  theme 
}: MicrophoneIconProps): JSX.Element => {
  // Determine color: use provided color, or theme primary color, or a default color
  const fillColor = color || (theme?.colors?.PRIMARY) || '#4A90E2';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={fillColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {/* Microphone body */}
        <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        
        {/* Microphone stand */}
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <Path d="M12 19v3" />
        
        {/* Microphone base */}
        <Circle cx="12" cy="23" r="2" fill={fillColor} />
      </G>
    </Svg>
  );
};

export default MicrophoneIcon;