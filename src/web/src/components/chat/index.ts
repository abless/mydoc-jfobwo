/**
 * This barrel file exports all chat-related components from the chat directory,
 * making them available through a single import statement.
 * These components implement the LLM Health Chat feature enabling users to
 * interact with an AI for personalized health advice.
 * 
 * @version 1.0.0
 */

// Import chat components from their individual files
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import ChatList from './ChatList';

// Re-export components as named exports
export { ChatBubble, ChatInput, ChatList };