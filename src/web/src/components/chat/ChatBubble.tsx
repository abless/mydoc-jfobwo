import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'; // ^0.71.0
import { ChatBubbleProps } from '../../types/components.types';
import { ChatRole, ChatMessageStatus } from '../../types/chat.types';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDisplayTime } from '../../utils/date.utils';

/**
 * ChatBubble component that renders a chat message bubble in the Health Advisor application.
 * It displays user or AI assistant messages with different styling based on the sender,
 * and includes the message content and timestamp.
 */
const ChatBubble: React.FC<ChatBubbleProps> = ({ message, style }) => {
  // Access theme for consistent styling
  const { theme } = useTheme();
  
  // Determine if the message is from the user or the AI assistant
  const isUser = message.role === ChatRole.USER;

  // Format the timestamp to a user-friendly format (e.g., "10:30 AM")
  const timeString = formatDisplayTime(message.timestamp);

  return (
    <View 
      style={[
        styles.container, 
        { 
          alignItems: isUser ? 'flex-end' : 'flex-start',
          marginLeft: isUser ? theme.spacing.l : theme.spacing.xs,
          marginRight: isUser ? theme.spacing.xs : theme.spacing.l,
        },
        style
      ]}
      accessible={true}
      accessibilityLabel={`${isUser ? 'You' : 'Health Advisor'}: ${message.content}`}
      accessibilityRole="text"
    >
      <View 
        style={[
          styles.bubble, 
          {
            backgroundColor: isUser ? theme.colors.PRIMARY : theme.colors.CARD,
            borderTopLeftRadius: isUser ? theme.borderRadius.medium : theme.borderRadius.small,
            borderTopRightRadius: isUser ? theme.borderRadius.small : theme.borderRadius.medium,
            borderBottomLeftRadius: theme.borderRadius.medium,
            borderBottomRightRadius: theme.borderRadius.medium,
            ...theme.elevation.small,
          }
        ]}
      >
        {/* Message content */}
        <Text 
          style={[
            styles.messageText, 
            {
              color: isUser ? theme.colors.WHITE : theme.colors.TEXT,
              fontSize: theme.typography.fontSize.m,
              lineHeight: theme.typography.lineHeight.m,
              fontFamily: theme.typography.fontFamily.regular,
            }
          ]}
        >
          {message.content}
        </Text>
        
        {/* Footer with status indicator and timestamp */}
        <View style={styles.footer}>
          {/* Show loading indicator when message is sending */}
          {message.status === ChatMessageStatus.SENDING && (
            <ActivityIndicator 
              size="small" 
              color={isUser ? theme.colors.WHITE : theme.colors.PRIMARY} 
              style={styles.statusIndicator}
              accessibilityLabel="Sending message"
            />
          )}
          
          {/* Show error text when message failed to send */}
          {message.status === ChatMessageStatus.ERROR && (
            <Text 
              style={[
                styles.errorText, 
                { 
                  color: isUser ? theme.colors.WHITE : theme.colors.ERROR,
                  fontSize: theme.typography.fontSize.xs,
                }
              ]}
              accessibilityLabel="Error sending message"
            >
              Error sending
            </Text>
          )}
          
          {/* Message timestamp */}
          <Text 
            style={[
              styles.timeText, 
              { 
                color: isUser ? `${theme.colors.WHITE}CC` : theme.colors.DISABLED,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}
          >
            {timeString}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  bubble: {
    padding: 12,
    maxWidth: '80%',
    minWidth: 60,
  },
  messageText: {
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  statusIndicator: {
    marginRight: 6,
  },
  timeText: {
    marginLeft: 4,
  },
  errorText: {
    marginRight: 6,
  },
});

export default ChatBubble;