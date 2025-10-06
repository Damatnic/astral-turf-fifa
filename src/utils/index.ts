/**
 * QUANTUM'S UTILITIES INDEX
 * Central export hub for all UI/UX perfection utilities
 */

// Core Utilities
export * from './cn';
export * from './tacticsValidation';

// Performance & Optimization
export * from './performance';
export * from './themeManager';

// Testing & Validation
export * from './testing';
export * from './qualityAssurance';

// Accessibility - explicit re-export to avoid conflict
export type { AccessibilityIssue } from './accessibility';
export * from './accessibility';

// Validation - export everything except AccessibilityIssue
export type { LighthouseMetrics, LighthouseThresholds, ValidationReport } from './validation';
export { LighthouseValidator, AccessibilityValidator, SEOValidator } from './validation';
export { UIUXValidator as UIUXValidatorFromValidation } from './validation';

// Convenience exports for common use cases
export {
  // Quick access to quality control
  initializePerfectQuality,
  quickQualityCheck,
  validatePerfectScore,
  autoOptimize,

  // Main controllers
  QualityController,
  UIUXValidator,
  QualityMonitor,
  TestRunner,
} from './qualityAssurance';

// Types for easy importing
export type { QualityDashboard } from './qualityAssurance';
