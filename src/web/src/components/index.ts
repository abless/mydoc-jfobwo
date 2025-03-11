/**
 * Main barrel file for UI components
 * 
 * This file exports all UI components from their respective subdirectories,
 * providing a centralized import point for components used throughout the
 * Health Advisor mobile application.
 */

// Import components from their respective directories
import * as common from './common';
import * as buttons from './buttons';
import * as forms from './forms';
import * as cards from './cards';
import * as modals from './modals';
import * as datainput from './datainput';
import * as health from './health';
import * as chat from './chat';

// Re-export components
export const Avatar = common.Avatar;
export const DatePicker = common.DatePicker;
export const ErrorMessage = common.ErrorMessage;
export const Header = common.Header;
export const LoadingIndicator = common.LoadingIndicator;
export const SearchBar = common.SearchBar;

export const Button = buttons.Button;
export const IconButton = buttons.IconButton;

export const FormField = forms.FormField;
export const RadioGroup = forms.RadioGroup;
export const TextInput = forms.TextInput;

export const Card = cards.Card;
export const HealthDataCard = cards.HealthDataCard;

export const Modal = modals.Modal;
export const BottomSheet = modals.BottomSheet;
export const ConfirmationModal = modals.ConfirmationModal;

export const CameraView = datainput.CameraView;
export const DataEntryOptions = datainput.DataEntryOptions;
export const VoiceRecorder = datainput.VoiceRecorder;

export const CalendarView = health.CalendarView;
export const HealthItemList = health.HealthItemList;

export const ChatBubble = chat.ChatBubble;
export const ChatInput = chat.ChatInput;
export const ChatList = chat.ChatList;