import { ReactNode } from 'react'; // ^18.2.0
import { StyleProp, ViewStyle, TextStyle, TextInputProps, ImageStyle } from 'react-native'; // ^0.71.0
import { Theme } from './theme.types';
import { ChatMessage } from './chat.types';
import { HealthDataResponse } from './health.types';

/**
 * Enum for button style variants used throughout the application
 */
export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline',
  TEXT = 'text',
}

/**
 * Enum for button size options
 */
export enum ButtonSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

/**
 * Props interface for Button component
 */
export interface ButtonProps {
  /**
   * Button text label
   */
  label: string;
  
  /**
   * Function to call when button is pressed
   */
  onPress: () => void;
  
  /**
   * Visual style variant of the button
   */
  variant?: ButtonVariant;
  
  /**
   * Size of the button
   */
  size?: ButtonSize;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether to show a loading indicator
   */
  loading?: boolean;
  
  /**
   * Optional icon to display in the button
   */
  icon?: ReactNode;
  
  /**
   * Additional styles for the button container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the button text
   */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Props interface for IconButton component
 */
export interface IconButtonProps {
  /**
   * Icon to display in the button
   */
  icon: ReactNode;
  
  /**
   * Function to call when button is pressed
   */
  onPress: () => void;
  
  /**
   * Size of the icon button
   */
  size?: number;
  
  /**
   * Color of the icon
   */
  color?: string;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional styles for the button container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

/**
 * Props interface for TextInput component
 */
export interface TextInputComponentProps {
  /**
   * Input field label
   */
  label: string;
  
  /**
   * Current value of the input
   */
  value: string;
  
  /**
   * Function to call when text changes
   */
  onChangeText: (text: string) => void;
  
  /**
   * Placeholder text when input is empty
   */
  placeholder?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Whether the input should hide text (for passwords)
   */
  secureTextEntry?: boolean;
  
  /**
   * Whether the input should allow multiple lines
   */
  multiline?: boolean;
  
  /**
   * Additional styles for the input container
   */
  containerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Additional styles for the input field
   */
  inputStyle?: StyleProp<TextStyle>;
}

/**
 * Props interface for FormField component
 */
export interface FormFieldProps {
  /**
   * Field label text
   */
  label: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Form field content
   */
  children: ReactNode;
  
  /**
   * Additional styles for the field container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Interface for radio button options
 */
export interface RadioOption {
  /**
   * Display label for the option
   */
  label: string;
  
  /**
   * Value of the option
   */
  value: string;
}

/**
 * Props interface for RadioGroup component
 */
export interface RadioGroupProps {
  /**
   * Array of radio options
   */
  options: RadioOption[];
  
  /**
   * Currently selected value
   */
  selectedValue: string;
  
  /**
   * Function to call when selection changes
   */
  onValueChange: (value: string) => void;
  
  /**
   * Layout direction of the radio buttons
   */
  direction?: 'horizontal' | 'vertical';
  
  /**
   * Additional styles for the radio group container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for Card component
 */
export interface CardProps {
  /**
   * Card content
   */
  children: ReactNode;
  
  /**
   * Additional styles for the card container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Function to call when card is pressed
   */
  onPress?: () => void;
  
  /**
   * Elevation level of the card shadow
   */
  elevation?: 'small' | 'medium' | 'large';
}

/**
 * Props interface for HealthDataCard component
 */
export interface HealthDataCardProps {
  /**
   * Health data item to display
   */
  item: HealthDataResponse;
  
  /**
   * Function to call when card is pressed
   */
  onPress: (id: string) => void;
  
  /**
   * Additional styles for the card container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for Modal component
 */
export interface ModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  
  /**
   * Function to call when the modal is dismissed
   */
  onClose: () => void;
  
  /**
   * Modal title text
   */
  title: string;
  
  /**
   * Modal content
   */
  children: ReactNode;
  
  /**
   * Animation type for modal presentation
   */
  animationType?: 'slide' | 'fade' | 'none';
}

/**
 * Props interface for BottomSheet component
 */
export interface BottomSheetProps {
  /**
   * Whether the bottom sheet is visible
   */
  visible: boolean;
  
  /**
   * Function to call when the bottom sheet is dismissed
   */
  onClose: () => void;
  
  /**
   * Bottom sheet title text
   */
  title: string;
  
  /**
   * Bottom sheet content
   */
  children: ReactNode;
  
  /**
   * Height of the bottom sheet
   */
  height?: number | string;
}

/**
 * Props interface for ConfirmationModal component
 */
export interface ConfirmationModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  
  /**
   * Modal title text
   */
  title: string;
  
  /**
   * Modal message text
   */
  message: string;
  
  /**
   * Confirm button text
   */
  confirmText: string;
  
  /**
   * Cancel button text
   */
  cancelText: string;
  
  /**
   * Function to call when confirmed
   */
  onConfirm: () => void;
  
  /**
   * Function to call when cancelled
   */
  onCancel: () => void;
  
  /**
   * Style variant for the confirm button
   */
  confirmVariant?: ButtonVariant;
}

/**
 * Props interface for Header component
 */
export interface HeaderProps {
  /**
   * Header title text
   */
  title: string;
  
  /**
   * Icon to display on the left side
   */
  leftIcon?: ReactNode;
  
  /**
   * Icon to display on the right side
   */
  rightIcon?: ReactNode;
  
  /**
   * Function to call when the left icon is pressed
   */
  onLeftPress?: () => void;
  
  /**
   * Function to call when the right icon is pressed
   */
  onRightPress?: () => void;
  
  /**
   * Additional styles for the header container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for Avatar component
 */
export interface AvatarProps {
  /**
   * Image URI for the avatar
   */
  uri: string;
  
  /**
   * Size of the avatar in pixels
   */
  size?: number;
  
  /**
   * Placeholder text to display when no image is available
   */
  placeholder?: string;
  
  /**
   * Additional styles for the avatar image
   */
  style?: StyleProp<ImageStyle>;
}

/**
 * Props interface for LoadingIndicator component
 */
export interface LoadingIndicatorProps {
  /**
   * Size of the loading indicator
   */
  size?: 'small' | 'large';
  
  /**
   * Color of the loading indicator
   */
  color?: string;
  
  /**
   * Additional styles for the loading indicator container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for ErrorMessage component
 */
export interface ErrorMessageProps {
  /**
   * Error message text
   */
  message: string;
  
  /**
   * Function to call when retry button is pressed
   */
  onRetry?: () => void;
  
  /**
   * Additional styles for the error message container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for SearchBar component
 */
export interface SearchBarProps {
  /**
   * Current search text value
   */
  value: string;
  
  /**
   * Function to call when search text changes
   */
  onChangeText: (text: string) => void;
  
  /**
   * Function to call when search is submitted
   */
  onSubmit?: () => void;
  
  /**
   * Placeholder text when search bar is empty
   */
  placeholder?: string;
  
  /**
   * Additional styles for the search bar container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for DatePicker component
 */
export interface DatePickerProps {
  /**
   * Currently selected date
   */
  selectedDate: Date;
  
  /**
   * Function to call when date selection changes
   */
  onDateChange: (date: Date) => void;
  
  /**
   * Format string for date display
   */
  format?: string;
  
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
  
  /**
   * Additional styles for the date picker container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for CameraView component
 */
export interface CameraViewProps {
  /**
   * Function to call when photo is captured
   */
  onCapture: (uri: string) => void;
  
  /**
   * Flash mode setting
   */
  flashMode?: 'on' | 'off' | 'auto';
  
  /**
   * Camera type to use
   */
  cameraType?: 'front' | 'back';
  
  /**
   * Additional styles for the camera container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for VoiceRecorder component
 */
export interface VoiceRecorderProps {
  /**
   * Function to call when recording is completed
   */
  onRecordComplete: (uri: string, transcription: string) => void;
  
  /**
   * Maximum duration of recording in seconds
   */
  maxDuration?: number;
  
  /**
   * Additional styles for the recorder container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for DataEntryOptions component
 */
export interface DataEntryOptionsProps {
  /**
   * Function to call when meal entry option is selected
   */
  onSelectMeal: () => void;
  
  /**
   * Function to call when lab result entry option is selected
   */
  onSelectLabResult: () => void;
  
  /**
   * Function to call when symptom entry option is selected
   */
  onSelectSymptom: () => void;
  
  /**
   * Function to call when the options sheet is cancelled
   */
  onCancel: () => void;
}

/**
 * Props interface for CalendarView component
 */
export interface CalendarViewProps {
  /**
   * Currently selected date
   */
  selectedDate: Date;
  
  /**
   * Function to call when date selection changes
   */
  onDateSelect: (date: Date) => void;
  
  /**
   * Object mapping date strings to marker data
   */
  markedDates?: Record<string, { marked: boolean; dotColor?: string }>;
  
  /**
   * Additional styles for the calendar container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for HealthItemList component
 */
export interface HealthItemListProps {
  /**
   * Array of health data items to display
   */
  items: HealthDataResponse[];
  
  /**
   * Function to call when an item is pressed
   */
  onItemPress: (id: string) => void;
  
  /**
   * Whether the list is currently loading
   */
  loading?: boolean;
  
  /**
   * Function to call when the end of the list is reached
   */
  onEndReached?: () => void;
  
  /**
   * Whether the list is currently refreshing
   */
  refreshing?: boolean;
  
  /**
   * Function to call when the list is pulled to refresh
   */
  onRefresh?: () => void;
  
  /**
   * Additional styles for the list container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for ChatBubble component
 */
export interface ChatBubbleProps {
  /**
   * Chat message to display
   */
  message: ChatMessage;
  
  /**
   * Additional styles for the bubble container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for ChatInput component
 */
export interface ChatInputProps {
  /**
   * Current input text value
   */
  value: string;
  
  /**
   * Function to call when input text changes
   */
  onChangeText: (text: string) => void;
  
  /**
   * Function to call when send button is pressed
   */
  onSend: () => void;
  
  /**
   * Function to call when voice input button is pressed
   */
  onVoiceInput?: () => void;
  
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the input is in loading state
   */
  loading?: boolean;
  
  /**
   * Additional styles for the input container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Props interface for ChatList component
 */
export interface ChatListProps {
  /**
   * Array of chat messages to display
   */
  messages: ChatMessage[];
  
  /**
   * Whether the list is currently loading
   */
  loading?: boolean;
  
  /**
   * Function to call when the end of the list is reached
   */
  onEndReached?: () => void;
  
  /**
   * Whether the list is currently refreshing
   */
  refreshing?: boolean;
  
  /**
   * Function to call when the list is pulled to refresh
   */
  onRefresh?: () => void;
  
  /**
   * Additional styles for the list container
   */
  style?: StyleProp<ViewStyle>;
}