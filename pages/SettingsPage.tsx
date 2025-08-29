
import React from 'react';
import { useUIContext } from '../hooks';
import { CogIcon } from '../components/ui/icons';
import { AIPersonality } from '../types';

const SettingsPage: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { settings } = uiState;

    const handlePersonalityChange = (personality: AIPersonality) => {
        dispatch({ type: 'SET_AI_PERSONALITY', payload: personality });
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
            <div 
                className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700/50 flex flex-col animate-fade-in-scale"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <CogIcon className="w-5 h-5 mr-3" />
                        Settings
                    </h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-200">AI Personality</h3>
                        <p className="text-sm text-gray-400 mb-3">Choose the tone and focus of the advice you receive from Astral AI.</p>
                        <div className="flex bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md p-0.5">
                            {(['balanced', 'cautious', 'attacking', 'data'] as AIPersonality[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => handlePersonalityChange(p)}
                                    className={`w-full text-xs font-semibold px-2 py-1.5 rounded-md transition-colors capitalize ${
                                        settings.aiPersonality === p ? 'bg-[var(--accent-tertiary)] text-white' : 'text-[var(--text-secondary)] hover:bg-gray-600/70'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;