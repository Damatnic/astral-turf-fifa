/**
 * Keyboard Shortcuts Hook
 *
 * Manages keyboard shortcut bindings and triggers
 */

import { useEffect, useCallback } from 'react';
import type { KeyboardShortcut, ToolId } from '../../../types/toolbar';

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  onShortcutTrigger: (toolId: ToolId) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  onShortcutTrigger,
  enabled = true,
}: UseKeyboardShortcutsProps): void {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) {
      return;
    }

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Find matching shortcut
    const matchedShortcut = shortcuts.find(shortcut => {
      // Check key match
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      if (!keyMatch) {
        return false;
      }

      // Check modifiers
      const modifiers = shortcut.modifiers || [];
      const ctrlMatch = modifiers.includes('ctrl') === (event.ctrlKey || event.metaKey);
      const shiftMatch = modifiers.includes('shift') === event.shiftKey;
      const altMatch = modifiers.includes('alt') === event.altKey;

      // If no modifiers specified, ensure no modifiers pressed
      if (modifiers.length === 0) {
        return !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
      }

      return ctrlMatch && shiftMatch && altMatch;
    });

    if (matchedShortcut) {
      event.preventDefault();
      event.stopPropagation();
      onShortcutTrigger(matchedShortcut.toolId);
    }
  }, [shortcuts, onShortcutTrigger, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, enabled]);
}
