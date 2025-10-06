/**
 * Haptic Feedback Utility
 *
 * Provides visual and (where supported) actual haptic feedback for user interactions.
 * Simulates native app-like tactile responses on web.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

/**
 * Triggers haptic feedback (if supported by device)
 * Falls back to visual feedback only on unsupported devices
 */
export function triggerHaptic(type: HapticType = 'medium'): void {
  // Check if Vibration API is supported
  if ('vibrate' in navigator) {
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      error: [20, 50, 20, 50, 20],
      warning: [15, 30, 15],
    };

    navigator.vibrate(patterns[type]);
  }

  // Visual feedback is handled via CSS classes
}

/**
 * Add haptic feedback to a DOM element
 * Adds visual pulse effect via CSS class
 */
export function addHapticFeedback(element: HTMLElement | null, type: HapticType = 'medium'): void {
  if (!element) {
    return;
  }

  // Trigger actual haptic if supported
  triggerHaptic(type);

  // Add visual pulse class
  element.classList.add(`haptic-${type}`);

  // Remove class after animation completes
  setTimeout(() => {
    element.classList.remove(`haptic-${type}`);
  }, 300);
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  const trigger = (type: HapticType = 'medium') => {
    triggerHaptic(type);
  };

  const addToElement = (element: HTMLElement | null, type: HapticType = 'medium') => {
    addHapticFeedback(element, type);
  };

  return { trigger, addToElement };
}

/**
 * Higher-order function to add haptic feedback to event handlers
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  handler: T,
  type: HapticType = 'medium'
): T {
  return ((...args: unknown[]) => {
    triggerHaptic(type);
    return handler(...args);
  }) as T;
}

/**
 * Add haptic feedback to button clicks
 */
export function hapticButton(
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void,
  type: HapticType = 'medium'
) {
  return {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHaptic(type);
      addHapticFeedback(e.currentTarget, type);
      onClick?.(e);
    },
  };
}

/**
 * Presets for common interaction types
 */
export const HapticPresets = {
  buttonClick: () => triggerHaptic('medium'),
  iconButton: () => triggerHaptic('light'),
  toggle: () => triggerHaptic('light'),
  submit: () => triggerHaptic('success'),
  delete: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  drag: () => triggerHaptic('light'),
  drop: () => triggerHaptic('medium'),
  selection: () => triggerHaptic('light'),
};
