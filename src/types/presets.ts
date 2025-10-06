/**
 * Tactical Presets Type Definitions
 * Defines the structure for saving, loading, and managing tactical presets
 */

export type PresetCategory =
  | 'attacking'
  | 'defensive'
  | 'pressing'
  | 'counter-attack'
  | 'possession'
  | 'balanced'
  | 'custom';

export interface PlayerPresetData {
  id: string;
  position: {
    x: number;
    y: number;
  };
  role?: string;
  instructions?: string[];
  attributes?: Record<string, number>;
}

export interface TacticalInstructions {
  defensiveLine?: 'high' | 'medium' | 'low';
  width?: 'narrow' | 'standard' | 'wide';
  tempo?: 'slow' | 'medium' | 'fast';
  passingStyle?: 'short' | 'mixed' | 'direct';
  pressingIntensity?: 'low' | 'medium' | 'high';
  counterAttack?: boolean;
  offside?: boolean;
}

export interface PresetMetadata {
  id: string;
  name: string;
  description?: string;
  category: PresetCategory;
  formation: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  tags?: string[];
  isPublic?: boolean;
  rating?: number;
  usageCount?: number;
}

export interface TacticalPreset {
  metadata: PresetMetadata;
  players: PlayerPresetData[];
  tacticalInstructions: TacticalInstructions;
  thumbnail?: string; // Base64 encoded image
}

export interface PresetLibrary {
  presets: TacticalPreset[];
  lastSyncedAt?: number;
  version: string;
}

export interface PresetFilter {
  category?: PresetCategory;
  formation?: string;
  tags?: string[];
  searchTerm?: string;
  minRating?: number;
}

export interface PresetExportData {
  version: string;
  exportedAt: number;
  presets: TacticalPreset[];
}

export interface CloudSyncStatus {
  isSyncing: boolean;
  lastSyncedAt?: number;
  error?: string;
  pendingChanges: number;
}
