import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Eye, EyeOff, User, Hash, Star, Activity } from 'lucide-react';

export interface PlayerDisplayConfig {
  showNames: boolean;
  showNumbers: boolean;
  showStats: boolean;
  showStamina: boolean;
  showMorale: boolean;
  showAvailability: boolean;
  iconType: 'circle' | 'jersey' | 'photo';
  namePosition: 'above' | 'below' | 'inside';
  size: 'small' | 'medium' | 'large';
}

interface PlayerDisplaySettingsProps {
  config: PlayerDisplayConfig;
  onConfigChange: (config: PlayerDisplayConfig) => void;
  className?: string;
}

const DEFAULT_CONFIG: PlayerDisplayConfig = {
  showNames: true,
  showNumbers: true,
  showStats: false,
  showStamina: true,
  showMorale: true,
  showAvailability: true,
  iconType: 'circle',
  namePosition: 'below',
  size: 'medium',
};

const ICON_TYPES = new Set<PlayerDisplayConfig['iconType']>(['circle', 'jersey', 'photo']);
const NAME_POSITIONS = new Set<PlayerDisplayConfig['namePosition']>(['above', 'below', 'inside']);
const TOKEN_SIZES = new Set<PlayerDisplayConfig['size']>(['small', 'medium', 'large']);
const OPTION_LABELS: Record<'iconType' | 'namePosition' | 'size', string> = {
  iconType: 'Icon Type',
  namePosition: 'Name Position',
  size: 'Token Size',
};

const PlayerDisplaySettings: React.FC<PlayerDisplaySettingsProps> = ({
  config,
  onConfigChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const safeConfig = useMemo(() => {
    const raw = (config ?? {}) as Partial<PlayerDisplayConfig>;
    const merged = { ...DEFAULT_CONFIG, ...raw };

    const coerceBoolean = (value: unknown, fallback: boolean) =>
      typeof value === 'boolean' ? value : fallback;

    const iconType = ICON_TYPES.has(merged.iconType as PlayerDisplayConfig['iconType'])
      ? (merged.iconType as PlayerDisplayConfig['iconType'])
      : DEFAULT_CONFIG.iconType;
    const namePosition = NAME_POSITIONS.has(merged.namePosition as PlayerDisplayConfig['namePosition'])
      ? (merged.namePosition as PlayerDisplayConfig['namePosition'])
      : DEFAULT_CONFIG.namePosition;
    const size = TOKEN_SIZES.has(merged.size as PlayerDisplayConfig['size'])
      ? (merged.size as PlayerDisplayConfig['size'])
      : DEFAULT_CONFIG.size;

    return {
      showNames: coerceBoolean(merged.showNames, DEFAULT_CONFIG.showNames),
      showNumbers: coerceBoolean(merged.showNumbers, DEFAULT_CONFIG.showNumbers),
      showStats: coerceBoolean(merged.showStats, DEFAULT_CONFIG.showStats),
      showStamina: coerceBoolean(merged.showStamina, DEFAULT_CONFIG.showStamina),
      showMorale: coerceBoolean(merged.showMorale, DEFAULT_CONFIG.showMorale),
      showAvailability: coerceBoolean(merged.showAvailability, DEFAULT_CONFIG.showAvailability),
      iconType,
      namePosition,
      size,
    } satisfies PlayerDisplayConfig;
  }, [config]);

  const safeOnConfigChange = useCallback(
    (nextConfig: PlayerDisplayConfig) => {
      if (typeof onConfigChange === 'function') {
        onConfigChange(nextConfig);
      }
    },
    [onConfigChange],
  );

  const applyConfigChange = useCallback(
    (partial: Partial<PlayerDisplayConfig>, message?: string) => {
      const nextConfig = { ...safeConfig, ...partial } as PlayerDisplayConfig;
      safeOnConfigChange(nextConfig);
      if (message) {
        setAnnouncement(message);
      }
    },
    [safeConfig, safeOnConfigChange],
  );

  const handlePanelToggle = useCallback(() => {
    setIsOpen(prev => {
      const nextState = !prev;
      setAnnouncement(`Display settings ${nextState ? 'opened' : 'closed'}`);
      return nextState;
    });
  }, [setAnnouncement]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setAnnouncement('Display settings closed');
  }, [setAnnouncement]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closePanel]);

  type ToggleKey =
    | 'showNames'
    | 'showNumbers'
    | 'showStats'
    | 'showStamina'
    | 'showMorale'
    | 'showAvailability';

  const handleToggle = useCallback(
    (key: ToggleKey, label: string) => {
      const nextValue = !safeConfig[key];
      applyConfigChange(
        { [key]: nextValue } as Pick<PlayerDisplayConfig, ToggleKey>,
        `${label} ${nextValue ? 'enabled' : 'disabled'}`,
      );
    },
    [safeConfig, applyConfigChange],
  );

  const handleSelectOption = useCallback(
    (key: 'iconType' | 'namePosition' | 'size', value: string, optionLabel: string) => {
      let normalizedValue:
        | PlayerDisplayConfig['iconType']
        | PlayerDisplayConfig['namePosition']
        | PlayerDisplayConfig['size'];

      if (key === 'iconType') {
        normalizedValue = ICON_TYPES.has(value as PlayerDisplayConfig['iconType'])
          ? (value as PlayerDisplayConfig['iconType'])
          : DEFAULT_CONFIG.iconType;
      } else if (key === 'namePosition') {
        normalizedValue = NAME_POSITIONS.has(value as PlayerDisplayConfig['namePosition'])
          ? (value as PlayerDisplayConfig['namePosition'])
          : DEFAULT_CONFIG.namePosition;
      } else {
        normalizedValue = TOKEN_SIZES.has(value as PlayerDisplayConfig['size'])
          ? (value as PlayerDisplayConfig['size'])
          : DEFAULT_CONFIG.size;
      }

      applyConfigChange(
        { [key]: normalizedValue } as Partial<PlayerDisplayConfig>,
        `${OPTION_LABELS[key]} set to ${optionLabel}`,
      );
    },
    [applyConfigChange],
  );

  const ToggleOption: React.FC<{
    label: string;
    icon: React.ReactNode;
    enabled: boolean;
    onToggle: () => void;
    description?: string;
    testId: string;
  }> = ({ label, icon, enabled, onToggle, description, testId }) => (
    <motion.div
      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700 transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <div>
          <div className="text-white font-medium text-sm">{label}</div>
          {description && <div className="text-slate-400 text-xs">{description}</div>}
        </div>
      </div>
      <button
        type="button"
        data-testid={testId}
        role="switch"
        aria-label={`${label} toggle`}
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-slate-600'
        }`}
      >
        <motion.div
          data-testid="toggle-slider"
          aria-hidden="true"
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ transform: `translateX(${enabled ? 22 : 2}px)` }}
        />
      </button>
    </motion.div>
  );

  const SelectOption: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onSelect: (value: string, label: string) => void;
    description?: string;
  }> = ({ label, value, options, onSelect, description }) => (
    <div className="p-3 rounded-lg bg-slate-800/50">
      <div className="mb-2">
        <div className="text-white font-medium text-sm">{label}</div>
        {description && <div className="text-slate-400 text-xs">{description}</div>}
      </div>
      <div className="flex gap-2">
        {options.map(option => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value, option.label)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const toggleButtonLabel = isOpen ? 'Hide display settings' : 'Show display settings';

  return (
    <div className={`relative ${className}`} data-testid="player-display-settings">
      <motion.button
        type="button"
        onClick={handlePanelToggle}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800  rounded-lg text-white hover:bg-slate-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`${toggleButtonLabel} panel`}
        aria-expanded={isOpen}
        aria-controls="player-display-settings-panel"
        data-testid="settings-toggle"
      >
        <Settings className="w-4 h-4" data-testid="settings-icon" />
        <span className="text-sm font-medium">Display</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              data-testid="settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-650  z-40"
              onClick={closePanel}
            />

            <motion.div
              id="player-display-settings-panel"
              data-testid="settings-panel"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 w-80 bg-slate-900  rounded-xl border border-slate-700 shadow-2xl z-50 animate-in"
              onClick={event => event.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Player Display Settings</h3>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="text-slate-400 hover:text-white transition-colors"
                    aria-label="Close display settings panel"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-slate-300 text-sm font-medium">Visibility</h4>

                    <ToggleOption
                      label="Player Names"
                      icon={<User className="w-4 h-4" />}
                      enabled={safeConfig.showNames}
                      onToggle={() => handleToggle('showNames', 'Player Names')}
                      description="Show player names on tokens"
                      testId="toggle-showNames"
                    />

                    <ToggleOption
                      label="Jersey Numbers"
                      icon={<Hash className="w-4 h-4" />}
                      enabled={safeConfig.showNumbers}
                      onToggle={() => handleToggle('showNumbers', 'Jersey Numbers')}
                      description="Show jersey numbers"
                      testId="toggle-showNumbers"
                    />

                    <ToggleOption
                      label="Player Stats"
                      icon={<Star className="w-4 h-4" />}
                      enabled={safeConfig.showStats}
                      onToggle={() => handleToggle('showStats', 'Player Stats')}
                      description="Show overall rating"
                      testId="toggle-showStats"
                    />

                    <ToggleOption
                      label="Stamina Bar"
                      icon={<Activity className="w-4 h-4" />}
                      enabled={safeConfig.showStamina}
                      onToggle={() => handleToggle('showStamina', 'Stamina Bar')}
                      description="Show stamina indicators"
                      testId="toggle-showStamina"
                    />

                    <ToggleOption
                      label="Morale Indicator"
                      icon={<Eye className="w-4 h-4" />}
                      enabled={safeConfig.showMorale}
                      onToggle={() => handleToggle('showMorale', 'Morale Indicator')}
                      description="Show player morale status"
                      testId="toggle-showMorale"
                    />

                    <ToggleOption
                      label="Availability Status"
                      icon={<EyeOff className="w-4 h-4" />}
                      enabled={safeConfig.showAvailability}
                      onToggle={() => handleToggle('showAvailability', 'Availability Status')}
                      description="Show injury/suspension status"
                      testId="toggle-showAvailability"
                    />
                  </div>

                  <SelectOption
                    label="Icon Type"
                    value={safeConfig.iconType}
                    options={[
                      { value: 'circle', label: 'Circle' },
                      { value: 'jersey', label: 'Jersey' },
                      { value: 'photo', label: 'Photo' },
                    ]}
                    onSelect={(value, label) => handleSelectOption('iconType', value, label)}
                    description="Choose player token appearance"
                  />

                  <SelectOption
                    label="Name Position"
                    value={safeConfig.namePosition}
                    options={[
                      { value: 'above', label: 'Above' },
                      { value: 'below', label: 'Below' },
                      { value: 'inside', label: 'Inside' },
                    ]}
                    onSelect={(value, label) => handleSelectOption('namePosition', value, label)}
                    description="Where to show player names"
                  />

                  <SelectOption
                    label="Token Size"
                    value={safeConfig.size}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    onSelect={(value, label) => handleSelectOption('size', value, label)}
                    description="Player token size"
                  />

                  <motion.button
                    type="button"
                    onClick={() => {
                      safeOnConfigChange({ ...DEFAULT_CONFIG });
                      setAnnouncement('Display settings reset to defaults');
                    }}
                    className="w-full mt-4 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reset to Defaults
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div role="status" aria-live="polite" className="sr-only" data-testid="sr-announcer">
        {announcement}
      </div>
    </div>
  );
};

export default PlayerDisplaySettings;
