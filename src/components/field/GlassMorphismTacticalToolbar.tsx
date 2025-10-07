import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useUIContext, useTacticsContext, useResponsive } from '../../hooks';
import type { DrawingTool } from '../../types';

// Modern glass morphism tool button
const GlassToolButton: React.FC<{
  label: string;
  tool?: DrawingTool;
  onClick: (tool?: DrawingTool) => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  shortcut?: string;
  tooltip?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}> = React.memo(
  ({
    label,
    tool,
    onClick,
    isActive,
    disabled = false,
    children,
    shortcut,
    tooltip,
    variant = 'primary',
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const variantStyles = {
      primary: {
        active: 'from-blue-500/30 to-purple-600/30 border-blue-400/50 shadow-blue-500/25',
        inactive: 'from-white/5 to-white/10 border-white/20 hover:border-blue-400/40',
        text: isActive ? 'text-blue-300' : 'text-white/80',
      },
      secondary: {
        active: 'from-green-500/30 to-emerald-600/30 border-green-400/50 shadow-green-500/25',
        inactive: 'from-white/5 to-white/10 border-white/20 hover:border-green-400/40',
        text: isActive ? 'text-green-300' : 'text-white/80',
      },
      danger: {
        active: 'from-red-500/30 to-pink-600/30 border-red-400/50 shadow-red-500/25',
        inactive: 'from-white/5 to-white/10 border-white/20 hover:border-red-400/40',
        text: isActive ? 'text-red-300' : 'text-white/80',
      },
    };

    const styles = variantStyles[variant];

    return (
      <div className="relative group">
        <button
          onClick={() => !disabled && onClick(tool)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={disabled}
          className={`
            relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center
            backdrop-blur-md border border-solid
            ${
              disabled
                ? 'from-gray-700/20 to-gray-800/20 border-gray-600/30 text-gray-500 cursor-not-allowed opacity-50'
                : isActive
                  ? `bg-gradient-to-br ${styles.active} shadow-xl transform scale-105`
                  : `bg-gradient-to-br ${styles.inactive} hover:shadow-lg hover:scale-105`
            }
            ${!disabled ? styles.text : ''}
            ${isHovered && !disabled ? 'shadow-2xl' : ''}
          `}
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: disabled
              ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.1))'
              : isActive
                ? `linear-gradient(135deg, ${variant === 'primary' ? 'rgba(59, 130, 246, 0.2)' : variant === 'secondary' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}, rgba(0, 0, 0, 0.1))`
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            boxShadow: isActive
              ? `0 8px 32px -4px ${variant === 'primary' ? 'rgba(59, 130, 246, 0.3)' : variant === 'secondary' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              : 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
          title={tooltip || label}
        >
          <div className="relative z-10 w-5 h-5">{children}</div>
          {shortcut && (
            <div className="absolute -top-1 -right-1 bg-gray-900/80 text-gray-300 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-white/20">
              {shortcut}
            </div>
          )}
        </button>

        {/* Enhanced tooltip */}
        {isHovered && tooltip && !disabled && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50">
            <div
              className="bg-gray-900/95 backdrop-blur-md text-white text-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-2xl border border-white/20"
              style={{
                background:
                  'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              {tooltip}
              {shortcut && <span className="ml-2 text-gray-400 text-xs">({shortcut})</span>}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-gray-900/95" />
            </div>
          </div>
        )}

        {/* Glow effect for active buttons */}
        {isActive && !disabled && (
          <div
            className="absolute inset-0 rounded-xl opacity-30 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${variant === 'primary' ? 'rgba(59, 130, 246, 0.4)' : variant === 'secondary' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'} 0%, transparent 70%)`,
              filter: 'blur(8px)',
              transform: 'scale(1.2)',
            }}
          />
        )}
      </div>
    );
  },
);

// Modern color picker with glass morphism
const GlassColorPicker: React.FC<{
  currentColor: string;
  onColorChange: (color: string) => void;
}> = React.memo(({ currentColor, onColorChange }) => {
  const colors = [
    { color: '#ffffff', name: 'White' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#ef4444', name: 'Red' },
    { color: '#10b981', name: 'Green' },
    { color: '#f59e0b', name: 'Yellow' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#f97316', name: 'Orange' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#6b7280', name: 'Gray' },
  ];

  return (
    <div
      className="flex items-center space-x-2 p-3 rounded-xl backdrop-blur-md border border-white/20"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="text-xs font-medium text-white/80 mr-2">Color:</div>
      <div className="flex items-center space-x-1.5">
        {colors.map(({ color, name }) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`
              w-7 h-7 rounded-full border-2 transition-all duration-300 relative group
              ${
                currentColor === color
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-white/40 hover:border-white/70 hover:scale-105'
              }
            `}
            style={{
              backgroundColor: color,
              boxShadow:
                currentColor === color
                  ? `0 0 16px ${color}44, 0 4px 12px rgba(0, 0, 0, 0.3)`
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
            title={name}
          >
            {currentColor === color && (
              <div className="absolute inset-0 rounded-full animate-ping border-2 border-white/60" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

// Formation selector with glass morphism
const GlassFormationSelector: React.FC = React.memo(() => {
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
    <div
      className="flex items-center space-x-3 p-3 rounded-xl backdrop-blur-md border border-white/20"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="text-xs font-bold text-white/80">FORMATIONS</div>

      <select
        value={activeFormationIds?.home || ''}
        onChange={e => handleFormationChange('home', e.target.value)}
        className="bg-blue-500/20 backdrop-blur-md text-blue-300 text-sm rounded-lg px-3 py-1.5 border border-blue-400/30 outline-none focus:border-blue-400/60 transition-colors"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <option value="" className="bg-gray-800">
          Home Team
        </option>
        {availableFormations.map(formation => (
          <option key={formation.id} value={formation.id} className="bg-gray-800">
            {formation.name} ({formation.slots})
          </option>
        ))}
      </select>

      <div className="text-white/60 font-bold">VS</div>

      <select
        value={activeFormationIds?.away || ''}
        onChange={e => handleFormationChange('away', e.target.value)}
        className="bg-red-500/20 backdrop-blur-md text-red-300 text-sm rounded-lg px-3 py-1.5 border border-red-400/30 outline-none focus:border-red-400/60 transition-colors"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <option value="" className="bg-gray-800">
          Away Team
        </option>
        {availableFormations.map(formation => (
          <option key={formation.id} value={formation.id} className="bg-gray-800">
            {formation.name} ({formation.slots})
          </option>
        ))}
      </select>
    </div>
  );
});

const GlassMorphismTacticalToolbar: React.FC = () => {
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
  useEffect(() => {
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
        ${isMobile ? 'fixed top-4 left-4 right-4 z-40' : 'absolute top-6 left-6 z-30'}
      `}
    >
      <div
        className="backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {/* Mobile toggle header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div className="text-lg font-bold text-white/90">Tactical Command Center</div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Main toolbar content */}
        <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'}`}>
          {/* Section tabs for mobile */}
          {isMobile && (
            <div className="flex border-b border-white/10">
              {[
                { id: 'tools', label: 'Tools', icon: '🎨' },
                { id: 'animation', label: 'Play', icon: '▶️' },
                { id: 'view', label: 'View', icon: '👁️' },
                { id: 'formation', label: 'Setup', icon: '⚽' },
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`
                    flex-1 p-3 text-sm text-center transition-all duration-300
                    ${
                      activeSection === section.id
                        ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }
                  `}
                  style={{
                    backdropFilter: activeSection === section.id ? 'blur(8px)' : undefined,
                  }}
                >
                  <div className="text-lg mb-1">{section.icon}</div>
                  <div className="text-xs font-medium">{section.label}</div>
                </button>
              ))}
            </div>
          )}

          <div className="p-4">
            {/* Desktop layout or mobile section content */}
            <div
              className={`flex items-center gap-4 ${isMobile ? 'flex-col space-y-4' : 'flex-row flex-wrap'}`}
            >
              {/* Drawing tools */}
              {(!isMobile || activeSection === 'tools') && (
                <div className="flex items-center space-x-2">
                  <GlassToolButton
                    label="Select"
                    tool="select"
                    onClick={setTool}
                    isActive={drawingTool === 'select'}
                    shortcut="S"
                    tooltip="Select and move players"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 2l16 16-6-6L2 2z" />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label="Pen"
                    tool="pen"
                    onClick={setTool}
                    isActive={drawingTool === 'pen'}
                    shortcut="P"
                    tooltip="Draw freehand lines"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label="Arrow"
                    tool="arrow"
                    onClick={setTool}
                    isActive={drawingTool === 'arrow'}
                    shortcut="A"
                    tooltip="Draw movement arrows"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label="Zone"
                    tool="zone"
                    onClick={setTool}
                    isActive={drawingTool === 'zone'}
                    shortcut="Z"
                    tooltip="Draw tactical zones"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label="Text"
                    tool="text"
                    onClick={setTool}
                    isActive={drawingTool === 'text'}
                    shortcut="T"
                    tooltip="Add text annotations"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a1 1 0 000 2h4.586l-4.293 4.293a1 1 0 101.414 1.414L10 6.414V11a1 1 0 102 0V4a1 1 0 00-1-1H4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>

                  <div className="w-px h-8 bg-white/20 mx-2" />

                  <GlassToolButton
                    label="Undo"
                    onClick={undo}
                    isActive={false}
                    disabled={!hasDrawings}
                    tooltip="Undo last drawing"
                    variant="secondary"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label="Clear"
                    onClick={clear}
                    isActive={false}
                    disabled={!hasDrawings}
                    tooltip="Clear all drawings"
                    variant="danger"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>
                </div>
              )}

              {/* Color picker */}
              {(!isMobile || activeSection === 'tools') && (
                <GlassColorPicker
                  currentColor={drawingColor || '#ffff00'}
                  onColorChange={setColor}
                />
              )}

              {/* Animation controls */}
              {(!isMobile || activeSection === 'animation') && (
                <div className="flex items-center space-x-2">
                  <GlassToolButton
                    label="Play"
                    onClick={handlePlay}
                    isActive={isAnimating}
                    disabled={!canPlayAnimation}
                    tooltip="Play animation sequence"
                    variant="secondary"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label="Reset"
                    onClick={handleReset}
                    isActive={false}
                    disabled={!canPlayAnimation}
                    tooltip="Reset animation to start"
                    variant="secondary"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>
                </div>
              )}

              {/* View controls */}
              {(!isMobile || activeSection === 'view') && (
                <div className="flex items-center space-x-2">
                  <GlassToolButton
                    label="Grid"
                    onClick={toggleGrid}
                    isActive={isGridVisible}
                    shortcut="G"
                    tooltip="Toggle field grid"
                    variant="secondary"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label="Strength"
                    onClick={toggleStrength}
                    isActive={isFormationStrengthVisible}
                    tooltip="Toggle formation strength overlay"
                    variant="secondary"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </GlassToolButton>

                  <GlassToolButton
                    label={positioningMode === 'snap' ? 'Snap' : 'Free'}
                    onClick={togglePositioningMode}
                    isActive={positioningMode === 'snap'}
                    tooltip={`Current mode: ${positioningMode}. Click to toggle.`}
                    variant="secondary"
                  >
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </GlassToolButton>
                </div>
              )}

              {/* Formation selector */}
              {(!isMobile || activeSection === 'formation') && <GlassFormationSelector />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(GlassMorphismTacticalToolbar);
