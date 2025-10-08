import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import type { Player, Position } from '../../types';

interface AnimationKeyframe {
  id: string;
  timestamp: number;
  playerId: string;
  position: Position;
  action?: 'move' | 'pass' | 'shoot' | 'dribble' | 'tackle';
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  metadata?: {
    speed?: number;
    direction?: number;
    intensity?: number;
  };
}

interface AnimationSequence {
  id: string;
  name: string;
  keyframes: AnimationKeyframe[];
  duration: number;
  loop: boolean;
  description?: string;
}

interface AnimationTrail {
  playerId: string;
  points: Position[];
  timestamps: number[];
  color: string;
  intensity: number;
  fadeStartTime: number;
  actionType?: 'move' | 'pass' | 'shoot' | 'dribble' | 'tackle';
}

// Professional timeline controls
const TimelineControls: React.FC<{
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  playbackSpeed: number;
}> = React.memo(
  ({
    isPlaying,
    currentTime,
    duration,
    onPlay,
    onPause,
    onStop,
    onSeek,
    onSpeedChange,
    playbackSpeed,
  }) => {
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="bg-gray-900/95  rounded-xl p-4 border border-slate-600 shadow-2xl">
        <div className="flex items-center space-x-4">
          {/* Play/Pause Button */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Stop Button */}
          <button
            onClick={onStop}
            className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Timeline Scrubber */}
          <div className="flex-1 relative">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={e => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute top-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-500 transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>

          {/* Time Display */}
          <div className="text-white font-mono text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Speed Control */}
          <div className="flex items-center space-x-2">
            <span className="text-white/70 text-sm">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={e => onSpeedChange(parseFloat(e.target.value))}
              className="bg-gray-700 text-white text-sm rounded px-2 py-1 outline-none"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>
      </div>
    );
  },
);

// Enhanced animation trail renderer
const AnimationTrailRenderer: React.FC<{
  trails: AnimationTrail[];
  currentTime: number;
  trailLength: number;
  showDirectionArrows: boolean;
}> = React.memo(({ trails, currentTime, trailLength, showDirectionArrows }) => {
  const renderTrail = (trail: AnimationTrail) => {
    if (trail.points.length < 2) {
      return null;
    }

    const maxAge = trailLength * 1000; // Convert to milliseconds
    const visiblePoints = trail.points.filter((_, index) => {
      const pointTime = trail.timestamps[index];
      return pointTime && currentTime - pointTime <= maxAge;
    });

    if (visiblePoints.length < 2) {
      return null;
    }

    // Create path for trail
    const pathData = visiblePoints
      .filter(
        point =>
          point &&
          typeof point.x === 'number' &&
          typeof point.y === 'number' &&
          !isNaN(point.x) &&
          !isNaN(point.y),
      )
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    // Calculate opacity based on time
    const opacity = Math.max(0.2, 1 - (currentTime - trail.fadeStartTime) / maxAge);

    // Action-based styling
    const getTrailStyle = () => {
      switch (trail.actionType) {
        case 'pass':
          return { stroke: '#10b981', strokeWidth: 0.8, strokeDasharray: '2 1' };
        case 'shoot':
          return { stroke: '#ef4444', strokeWidth: 1.2, strokeDasharray: 'none' };
        case 'dribble':
          return { stroke: '#f59e0b', strokeWidth: 0.6, strokeDasharray: '1 1' };
        case 'tackle':
          return { stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '3 1' };
        default:
          return { stroke: trail.color, strokeWidth: 0.7, strokeDasharray: 'none' };
      }
    };

    const style = getTrailStyle();

    return (
      <g key={trail.playerId} className="animation-trail">
        {/* Glow effect */}
        <path
          d={pathData}
          fill="none"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth * 2}
          strokeDasharray={style.strokeDasharray}
          opacity={opacity * 0.3}
          filter="url(#trail-glow)"
          className="trail-glow"
        />

        {/* Main trail */}
        <path
          d={pathData}
          fill="none"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          strokeDasharray={style.strokeDasharray}
          opacity={opacity}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="trail-main"
        />

        {/* Direction arrows */}
        {showDirectionArrows && visiblePoints.length >= 2 && (
          <g className="trail-arrows">
            {visiblePoints.slice(1).map((point, index) => {
              const prevPoint = visiblePoints[index];
              const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);

              return (
                <g
                  key={index}
                  transform={`translate(${point.x}, ${point.y}) rotate(${(angle * 180) / Math.PI})`}
                >
                  <path
                    d="M -1 -0.5 L 1 0 L -1 0.5 Z"
                    fill={style.stroke}
                    opacity={opacity * 0.8}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Action indicators */}
        {trail.actionType && visiblePoints.length > 0 && (
          <circle
            cx={visiblePoints[visiblePoints.length - 1].x}
            cy={visiblePoints[visiblePoints.length - 1].y}
            r="1.5"
            fill={style.stroke}
            opacity={opacity}
            className="action-indicator animate-pulse"
          />
        )}
      </g>
    );
  };

  return (
    <g className="animation-trails">
      <defs>
        <filter id="trail-glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {trails.map(renderTrail)}
    </g>
  );
});

// Keyframe editor for advanced users
const KeyframeEditor: React.FC<{
  sequence: AnimationSequence | null;
  onUpdateSequence: (sequence: AnimationSequence) => void;
  players: Player[];
}> = React.memo(({ sequence, onUpdateSequence, players }) => {
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);

  if (!sequence) {
    return null;
  }

  const addKeyframe = () => {
    const newKeyframe: AnimationKeyframe = {
      id: `keyframe-${Date.now()}`,
      timestamp: sequence.duration,
      playerId: players[0]?.id || '',
      position: { x: 50, y: 50 },
      action: 'move',
      duration: 1000,
      easing: 'ease-in-out',
    };

    onUpdateSequence({
      ...sequence,
      keyframes: [...sequence.keyframes, newKeyframe],
      duration: Math.max(
        sequence.duration,
        newKeyframe.timestamp + (newKeyframe.duration || 0) / 1000,
      ),
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Keyframe Editor</h3>
        <button
          onClick={addKeyframe}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
          Add Keyframe
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {sequence.keyframes.map(keyframe => (
          <div
            key={keyframe.id}
            className={`p-2 rounded border cursor-pointer transition-colors ${
              selectedKeyframe === keyframe.id
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onClick={() => setSelectedKeyframe(keyframe.id)}
          >
            <div className="flex justify-between items-center">
              <div className="text-white text-sm">
                {players.find(p => p.id === keyframe.playerId)?.name || 'Unknown Player'}
              </div>
              <div className="text-gray-400 text-xs">
                {keyframe.timestamp.toFixed(1)}s - {keyframe.action}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const ProfessionalAnimationTimeline: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const { players, formations } = tacticsState;
  const { isAnimating, animationTrails } = uiState;

  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const [animationState, setAnimationState] = useState({
    currentTime: 0,
    duration: 10, // 10 seconds default
    playbackSpeed: 1,
    isPlaying: false,
    sequence: null as AnimationSequence | null,
    trails: [] as AnimationTrail[],
    showKeyframeEditor: false,
    trailLength: 3, // seconds
    showDirectionArrows: true,
    showActionIndicators: true,
  });

  // Generate dynamic trails based on player movements
  const generatePlayerTrails = useCallback(() => {
    if (!players) {
      return [];
    }

    return players.map(player => {
      const extendedPlayer = player as any;
      return {
        playerId: player.id,
        points: extendedPlayer.movementHistory || [player.position || { x: 50, y: 50 }],
        timestamps: extendedPlayer.movementTimestamps || [Date.now()],
        color: player.team === 'home' ? '#3b82f6' : '#ef4444',
        intensity: 1,
        fadeStartTime: Date.now() - animationState.trailLength * 1000,
        actionType: extendedPlayer.lastAction,
      };
    });
  }, [players, animationState.trailLength]);

  // Enhanced animation loop with smooth interpolation
  const updateAnimation = useCallback(
    (timestamp: number) => {
      if (!animationState.isPlaying) {
        return;
      }

      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }

      const elapsed = ((timestamp - startTimeRef.current) / 1000) * animationState.playbackSpeed;
      const newCurrentTime = Math.min(elapsed, animationState.duration);

      setAnimationState(prev => ({ ...prev, currentTime: newCurrentTime }));

      // Update trails
      const newTrails = generatePlayerTrails();
      setAnimationState(prev => ({ ...prev, trails: newTrails }));

      if (newCurrentTime < animationState.duration) {
        animationFrameRef.current = requestAnimationFrame(updateAnimation);
      } else {
        // Animation completed
        setAnimationState(prev => ({ ...prev, isPlaying: false }));
        startTimeRef.current = 0;
      }
    },
    [
      animationState.isPlaying,
      animationState.duration,
      animationState.playbackSpeed,
      generatePlayerTrails,
    ],
  );

  // Animation controls
  const handlePlay = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isPlaying: true }));
    uiDispatch({ type: 'START_ANIMATION' });
  }, [uiDispatch]);

  const handlePause = useCallback(() => {
    setAnimationState(prev => ({ ...prev, isPlaying: false }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = 0;
  }, []);

  const handleStop = useCallback(() => {
    setAnimationState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
    }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    startTimeRef.current = 0;
    uiDispatch({ type: 'RESET_ANIMATION' });
  }, [uiDispatch]);

  const handleSeek = useCallback((time: number) => {
    setAnimationState(prev => ({ ...prev, currentTime: time }));
    startTimeRef.current = 0;
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setAnimationState(prev => ({ ...prev, playbackSpeed: speed }));
    startTimeRef.current = 0;
  }, []);

  // Start animation loop
  useEffect(() => {
    if (animationState.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState.isPlaying, updateAnimation]);

  // Create default animation sequence
  const createDefaultSequence = useCallback((): AnimationSequence => {
    if (!players || players.length === 0) {
      return {
        id: 'default',
        name: 'Formation Movement',
        keyframes: [],
        duration: 10,
        loop: false,
      };
    }

    const keyframes: AnimationKeyframe[] = players.flatMap((player, index) => [
      {
        id: `${player.id}-start`,
        timestamp: 0,
        playerId: player.id,
        position: player.position || { x: 20 + index * 10, y: 50 },
        action: 'move',
        duration: 2000,
        easing: 'ease-in-out',
      },
      {
        id: `${player.id}-mid`,
        timestamp: 5,
        playerId: player.id,
        position: { x: 50, y: 30 + index * 8 },
        action: 'move',
        duration: 3000,
        easing: 'ease-in-out',
      },
      {
        id: `${player.id}-end`,
        timestamp: 8,
        playerId: player.id,
        position: { x: 80 - index * 8, y: 70 },
        action: 'move',
        duration: 2000,
        easing: 'ease-out',
      },
    ]);

    return {
      id: 'default-sequence',
      name: 'Tactical Movement',
      keyframes,
      duration: 10,
      loop: false,
      description: 'Basic formation movement pattern',
    };
  }, [players]);

  // Initialize sequence if none exists
  useEffect(() => {
    if (!animationState.sequence && players && players.length > 0) {
      setAnimationState(prev => ({
        ...prev,
        sequence: createDefaultSequence(),
      }));
    }
  }, [players, animationState.sequence, createDefaultSequence]);

  if (!players || players.length === 0) {
    return (
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-gray-900/80  rounded-lg p-4 border border-slate-600 text-white text-center">
          <div className="text-sm">No players available for animation</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Animation trails overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <AnimationTrailRenderer
          trails={animationState.trails}
          currentTime={animationState.currentTime * 1000}
          trailLength={animationState.trailLength}
          showDirectionArrows={animationState.showDirectionArrows}
        />
      </svg>

      {/* Timeline controls */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-4">
        <TimelineControls
          isPlaying={animationState.isPlaying}
          currentTime={animationState.currentTime}
          duration={animationState.duration}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSeek={handleSeek}
          onSpeedChange={handleSpeedChange}
          playbackSpeed={animationState.playbackSpeed}
        />
      </div>

      {/* Animation settings panel */}
      <div className="absolute top-4 left-4 z-30">
        <div className="bg-gray-900/80  rounded-lg p-3 border border-slate-600 space-y-2">
          <div className="text-white text-sm font-medium mb-2">Animation Settings</div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={animationState.showDirectionArrows}
              onChange={e =>
                setAnimationState(prev => ({
                  ...prev,
                  showDirectionArrows: e.target.checked,
                }))
              }
              className="w-3 h-3"
            />
            <span className="text-white/80 text-xs">Direction Arrows</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={animationState.showActionIndicators}
              onChange={e =>
                setAnimationState(prev => ({
                  ...prev,
                  showActionIndicators: e.target.checked,
                }))
              }
              className="w-3 h-3"
            />
            <span className="text-white/80 text-xs">Action Indicators</span>
          </label>

          <div className="space-y-1">
            <label className="text-white/80 text-xs">Trail Length (seconds)</label>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={animationState.trailLength}
              onChange={e =>
                setAnimationState(prev => ({
                  ...prev,
                  trailLength: parseFloat(e.target.value),
                }))
              }
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-white/60 text-xs text-center">{animationState.trailLength}s</div>
          </div>

          <button
            onClick={() =>
              setAnimationState(prev => ({
                ...prev,
                showKeyframeEditor: !prev.showKeyframeEditor,
              }))
            }
            className="w-full px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
          >
            {animationState.showKeyframeEditor ? 'Hide' : 'Show'} Keyframe Editor
          </button>
        </div>

        {/* Keyframe Editor */}
        {animationState.showKeyframeEditor && (
          <div className="mt-2">
            <KeyframeEditor
              sequence={animationState.sequence}
              onUpdateSequence={sequence =>
                setAnimationState(prev => ({
                  ...prev,
                  sequence,
                }))
              }
              players={players || []}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ProfessionalAnimationTimeline);
