/**
 * QUANTUM'S UTILITIES INDEX
 * Central export hub for all UI/UX perfection utilities
 */

// Core Utilities
export * from './cn';
export * from './tacticsValidation';

// Performance & Optimization
export * from './performance';
export * from './accessibility';
export * from './themeManager';

// Testing & Validation
export * from './validation';
export * from './testing';
export * from './qualityAssurance';

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

  // Performance monitoring
  PerformanceMonitor,

  // Accessibility management
  AccessibilityManager,
  FocusManager,

  // Theme management
  ThemeManager,
} from './qualityAssurance';

// Types for easy importing
export type {
  QualityDashboard,
  ValidationReport,
  MonitoringReport,
  PerformanceMetrics,
  AccessibilityIssue,
  ThemePreferences,
} from './qualityAssurance';
