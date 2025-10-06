/**
 * Accessibility Components
 *
 * Export all accessibility-related components and hooks
 */

// Components
export { SkipLinks, skipLinksStyles } from './SkipLinks';
export {
  AnnouncementProvider,
  useAnnouncement,
  useCommonAnnouncements,
  announcementPresets,
  srOnlyStyles,
} from './LiveRegion';
export {
  KeyboardShortcutsHelp,
  KeyboardShortcutsButton,
  GlobalKeyboardShortcutsHelp,
} from './KeyboardShortcutsHelp';

// Hooks
export { useKeyboardShortcuts, useKeyboardShortcutsStore } from '@/hooks/useKeyboardShortcuts';
export {
  useFocusTrap,
  useFocusRestoration,
  useInitialFocus,
  useFocusVisible,
  focusManagement,
} from '@/hooks/useFocusManagement';
export { useHighContrast, highContrastStyles } from '@/hooks/useHighContrast';

// Types
export type { KeyboardShortcut, ShortcutCategory } from '@/hooks/useKeyboardShortcuts';
export type { AnnouncementPoliteness, Announcement } from './LiveRegion';
export type { ContrastMode } from '@/hooks/useHighContrast';
