/**
 * Live Region Component and Hook
 *
 * Provides screen reader announcements for dynamic content changes
 * Uses ARIA live regions to announce updates without moving focus
 *
 * Complies with WCAG 2.1 Success Criterion 4.1.3 (Status Messages)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Announcement types
export type AnnouncementPoliteness = 'polite' | 'assertive' | 'off';

export interface Announcement {
  id: string;
  message: string;
  politeness: AnnouncementPoliteness;
  timestamp: number;
}

// Context for managing announcements
interface AnnouncementContextValue {
  announcements: Announcement[];
  announce: (message: string, politeness?: AnnouncementPoliteness) => void;
  clearAnnouncements: () => void;
}

const AnnouncementContext = createContext<AnnouncementContextValue | null>(null);

/**
 * Announcement Provider
 *
 * Wraps your app to provide screen reader announcement functionality
 *
 * @example
 * ```tsx
 * <AnnouncementProvider>
 *   <App />
 * </AnnouncementProvider>
 * ```
 */
export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Announce a message to screen readers
  const announce = useCallback((message: string, politeness: AnnouncementPoliteness = 'polite') => {
    const announcement: Announcement = {
      id: `announcement-${Date.now()}-${Math.random()}`,
      message,
      politeness,
      timestamp: Date.now(),
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Auto-clear announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 5000);
  }, []);

  // Clear all announcements
  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  const value: AnnouncementContextValue = {
    announcements,
    announce,
    clearAnnouncements,
  };

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
      <LiveRegion announcements={announcements} />
    </AnnouncementContext.Provider>
  );
}

/**
 * Hook to use announcements
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce } = useAnnouncement();
 *
 *   const handleSave = () => {
 *     // ... save logic
 *     announce('Formation saved successfully');
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useAnnouncement() {
  const context = useContext(AnnouncementContext);

  if (!context) {
    throw new Error('useAnnouncement must be used within AnnouncementProvider');
  }

  return context;
}

/**
 * Live Region Component
 *
 * Renders ARIA live regions for screen reader announcements
 * Automatically manages polite and assertive announcements
 */
function LiveRegion({ announcements }: { announcements: Announcement[] }) {
  const politeAnnouncements = announcements.filter(a => a.politeness === 'polite');
  const assertiveAnnouncements = announcements.filter(a => a.politeness === 'assertive');

  return (
    <>
      {/* Polite announcements - read when user is idle */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-region-polite"
      >
        {politeAnnouncements.map(announcement => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>

      {/* Assertive announcements - interrupt current speech */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-region-assertive"
      >
        {assertiveAnnouncements.map(announcement => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
    </>
  );
}

/**
 * Screen-reader only CSS class
 * Use Tailwind's sr-only if available, otherwise use this
 */
export const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .sr-only-focusable:focus,
  .sr-only-focusable:active {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;

/**
 * Announcement Presets
 *
 * Common announcement messages for consistent UX
 */
export const announcementPresets = {
  // Navigation
  pageLoaded: (pageName: string) => `${pageName} page loaded`,
  navigated: (destination: string) => `Navigated to ${destination}`,

  // Forms
  formSubmitted: 'Form submitted successfully',
  formError: 'Please fix the errors in the form',
  fieldError: (fieldName: string, error: string) => `${fieldName}: ${error}`,
  formSaved: 'Changes saved',

  // Loading states
  loading: (context: string) => `Loading ${context}`,
  loadComplete: (context: string) => `${context} loaded successfully`,
  loadError: (context: string) => `Error loading ${context}`,

  // Actions
  itemAdded: (itemName: string) => `${itemName} added`,
  itemRemoved: (itemName: string) => `${itemName} removed`,
  itemUpdated: (itemName: string) => `${itemName} updated`,

  // Tactical Board specific
  playerMoved: (playerName: string, position: string) => `${playerName} moved to ${position}`,
  formationChanged: (formation: string) => `Formation changed to ${formation}`,
  formationSaved: 'Formation saved successfully',
  analysisComplete: (rating: number) =>
    `AI analysis complete. Formation rating: ${rating} out of 100`,

  // Notifications
  success: (message: string) => `Success: ${message}`,
  warning: (message: string) => `Warning: ${message}`,
  error: (message: string) => `Error: ${message}`,
  info: (message: string) => `Info: ${message}`,
};

/**
 * Convenience hook for common announcements
 */
export function useCommonAnnouncements() {
  const { announce } = useAnnouncement();

  return {
    announceSuccess: (message: string) => announce(announcementPresets.success(message), 'polite'),

    announceError: (message: string) => announce(announcementPresets.error(message), 'assertive'),

    announceWarning: (message: string) => announce(announcementPresets.warning(message), 'polite'),

    announceInfo: (message: string) => announce(announcementPresets.info(message), 'polite'),

    announceLoading: (context: string) => announce(announcementPresets.loading(context), 'polite'),

    announceLoadComplete: (context: string) =>
      announce(announcementPresets.loadComplete(context), 'polite'),

    announceNavigation: (destination: string) =>
      announce(announcementPresets.navigated(destination), 'polite'),
  };
}

export default {
  AnnouncementProvider,
  useAnnouncement,
  useCommonAnnouncements,
  announcementPresets,
  srOnlyStyles,
};
