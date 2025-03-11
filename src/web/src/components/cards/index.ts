/**
 * index.ts
 * 
 * Barrel file that exports all card components from the cards directory.
 * This provides a centralized import point for card components used
 * throughout the Health Advisor mobile application, improving code organization
 * and maintainability.
 */

// Import card components
import Card from './Card';
import HealthDataCard from './HealthDataCard';

// Re-export components as named exports
export { Card, HealthDataCard };