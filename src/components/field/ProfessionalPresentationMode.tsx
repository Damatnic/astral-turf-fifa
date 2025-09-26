import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import type { Player, Formation } from '../../types';

interface PresentationSlide {
  id: string;
  title: string;
  type: 'formation' | 'analysis' | 'comparison' | 'animation' | 'custom';
  content: {
    formation?: string;
    players?: string[];
    annotations?: string[];
    highlights?: string[];
    duration?: number;
  };
  transitions: {
    enter: 'fade' | 'slide' | 'zoom' | 'none';
    exit: 'fade' | 'slide' | 'zoom' | 'none';
    duration: number;
  };
}

interface PresentationState {
  isActive: boolean;
  currentSlide: number;
  slides: PresentationSlide[];
  isPlaying: boolean;
  autoAdvance: boolean;
  slideDuration: number;
  pointerPosition: { x: number; y: number } | null;
  laserPointer: boolean;
  annotations: string[];
}

// Laser pointer component
const LaserPointer: React.FC<{
  position: { x: number; y: number };
  isActive: boolean;
}> = React.memo(({ position, isActive }) => {
  if (!isActive) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Laser dot */}
      <div className="w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
      <div className="absolute inset-0 w-4 h-4 bg-red-600 rounded-full" />
      
      {/* Glow effect */}
      <div className="absolute inset-0 w-8 h-8 bg-red-500/30 rounded-full animate-pulse transform -translate-x-2 -translate-y-2" />
    </div>
  );
});

// Slide navigation
const SlideNavigation: React.FC<{
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (slide: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  isPlaying: boolean;
}> = React.memo(({
  currentSlide,
  totalSlides,
  onSlideChange,
  onPlay,
  onPause,
  onStop,
  isPlaying,
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/80 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
        <div className="flex items-center space-x-4">
          {/* Previous */}
          <button
            onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => onSlideChange(Math.min(totalSlides - 1, currentSlide + 1))}
            disabled={currentSlide === totalSlides - 1}
            className="p-2 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Slide counter */}
          <div className="text-white text-sm font-medium px-3">
            {currentSlide + 1} / {totalSlides}
          </div>

          {/* Stop */}
          <button
            onClick={onStop}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

// Presentation controls overlay
const PresentationControls: React.FC<{
  onToggleLaser: () => void;
  onToggleAnnotations: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  laserActive: boolean;
  annotationsVisible: boolean;
  zoomLevel: number;
}> = React.memo(({
  onToggleLaser,
  onToggleAnnotations,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  laserActive,
  annotationsVisible,
  zoomLevel,
}) => {
  return (
    <div className="fixed top-8 right-8 z-50">
      <div className="bg-black/80 backdrop-blur-md rounded-lg p-4 border border-white/20 space-y-3">
        <div className="text-white text-sm font-medium mb-3">Presentation Tools</div>
        
        {/* Laser pointer */}
        <button
          onClick={onToggleLaser}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            laserActive
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔴 Laser Pointer
        </button>

        {/* Annotations */}
        <button
          onClick={onToggleAnnotations}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            annotationsVisible
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📝 Annotations
        </button>

        {/* Zoom controls */}
        <div className="space-y-2">
          <div className="text-white text-xs">Zoom: {(zoomLevel * 100).toFixed(0)}%</div>
          <div className="flex space-x-1">
            <button
              onClick={onZoomOut}
              className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              −
            </button>
            <button
              onClick={onResetZoom}
              className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              100%
            </button>
            <button
              onClick={onZoomIn}
              className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Slide content overlay
const SlideOverlay: React.FC<{
  slide: PresentationSlide;
  isVisible: boolean;
}> = React.memo(({ slide, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-8 left-8 z-40 max-w-md">
      <div 
        className="bg-black/90 backdrop-blur-md rounded-lg p-6 border border-white/20 transform transition-all duration-500"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">{slide.title}</h2>
        
        {slide.content.annotations && slide.content.annotations.length > 0 && (
          <div className="space-y-2">
            {slide.content.annotations.map((annotation, index) => (
              <div key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>{annotation}</span>
              </div>
            ))}
          </div>
        )}

        {slide.content.highlights && slide.content.highlights.length > 0 && (
          <div className="mt-4 space-y-1">
            <div className="text-yellow-400 text-sm font-medium">Key Points:</div>
            {slide.content.highlights.map((highlight, index) => (
              <div key={index} className="text-yellow-300 text-sm flex items-start space-x-2">
                <span className="text-yellow-400">★</span>
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const ProfessionalPresentationMode: React.FC = () => {
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const { tacticsState } = useTacticsContext();
  const { isPresentationMode } = uiState;
  const { formations, activeFormationIds, players } = tacticsState;

  const [presentationState, setPresentationState] = useState<PresentationState>({
    isActive: isPresentationMode || false,
    currentSlide: 0,
    slides: [],
    isPlaying: false,
    autoAdvance: false,
    slideDuration: 10000, // 10 seconds
    pointerPosition: null,
    laserPointer: false,
    annotations: [],
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const presentationRef = useRef<HTMLDivElement>(null);
  const slideTimerRef = useRef<NodeJS.Timeout>();

  // Generate default slides based on current formations
  const generateDefaultSlides = useCallback((): PresentationSlide[] => {
    const slides: PresentationSlide[] = [];

    // Title slide
    slides.push({
      id: 'title',
      title: 'Tactical Analysis Presentation',
      type: 'custom',
      content: {
        annotations: [
          'Comprehensive formation analysis',
          'Player positioning strategies',
          'Tactical advantages and weaknesses',
        ],
        highlights: [
          'AI-powered insights',
          'Real-time adjustments',
          'Professional visualization',
        ],
      },
      transitions: {
        enter: 'fade',
        exit: 'slide',
        duration: 500,
      },
    });

    // Formation overview
    if (formations && activeFormationIds) {
      slides.push({
        id: 'formations',
        title: 'Formation Overview',
        type: 'formation',
        content: {
          formation: formations[activeFormationIds.home]?.name || 'Home Formation',
          annotations: [
            `Home: ${formations[activeFormationIds.home]?.name || 'Custom'}`,
            `Away: ${formations[activeFormationIds.away]?.name || 'Custom'}`,
            'Tactical setup and player positioning',
          ],
          highlights: [
            'Balanced formation structure',
            'Strategic player placement',
            'Defensive and attacking balance',
          ],
        },
        transitions: {
          enter: 'slide',
          exit: 'zoom',
          duration: 600,
        },
      });
    }

    // Player analysis
    if (players && players.length > 0) {
      slides.push({
        id: 'players',
        title: 'Key Players Analysis',
        type: 'analysis',
        content: {
          players: players.slice(0, 5).map(p => p.name),
          annotations: [
            'Individual player strengths',
            'Role compatibility assessment',
            'Performance optimization',
          ],
          highlights: [
            'Star players identified',
            'Tactical roles optimized',
            'Chemistry considerations',
          ],
        },
        transitions: {
          enter: 'zoom',
          exit: 'fade',
          duration: 400,
        },
      });
    }

    // Summary slide
    slides.push({
      id: 'summary',
      title: 'Tactical Summary',
      type: 'custom',
      content: {
        annotations: [
          'Formation effectiveness analyzed',
          'Strategic recommendations provided',
          'Ready for implementation',
        ],
        highlights: [
          'Optimized team structure',
          'Enhanced tactical awareness',
          'Competitive advantage gained',
        ],
      },
      transitions: {
        enter: 'fade',
        exit: 'fade',
        duration: 500,
      },
    });

    return slides;
  }, [formations, activeFormationIds, players]);

  // Initialize slides when presentation starts
  useEffect(() => {
    if (presentationState.isActive && presentationState.slides.length === 0) {
      setPresentationState(prev => ({
        ...prev,
        slides: generateDefaultSlides(),
      }));
    }
  }, [presentationState.isActive, presentationState.slides.length, generateDefaultSlides]);

  // Mouse tracking for laser pointer
  useEffect(() => {
    if (!presentationState.laserPointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPresentationState(prev => ({
        ...prev,
        pointerPosition: { x: e.clientX, y: e.clientY },
      }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [presentationState.laserPointer]);

  // Keyboard controls
  useEffect(() => {
    if (!presentationState.isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          handleSlideChange(Math.min(presentationState.slides.length - 1, presentationState.currentSlide + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSlideChange(Math.max(0, presentationState.currentSlide - 1));
          break;
        case 'Escape':
          e.preventDefault();
          handleStop();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          handleToggleLaser();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [presentationState.isActive, presentationState.slides.length, presentationState.currentSlide]);

  // Auto-advance slides
  useEffect(() => {
    if (presentationState.isPlaying && presentationState.autoAdvance) {
      slideTimerRef.current = setTimeout(() => {
        const nextSlide = presentationState.currentSlide + 1;
        if (nextSlide < presentationState.slides.length) {
          handleSlideChange(nextSlide);
        } else {
          handlePause();
        }
      }, presentationState.slideDuration);
    }

    return () => {
      if (slideTimerRef.current) {
        clearTimeout(slideTimerRef.current);
      }
    };
  }, [presentationState.isPlaying, presentationState.autoAdvance, presentationState.currentSlide, presentationState.slideDuration, presentationState.slides.length]);

  // Control functions
  const handleSlideChange = useCallback((slideIndex: number) => {
    setPresentationState(prev => ({ ...prev, currentSlide: slideIndex }));
  }, []);

  const handlePlay = useCallback(() => {
    setPresentationState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setPresentationState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleStop = useCallback(() => {
    setPresentationState(prev => ({
      ...prev,
      isPlaying: false,
      currentSlide: 0,
      isActive: false,
    }));
    uiDispatch({ type: 'TOGGLE_PRESENTATION_MODE' });
  }, [uiDispatch]);

  const handleToggleLaser = useCallback(() => {
    setPresentationState(prev => ({ ...prev, laserPointer: !prev.laserPointer }));
  }, []);

  const handleToggleAnnotations = useCallback(() => {
    // Toggle annotation visibility
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Start presentation
  useEffect(() => {
    if (isPresentationMode && !presentationState.isActive) {
      setPresentationState(prev => ({
        ...prev,
        isActive: true,
        slides: generateDefaultSlides(),
      }));
    } else if (!isPresentationMode && presentationState.isActive) {
      setPresentationState(prev => ({ ...prev, isActive: false }));
    }
  }, [isPresentationMode, presentationState.isActive, generateDefaultSlides]);

  if (!presentationState.isActive || presentationState.slides.length === 0) {
    return null;
  }

  const currentSlide = presentationState.slides[presentationState.currentSlide];

  return (
    <div 
      ref={presentationRef}
      className="fixed inset-0 bg-black z-50"
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Main content area - the field will be rendered here by the parent */}
      <div className="absolute inset-0" />

      {/* Slide overlay */}
      <SlideOverlay slide={currentSlide} isVisible={true} />

      {/* Presentation controls */}
      <PresentationControls
        onToggleLaser={handleToggleLaser}
        onToggleAnnotations={handleToggleAnnotations}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        laserActive={presentationState.laserPointer}
        annotationsVisible={true}
        zoomLevel={zoomLevel}
      />

      {/* Navigation */}
      <SlideNavigation
        currentSlide={presentationState.currentSlide}
        totalSlides={presentationState.slides.length}
        onSlideChange={handleSlideChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        isPlaying={presentationState.isPlaying}
      />

      {/* Laser pointer */}
      <LaserPointer
        position={presentationState.pointerPosition || { x: 0, y: 0 }}
        isActive={presentationState.laserPointer && !!presentationState.pointerPosition}
      />

      {/* Instructions overlay */}
      <div className="fixed bottom-8 left-8 z-40">
        <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 border border-white/20">
          <div className="text-white text-xs space-y-1">
            <div><kbd className="bg-gray-700 px-1 rounded">→</kbd> Next slide</div>
            <div><kbd className="bg-gray-700 px-1 rounded">←</kbd> Previous slide</div>
            <div><kbd className="bg-gray-700 px-1 rounded">L</kbd> Laser pointer</div>
            <div><kbd className="bg-gray-700 px-1 rounded">F</kbd> Fullscreen</div>
            <div><kbd className="bg-gray-700 px-1 rounded">ESC</kbd> Exit</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfessionalPresentationMode);