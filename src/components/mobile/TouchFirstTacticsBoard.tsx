import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Smartphone, 
  MousePointer, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move,
  Hand,
  Navigation,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Settings
} from 'lucide-react';
import type { Player, Position } from '../../types';

interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'pinch' | 'pan' | 'swipe';
  startPosition: Position;
  currentPosition: Position;
  distance?: number;
  scale?: number;
  duration: number;
}

interface MobileViewport {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  orientation: 'portrait' | 'landscape';
}

interface TouchFirstTacticsBoardProps {
  players: Player[];
  onPlayerMove: (playerId: string, position: Position) => void;
  onFormationChange?: (formation: string) => void;
  isReadOnly?: boolean;
}

export const TouchFirstTacticsBoard: React.FC<TouchFirstTacticsBoardProps> = ({
  players,
  onPlayerMove,
  onFormationChange,
  isReadOnly = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<MobileViewport>({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  });

  const [touchState, setTouchState] = useState({
    isMultiTouch: false,
    activeTouches: 0,
    lastTapTime: 0,
    gestureStart: null as Position | null,
    selectedPlayer: null as string | null,
    isDragging: false,
    longPressTimer: null as NodeJS.Timeout | null
  });

  const [mobileUI, setMobileUI] = useState({
    showToolbar: true,
    compactMode: false,
    showMiniMap: false,
    hapticEnabled: true,
    gestureHints: true,
    quickActions: true
  });

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const touch = touches[0];
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = {
      x: (touch.clientX - rect.left) / viewport.scale - viewport.offsetX,
      y: (touch.clientY - rect.top) / viewport.scale - viewport.offsetY
    };

    setTouchState(prev => ({
      ...prev,
      activeTouches: touches.length,
      isMultiTouch: touches.length > 1,
      gestureStart: position,
      isDragging: false
    }));

    // Long press detection
    if (touches.length === 1 && !isReadOnly) {
      const timer = setTimeout(() => {
        handleLongPress(position);
      }, 500);

      setTouchState(prev => ({
        ...prev,
        longPressTimer: timer
      }));
    }

    // Pinch gesture detection
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setTouchState(prev => ({
        ...prev,
        gestureStart: { x: distance, y: viewport.scale }
      }));
    }

    e.preventDefault();
  }, [viewport, isReadOnly]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (touches.length === 1 && touchState.selectedPlayer && !isReadOnly) {
      // Single touch - move player
      const touch = touches[0];
      const position = {
        x: (touch.clientX - rect.left) / viewport.scale - viewport.offsetX,
        y: (touch.clientY - rect.top) / viewport.scale - viewport.offsetY
      };

      onPlayerMove(touchState.selectedPlayer, position);
      
      setTouchState(prev => ({
        ...prev,
        isDragging: true
      }));

      // Haptic feedback
      if (mobileUI.hapticEnabled && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else if (touches.length === 2) {
      // Pinch to zoom
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (touchState.gestureStart) {
        const scaleChange = distance / touchState.gestureStart.x;
        const newScale = Math.min(Math.max(touchState.gestureStart.y * scaleChange, 0.5), 3);
        
        setViewport(prev => ({
          ...prev,
          scale: newScale
        }));
      }
    } else if (touches.length === 1 && !touchState.selectedPlayer) {
      // Pan gesture
      const touch = touches[0];
      if (touchState.gestureStart) {
        const deltaX = touch.clientX - touchState.gestureStart.x;
        const deltaY = touch.clientY - touchState.gestureStart.y;
        
        setViewport(prev => ({
          ...prev,
          offsetX: prev.offsetX + deltaX / viewport.scale,
          offsetY: prev.offsetY + deltaY / viewport.scale
        }));
      }
    }

    e.preventDefault();
  }, [touchState, viewport, onPlayerMove, isReadOnly, mobileUI.hapticEnabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    
    // Clear long press timer
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
    }

    // Double tap detection
    if (e.changedTouches.length === 1 && !touchState.isDragging) {
      if (now - touchState.lastTapTime < 300) {
        handleDoubleTap();
      }
    }

    setTouchState(prev => ({
      ...prev,
      activeTouches: 0,
      isMultiTouch: false,
      gestureStart: null,
      selectedPlayer: null,
      isDragging: false,
      longPressTimer: null,
      lastTapTime: now
    }));

    e.preventDefault();
  }, [touchState]);

  const handleLongPress = (position: Position) => {
    const player = findPlayerAtPosition(position);
    if (player && !isReadOnly) {
      setTouchState(prev => ({
        ...prev,
        selectedPlayer: player.id
      }));

      // Haptic feedback for selection
      if (mobileUI.hapticEnabled && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const handleDoubleTap = () => {
    // Center and reset zoom
    setViewport(prev => ({
      ...prev,
      scale: 1,
      offsetX: 0,
      offsetY: 0
    }));

    if (mobileUI.hapticEnabled && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const findPlayerAtPosition = (position: Position): Player | null => {
    return players.find(player => {
      const distance = Math.sqrt(
        Math.pow(player.position.x - position.x, 2) +
        Math.pow(player.position.y - position.y, 2)
      );
      return distance < 30; // Touch target size
    }) || null;
  };

  // Orientation and viewport management
  useEffect(() => {
    const handleResize = () => {
      setViewport(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      }));
    };

    const handleOrientationChange = () => {
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Gesture hints for new users
  const [showGestureHints, setShowGestureHints] = useState(mobileUI.gestureHints);

  const gestureHints = [
    { icon: <MousePointer />, text: 'Long press to select player' },
    { icon: <Move />, text: 'Drag to move selected player' },
    { icon: <Hand />, text: 'Pinch to zoom in/out' },
    { icon: <Navigation />, text: 'Double tap to reset view' }
  ];

  const quickActionButtons = [
    { icon: <ZoomIn />, action: () => setViewport(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) })) },
    { icon: <ZoomOut />, action: () => setViewport(prev => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.5) })) },
    { icon: <RotateCcw />, action: () => setViewport({ ...viewport, scale: 1, offsetX: 0, offsetY: 0 }) },
    { icon: <Maximize2 />, action: () => setMobileUI(prev => ({ ...prev, compactMode: !prev.compactMode })) }
  ];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-green-900 to-blue-900 relative overflow-hidden">
      {/* Mobile Header */}
      <div className={`absolute top-0 left-0 right-0 z-50 transition-transform ${
        mobileUI.showToolbar ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <Card className="bg-black/50 backdrop-blur-md border-white/20 rounded-none border-x-0 border-t-0">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Mobile Tactics</span>
                <Badge variant="secondary" className="text-xs">
                  {viewport.orientation}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 text-xs">
                  {viewport.scale.toFixed(1)}x
                </Badge>
                <Button
                  size="sm"
                  onClick={() => setMobileUI(prev => ({ ...prev, showToolbar: false }))}
                  className="bg-white/10 hover:bg-white/20 border-white/20 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Show toolbar button when hidden */}
      {!mobileUI.showToolbar && (
        <Button
          onClick={() => setMobileUI(prev => ({ ...prev, showToolbar: true }))}
          className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md border-white/20"
          size="sm"
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}

      {/* Main Field Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `scale(${viewport.scale}) translate(${viewport.offsetX}px, ${viewport.offsetY}px)`,
          transformOrigin: 'center center',
          touchAction: 'none'
        }}
      >
        {/* Soccer Field */}
        <div
          ref={fieldRef}
          className="w-full h-full bg-gradient-to-b from-green-400 to-green-600 relative"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(180deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        >
          {/* Field Markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 520">
            {/* Field boundary */}
            <rect x="40" y="40" width="720" height="440" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Center line */}
            <line x1="400" y1="40" x2="400" y2="480" stroke="white" strokeWidth="2" />
            
            {/* Center circle */}
            <circle cx="400" cy="260" r="60" fill="none" stroke="white" strokeWidth="2" />
            
            {/* Penalty areas */}
            <rect x="40" y="160" width="120" height="200" fill="none" stroke="white" strokeWidth="2" />
            <rect x="640" y="160" width="120" height="200" fill="none" stroke="white" strokeWidth="2" />
            
            {/* Goal areas */}
            <rect x="40" y="210" width="40" height="100" fill="none" stroke="white" strokeWidth="2" />
            <rect x="720" y="210" width="40" height="100" fill="none" stroke="white" strokeWidth="2" />
          </svg>

          {/* Players */}
          {players.map(player => (
            <div
              key={player.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                touchState.selectedPlayer === player.id 
                  ? 'scale-125 z-20' 
                  : 'z-10'
              }`}
              style={{
                left: `${(player.position.x / 100) * 100}%`,
                top: `${(player.position.y / 100) * 100}%`,
                touchAction: 'none'
              }}
            >
              {/* Player Circle */}
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-white shadow-lg ${
                touchState.selectedPlayer === player.id
                  ? 'border-yellow-400 bg-blue-600 shadow-yellow-400/50'
                  : 'border-white bg-blue-500'
              }`}>
                <span className="text-sm">{player.jerseyNumber || '?'}</span>
              </div>

              {/* Player Name (Mobile) */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {player.name}
                </div>
              </div>

              {/* Selection Ring */}
              {touchState.selectedPlayer === player.id && (
                <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-pulse" />
              )}
            </div>
          ))}

          {/* Touch Target Areas (Invisible helpers for easier touch) */}
          {players.map(player => (
            <div
              key={`touch-${player.id}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 z-30"
              style={{
                left: `${(player.position.x / 100) * 100}%`,
                top: `${(player.position.y / 100) * 100}%`,
                touchAction: 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Quick Action Buttons */}
      {mobileUI.quickActions && (
        <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-40">
          {quickActionButtons.map((button, index) => (
            <Button
              key={index}
              onClick={button.action}
              className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border-white/20 hover:bg-white/20"
              size="sm"
            >
              {button.icon}
            </Button>
          ))}
        </div>
      )}

      {/* Gesture Hints */}
      {showGestureHints && (
        <div className="absolute bottom-4 left-4 right-4 z-40">
          <Card className="bg-black/70 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">Touch Gestures</h3>
                <Button
                  size="sm"
                  onClick={() => setShowGestureHints(false)}
                  className="bg-white/10 hover:bg-white/20 border-white/20 p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {gestureHints.map((hint, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="text-blue-400">
                      {React.cloneElement(hint.icon, { className: 'w-4 h-4' })}
                    </div>
                    <span className="text-white text-xs">{hint.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-md border-t border-white/20 p-2">
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-4">
            <span>Players: {players.length}</span>
            <span>Scale: {viewport.scale.toFixed(1)}x</span>
            <span>Touches: {touchState.activeTouches}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {touchState.selectedPlayer && (
              <Badge className="bg-yellow-500/20 text-yellow-400">
                Selected
              </Badge>
            )}
            {mobileUI.hapticEnabled && (
              <Badge className="bg-green-500/20 text-green-400">
                Haptic
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};