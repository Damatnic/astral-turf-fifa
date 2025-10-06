import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  TacticalPreset,
  PresetLibrary,
  PresetFilter,
  PresetCategory,
  CloudSyncStatus,
  PresetExportData,
  PresetMetadata,
} from '../types/presets';

const STORAGE_KEY = 'astral_turf_tactical_presets';
const LIBRARY_VERSION = '1.0.0';

interface UseTacticalPresetsOptions {
  autoSync?: boolean;
  syncInterval?: number; // milliseconds
}

interface UseTacticalPresetsReturn {
  // State
  presets: TacticalPreset[];
  filteredPresets: TacticalPreset[];
  selectedPreset: TacticalPreset | null;
  filter: PresetFilter;
  syncStatus: CloudSyncStatus;
  isLoading: boolean;

  // Actions
  createPreset: (
    preset: Omit<TacticalPreset, 'metadata'> & {
      metadata: Omit<PresetMetadata, 'id' | 'createdAt' | 'updatedAt' | 'version'>;
    }
  ) => Promise<TacticalPreset>;
  updatePreset: (id: string, updates: Partial<TacticalPreset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  duplicatePreset: (id: string) => Promise<TacticalPreset>;
  selectPreset: (id: string | null) => void;

  // Filtering
  setFilter: (filter: Partial<PresetFilter>) => void;
  clearFilter: () => void;
  searchPresets: (searchTerm: string) => void;
  filterByCategory: (category: PresetCategory) => void;
  filterByFormation: (formation: string) => void;

  // Import/Export
  exportPreset: (id: string) => PresetExportData;
  exportAllPresets: () => PresetExportData;
  importPresets: (data: PresetExportData) => Promise<number>;
  exportToFile: (id?: string) => void;
  importFromFile: (file: File) => Promise<number>;

  // Cloud Sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;

  // Utilities
  getPresetById: (id: string) => TacticalPreset | undefined;
  getPresetsByCategory: (category: PresetCategory) => TacticalPreset[];
  getPresetStats: () => {
    total: number;
    byCategory: Record<PresetCategory, number>;
    mostUsed: TacticalPreset[];
  };
}

/**
 * Hook for managing tactical presets library
 */
export function useTacticalPresets(
  options: UseTacticalPresetsOptions = {}
): UseTacticalPresetsReturn {
  const { autoSync = false, syncInterval = 60000 } = options;

  const [library, setLibrary] = useState<PresetLibrary>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse preset library:', error);
      }
    }
    return { presets: [], version: LIBRARY_VERSION };
  });

  const [selectedPreset, setSelectedPreset] = useState<TacticalPreset | null>(null);
  const [filter, setFilterState] = useState<PresetFilter>({});
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>({
    isSyncing: false,
    pendingChanges: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage whenever library changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync) {
      return;
    }

    const interval = setInterval(() => {
      syncToCloud();
    }, syncInterval);

    return () => {
      clearInterval(interval);
    };
  }, [autoSync, syncInterval]);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    let result = [...library.presets];

    if (filter.category) {
      result = result.filter(p => p.metadata.category === filter.category);
    }

    if (filter.formation) {
      result = result.filter(p => p.metadata.formation === filter.formation);
    }

    if (filter.tags && filter.tags.length > 0) {
      result = result.filter(p => p.metadata.tags?.some(tag => filter.tags?.includes(tag)));
    }

    if (filter.minRating !== undefined) {
      result = result.filter(p => (p.metadata.rating ?? 0) >= filter.minRating!);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.metadata.name.toLowerCase().includes(term) ||
          p.metadata.description?.toLowerCase().includes(term) ||
          p.metadata.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return result;
  }, [library.presets, filter]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Create preset
  const createPreset = useCallback(
    async (
      preset: Omit<TacticalPreset, 'metadata'> & {
        metadata: Omit<
          import('../types/presets').PresetMetadata,
          'id' | 'createdAt' | 'updatedAt' | 'version'
        >;
      }
    ): Promise<TacticalPreset> => {
      const now = Date.now();
      const newPreset: TacticalPreset = {
        ...preset,
        metadata: {
          ...preset.metadata,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          version: 1,
          usageCount: 0,
        },
      };

      setLibrary(prev => ({
        ...prev,
        presets: [...prev.presets, newPreset],
      }));

      setSyncStatus(prev => ({
        ...prev,
        pendingChanges: prev.pendingChanges + 1,
      }));

      return newPreset;
    },
    [generateId]
  );

  // Update preset
  const updatePreset = useCallback(async (id: string, updates: Partial<TacticalPreset>) => {
    setLibrary(prev => ({
      ...prev,
      presets: prev.presets.map(p =>
        p.metadata.id === id
          ? {
              ...p,
              ...updates,
              metadata: {
                ...p.metadata,
                ...(updates.metadata || {}),
                updatedAt: Date.now(),
                version: p.metadata.version + 1,
              },
            }
          : p
      ),
    }));

    setSyncStatus(prev => ({
      ...prev,
      pendingChanges: prev.pendingChanges + 1,
    }));
  }, []);

  // Delete preset
  const deletePreset = useCallback(
    async (id: string) => {
      setLibrary(prev => ({
        ...prev,
        presets: prev.presets.filter(p => p.metadata.id !== id),
      }));

      if (selectedPreset?.metadata.id === id) {
        setSelectedPreset(null);
      }

      setSyncStatus(prev => ({
        ...prev,
        pendingChanges: prev.pendingChanges + 1,
      }));
    },
    [selectedPreset]
  );

  // Duplicate preset
  const duplicatePreset = useCallback(
    async (id: string): Promise<TacticalPreset> => {
      const original = library.presets.find(p => p.metadata.id === id);
      if (!original) {
        throw new Error(`Preset ${id} not found`);
      }

      const now = Date.now();
      const duplicate: TacticalPreset = {
        ...original,
        metadata: {
          ...original.metadata,
          id: generateId(),
          name: `${original.metadata.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
          version: 1,
          usageCount: 0,
        },
      };

      setLibrary(prev => ({
        ...prev,
        presets: [...prev.presets, duplicate],
      }));

      return duplicate;
    },
    [library.presets, generateId]
  );

  // Select preset
  const selectPreset = useCallback(
    (id: string | null) => {
      if (id === null) {
        setSelectedPreset(null);
        return;
      }

      const preset = library.presets.find(p => p.metadata.id === id);
      if (preset) {
        setSelectedPreset(preset);

        // Increment usage count
        updatePreset(id, {
          metadata: {
            ...preset.metadata,
            usageCount: (preset.metadata.usageCount ?? 0) + 1,
          },
        });
      }
    },
    [library.presets, updatePreset]
  );

  // Set filter
  const setFilter = useCallback((newFilter: Partial<PresetFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilterState({});
  }, []);

  // Search presets
  const searchPresets = useCallback(
    (searchTerm: string) => {
      setFilter({ searchTerm });
    },
    [setFilter]
  );

  // Filter by category
  const filterByCategory = useCallback(
    (category: PresetCategory) => {
      setFilter({ category });
    },
    [setFilter]
  );

  // Filter by formation
  const filterByFormation = useCallback(
    (formation: string) => {
      setFilter({ formation });
    },
    [setFilter]
  );

  // Export preset
  const exportPreset = useCallback(
    (id: string): PresetExportData => {
      const preset = library.presets.find(p => p.metadata.id === id);
      if (!preset) {
        throw new Error(`Preset ${id} not found`);
      }

      return {
        version: LIBRARY_VERSION,
        exportedAt: Date.now(),
        presets: [preset],
      };
    },
    [library.presets]
  );

  // Export all presets
  const exportAllPresets = useCallback((): PresetExportData => {
    return {
      version: LIBRARY_VERSION,
      exportedAt: Date.now(),
      presets: library.presets,
    };
  }, [library.presets]);

  // Import presets
  const importPresets = useCallback(
    async (data: PresetExportData): Promise<number> => {
      const importedPresets = data.presets.map(preset => ({
        ...preset,
        metadata: {
          ...preset.metadata,
          id: generateId(), // Generate new ID to avoid conflicts
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      }));

      setLibrary(prev => ({
        ...prev,
        presets: [...prev.presets, ...importedPresets],
      }));

      return importedPresets.length;
    },
    [generateId]
  );

  // Export to file
  const exportToFile = useCallback(
    (id?: string) => {
      const data = id ? exportPreset(id) : exportAllPresets();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `tactical-presets-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [exportPreset, exportAllPresets]
  );

  // Import from file
  const importFromFile = useCallback(
    async (file: File): Promise<number> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async e => {
          try {
            const content = e.target?.result as string;
            const data: PresetExportData = JSON.parse(content);
            const count = await importPresets(data);
            resolve(count);
          } catch (error) {
            reject(new Error('Failed to parse preset file'));
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
      });
    },
    [importPresets]
  );

  // Sync to cloud (placeholder - implement with actual cloud service)
  const syncToCloud = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: undefined }));

    try {
      // TODO: Implement actual cloud sync
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        pendingChanges: 0,
      }));

      setLibrary(prev => ({
        ...prev,
        lastSyncedAt: Date.now(),
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, []);

  // Sync from cloud (placeholder - implement with actual cloud service)
  const syncFromCloud = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: undefined }));

    try {
      // TODO: Implement actual cloud sync
      await new Promise(resolve => {
        setTimeout(resolve, 1000);
      });

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        pendingChanges: 0,
      }));
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, []);

  // Get preset by ID
  const getPresetById = useCallback(
    (id: string) => {
      return library.presets.find(p => p.metadata.id === id);
    },
    [library.presets]
  );

  // Get presets by category
  const getPresetsByCategory = useCallback(
    (category: PresetCategory) => {
      return library.presets.filter(p => p.metadata.category === category);
    },
    [library.presets]
  );

  // Get preset statistics
  const getPresetStats = useCallback(() => {
    const byCategory: Record<PresetCategory, number> = {
      attacking: 0,
      defensive: 0,
      pressing: 0,
      'counter-attack': 0,
      possession: 0,
      balanced: 0,
      custom: 0,
    };

    library.presets.forEach(preset => {
      byCategory[preset.metadata.category] = (byCategory[preset.metadata.category] || 0) + 1;
    });

    const mostUsed = [...library.presets]
      .sort((a, b) => (b.metadata.usageCount ?? 0) - (a.metadata.usageCount ?? 0))
      .slice(0, 5);

    return {
      total: library.presets.length,
      byCategory,
      mostUsed,
    };
  }, [library.presets]);

  return {
    // State
    presets: library.presets,
    filteredPresets,
    selectedPreset,
    filter,
    syncStatus,
    isLoading,

    // Actions
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    selectPreset,

    // Filtering
    setFilter,
    clearFilter,
    searchPresets,
    filterByCategory,
    filterByFormation,

    // Import/Export
    exportPreset,
    exportAllPresets,
    importPresets,
    exportToFile,
    importFromFile,

    // Cloud Sync
    syncToCloud,
    syncFromCloud,

    // Utilities
    getPresetById,
    getPresetsByCategory,
    getPresetStats,
  };
}
