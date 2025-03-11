import React from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native'; // ^0.71.0
import { ChatInputProps } from '../../types/components.types';
import TextInput from '../forms/TextInput';
import IconButton from '../buttons/IconButton';
import SendIcon from '../../assets/icons/send';
import MicrophoneIcon from '../../assets/icons/microphone';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/index';

/**
 * A component that renders a text input field with send and voice input buttons 
 * for the chat interface in the Health Advisor application.
 * 
 * @param props The component props
 * @returns Rendered ChatInput component
 */
const ChatInput = ({
  value,
  onChangeText,
  onSend,
  onVoiceInput,
  disabled = false,
  loading = false,
  style,
}: ChatInputProps): JSX.Element => {
  // Get theme for styling
  const { theme } = useTheme();

  // Handle send button press only if there's text and not disabled
  const handleSend = () => {
    if (value.trim() && !disabled && !loading) {
      onSend();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { 
          backgroundColor: theme.colors.CARD,
          borderTopColor: theme.colors.BORDER 
        },
        style,
      ]}
      accessibilityLabel="Message input area"
    >
      <TextInput
        label=""
        value={value}
        onChangeText={(text) => !disabled && onChangeText(text)}
        placeholder="Type a message..."
        multiline
        containerStyle={styles.inputContainer}
        inputStyle={[
          styles.input,
          disabled && { color: theme.colors.DISABLED }
        ]}
      />
      
      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.PRIMARY}
          style={styles.loadingIndicator}
          accessibilityLabel="Sending message"
        />
      ) : (
        <IconButton
          icon={<SendIcon />}
          onPress={handleSend}
          disabled={!value.trim() || disabled}
          accessibilityLabel="Send message"
          color={value.trim() && !disabled ? theme.colors.PRIMARY : theme.colors.DISABLED}
        />
      )}
      
      {onVoiceInput && (
        <IconButton
          icon={<MicrophoneIcon />}
          onPress={onVoiceInput}
          disabled={disabled || loading}
          accessibilityLabel="Voice input"
          color={disabled || loading ? theme.colors.DISABLED : theme.colors.PRIMARY}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderTopWidth: 1,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0, // Override the default margin from FormField
  },
  input: {
    maxHeight: 100,
    minHeight: 40,
    paddingTop: Platform.OS === 'ios' ? spacing.xs : 0,
    textAlignVertical: 'center',
  },
  loadingIndicator: {
    marginHorizontal: spacing.xs,
    width: 24, // Match IconButton size for consistent layout
    height: 24,
  },
});

export default ChatInput;