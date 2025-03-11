import { useState, useEffect } from 'react'; // react version 18.2.0
import { Keyboard, KeyboardEvent, Platform } from 'react-native'; // react-native version 0.71.0

/**
 * Interface representing the state of the keyboard
 */
export interface KeyboardState {
  /** Whether the keyboard is currently visible */
  isKeyboardVisible: boolean;
  /** The height of the keyboard in pixels */
  keyboardHeight: number;
}

/**
 * A hook that tracks keyboard visibility and height to help components
 * adjust their layout when the keyboard appears or disappears.
 * 
 * This is particularly useful for:
 * - Ensuring chat input fields remain visible when keyboard appears
 * - Adjusting form layouts to keep fields accessible
 * - Providing smooth transitions when keyboard state changes
 * 
 * @returns An object containing keyboard visibility and height information
 * 
 * @example
 * const { isKeyboardVisible, keyboardHeight } = useKeyboard();
 * 
 * // Use in JSX to adjust layout
 * <View style={{ paddingBottom: isKeyboardVisible ? keyboardHeight : 0 }}>
 *   <TextInput />
 * </View>
 */
const useKeyboard = (): KeyboardState => {
  // Track whether the keyboard is visible
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  
  // Track the height of the keyboard
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    // Function to handle when the keyboard is shown
    const handleKeyboardShow = (event: KeyboardEvent): void => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    };

    // Function to handle when the keyboard is hidden
    const handleKeyboardHide = (): void => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    // Determine which keyboard events to listen to based on platform
    // iOS has 'will' events which fire before the keyboard animation
    // Android has 'did' events which fire after the keyboard animation
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleKeyboardShow
    );
    
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleKeyboardHide
    );

    // Return a cleanup function to remove the event listeners
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Return the keyboard state
  return { isKeyboardVisible, keyboardHeight };
};

export default useKeyboard;