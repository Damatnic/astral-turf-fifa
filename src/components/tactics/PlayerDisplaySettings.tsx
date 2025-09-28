import React, { useState } from 'react';
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

const PlayerDisplaySettings: React.FC<PlayerDisplaySettingsProps> = ({
  config,
  onConfigChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (key: keyof PlayerDisplayConfig, value: any) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };

  const ToggleOption: React.FC<{
    label: string;
    icon: React.ReactNode;
    enabled: boolean;
    onToggle: () => void;
    description?: string;
  }> = ({ label, icon, enabled, onToggle, description }) => (
    <motion.div
      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-400">
          {icon}
        </div>
        <div>
          <div className="text-white font-medium text-sm">{label}</div>
          {description && (
            <div className="text-slate-400 text-xs">{description}</div>
          )}
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-slate-600'
        }`}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </motion.div>
  );

  const SelectOption: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onSelect: (value: string) => void;
    description?: string;
  }> = ({ label, value, options, onSelect, description }) => (
    <div className="p-3 rounded-lg bg-slate-800/50">
      <div className="mb-2">
        <div className="text-white font-medium text-sm">{label}</div>
        {description && (
          <div className="text-slate-400 text-xs">{description}</div>
        )}
      </div>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              value === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Settings Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 backdrop-blur-sm rounded-lg text-white hover:bg-slate-700/80 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Display</span>
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Settings Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/50 shadow-2xl z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Player Display Settings</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Visibility Options */}
                  <div className="space-y-2">
                    <h4 className="text-slate-300 text-sm font-medium">Visibility</h4>
                    
                    <ToggleOption
                      label="Player Names"
                      icon={<User className="w-4 h-4" />}
                      enabled={config.showNames}
                      onToggle={() => handleToggle('showNames', !config.showNames)}
                      description="Show player names on tokens"
                    />
                    
                    <ToggleOption
                      label="Jersey Numbers"
                      icon={<Hash className="w-4 h-4" />}
                      enabled={config.showNumbers}
                      onToggle={() => handleToggle('showNumbers', !config.showNumbers)}
                      description="Show jersey numbers"
                    />
                    
                    <ToggleOption
                      label="Player Stats"
                      icon={<Star className="w-4 h-4" />}
                      enabled={config.showStats}
                      onToggle={() => handleToggle('showStats', !config.showStats)}
                      description="Show overall rating"
                    />
                    
                    <ToggleOption
                      label="Stamina Bar"
                      icon={<Activity className="w-4 h-4" />}
                      enabled={config.showStamina}
                      onToggle={() => handleToggle('showStamina', !config.showStamina)}
                      description="Show stamina indicators"
                    />
                    
                    <ToggleOption
                      label="Morale Indicator"
                      icon={<Eye className="w-4 h-4" />}
                      enabled={config.showMorale}
                      onToggle={() => handleToggle('showMorale', !config.showMorale)}
                      description="Show player morale status"
                    />
                    
                    <ToggleOption
                      label="Availability Status"
                      icon={<EyeOff className="w-4 h-4" />}
                      enabled={config.showAvailability}
                      onToggle={() => handleToggle('showAvailability', !config.showAvailability)}
                      description="Show injury/suspension status"
                    />
                  </div>

                  {/* Icon Type */}
                  <SelectOption
                    label="Icon Type"
                    value={config.iconType}
                    options={[
                      { value: 'circle', label: 'Circle' },
                      { value: 'jersey', label: 'Jersey' },
                      { value: 'photo', label: 'Photo' }
                    ]}
                    onSelect={(value) => handleToggle('iconType', value)}
                    description="Choose player token appearance"
                  />

                  {/* Name Position */}
                  <SelectOption
                    label="Name Position"
                    value={config.namePosition}
                    options={[
                      { value: 'above', label: 'Above' },
                      { value: 'below', label: 'Below' },
                      { value: 'inside', label: 'Inside' }
                    ]}
                    onSelect={(value) => handleToggle('namePosition', value)}
                    description="Where to show player names"
                  />

                  {/* Size */}
                  <SelectOption
                    label="Token Size"
                    value={config.size}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' }
                    ]}
                    onSelect={(value) => handleToggle('size', value)}
                    description="Player token size"
                  />

                  {/* Reset Button */}
                  <motion.button
                    onClick={() => onConfigChange({
                      showNames: true,
                      showNumbers: true,
                      showStats: false,
                      showStamina: true,
                      showMorale: true,
                      showAvailability: true,
                      iconType: 'circle',
                      namePosition: 'below',
                      size: 'medium'
                    })}
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
    </div>
  );
};

export default PlayerDisplaySettings;