import React, { useState } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import { PlusIcon, TrashIcon, GoalIcon, CardIcon, PencilIcon } from '../ui/icons';
import type { PlaybookEvent } from '../../types';

const StepEventEditor: React.FC<{
  stepIndex: number;
  event: PlaybookEvent | undefined;
  onClose: () => void;
}> = ({ stepIndex, event, onClose }) => {
  const { dispatch } = useTacticsContext();
  const [type, setType] = useState<PlaybookEvent['type']>(event?.type || 'Goal');
  const [description, setDescription] = useState(event?.description || '');

  const handleSave = () => {
    if (description?.trim()) {
      dispatch({
        type: 'SET_PLAYBOOK_EVENT',
        payload: { stepIndex, event: { type, description: description.trim() } },
      });
    }
    onClose();
  };

  const handleRemove = () => {
    dispatch({ type: 'SET_PLAYBOOK_EVENT', payload: { stepIndex, event: null } });
    onClose();
  };

  return (
    <div className="absolute bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-30">
      <h4 className="font-bold text-white text-sm mb-2">Edit Step Event</h4>
      <div className="space-y-2">
        <select
          value={type}
          onChange={e => setType(e.target.value as any)}
          className="w-full p-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md"
        >
          <option>Goal</option>
          <option>Yellow Card</option>
          <option>Red Card</option>
        </select>
        <input
          type="text"
          placeholder="Event description (e.g., Header)"
          value={description}
          onChange={e => setDescription(e?.target?.value ?? '')}
          className="w-full p-1.5 text-sm bg-gray-700 border border-gray-600 rounded-md"
        />
      </div>
      <div className="flex justify-between mt-3">
        <button
          onClick={handleRemove}
          className="text-xs px-2 py-1 rounded-md text-red-400 hover:bg-red-500/20"
        >
          Remove
        </button>
        <div className="space-x-2">
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-md hover:bg-gray-600">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-xs px-2 py-1 rounded-md bg-teal-600 hover:bg-teal-500 font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const StepButton: React.FC<{ index: number }> = ({ index }) => {
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

  const eventIcon = () => {
    if (!event?.type) {
      return null;
    }
    if (event.type === 'Goal') {
      return <GoalIcon className="w-3 h-3 text-green-400" />;
    }
    if (event.type === 'Yellow Card') {
      return <CardIcon className="w-3 h-3 text-yellow-400" />;
    }
    if (event.type === 'Red Card') {
      return <CardIcon className="w-3 h-3 text-red-500" />;
    }
    return null;
  };

  const handleSelectStep = () => {
    dispatch({ type: 'SET_ACTIVE_STEP', payload: index });
  };

  const handleDeleteStep = (e: React.MouseEvent) => {
    e?.stopPropagation();
    if ((activeItem?.steps?.length ?? 0) > 1) {
      if (confirm(`Are you sure you want to delete Step ${index + 1}?`)) {
        dispatch({ type: 'DELETE_PLAYBOOK_STEP', payload: index });
      }
    } else {
      alert('You cannot delete the only step in a play.');
    }
  };

  const handleToggleEventEditor = (e: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditingEvent(!isEditingEvent);
  };

  return (
    <div className="relative">
      <button
        onClick={handleSelectStep}
        className={`group relative w-10 h-10 rounded-md text-xs font-bold flex items-center justify-center transition-all duration-200
                    ${
                      activeStepIndex === index
                        ? 'bg-teal-500 text-white ring-2 ring-offset-2 ring-offset-slate-800 ring-teal-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
      >
        {event && <div className="absolute top-0.5 left-0.5">{eventIcon()}</div>}
        <span>{index + 1}</span>
        {(activeItem?.steps?.length ?? 0) > 1 && (
          <div
            onClick={handleDeleteStep}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
            title={`Delete Step ${index + 1}`}
          >
            <TrashIcon className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        <div
          onClick={handleToggleEventEditor}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 hover:bg-teal-600"
          title="Edit Event"
        >
          <PencilIcon className="w-2.5 h-2.5 text-white" />
        </div>
      </button>
      {isEditingEvent && (
        <StepEventEditor stepIndex={index} event={event} onClose={() => setIsEditingEvent(false)} />
      )}
    </div>
  );
};

const AnimationTimeline: React.FC = () => {
  const { tacticsState, dispatch } = useTacticsContext();
  const { uiState } = useUIContext();
  const { playbook } = tacticsState;
  const { activePlaybookItemId, activeStepIndex } = uiState;

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

  return (
    <div
      className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-lg shadow-2xl flex items-center p-2 space-x-2 z-20 animate-fade-in-scale"
      style={{ animationDuration: '0.3s' }}
    >
      <div className="text-xs font-bold text-gray-400 pr-2 border-r border-slate-600">STEPS</div>
      <div className="flex items-center space-x-1.5">
        {(activeItem?.steps ?? []).map((_, index) => (
          <StepButton key={index} index={index} />
        ))}
      </div>
      <button
        onClick={handleAddStep}
        className="w-10 h-10 rounded-md bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-teal-700/50 hover:text-teal-400 transition-colors"
        title="Add New Step"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default AnimationTimeline;
