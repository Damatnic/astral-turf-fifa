/**
 * Focus Management Hooks
 *
 * Provides comprehensive focus management for modals, dialogs, and complex UIs:
 * - Focus trapping (prevent focus from leaving modal)
 * - Focus restoration (return focus after modal closes)
 * - Initial focus management
 * - Focus-visible support (keyboard-only focus indicators)
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll(selector));
}

/**
 * Focus Trap Hook
 *
 * Traps keyboard focus within a container (for modals/dialogs)
 *
 * @example
 * ```tsx
 * function Modal() {
 *   const modalRef = useFocusTrap<HTMLDivElement>();
 *   return <div ref={modalRef}>Modal content</div>;
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(active = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active || !ref.current) {
      return;
    }

    const container = ref.current;
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      // Shift + Tab (backwards)
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active]);

  return ref;
}

/**
 * Focus Restoration Hook
 *
 * Saves current focus and restores it when component unmounts
 * Useful for modals that should return focus to the trigger button
 *
 * @example
 * ```tsx
 * function Modal({ onClose }) {
 *   useFocusRestoration();
 *   return <div>Modal content</div>;
 * }
 * ```
 */
export function useFocusRestoration() {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Save currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    return () => {
      // Restore focus on unmount
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, []);
}

/**
 * Initial Focus Hook
 *
 * Sets focus to a specific element on mount
 *
 * @example
 * ```tsx
 * function Form() {
 *   const inputRef = useInitialFocus<HTMLInputElement>();
 *   return <input ref={inputRef} />;
 * }
 * ```
 */
export function useInitialFocus<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return ref;
}

/**
 * Focus-Visible Hook
 *
 * Detects if user is navigating with keyboard (for focus indicators)
 * Returns true if last interaction was keyboard-based
 *
 * @example
 * ```tsx
 * function Button() {
 *   const isKeyboardUser = useFocusVisible();
 *   return (
 *     <button className={isKeyboardUser ? 'focus-ring' : ''}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useFocusVisible() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = () => setIsKeyboardUser(true);
    const handleMouseDown = () => setIsKeyboardUser(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}

/**
 * Focus Management Utilities
 */
export const focusManagement = {
  /**
   * Move focus to next focusable element
   */
  focusNext: (container?: HTMLElement) => {
    const root = container || document.body;
    const focusableElements = getFocusableElements(root);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    }
  },

  /**
   * Move focus to previous focusable element
   */
  focusPrevious: (container?: HTMLElement) => {
    const root = container || document.body;
    const focusableElements = getFocusableElements(root);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    }
  },

  /**
   * Focus first element in container
   */
  focusFirst: (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  },

  /**
   * Focus last element in container
   */
  focusLast: (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  },

  /**
   * Check if element is focusable
   */
  isFocusable: (element: HTMLElement): boolean => {
    return getFocusableElements(element.parentElement || document.body).includes(element);
  },
};

export default {
  useFocusTrap,
  useFocusRestoration,
  useInitialFocus,
  useFocusVisible,
  focusManagement,
};
