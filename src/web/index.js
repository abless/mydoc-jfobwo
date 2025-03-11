import { AppRegistry } from 'react-native'; // ^0.71.0
import App from './App';
import { name as appName } from './app.json';

/**
 * Registers the App component with React Native's AppRegistry.
 * This is the entry point for the React Native application.
 *
 * LD1: Registers the App component with the name 'HealthAdvisor'
 * IE1: The App component is imported from './App'
 * IE2: The appName is imported from './app.json'
 */
AppRegistry.registerComponent(appName, () => App);