import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Presentation,
  Monitor,
  MonitorX,
  MousePointer2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Palette,
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Users,
  Lightbulb,
  Navigation,
  Zap,
  X,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useTacticsContext, useUIContext } from '../../hooks';

interface PresentationControlsProps {
  isPresenting: boolean;
  onTogglePresentation: () => void;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
  isFullscreen?: boolean;
}

interface PresentationSettings {
  showPlayerNames: boolean;
  showPlayerNumbers: boolean;
  showFormationName: boolean;
  showTactics: boolean;
  enablePointerMode: boolean;
  enableSoundEffects: boolean;
  backgroundTheme: 'dark' | 'light' | 'pitch';
  animationSpeed: 'slow' | 'normal' | 'fast';
  autoAdvance: boolean;
  autoAdvanceDelay: number; // seconds
}

interface PresentationState {
  isPlaying: boolean;
  currentSlide: number;
  totalSlides: number;
  elapsedTime: number;
}

const defaultSettings: PresentationSettings = {
  showPlayerNames: true,
  showPlayerNumbers: true,
  showFormationName: true,
  showTactics: false,
  enablePointerMode: false,
  enableSoundEffects: false,
  backgroundTheme: 'dark',
  animationSpeed: 'normal',
  autoAdvance: false,
  autoAdvanceDelay: 5,
};

const PresentationControls: React.FC<PresentationControlsProps> = ({
  isPresenting,
  onTogglePresentation,
  onEnterFullscreen,
  onExitFullscreen,
  isFullscreen = false,
}) => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const [settings, setSettings] = useState<PresentationSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [presentationState, setPresentationState] = useState<PresentationState>({
    isPlaying: false,
    currentSlide: 1,
    totalSlides: 5,
    elapsedTime: 0,
  });
  const [isMinimized, setIsMinimized] = useState(false);

  // Timer for presentation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPresenting && presentationState.isPlaying) {
      interval = setInterval(() => {
        setPresentationState(prev => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }));

        // Auto advance slides if enabled
        if (settings.autoAdvance && presentationState.elapsedTime >= settings.autoAdvanceDelay) {
          if (presentationState.currentSlide < presentationState.totalSlides) {
            handleNextSlide();
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPresenting, presentationState.isPlaying, settings.autoAdvance, settings.autoAdvanceDelay]);

  // Enter presentation mode
  const handleEnterPresentation = () => {
    dispatch({ type: 'ENTER_PRESENTATION_MODE' });
    onTogglePresentation();
    setPresentationState(prev => ({ ...prev, isPlaying: true, elapsedTime: 0 }));
  };

  // Exit presentation mode
  const handleExitPresentation = () => {
    dispatch({ type: 'EXIT_PRESENTATION_MODE' });
    onTogglePresentation();
    setPresentationState(prev => ({ ...prev, isPlaying: false, elapsedTime: 0 }));
  };

  // Playback controls
  const handlePlay = () => {
    setPresentationState(prev => ({ ...prev, isPlaying: true }));
    dispatch({ type: 'START_ANIMATION' });
  };

  const handlePause = () => {
    setPresentationState(prev => ({ ...prev, isPlaying: false }));
    dispatch({ type: 'PAUSE_ANIMATION' });
  };

  const handleStop = () => {
    setPresentationState(prev => ({ ...prev, isPlaying: false, elapsedTime: 0, currentSlide: 1 }));
    dispatch({ type: 'RESET_ANIMATION' });
  };

  const handlePreviousSlide = () => {
    if (presentationState.currentSlide > 1) {
      setPresentationState(prev => ({
        ...prev,
        currentSlide: prev.currentSlide - 1,
        elapsedTime: 0,
      }));
    }
  };

  const handleNextSlide = () => {
    if (presentationState.currentSlide < presentationState.totalSlides) {
      setPresentationState(prev => ({
        ...prev,
        currentSlide: prev.currentSlide + 1,
        elapsedTime: 0,
      }));
    }
  };

  // Settings handlers
  const updateSetting = <K extends keyof PresentationSettings>(
    key: K,
    value: PresentationSettings[K],
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isPresenting) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEnterPresentation}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-semibold transition-all duration-200"
        >
          <Presentation className="w-5 h-5" />
          Start Presentation
        </motion.button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'bottom-6 left-1/2 -translate-x-1/2'} z-50`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600/50 rounded-2xl shadow-2xl">
          {isMinimized ? (
            // Minimized view
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="p-3 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-white font-medium">LIVE</span>
              <span className="text-xs text-slate-400">
                {presentationState.currentSlide}/{presentationState.totalSlides}
              </span>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            // Full controls view
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-white">PRESENTATION MODE</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Slide {presentationState.currentSlide} of {presentationState.totalSlides}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(presentationState.elapsedTime)}
                  </div>
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="Minimize"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleExitPresentation}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="Exit Presentation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Controls */}
              <div className="p-4 space-y-4">
                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePreviousSlide}
                    disabled={presentationState.currentSlide <= 1}
                    className="p-2 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous Slide"
                  >
                    <SkipBack className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={presentationState.isPlaying ? handlePause : handlePlay}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
                    title={presentationState.isPlaying ? 'Pause' : 'Play'}
                  >
                    {presentationState.isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleStop}
                    className="p-2 text-slate-300 hover:text-red-400 transition-colors"
                    title="Stop"
                  >
                    <Square className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNextSlide}
                    disabled={presentationState.currentSlide >= presentationState.totalSlides}
                    className="p-2 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next Slide"
                  >
                    <SkipForward className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Slide Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>
                      {Math.round(
                        (presentationState.currentSlide / presentationState.totalSlides) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(presentationState.currentSlide / presentationState.totalSlides) * 100}%`,
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        updateSetting('enablePointerMode', !settings.enablePointerMode)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        settings.enablePointerMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:text-white'
                      }`}
                      title="Pointer Mode"
                    >
                      <MousePointer2 className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateSetting('showPlayerNames', !settings.showPlayerNames)}
                      className={`p-2 rounded-lg transition-colors ${
                        settings.showPlayerNames
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:text-white'
                      }`}
                      title="Show Player Names"
                    >
                      <Users className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        updateSetting('enableSoundEffects', !settings.enableSoundEffects)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        settings.enableSoundEffects
                          ? 'bg-yellow-600 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:text-white'
                      }`}
                      title="Sound Effects"
                    >
                      {settings.enableSoundEffects ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </motion.button>

                    {isFullscreen ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onExitFullscreen}
                        className="p-2 bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title="Exit Fullscreen"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onEnterFullscreen}
                        className="p-2 bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title="Enter Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg transition-colors ${
                      showSettings
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:text-white'
                    }`}
                    title="Presentation Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-700/50 p-4 space-y-4"
                  >
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      Presentation Settings
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Display Settings */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Display
                        </h5>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={settings.showPlayerNames}
                            onChange={e => updateSetting('showPlayerNames', e.target.checked)}
                            className="rounded"
                          />
                          Player Names
                        </label>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={settings.showPlayerNumbers}
                            onChange={e => updateSetting('showPlayerNumbers', e.target.checked)}
                            className="rounded"
                          />
                          Player Numbers
                        </label>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={settings.showFormationName}
                            onChange={e => updateSetting('showFormationName', e.target.checked)}
                            className="rounded"
                          />
                          Formation Name
                        </label>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={settings.showTactics}
                            onChange={e => updateSetting('showTactics', e.target.checked)}
                            className="rounded"
                          />
                          Tactical Instructions
                        </label>
                      </div>

                      {/* Animation Settings */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Animation
                        </h5>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Speed</label>
                          <select
                            value={settings.animationSpeed}
                            onChange={e => updateSetting('animationSpeed', e.target.value as any)}
                            className="w-full p-1 text-xs bg-slate-700 border border-slate-600 rounded"
                          >
                            <option value="slow">Slow</option>
                            <option value="normal">Normal</option>
                            <option value="fast">Fast</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={settings.autoAdvance}
                            onChange={e => updateSetting('autoAdvance', e.target.checked)}
                            className="rounded"
                          />
                          Auto Advance
                        </label>

                        {settings.autoAdvance && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">
                              Delay: {settings.autoAdvanceDelay}s
                            </label>
                            <input
                              type="range"
                              min={2}
                              max={15}
                              value={settings.autoAdvanceDelay}
                              onChange={e =>
                                updateSetting('autoAdvanceDelay', parseInt(e.target.value))
                              }
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PresentationControls;
