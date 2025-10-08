import React, { useState, useCallback, useMemo } from 'react';
import { useUIContext, useTacticsContext, useResponsive } from '../../hooks';
import type { DrawingTool } from '../../types';

// Enhanced tool button with better visual feedback
const ToolButton: React.FC<{
  label: string;
  tool?: DrawingTool;
  onClick: (tool?: DrawingTool) => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  shortcut?: string;
  tooltip?: string;
}> = React.memo(
  ({ label, tool, onClick, isActive, disabled = false, children, shortcut, tooltip }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => !disabled && onClick(tool)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={disabled}
          className={`
          relative p-3 rounded-lg transition-all duration-200 flex items-center justify-center
          ${
            isActive
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
              : disabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-105'
          }
          ${isHovered && !disabled ? 'shadow-xl' : ''}
        `}
          title={tooltip || label}
        >
          {children}
          {shortcut && (
            <span className="absolute -top-1 -right-1 text-xs bg-gray-800 text-gray-300 px-1 rounded text-[10px]">
              {shortcut}
            </span>
          )}
        </button>

        {/* Enhanced tooltip */}
        {isHovered && tooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700">
              {tooltip}
              {shortcut && <span className="ml-2 text-gray-400">({shortcut})</span>}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

// Color picker component
const ColorPicker: React.FC<{
  currentColor: string;
  onColorChange: (color: string) => void;
}> = React.memo(({ currentColor, onColorChange }) => {
  const colors = [
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ff8000',
    '#8000ff',
    '#ff0080',
  ];

  return (
    <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-2">
      {colors.map(color => (
        <button
          key={color}
          onClick={() => onColorChange(color)}
          className={`
            w-6 h-6 rounded-full border-2 transition-all duration-200
            ${
              currentColor === color
                ? 'border-white scale-110 shadow-lg'
                : 'border-gray-600 hover:border-gray-400 hover:scale-105'
            }
          `}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
});

// Formation selector component
const FormationSelector: React.FC = React.memo(() => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { formations, activeFormationIds } = tacticsState;

  const availableFormations = useMemo(() => {
    return Object.entries(formations || {}).map(([id, formation]) => ({
      id,
      name: formation?.name || 'Unknown Formation',
      slots: formation?.slots?.length || 0,
    }));
  }, [formations]);

  const handleFormationChange = useCallback(
    (team: 'home' | 'away', formationId: string) => {
      dispatch({
        type: 'SET_ACTIVE_FORMATION',
        payload: { team, formationId },
      });
    },
    [dispatch],
  );

  return (
    <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-2">
      <div className="text-xs font-bold text-gray-400">FORMATION</div>

      <select
        value={activeFormationIds?.home || ''}
        onChange={e => handleFormationChange('home', e.target.value)}
        className="bg-slate-700 text-blue-400 text-xs rounded px-2 py-1 border border-blue-500/30"
      >
        <option value="">Home</option>
        {availableFormations.map(formation => (
          <option key={formation.id} value={formation.id}>
            {formation.name} ({formation.slots})
          </option>
        ))}
      </select>

      <div className="text-gray-500">vs</div>

      <select
        value={activeFormationIds?.away || ''}
        onChange={e => handleFormationChange('away', e.target.value)}
        className="bg-slate-700 text-red-400 text-xs rounded px-2 py-1 border border-red-500/30"
      >
        <option value="">Away</option>
        {availableFormations.map(formation => (
          <option key={formation.id} value={formation.id}>
            {formation.name} ({formation.slots})
          </option>
        ))}
      </select>
    </div>
  );
});

const EnhancedTacticalToolbar: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { isMobile } = useResponsive();

  const {
    drawingTool,
    drawingColor,
    isAnimating,
    activePlaybookItemId,
    isGridVisible,
    isFormationStrengthVisible,
    positioningMode,
    isPresentationMode,
  } = uiState;

  const { drawings, playbook } = tacticsState;

  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [activeSection, setActiveSection] = useState<'tools' | 'animation' | 'view' | 'formation'>(
    'tools',
  );

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          setTool('select');
          break;
        case 'p':
          e.preventDefault();
          setTool('pen');
          break;
        case 'a':
          e.preventDefault();
          setTool('arrow');
          break;
        case 'z':
          e.preventDefault();
          setTool('zone');
          break;
        case 't':
          e.preventDefault();
          setTool('text');
          break;
        case 'g':
          e.preventDefault();
          toggleGrid();
          break;
        case 'escape':
          e.preventDefault();
          setTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const setTool = useCallback(
    (tool?: DrawingTool) => {
      if (tool) {
        dispatch({ type: 'SET_DRAWING_TOOL', payload: tool });
      }
    },
    [dispatch],
  );

  const setColor = useCallback(
    (color: string) => {
      dispatch({ type: 'SET_DRAWING_COLOR', payload: color });
    },
    [dispatch],
  );

  const undo = useCallback(() => {
    if (drawings?.length > 0) {
      tacticsDispatch({ type: 'UNDO_LAST_DRAWING' });
    }
  }, [tacticsDispatch, drawings]);

  const clear = useCallback(() => {
    if (drawings?.length > 0) {
      const confirmed = window.confirm('Clear all drawings? This action cannot be undone.');
      if (confirmed) {
        tacticsDispatch({ type: 'CLEAR_DRAWINGS' });
      }
    }
  }, [tacticsDispatch, drawings]);

  const toggleGrid = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID_VISIBILITY' });
  }, [dispatch]);

  const toggleStrength = useCallback(() => {
    dispatch({ type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' });
  }, [dispatch]);

  const togglePositioningMode = useCallback(() => {
    dispatch({
      type: 'SET_POSITIONING_MODE',
      payload: positioningMode === 'snap' ? 'free' : 'snap',
    });
  }, [dispatch, positioningMode]);

  const handlePlay = useCallback(() => {
    dispatch({ type: 'START_ANIMATION' });
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_ANIMATION' });
  }, [dispatch]);

  const activePlaybookItem = activePlaybookItemId ? playbook?.[activePlaybookItemId] : null;
  const canPlayAnimation = !!activePlaybookItem && (activePlaybookItem?.steps?.length || 0) > 1;
  const hasDrawings = (drawings?.length || 0) > 0;

  if (isPresentationMode) {
    return null;
  }

  return (
    <div
      className={`
      ${isMobile ? 'fixed top-4 left-4 right-4 z-30' : 'absolute top-4 left-4 z-20'}
    `}
    >
      <div
        className={`
        bg-slate-900  border border-slate-700 rounded-xl shadow-2xl
        ${isMobile ? 'w-full' : 'min-w-max'}
      `}
      >
        {/* Mobile toggle button */}
        {isMobile && (
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <div className="text-sm font-bold text-slate-300">Tactical Tools</div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        )}

        {/* Main toolbar content */}
        <div
          className={`
          ${isMobile && !isExpanded ? 'hidden' : 'block'}
        `}
        >
          {/* Section tabs for mobile */}
          {isMobile && (
            <div className="flex border-b border-slate-700">
              {[
                { id: 'tools', label: 'Tools', icon: '🎨' },
                { id: 'animation', label: 'Animation', icon: '▶️' },
                { id: 'view', label: 'View', icon: '👁️' },
                { id: 'formation', label: 'Formation', icon: '⚽' },
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`
                    flex-1 p-2 text-xs text-center transition-colors
                    ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  <div>{section.icon}</div>
                  <div>{section.label}</div>
                </button>
              ))}
            </div>
          )}

          <div className="p-3">
            {/* Desktop layout or mobile section content */}
            <div
              className={`
              flex items-center gap-3
              ${isMobile ? 'flex-col space-y-3' : 'flex-row'}
            `}
            >
              {/* Drawing tools */}
              {(!isMobile || activeSection === 'tools') && (
                <div className="flex items-center space-x-2">
                  <ToolButton
                    label="Select"
                    tool="select"
                    onClick={setTool}
                    isActive={drawingTool === 'select'}
                    shortcut="S"
                    tooltip="Select and move players"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 2l16 16-6-6L2 2z" />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label="Pen"
                    tool="pen"
                    onClick={setTool}
                    isActive={drawingTool === 'pen'}
                    shortcut="P"
                    tooltip="Draw freehand lines"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label="Arrow"
                    tool="arrow"
                    onClick={setTool}
                    isActive={drawingTool === 'arrow'}
                    shortcut="A"
                    tooltip="Draw movement arrows"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label="Zone"
                    tool="zone"
                    onClick={setTool}
                    isActive={drawingTool === 'zone'}
                    shortcut="Z"
                    tooltip="Draw tactical zones"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label="Text"
                    tool="text"
                    onClick={setTool}
                    isActive={drawingTool === 'text'}
                    shortcut="T"
                    tooltip="Add text annotations"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a1 1 0 000 2h4.586l-4.293 4.293a1 1 0 101.414 1.414L10 6.414V11a1 1 0 102 0V4a1 1 0 00-1-1H4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>

                  <div className="w-px h-8 bg-slate-600" />

                  <ToolButton
                    label="Undo"
                    onClick={undo}
                    isActive={false}
                    disabled={!hasDrawings}
                    tooltip="Undo last drawing"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label="Clear"
                    onClick={clear}
                    isActive={false}
                    disabled={!hasDrawings}
                    tooltip="Clear all drawings"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>
                </div>
              )}

              {/* Color picker */}
              {(!isMobile || activeSection === 'tools') && (
                <ColorPicker currentColor={drawingColor || '#ffff00'} onColorChange={setColor} />
              )}

              {/* Animation controls */}
              {(!isMobile || activeSection === 'animation') && (
                <div className="flex items-center space-x-2">
                  <ToolButton
                    label="Play"
                    onClick={handlePlay}
                    isActive={isAnimating}
                    disabled={!canPlayAnimation}
                    tooltip="Play animation sequence"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label="Reset"
                    onClick={handleReset}
                    isActive={false}
                    disabled={!canPlayAnimation}
                    tooltip="Reset animation to start"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>
                </div>
              )}

              {/* View controls */}
              {(!isMobile || activeSection === 'view') && (
                <div className="flex items-center space-x-2">
                  <ToolButton
                    label="Grid"
                    onClick={toggleGrid}
                    isActive={isGridVisible}
                    shortcut="G"
                    tooltip="Toggle field grid"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label="Strength"
                    onClick={toggleStrength}
                    isActive={isFormationStrengthVisible}
                    tooltip="Toggle formation strength overlay"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </ToolButton>

                  <ToolButton
                    label={positioningMode === 'snap' ? 'Snap' : 'Free'}
                    onClick={togglePositioningMode}
                    isActive={positioningMode === 'snap'}
                    tooltip={`Current mode: ${positioningMode}. Click to toggle.`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </ToolButton>
                </div>
              )}

              {/* Formation selector */}
              {(!isMobile || activeSection === 'formation') && <FormationSelector />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EnhancedTacticalToolbar);
