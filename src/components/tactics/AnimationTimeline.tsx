import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Plus,
  Trash2,
  Edit3,
  Target,
  Flag,
  AlertTriangle,
  X,
  Save,
  Settings,
} from 'lucide-react';
import { useTacticsContext, useUIContext } from '../../hooks';
import type { PlaybookEvent } from '../../types';

interface EventIconProps {
  type: PlaybookEvent['type'];
  className?: string;
}

const EventIcon: React.FC<EventIconProps> = ({ type, className = '' }) => {
  switch (type) {
    case 'Goal':
      return <Target className={`${className} text-green-500`} />;
    case 'Yellow Card':
      return <Flag className={`${className} text-yellow-500`} />;
    case 'Red Card':
      return <AlertTriangle className={`${className} text-red-500`} />;
    default:
      return null;
  }
};

interface StepEventEditorProps {
  stepIndex: number;
  event?: PlaybookEvent;
  onClose: () => void;
}

const StepEventEditor: React.FC<StepEventEditorProps> = ({ stepIndex, event, onClose }) => {
  const { dispatch } = useTacticsContext();
  const [type, setType] = useState<PlaybookEvent['type']>(event?.type || 'Goal');
  const [description, setDescription] = useState(event?.description || '');

  const handleSave = () => {
    if (description?.trim()) {
      dispatch({
        type: 'SET_PLAYBOOK_EVENT',
        payload: {
          stepIndex,
          event: { type, description: description.trim() },
        },
      });
    }
    onClose();
  };

  const handleRemove = () => {
    dispatch({
      type: 'SET_PLAYBOOK_EVENT',
      payload: { stepIndex, event: null },
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute bottom-full mb-2 w-80 bg-slate-800/95  border border-slate-600/50 p-4 rounded-xl shadow-2xl z-50"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white text-sm flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-400" />
          Edit Step Event
        </h4>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Event Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as PlaybookEvent['type'])}
            className="w-full p-2 text-sm bg-slate-700/70 border border-slate-600/50 rounded-lg focus:border-blue-500 focus:outline-none text-white"
          >
            <option value="Goal">Goal</option>
            <option value="Yellow Card">Yellow Card</option>
            <option value="Red Card">Red Card</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
          <input
            type="text"
            placeholder="e.g., Header from corner kick"
            value={description}
            onChange={e => setDescription(e.target.value || '')}
            className="w-full p-2 text-sm bg-slate-700/70 border border-slate-600/50 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex justify-between mt-4 pt-3 border-t border-slate-700">
        <button
          onClick={handleRemove}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Remove
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface StepButtonProps {
  index: number;
}

const StepButton: React.FC<StepButtonProps> = ({ index }) => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { playbook } = tacticsState;
  const { activePlaybookItemId, activeStepIndex } = uiState;
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  if (!activePlaybookItemId || activeStepIndex === null) {
    return null;
  }

  const activeItem = playbook?.[activePlaybookItemId];
  if (!activeItem) {
    return null;
  }

  const step = activeItem?.steps?.[index];
  if (!step) {
    return null;
  }

  const event = step?.event;

  const handleSelectStep = () => {
    dispatch({ type: 'SET_ACTIVE_STEP', payload: index });
  };

  const handleDeleteStep = (e: React.MouseEvent) => {
    e?.stopPropagation();
    if ((activeItem?.steps?.length ?? 0) > 1) {
      if (window.confirm(`Are you sure you want to delete Step ${index + 1}?`)) {
        dispatch({ type: 'DELETE_PLAYBOOK_STEP', payload: index });
      }
    } else {
      window.alert('You cannot delete the only step in a play.');
    }
  };

  const handleToggleEventEditor = (e: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditingEvent(!isEditingEvent);
  };

  const isActive = activeStepIndex === index;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSelectStep}
        className={`group relative w-12 h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-200 shadow-lg ${
          isActive
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-400/50 ring-offset-2 ring-offset-slate-800'
            : 'bg-slate-700/70  text-slate-300 hover:bg-slate-600/70 border border-slate-600/30'
        }`}
      >
        {/* Event indicator */}
        {event && (
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600">
            <EventIcon type={event.type} className="w-3 h-3" />
          </div>
        )}

        <span className="font-semibold">{index + 1}</span>

        {/* Delete button */}
        {(activeItem?.steps?.length ?? 0) > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            onClick={handleDeleteStep}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
            title={`Delete Step ${index + 1}`}
          >
            <Trash2 className="w-3 h-3 text-white" />
          </motion.div>
        )}

        {/* Edit event button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          onClick={handleToggleEventEditor}
          className="absolute -bottom-2 -right-2 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-blue-600 shadow-lg"
          title="Edit Event"
        >
          <Edit3 className="w-3 h-3 text-white" />
        </motion.div>
      </motion.button>

      {/* Event editor */}
      <AnimatePresence>
        {isEditingEvent && (
          <StepEventEditor
            stepIndex={index}
            event={event}
            onClose={() => setIsEditingEvent(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface PlaybackControlsProps {
  isAnimating: boolean;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isAnimating,
  isPaused,
  currentStep,
  totalSteps,
  onPlay,
  onPause,
  onReset,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-700  rounded-lg border border-slate-600/30">
      {/* Previous step */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onPrevious}
        disabled={currentStep <= 0}
        className="p-2 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Previous Step"
      >
        <SkipBack className="w-4 h-4" />
      </motion.button>

      {/* Play/Pause */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={isAnimating && !isPaused ? onPause : onPlay}
        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        title={isAnimating && !isPaused ? 'Pause' : 'Play'}
      >
        {isAnimating && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </motion.button>

      {/* Reset */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onReset}
        className="p-2 text-slate-300 hover:text-white transition-colors"
        title="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </motion.button>

      {/* Next step */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onNext}
        disabled={currentStep >= totalSteps - 1}
        className="p-2 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Next Step"
      >
        <SkipForward className="w-4 h-4" />
      </motion.button>

      {/* Step indicator */}
      <div className="ml-2 px-3 py-1 bg-slate-800/70 rounded-md">
        <span className="text-xs font-medium text-slate-300">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
};

const AnimationTimeline: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { playbook } = tacticsState;
  const { activePlaybookItemId, activeStepIndex, isAnimating, isPaused } = uiState;

  if (!activePlaybookItemId || activeStepIndex === null) {
    return null;
  }

  const activeItem = playbook?.[activePlaybookItemId];
  if (!activeItem) {
    return null;
  }

  const handleAddStep = () => {
    dispatch({ type: 'ADD_PLAYBOOK_STEP' });
  };

  const handlePlay = () => {
    dispatch({ type: 'START_ANIMATION' });
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_ANIMATION' });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_ANIMATION' });
  };

  const handlePrevious = () => {
    if (activeStepIndex > 0) {
      dispatch({ type: 'SET_ACTIVE_STEP', payload: activeStepIndex - 1 });
    }
  };

  const handleNext = () => {
    if (activeStepIndex < (activeItem?.steps?.length ?? 0) - 1) {
      dispatch({ type: 'SET_ACTIVE_STEP', payload: activeStepIndex + 1 });
    }
  };

  const totalSteps = activeItem?.steps?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="bg-slate-800  border border-slate-600/40 rounded-2xl shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-white">Animation Timeline</h3>
            <span className="text-xs text-slate-400">• {activeItem.name}</span>
          </div>

          <PlaybackControls
            isAnimating={isAnimating}
            isPaused={isPaused}
            currentStep={activeStepIndex}
            totalSteps={totalSteps}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-3">
          {/* Steps label */}
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider pr-3 border-r border-slate-600/50">
            Steps
          </div>

          {/* Step buttons */}
          <div className="flex items-center gap-3">
            {(activeItem?.steps ?? []).map((_, index) => (
              <StepButton key={index} index={index} />
            ))}
          </div>

          {/* Add step button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddStep}
            className="w-12 h-12 rounded-xl bg-slate-700 border-2 border-dashed border-slate-600/50 text-slate-400 flex items-center justify-center hover:bg-slate-600/50 hover:border-blue-500/50 hover:text-blue-400 transition-all duration-200"
            title="Add New Step"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimationTimeline;
