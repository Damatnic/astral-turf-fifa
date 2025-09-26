import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, designTokens, ThemeMode } from '../../context/ThemeContext';
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedSwitch,
} from './InteractiveComponents';
import { AccessibleModal } from './AccessibilityComponents';

// Personalization Types
export interface UserPreferences {
  theme: {
    mode: ThemeMode;
    primaryColor: string;
    accentColor: string;
    customColors?: {
      [key: string]: string;
    };
  };
  layout: {
    density: 'compact' | 'comfortable' | 'spacious';
    sidebarPosition: 'left' | 'right';
    sidebarCollapsed: boolean;
    showAnimations: boolean;
    reduceMotion: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    focusIndicators: boolean;
    screenReaderOptimizations: boolean;
    keyboardNavigation: boolean;
  };
  dashboard: {
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      visible: boolean;
    }>;
    layout: 'grid' | 'list' | 'masonry';
  };
  shortcuts: {
    [key: string]: string;
  };
  notifications: {
    desktop: boolean;
    sound: boolean;
    frequency: 'all' | 'important' | 'minimal';
  };
}

const defaultPreferences: UserPreferences = {
  theme: {
    mode: 'system',
    primaryColor: '#0ea5e9',
    accentColor: '#22c55e',
  },
  layout: {
    density: 'comfortable',
    sidebarPosition: 'left',
    sidebarCollapsed: false,
    showAnimations: true,
    reduceMotion: false,
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    focusIndicators: true,
    screenReaderOptimizations: false,
    keyboardNavigation: true,
  },
  dashboard: {
    widgets: [],
    layout: 'grid',
  },
  shortcuts: {},
  notifications: {
    desktop: true,
    sound: false,
    frequency: 'important',
  },
};

// Personalization Context
interface PersonalizationContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  exportPreferences: () => string;
  importPreferences: (data: string) => void;
  getPreferenceValue: <T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T]
  ) => UserPreferences[T][keyof UserPreferences[T]];
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export const PersonalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('user-preferences');
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('user-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev };
      Object.keys(updates).forEach(key => {
        const category = key as keyof UserPreferences;
        updated[category] = { ...updated[category], ...updates[category] };
      });
      return updated;
    });
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('user-preferences');
  };

  const exportPreferences = () => {
    return JSON.stringify(preferences, null, 2);
  };

  const importPreferences = (data: string) => {
    try {
      const imported = JSON.parse(data);
      setPreferences({ ...defaultPreferences, ...imported });
    } catch (_error) {
      console.error('Failed to import preferences:', _error);
    }
  };

  const getPreferenceValue = <T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T],
  ) => {
    return preferences[category][key];
  };

  return (
    <PersonalizationContext.Provider
      value={{
        preferences,
        updatePreferences,
        resetPreferences,
        exportPreferences,
        importPreferences,
        getPreferenceValue,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
};

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within PersonalizationProvider');
  }
  return context;
};

// Theme Customizer Component
interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const { theme, setThemeMode, themeMode } = useTheme();
  const { preferences, updatePreferences } = usePersonalization();
  const [customColors, setCustomColors] = useState({
    primary: preferences.theme.primaryColor,
    accent: preferences.theme.accentColor,
  });

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    updatePreferences({
      theme: { ...preferences.theme, mode },
    });
  };

  const handleColorChange = (colorType: 'primary' | 'accent', color: string) => {
    setCustomColors(prev => ({ ...prev, [colorType]: color }));
    updatePreferences({
      theme: {
        ...preferences.theme,
        [colorType === 'primary' ? 'primaryColor' : 'accentColor']: color,
      },
    });
  };

  const presetColors = [
    { name: 'Blue', value: '#0ea5e9' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Teal', value: '#14b8a6' },
  ];

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Theme Customizer"
      description="Customize your application's appearance"
      size="lg"
    >
      <div className="space-y-8">
        {/* Theme Mode Selection */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Theme Mode
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
              <EnhancedButton
                key={mode}
                variant={themeMode === mode ? 'primary' : 'secondary'}
                onClick={() => handleThemeModeChange(mode)}
                className="capitalize"
              >
                {mode}
              </EnhancedButton>
            ))}
          </div>
        </div>

        {/* Primary Color */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Primary Color
          </h4>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {presetColors.map(color => (
              <button
                key={color.name}
                className="relative w-full aspect-square rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: color.value,
                  borderColor:
                    customColors.primary === color.value
                      ? theme.colors.text.primary
                      : 'transparent',
                  focusRingColor: theme.colors.accent.primary,
                }}
                onClick={() => handleColorChange('primary', color.value)}
                aria-label={`Set primary color to ${color.name}`}
              >
                {customColors.primary === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <EnhancedInput
            type="color"
            value={customColors.primary}
            onChange={e => handleColorChange('primary', e.target.value)}
            label="Custom Primary Color"
            className="w-full"
          />
        </div>

        {/* Accent Color */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Accent Color
          </h4>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {presetColors.map(color => (
              <button
                key={color.name}
                className="relative w-full aspect-square rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: color.value,
                  borderColor:
                    customColors.accent === color.value ? theme.colors.text.primary : 'transparent',
                  focusRingColor: theme.colors.accent.primary,
                }}
                onClick={() => handleColorChange('accent', color.value)}
                aria-label={`Set accent color to ${color.name}`}
              >
                {customColors.accent === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <EnhancedInput
            type="color"
            value={customColors.accent}
            onChange={e => handleColorChange('accent', e.target.value)}
            label="Custom Accent Color"
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div
          className="flex justify-end space-x-3 pt-6 border-t"
          style={{ borderColor: theme.colors.border.primary }}
        >
          <EnhancedButton variant="secondary" onClick={onClose}>
            Close
          </EnhancedButton>
        </div>
      </div>
    </AccessibleModal>
  );
};

// Layout Preferences Component
interface LayoutPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LayoutPreferences: React.FC<LayoutPreferencesProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { preferences, updatePreferences } = usePersonalization();

  const handleLayoutChange = (key: keyof UserPreferences['layout'], value: unknown) => {
    updatePreferences({
      layout: { ...preferences.layout, [key]: value },
    });
  };

  const densityOptions = [
    { value: 'compact', label: 'Compact', description: 'More content, less spacing' },
    { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing and content' },
    { value: 'spacious', label: 'Spacious', description: 'More spacing, less content' },
  ];

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Layout Preferences"
      description="Customize your application's layout and behavior"
      size="md"
    >
      <div className="space-y-6">
        {/* Density */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Interface Density
          </h4>
          <div className="space-y-3">
            {densityOptions.map(option => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border"
                style={{
                  borderColor:
                    preferences.layout.density === option.value
                      ? theme.colors.accent.primary
                      : theme.colors.border.primary,
                  backgroundColor:
                    preferences.layout.density === option.value
                      ? `${theme.colors.accent.primary}10`
                      : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="density"
                  value={option.value}
                  checked={preferences.layout.density === option.value}
                  onChange={e => handleLayoutChange('density', e.target.value)}
                  className="sr-only"
                />
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: theme.colors.accent.primary }}
                >
                  {preferences.layout.density === option.value && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.colors.accent.primary }}
                    />
                  )}
                </div>
                <div>
                  <div className="font-medium" style={{ color: theme.colors.text.primary }}>
                    {option.label}
                  </div>
                  <div className="text-sm" style={{ color: theme.colors.text.secondary }}>
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Sidebar Position */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Sidebar Position
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {(['left', 'right'] as const).map(position => (
              <EnhancedButton
                key={position}
                variant={preferences.layout.sidebarPosition === position ? 'primary' : 'secondary'}
                onClick={() => handleLayoutChange('sidebarPosition', position)}
                className="capitalize"
              >
                {position}
              </EnhancedButton>
            ))}
          </div>
        </div>

        {/* Animation Settings */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>
            Animations & Motion
          </h4>

          <EnhancedSwitch
            checked={preferences.layout.showAnimations}
            onChange={checked => handleLayoutChange('showAnimations', checked)}
            label="Enable Animations"
          />

          <EnhancedSwitch
            checked={preferences.layout.reduceMotion}
            onChange={checked => handleLayoutChange('reduceMotion', checked)}
            label="Reduce Motion (for accessibility)"
          />
        </div>

        {/* Actions */}
        <div
          className="flex justify-end space-x-3 pt-6 border-t"
          style={{ borderColor: theme.colors.border.primary }}
        >
          <EnhancedButton variant="secondary" onClick={onClose}>
            Close
          </EnhancedButton>
        </div>
      </div>
    </AccessibleModal>
  );
};

// Accessibility Preferences Component
interface AccessibilityPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPreferences: React.FC<AccessibilityPreferencesProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();
  const { preferences, updatePreferences } = usePersonalization();

  const handleAccessibilityChange = (
    key: keyof UserPreferences['accessibility'],
    value: unknown,
  ) => {
    updatePreferences({
      accessibility: { ...preferences.accessibility, [key]: value },
    });
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Small', size: '14px' },
    { value: 'medium', label: 'Medium', size: '16px' },
    { value: 'large', label: 'Large', size: '18px' },
    { value: 'extra-large', label: 'Extra Large', size: '20px' },
  ];

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Accessibility Preferences"
      description="Configure accessibility features and options"
      size="md"
    >
      <div className="space-y-6">
        {/* Font Size */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Font Size
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {fontSizeOptions.map(option => (
              <button
                key={option.value}
                className="p-3 rounded-lg border text-left focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  borderColor:
                    preferences.accessibility.fontSize === option.value
                      ? theme.colors.accent.primary
                      : theme.colors.border.primary,
                  backgroundColor:
                    preferences.accessibility.fontSize === option.value
                      ? `${theme.colors.accent.primary}10`
                      : theme.colors.background.secondary,
                  focusRingColor: theme.colors.accent.primary,
                }}
                onClick={() => handleAccessibilityChange('fontSize', option.value)}
              >
                <div className="font-medium" style={{ color: theme.colors.text.primary }}>
                  {option.label}
                </div>
                <div style={{ fontSize: option.size, color: theme.colors.text.secondary }}>
                  Sample text
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility Toggles */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium" style={{ color: theme.colors.text.primary }}>
            Accessibility Features
          </h4>

          <EnhancedSwitch
            checked={preferences.accessibility.highContrast}
            onChange={checked => handleAccessibilityChange('highContrast', checked)}
            label="High Contrast Mode"
          />

          <EnhancedSwitch
            checked={preferences.accessibility.focusIndicators}
            onChange={checked => handleAccessibilityChange('focusIndicators', checked)}
            label="Enhanced Focus Indicators"
          />

          <EnhancedSwitch
            checked={preferences.accessibility.screenReaderOptimizations}
            onChange={checked => handleAccessibilityChange('screenReaderOptimizations', checked)}
            label="Screen Reader Optimizations"
          />

          <EnhancedSwitch
            checked={preferences.accessibility.keyboardNavigation}
            onChange={checked => handleAccessibilityChange('keyboardNavigation', checked)}
            label="Enhanced Keyboard Navigation"
          />
        </div>

        {/* Actions */}
        <div
          className="flex justify-end space-x-3 pt-6 border-t"
          style={{ borderColor: theme.colors.border.primary }}
        >
          <EnhancedButton variant="secondary" onClick={onClose}>
            Close
          </EnhancedButton>
        </div>
      </div>
    </AccessibleModal>
  );
};

// Preferences Export/Import Component
interface PreferencesBackupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PreferencesBackup: React.FC<PreferencesBackupProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { exportPreferences, importPreferences, resetPreferences } = usePersonalization();
  const [importData, setImportData] = useState('');
  const [exportedData, setExportedData] = useState('');

  const handleExport = () => {
    const data = exportPreferences();
    setExportedData(data);

    // Copy to clipboard
    navigator.clipboard.writeText(data);
  };

  const handleImport = () => {
    if (importData.trim()) {
      importPreferences(importData);
      setImportData('');
      onClose();
    }
  };

  const handleReset = () => {
    if (
      confirm('Are you sure you want to reset all preferences to default? This cannot be undone.')
    ) {
      resetPreferences();
      onClose();
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Backup & Restore Preferences"
      description="Export, import, or reset your personalization settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Export Section */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Export Preferences
          </h4>
          <p className="text-sm mb-4" style={{ color: theme.colors.text.secondary }}>
            Export your current preferences to backup or share with other devices.
          </p>
          <EnhancedButton onClick={handleExport} className="mb-4">
            Export & Copy to Clipboard
          </EnhancedButton>
          {exportedData && (
            <textarea
              value={exportedData}
              readOnly
              className="w-full h-32 p-3 rounded-lg border font-mono text-xs"
              style={{
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.border.primary,
                color: theme.colors.text.primary,
              }}
            />
          )}
        </div>

        {/* Import Section */}
        <div>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Import Preferences
          </h4>
          <p className="text-sm mb-4" style={{ color: theme.colors.text.secondary }}>
            Paste exported preferences data to restore your settings.
          </p>
          <textarea
            value={importData}
            onChange={e => setImportData(e.target.value)}
            placeholder="Paste exported preferences JSON here..."
            className="w-full h-32 p-3 rounded-lg border font-mono text-xs mb-4"
            style={{
              backgroundColor: theme.colors.background.primary,
              borderColor: theme.colors.border.primary,
              color: theme.colors.text.primary,
            }}
          />
          <EnhancedButton onClick={handleImport} disabled={!importData.trim()} variant="primary">
            Import Preferences
          </EnhancedButton>
        </div>

        {/* Reset Section */}
        <div className="pt-6 border-t" style={{ borderColor: theme.colors.border.primary }}>
          <h4 className="text-lg font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            Reset Preferences
          </h4>
          <p className="text-sm mb-4" style={{ color: theme.colors.text.secondary }}>
            Reset all preferences to their default values. This action cannot be undone.
          </p>
          <EnhancedButton onClick={handleReset} variant="danger">
            Reset to Defaults
          </EnhancedButton>
        </div>

        {/* Actions */}
        <div
          className="flex justify-end space-x-3 pt-6 border-t"
          style={{ borderColor: theme.colors.border.primary }}
        >
          <EnhancedButton variant="secondary" onClick={onClose}>
            Close
          </EnhancedButton>
        </div>
      </div>
    </AccessibleModal>
  );
};

export default {
  PersonalizationProvider,
  usePersonalization,
  ThemeCustomizer,
  LayoutPreferences,
  AccessibilityPreferences,
  PreferencesBackup,
};
