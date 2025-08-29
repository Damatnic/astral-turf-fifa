
import React, { useMemo, useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import { UsersIcon, BrainCircuitIcon, DumbbellIcon, TargetIcon, ChartLineIcon, ShieldCheck, FormationIcon, SunIcon, MoonIcon, SaveIcon, TrashIcon } from '../components/ui/icons';
import { WeeklySchedule, TrainingDrill, TrainingDrillCategory } from '../types';
import { TRAINING_DRILLS } from '../constants';

const DrillCard: React.FC<{ drill: TrainingDrill, onDragStart: (e: React.DragEvent, drill: TrainingDrill) => void }> = ({ drill, onDragStart }) => {
    const categoryColors: Record<TrainingDrillCategory, string> = {
        attacking: 'border-green-500', defending: 'border-blue-500', physical: 'border-red-500',
        technical: 'border-yellow-500', tactical: 'border-purple-500', set_pieces: 'border-indigo-500',
        warmup: 'border-orange-400', cooldown: 'border-slate-400',
    };
    const intensityColors: Record<TrainingDrill['intensity'], string> = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-red-500' };
    return (
        <div 
            draggable 
            onDragStart={(e) => onDragStart(e, drill)}
            className={`p-2 bg-gray-700 rounded-lg cursor-grab border-l-4 ${categoryColors[drill.category]}`}
            title={drill.description}
        >
            <div className="flex justify-between items-center">
                <p className="font-semibold text-sm text-white">{drill.name}</p>
                <div className={`w-3 h-3 rounded-full ${intensityColors[drill.intensity]}`} title={`Intensity: ${drill.intensity}`}></div>
            </div>
        </div>
    );
};

const SessionPartSlot: React.FC<{
    drillId: string | null;
    part: 'warmup' | 'main' | 'cooldown';
    onDrop: (e: React.DragEvent) => void;
    onClear: () => void;
}> = ({ drillId, part, onDrop, onClear }) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const drill = drillId ? TRAINING_DRILLS.find(d => d.id === drillId) : null;

    return (
        <div 
            onDrop={(e) => { e.preventDefault(); onDrop(e); setIsDragOver(false); }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            className={`p-1.5 rounded-md h-[70px] transition-colors relative ${isDragOver ? 'bg-teal-500/20' : 'bg-gray-900/50'}`}
        >
            <span className="absolute top-1 left-1.5 text-[10px] text-gray-500 font-bold uppercase">{part}</span>
            {drill ? (
                <div className="h-full pt-3">
                     <p className="font-semibold text-xs text-white truncate">{drill.name}</p>
                     <p className="text-[10px] text-gray-400 capitalize">{drill.category.replace('_', ' ')}</p>
                     <button onClick={onClear} className="absolute top-1 right-1 text-gray-500 hover:text-white text-xs">&times;</button>
                </div>
            ) : (
                 <div className="h-full w-full border-2 border-dashed border-gray-600 rounded-md flex items-center justify-center">
                    <span className="text-[10px] text-gray-500">Drop Drill</span>
                </div>
            )}
        </div>
    );
};

const TrainingPage: React.FC = () => {
    const { franchiseState, dispatch } = useFranchiseContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const { trainingSchedule, trainingPlanTemplates } = franchiseState;
    const { activeTeamContext } = uiState;
    
    const activeTeam = activeTeamContext === 'away' ? 'away' : 'home';
    const schedule = trainingSchedule[activeTeam];
    
    const [newTemplateName, setNewTemplateName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    const handleDragStart = (e: React.DragEvent, drill: TrainingDrill) => {
        e.dataTransfer.setData('application/json', JSON.stringify(drill));
    };

    const handleDrop = (day: keyof WeeklySchedule, session: 'morning' | 'afternoon', sessionPart: 'warmup' | 'main' | 'cooldown') => (e: React.DragEvent) => {
        const drill = JSON.parse(e.dataTransfer.getData('application/json')) as TrainingDrill;
        dispatch({ type: 'SET_SESSION_DRILL', payload: { team: activeTeam, day, session, sessionPart, drillId: drill.id } });
    };

    const handleClearDrill = (day: keyof WeeklySchedule, session: 'morning' | 'afternoon', sessionPart: 'warmup' | 'main' | 'cooldown') => {
         dispatch({ type: 'SET_SESSION_DRILL', payload: { team: activeTeam, day, session, sessionPart, drillId: null } });
    };

    const handleToggleRestDay = (day: keyof WeeklySchedule, isResting: boolean) => {
        if (isResting) {
            dispatch({ type: 'SET_DAY_AS_TRAINING', payload: { team: activeTeam, day } });
        } else {
            dispatch({ type: 'SET_DAY_AS_REST', payload: { team: activeTeam, day } });
        }
    };
    
    const drillCategories = useMemo(() => {
        return TRAINING_DRILLS.reduce((acc, drill) => {
            (acc[drill.category] = acc[drill.category] || []).push(drill);
            return acc;
        }, {} as Record<TrainingDrillCategory, TrainingDrill[]>);
    }, []);
    
    const handleSaveTemplate = () => {
        if (newTemplateName.trim()) {
            dispatch({ type: 'SAVE_TRAINING_TEMPLATE', payload: { team: activeTeam, name: newTemplateName.trim() } });
            setNewTemplateName('');
            setShowSaveInput(false);
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Training plan saved!', type: 'success' } });
        }
    };
    
    const handleLoadTemplate = (templateId: string) => {
        if (confirm('Loading a template will overwrite your current weekly schedule. Are you sure?')) {
            dispatch({ type: 'LOAD_TRAINING_TEMPLATE', payload: { team: activeTeam, templateId } });
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Training plan loaded!', type: 'info' } });
        }
    };
    
    const handleDeleteTemplate = (templateId: string) => {
        if (confirm('Are you sure you want to delete this template? This cannot be undone.')) {
            dispatch({ type: 'DELETE_TRAINING_TEMPLATE', payload: { templateId } });
        }
    };
    
    const DAYS_OF_WEEK: (keyof WeeklySchedule)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const CATEGORY_ICONS: Record<TrainingDrillCategory, React.ReactNode> = {
        attacking: <TargetIcon className="w-4 h-4 mr-2" />, defending: <ShieldCheck className="w-4 h-4 mr-2" />,
        physical: <DumbbellIcon className="w-4 h-4 mr-2" />, technical: <ChartLineIcon className="w-4 h-4 mr-2" />,
        tactical: <BrainCircuitIcon className="w-4 h-4 mr-2" />, set_pieces: <FormationIcon className="w-4 h-4 mr-2" />,
        warmup: <SunIcon className="w-4 h-4 mr-2" />, cooldown: <MoonIcon className="w-4 h-4 mr-2" />
    };

    return (
        <div className="w-full h-full flex p-4 bg-gray-900 overflow-hidden">
            <aside className="w-72 bg-gray-800 rounded-lg shadow-lg flex-shrink-0 p-4 flex flex-col">
                <div className="flex-grow overflow-y-auto pr-2">
                    <h2 className="text-xl font-bold text-teal-400 mb-4">Drill Library</h2>
                    <div className="space-y-4">
                        {Object.entries(drillCategories).map(([category, drills]) => (
                            <div key={category}>
                                <h3 className="font-bold text-gray-300 capitalize flex items-center mb-2">{CATEGORY_ICONS[category as TrainingDrillCategory]} {category.replace('_', ' ')}</h3>
                                <div className="space-y-2">
                                    {drills.map(drill => <DrillCard key={drill.id} drill={drill} onDragStart={handleDragStart} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-shrink-0 pt-4 border-t border-gray-700">
                    <h3 className="font-bold text-gray-300 mb-2">Training Templates</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {Object.values(trainingPlanTemplates).map(template => (
                            <div key={template.id} className="group flex items-center justify-between p-2 bg-gray-700/50 rounded-md">
                                <button
                                    onClick={() => handleLoadTemplate(template.id)}
                                    className="text-sm font-semibold text-white truncate hover:text-teal-400"
                                    title={`Load "${template.name}"`}
                                >
                                    {template.name}
                                </button>
                                {!template.isDefault && (
                                    <button
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete template"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {showSaveInput ? (
                        <div className="mt-2 flex space-x-2">
                            <input
                                type="text"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="Template name..."
                                className="flex-grow p-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm"
                                autoFocus
                            />
                            <button onClick={handleSaveTemplate} className="px-3 bg-green-600 hover:bg-green-500 rounded-md"><SaveIcon className="w-4 h-4"/></button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSaveInput(true)}
                            className="w-full mt-2 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-md text-sm font-semibold"
                        >
                            Save Current Plan
                        </button>
                    )}
                </div>
            </aside>
            <main className="flex-grow ml-4 bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center">
                        <UsersIcon className="w-5 h-5 mr-3" />
                        Weekly Training Planner ({activeTeam})
                    </h2>
                </div>
                 <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {DAYS_OF_WEEK.map(day => {
                        const dailySchedule = schedule[day];
                        return (
                        <div key={day} className={`p-3 rounded-lg ${dailySchedule.isRestDay ? 'bg-blue-900/30' : 'bg-gray-700/50'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white capitalize">{day}</h3>
                                <div className="flex items-center">
                                     <span className="text-xs mr-2 text-gray-400">Rest Day</span>
                                     <input type="checkbox" checked={dailySchedule.isRestDay} onChange={() => handleToggleRestDay(day, dailySchedule.isRestDay)}
                                        className="w-4 h-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"/>
                                </div>
                            </div>
                            {!dailySchedule.isRestDay ? (
                                <div className="space-y-3">
                                    <div className="p-2 bg-gray-800/50 rounded-md">
                                        <h4 className="text-xs text-center font-bold text-gray-400 mb-1">Morning</h4>
                                        <div className="space-y-1">
                                            <SessionPartSlot part="warmup" drillId={dailySchedule.morning.warmup} onDrop={handleDrop(day, 'morning', 'warmup')} onClear={() => handleClearDrill(day, 'morning', 'warmup')} />
                                            <SessionPartSlot part="main" drillId={dailySchedule.morning.main} onDrop={handleDrop(day, 'morning', 'main')} onClear={() => handleClearDrill(day, 'morning', 'main')} />
                                            <SessionPartSlot part="cooldown" drillId={dailySchedule.morning.cooldown} onDrop={handleDrop(day, 'morning', 'cooldown')} onClear={() => handleClearDrill(day, 'morning', 'cooldown')} />
                                        </div>
                                    </div>
                                     <div className="p-2 bg-gray-800/50 rounded-md">
                                        <h4 className="text-xs text-center font-bold text-gray-400 mb-1">Afternoon</h4>
                                        <div className="space-y-1">
                                            <SessionPartSlot part="warmup" drillId={dailySchedule.afternoon.warmup} onDrop={handleDrop(day, 'afternoon', 'warmup')} onClear={() => handleClearDrill(day, 'afternoon', 'warmup')} />
                                            <SessionPartSlot part="main" drillId={dailySchedule.afternoon.main} onDrop={handleDrop(day, 'afternoon', 'main')} onClear={() => handleClearDrill(day, 'afternoon', 'main')} />
                                            <SessionPartSlot part="cooldown" drillId={dailySchedule.afternoon.cooldown} onDrop={handleDrop(day, 'afternoon', 'cooldown')} onClear={() => handleClearDrill(day, 'afternoon', 'cooldown')} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[280px] flex items-center justify-center">
                                    <p className="text-gray-400 font-semibold">Team is Resting</p>
                                </div>
                            )}
                        </div>
                        )
                    })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrainingPage;
