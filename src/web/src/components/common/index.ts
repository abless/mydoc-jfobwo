/**
 * Common UI components index file
 * 
 * This file exports all reusable UI components from the common directory,
 * providing a centralized import point for these components throughout
 * the Health Advisor application.
 * 
 * By using this index file, other parts of the application can import
 * multiple common components with a single import statement:
 * import { Avatar, DatePicker, ErrorMessage } from '../components/common';
 */

// Import components
import Avatar from './Avatar';
import DatePicker from './DatePicker';
import ErrorMessage from './ErrorMessage';
import Header from './Header';
import LoadingIndicator from './LoadingIndicator';
import SearchBar from './SearchBar';

// Export all components as named exports
export {
  Avatar,
  DatePicker,
  ErrorMessage,
  Header,
  LoadingIndicator,
  SearchBar
};