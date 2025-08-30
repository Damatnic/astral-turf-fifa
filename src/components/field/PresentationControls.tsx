
import React from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import { PlayIcon, PauseIcon, ResetIcon, StepForwardIcon, StepBackIcon, ExitFullscreenIcon, BrainCircuitIcon, GoalIcon, CardIcon } from '../ui/icons';
import { getAISubstitutionSuggestion } from "../../services/aiServiceLoader";
import type { Player, PlaybookEvent } from '../../types';

const EventDisplay: React.FC<{event: PlaybookEvent}> = ({ event }) => {
    if (!event?.type) return null;
    const Icon = event.type === 'Goal' ? GoalIcon : CardIcon;
    const color = event.type === 'Goal' ? 'text-green-400' : event.type === 'Yellow Card' ? 'text-yellow-400' : 'text-red-500';

    return (
        <div className="flex items-center text-sm">
            <Icon className={`w-5 h-5 mr-2 ${color}`} />
            <span className="font-bold text-white">{event?.type ?? 'Unknown'}:</span>
            <span className="text-gray-300 ml-1.5 truncate" title={event?.description ?? ''}>{event?.description ?? 'No description'}</span>
        </div>
    );
}

const PresentationControls: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { tacticsState } = useTacticsContext();
    const { isAnimating, activePlaybookItemId, activeStepIndex } = uiState;
    const { playbook } = tacticsState;


    if (!activePlaybookItemId || activeStepIndex === null) return null;

    const activeItem = playbook?.[activePlaybookItemId];
    if (!activeItem) return null;
    
    const currentStep = activeItem?.steps?.[activeStepIndex];
    const event = currentStep?.event;

    const totalSteps = activeItem?.steps?.length ?? 0;
    const canPlay = totalSteps > 1;

    const handlePlayPause = () => {
        if (!canPlay) return;
        if (isAnimating) {
            dispatch({ type: 'PAUSE_ANIMATION' });
        } else {
            dispatch({ type: 'START_ANIMATION' });
        }
    };

    const handleReset = () => {
        dispatch({ type: 'RESET_ANIMATION' });
    };

    const handleNextStep = () => {
        if (activeStepIndex < totalSteps - 1) {
            dispatch({ type: 'SET_ACTIVE_STEP', payload: activeStepIndex + 1 });
        }
    };

    const handlePrevStep = () => {
        if (activeStepIndex > 0) {
            dispatch({ type: 'SET_ACTIVE_STEP', payload: activeStepIndex - 1 });
        }
    };
    
    const handleExit = () => {
        dispatch({ type: 'EXIT_PRESENTATION_MODE' });
    };
    
    const handleAISub = () => {
        dispatch({ type: 'GET_AI_SUB_SUGGESTION_START' });
    };

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md border border-slate-600/50 rounded-xl shadow-2xl flex items-center p-3 space-x-4 z-30 animate-fade-in-scale">
            <button onClick={handlePrevStep} disabled={isAnimating || activeStepIndex === 0} title="Previous Step" className="p-2 rounded-md text-gray-300 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed">
                <StepBackIcon className="w-6 h-6" />
            </button>

            <button onClick={handlePlayPause} disabled={!canPlay} title={isAnimating ? "Pause" : "Play"} className="p-3 rounded-full text-white bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors">
                {isAnimating ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            
            <button onClick={handleReset} title="Restart" className="p-2 rounded-md text-gray-300 hover:bg-gray-700">
                <ResetIcon className="w-6 h-6" />
            </button>

            <button onClick={handleNextStep} disabled={isAnimating || activeStepIndex === totalSteps - 1} title="Next Step" className="p-2 rounded-md text-gray-300 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed">
                <StepForwardIcon className="w-6 h-6" />
            </button>
            
            <div className="w-px h-8 bg-slate-700 mx-2" />
            
            <div className="flex flex-col items-center justify-center w-48">
                <div className="text-lg font-bold text-center">
                    <span className="text-white">{activeStepIndex + 1}</span>
                    <span className="text-gray-500"> / {totalSteps}</span>
                </div>
                <div className="h-5 mt-1">
                    {event && <EventDisplay event={event} />}
                </div>
            </div>

            <div className="w-px h-8 bg-slate-700 mx-2" />
            
            <button onClick={handleAISub} title="Ask AI for Substitution" className="p-2 rounded-md text-teal-400 hover:bg-gray-700">
                <BrainCircuitIcon className="w-6 h-6" />
            </button>

            <button onClick={handleExit} title="Exit Presentation Mode" className="p-2 rounded-md text-gray-300 hover:bg-gray-700">
                <ExitFullscreenIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default PresentationControls;
