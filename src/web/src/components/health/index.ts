/**
 * Barrel file for health-related components in the Health Advisor mobile application.
 * Exports components used for health data display and navigation, centralizing imports
 * to improve maintainability and simplify component usage throughout the application.
 * 
 * This file addresses:
 * - Health Log Navigation (Technical Specifications/4. Process Flowchart/4.1 System Workflows/4.1.1 Core Business Processes)
 * - Health History Log (Product Requirements/Feature Catalog/Health Data Management Features)
 */

import CalendarView from './CalendarView';
import HealthItemList from './HealthItemList';

export { CalendarView, HealthItemList };