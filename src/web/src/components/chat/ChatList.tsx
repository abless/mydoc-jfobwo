import React, { useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native'; // ^0.71.0
import { ChatListProps } from '../../types/components.types';
import ChatBubble from './ChatBubble';
import LoadingIndicator from '../common/LoadingIndicator';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ChatList component that renders a scrollable list of chat messages between
 * the user and the LLM health advisor. It displays messages in chronological order
 * with support for loading more messages, pull-to-refresh, and proper loading states.
 */
const ChatList: React.FC<ChatListProps> = ({
  messages,
  loading,
  onEndReached,
  refreshing,
  onRefresh,
  style,
}) => {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // Render individual message bubble
  const renderItem = useCallback(({ item }) => (
    <ChatBubble message={item} />
  ), []);

  // Generate unique keys for message items
  const keyExtractor = useCallback((item) => item.id, []);

  // Component to display when the chat is empty
  const renderEmptyComponent = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { padding: theme.spacing.xl }]}>
        <Text 
          style={[
            styles.emptyText, 
            { 
              color: theme.colors.TEXT,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.m,
              lineHeight: theme.typography.lineHeight.m,
            }
          ]}
        >
          No messages yet. Start a conversation!
        </Text>
      </View>
    );
  }, [loading, theme]);

  // Ensure the list scrolls to show the most recent messages
  const onContentSizeChange = useCallback(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [messages.length]);

  // Show a centered loading indicator when initially loading messages
  if (loading && messages.length === 0) {
    return <LoadingIndicator style={styles.loader} />;
  }

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel="Chat conversation"
      accessibilityRole="list"
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyComponent}
        onContentSizeChange={onContentSizeChange}
        style={styles.list}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingVertical: theme.spacing.m },
          messages.length === 0 && styles.emptyListContent
        ]}
        inverted={true} // Shows newest messages at the bottom
        onEndReached={onEndReached} // Triggered when scrolling to top (older messages)
        onEndReachedThreshold={0.2}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              colors={[theme.colors.PRIMARY]}
              tintColor={theme.colors.PRIMARY}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyListContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatList;