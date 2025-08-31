
import React from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import type { DrawingTool } from '../../types';
import { ArrowIcon, LineIcon, PenIcon, PlayIcon, ResetIcon, SelectIcon, SquareIcon, TextIcon, TrashIcon, UndoIcon, GridIcon, RadarChartIcon, TargetIcon } from '../ui/icons';

const ToolButton: React.FC<{
    label: string;
    tool?: DrawingTool;
    onClick: (tool?: DrawingTool) => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ label, tool, isActive, onClick, children }) => (
    <button
        aria-label={label}
        title={label}
        onClick={() => onClick(tool)}
        className={`p-2 rounded-md transition-colors ${
            isActive
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
        }`}
    >
        {children}
    </button>
);

const TacticalToolbar: React.FC = () => {
    const { uiState, dispatch } = useUIContext();
    const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
    const { drawingTool, drawingColor, isAnimating, activePlaybookItemId, isGridVisible, isFormationStrengthVisible, positioningMode } = uiState;
    const { drawings, playbook } = tacticsState;

    const setTool = (tool?: DrawingTool) => {
        if(tool) {dispatch({ type: 'SET_DRAWING_TOOL', payload: tool });}
    };
    const setColor = (color: string) => dispatch({ type: 'SET_DRAWING_COLOR', payload: color });
    const undo = () => tacticsDispatch({ type: 'UNDO_LAST_DRAWING' });
    const clear = () => {
        if (confirm("Are you sure you want to clear all drawings?")) {
            tacticsDispatch({ type: 'CLEAR_DRAWINGS' });
        }
    };

    const handlePlay = () => dispatch({ type: 'START_ANIMATION' });
    const handleReset = () => dispatch({ type: 'RESET_ANIMATION' });
    const toggleGrid = () => dispatch({ type: 'TOGGLE_GRID_VISIBILITY' });
    const toggleStrength = () => dispatch({ type: 'TOGGLE_FORMATION_STRENGTH_VISIBILITY' });
    const togglePositioningMode = () => dispatch({ type: 'SET_POSITIONING_MODE', payload: positioningMode === 'snap' ? 'free' : 'snap' });

    const activePlaybookItem = activePlaybookItemId ? playbook[activePlaybookItemId] : null;
    const canPlayAnimation = !!activePlaybookItem && activePlaybookItem.steps.length > 1;

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-lg shadow-2xl flex items-center p-2 space-x-2 z-20">
            <div className="flex items-center space-x-1">
                <ToolButton label="Select (V)" tool="select" isActive={drawingTool === 'select'} onClick={setTool}>
                    <SelectIcon className="w-5 h-5" />
                </ToolButton>
                 <ToolButton label="Arrow (A)" tool="arrow" isActive={drawingTool === 'arrow'} onClick={setTool}>
                    <ArrowIcon className="w-5 h-5" />
                </ToolButton>
                 <ToolButton label="Line (L)" tool="line" isActive={drawingTool === 'line'} onClick={setTool}>
                    <LineIcon className="w-5 h-5" />
                </ToolButton>
                 <ToolButton label="Zone (R)" tool="zone" isActive={drawingTool === 'zone'} onClick={setTool}>
                    <SquareIcon className="w-5 h-5" />
                </ToolButton>
                 <ToolButton label="Pen (P)" tool="pen" isActive={drawingTool === 'pen'} onClick={setTool}>
                    <PenIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton label="Text (T)" tool="text" isActive={drawingTool === 'text'} onClick={setTool}>
                    <TextIcon className="w-5 h-5" />
                </ToolButton>
            </div>

            <div className="w-px h-6 bg-slate-600"></div>

            <div className="flex items-center space-x-1">
                 <ToolButton label="Toggle Grid" isActive={isGridVisible} onClick={toggleGrid}>
                    <GridIcon className="w-5 h-5" />
                </ToolButton>
                 <ToolButton label="Toggle Formation Strength" isActive={isFormationStrengthVisible} onClick={toggleStrength}>
                    <RadarChartIcon className="w-5 h-5" />
                </ToolButton>
                <ToolButton
                    label={`Positioning Mode: ${positioningMode === 'snap' ? 'Snap to Position' : 'Free Movement'}`}
                    isActive={positioningMode === 'free'}
                    onClick={togglePositioningMode}
                >
                    <TargetIcon className="w-5 h-5" />
                </ToolButton>
                <div className="relative w-8 h-8 flex items-center justify-center">
                    <input
                        type="color"
                        aria-label="Select drawing color"
                        value={drawingColor}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div style={{ backgroundColor: drawingColor }} className="w-6 h-6 rounded-md border-2 border-slate-500 pointer-events-none"></div>
                </div>
            </div>

            <div className="w-px h-6 bg-slate-600"></div>

            <div className="flex items-center space-x-1">
                {isAnimating ? (
                    <button aria-label="Reset Animation" onClick={handleReset} className="p-2 rounded-md text-white bg-red-600 hover:bg-red-500 transition-colors">
                        <ResetIcon className="w-5 h-5" />
                    </button>
                ) : (
                    <button aria-label="Play Animation" onClick={handlePlay} disabled={!canPlayAnimation} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors">
                        <PlayIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="w-px h-6 bg-slate-600"></div>

             <div className="flex items-center space-x-1">
                 <button aria-label="Undo Last Drawing" onClick={undo} disabled={drawings.length === 0} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                    <UndoIcon className="w-5 h-5" />
                </button>
                 <button aria-label="Clear All Drawings" onClick={clear} disabled={drawings.length === 0} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default TacticalToolbar;
