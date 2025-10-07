/**
 * Navigation Context Hook
 *
 * Provides navigation state and utilities across components
 */

import { useState, useCallback, useEffect } from 'react';
import type { NavigationItem, BreadcrumbItem } from '../../../types/navigation';
import { buildBreadcrumbs } from '../utils/navigationHelpers';

interface UseNavigationContextReturn {
  breadcrumbs: BreadcrumbItem[];
  recentPages: NavigationItem[];
  favoritePages: NavigationItem[];
  addRecentPage: (item: NavigationItem) => void;
  toggleFavorite: (itemId: string) => void;
  clearRecent: () => void;
}

const MAX_RECENT_PAGES = 10;

export function useNavigationContext(
  currentPath: string = '/',
  navigationItems: NavigationItem[] = [],
): UseNavigationContextReturn {
  const [recentPages, setRecentPages] = useState<NavigationItem[]>([]);
  const [favoritePages, setFavoritePages] = useState<NavigationItem[]>([]);

  // Build breadcrumbs from current path
  const breadcrumbs = buildBreadcrumbs(currentPath, navigationItems);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem('astral-turf-recent-pages');
      const storedFavorites = localStorage.getItem('astral-turf-favorite-pages');

      if (storedRecent) {
        setRecentPages(JSON.parse(storedRecent) as NavigationItem[]);
      }

      if (storedFavorites) {
        setFavoritePages(JSON.parse(storedFavorites) as NavigationItem[]);
      }
    } catch {
      // Silent fail - localStorage might be disabled
    }
  }, []);

  // Add page to recent history
  const addRecentPage = useCallback((item: NavigationItem) => {
    setRecentPages(prev => {
      // Remove duplicates
      const filtered = prev.filter(p => p.id !== item.id);

      // Add to front
      const updated = [item, ...filtered].slice(0, MAX_RECENT_PAGES);

      // Save to localStorage
      try {
        localStorage.setItem('astral-turf-recent-pages', JSON.stringify(updated));
      } catch {
        // Silent fail
      }

      return updated;
    });
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback((itemId: string) => {
    setFavoritePages(prev => {
      const exists = prev.some(p => p.id === itemId);

      let updated: NavigationItem[];
      if (exists) {
        // Remove from favorites
        updated = prev.filter(p => p.id !== itemId);
      } else {
        // Add to favorites (need to find the full item)
        const item = recentPages.find(p => p.id === itemId);
        if (item) {
          updated = [...prev, item];
        } else {
          updated = prev;
        }
      }

      // Save to localStorage
      try {
        localStorage.setItem('astral-turf-favorite-pages', JSON.stringify(updated));
      } catch {
        // Silent fail
      }

      return updated;
    });
  }, [recentPages]);

  // Clear recent history
  const clearRecent = useCallback(() => {
    setRecentPages([]);
    try {
      localStorage.removeItem('astral-turf-recent-pages');
    } catch {
      // Silent fail
    }
  }, []);

  return {
    breadcrumbs,
    recentPages,
    favoritePages,
    addRecentPage,
    toggleFavorite,
    clearRecent,
  };
}
