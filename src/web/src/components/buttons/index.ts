/**
 * Button component exports for the Health Advisor application.
 * Provides a centralized import point for button components used throughout the app.
 * 
 * Supports both named imports: import { Button, IconButton } from '../components/buttons';
 * And default import: import Buttons from '../components/buttons';
 */

// Import button components
import Button from './Button';
import IconButton from './IconButton';

// Export as named exports for destructured imports
export { Button, IconButton };

// Export as default object for namespace imports
export default {
  Button,
  IconButton
};