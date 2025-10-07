/**
 * FilterPanel Component
 *
 * Advanced filtering interface for roster management
 */

import React from 'react';
import { Filter, X, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { FilterPanelProps } from '../../../types/roster';

export default function FilterPanel({
  filters,
  presets,
  activePresetId,
  onFilterChange,
  onResetFilters,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  isExpanded = true,
  onToggleExpanded,
  className = '',
}: FilterPanelProps) {
  const [presetName, setPresetName] = React.useState('');
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className={`filter-panel ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="header-content">
          <Filter size={20} />
          <h3>Filters</h3>
          <button className="reset-button" onClick={onResetFilters} type="button">
            Reset
          </button>
        </div>
        {onToggleExpanded && (
          <button className="toggle-button" onClick={onToggleExpanded} type="button">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="panel-content">
          {/* Search (handled by parent) */}
          
          {/* Position Filter */}
          <div className="filter-section">
            <label>Position</label>
            <div className="position-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.positions.includeAll}
                  onChange={e =>
                    onFilterChange({
                      positions: { ...filters.positions, includeAll: e.target.checked },
                    })
                  }
                />
                <span>All Positions</span>
              </label>
            </div>
          </div>

          {/* Attribute Ranges */}
          <div className="filter-section">
            <label>
              <input
                type="checkbox"
                checked={filters.overall.enabled}
                onChange={e =>
                  onFilterChange({
                    overall: { ...filters.overall, enabled: e.target.checked },
                  })
                }
              />
              Overall Rating
            </label>
            {filters.overall.enabled && (
              <div className="range-inputs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.overall.min}
                  onChange={e =>
                    onFilterChange({
                      overall: { ...filters.overall, min: Number(e.target.value) },
                    })
                  }
                />
                <span>to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.overall.max}
                  onChange={e =>
                    onFilterChange({
                      overall: { ...filters.overall, max: Number(e.target.value) },
                    })
                  }
                />
              </div>
            )}
          </div>

          <div className="filter-section">
            <label>
              <input
                type="checkbox"
                checked={filters.age.enabled}
                onChange={e =>
                  onFilterChange({
                    age: { ...filters.age, enabled: e.target.checked },
                  })
                }
              />
              Age
            </label>
            {filters.age.enabled && (
              <div className="range-inputs">
                <input
                  type="number"
                  min="16"
                  max="40"
                  value={filters.age.min}
                  onChange={e =>
                    onFilterChange({
                      age: { ...filters.age, min: Number(e.target.value) },
                    })
                  }
                />
                <span>to</span>
                <input
                  type="number"
                  min="16"
                  max="40"
                  value={filters.age.max}
                  onChange={e =>
                    onFilterChange({
                      age: { ...filters.age, max: Number(e.target.value) },
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="filter-section">
            <label>Player Status</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.status.available}
                  onChange={e =>
                    onFilterChange({
                      status: { ...filters.status, available: e.target.checked },
                    })
                  }
                />
                <span>Available</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.status.injured}
                  onChange={e =>
                    onFilterChange({
                      status: { ...filters.status, injured: e.target.checked },
                    })
                  }
                />
                <span>Injured</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.status.suspended}
                  onChange={e =>
                    onFilterChange({
                      status: { ...filters.status, suspended: e.target.checked },
                    })
                  }
                />
                <span>Suspended</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.status.tired}
                  onChange={e =>
                    onFilterChange({
                      status: { ...filters.status, tired: e.target.checked },
                    })
                  }
                />
                <span>Tired</span>
              </label>
            </div>
          </div>

          {/* Presets */}
          <div className="filter-section">
            <div className="section-header">
              <label>Saved Presets</label>
              <button
                className="save-preset-button"
                onClick={() => setShowSaveDialog(!showSaveDialog)}
                type="button"
              >
                <Save size={14} />
              </button>
            </div>

            {showSaveDialog && (
              <div className="save-dialog">
                <input
                  type="text"
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                />
                <button onClick={handleSavePreset} type="button">
                  Save
                </button>
              </div>
            )}

            <div className="preset-list">
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className={`preset-item ${activePresetId === preset.id ? 'active' : ''}`}
                >
                  <button
                    className="preset-button"
                    onClick={() => onLoadPreset(preset.id)}
                    type="button"
                  >
                    {preset.name}
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => onDeletePreset(preset.id)}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .filter-panel {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-content h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .reset-button {
          padding: 6px 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reset-button:hover {
          background: #e5e7eb;
        }

        .toggle-button {
          padding: 4px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .toggle-button:hover {
          background: #f3f4f6;
        }

        .panel-content {
          padding: 16px;
          max-height: 600px;
          overflow-y: auto;
        }

        .filter-section {
          margin-bottom: 20px;
        }

        .filter-section label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 400;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .position-checkboxes,
        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .range-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .range-inputs input {
          flex: 1;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
        }

        .range-inputs span {
          color: #6b7280;
          font-size: 13px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .save-preset-button {
          padding: 4px 8px;
          background: #3b82f6;
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-preset-button:hover {
          background: #2563eb;
        }

        .save-dialog {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .save-dialog input {
          flex: 1;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
        }

        .save-dialog button {
          padding: 8px 16px;
          background: #3b82f6;
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .preset-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preset-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preset-item.active .preset-button {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .preset-button {
          flex: 1;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          text-align: left;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-button:hover {
          background: #f9fafb;
        }

        .delete-button {
          padding: 6px;
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .delete-button:hover {
          background: #fee2e2;
        }
      `}</style>
    </div>
  );
}
