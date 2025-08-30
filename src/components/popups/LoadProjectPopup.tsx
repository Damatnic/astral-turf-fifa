import React, { useState, useEffect } from 'react';
import { useUIContext, useTacticsContext, useFranchiseContext } from '../../hooks';
import { CloseIcon, SaveIcon, FolderOpenIcon, TrashIcon, PlusIcon } from '../ui/icons';
import type { RootState, SaveSlot } from '../../types';

const LoadProjectPopup: React.FC = () => {
    const { dispatch } = useUIContext();
    const { dispatch: rootDispatch } = useTacticsContext(); // Can use any context for root actions
    const [saveSlots, setSaveSlots] = useState<Record<string, SaveSlot>>({});
    const [newSlotName, setNewSlotName] = useState('');

    useEffect(() => {
        const slots = JSON.parse(localStorage.getItem('astralTurfSaveSlots') || '{}');
        setSaveSlots(slots);
    }, []);

    const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

    const handleCreateSlot = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newSlotName.trim();
        if (!name) return;
        const id = `slot_${Date.now()}`;
        const newSlot: SaveSlot = { id, name, lastSaved: new Date().toISOString(), appVersion: '8.0.0' };
        
        const updatedSlots = { ...saveSlots, [id]: newSlot };
        localStorage.setItem('astralTurfSaveSlots', JSON.stringify(updatedSlots));
        setSaveSlots(updatedSlots);
        setNewSlotName('');

        // Automatically select the new slot
        rootDispatch({ type: 'SET_ACTIVE_SAVE_SLOT', payload: id });
        // Reset state for the new slot
        rootDispatch({ type: 'RESET_STATE' });
        
        handleClose();
    };

    const handleLoadSlot = (slotId: string) => {
        const savedStateJSON = localStorage.getItem(`astralTurfSave_${slotId}`);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            rootDispatch({ type: 'LOAD_STATE', payload: savedState as RootState });
            rootDispatch({ type: 'SET_ACTIVE_SAVE_SLOT', payload: slotId });
            handleClose();
        }
    };

    const handleDeleteSlot = (slotId: string) => {
        if (confirm('Are you sure you want to delete this save file? This action cannot be undone.')) {
            const { [slotId]: _, ...remainingSlots } = saveSlots;
            localStorage.setItem('astralTurfSaveSlots', JSON.stringify(remainingSlots));
            localStorage.removeItem(`astralTurfSave_${slotId}`);
            setSaveSlots(remainingSlots);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
            <div onClick={e => e.stopPropagation()} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400 flex items-center"><FolderOpenIcon className="w-5 h-5 mr-2" />Load Project</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <div className="p-4 flex-grow overflow-y-auto space-y-2">
                    {Object.values(saveSlots).length > 0 ? (
                        Object.values(saveSlots).map(slot => (
                            <div key={slot.id} className="group flex items-center justify-between p-3 bg-gray-700/50 rounded-md">
                                <div>
                                    <p className="font-semibold text-white">{slot.name}</p>
                                    <p className="text-xs text-gray-400">Last saved: {new Date(slot.lastSaved).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleLoadSlot(slot.id)} className="px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded text-sm">Load</button>
                                    <button onClick={() => handleDeleteSlot(slot.id)} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-10">No saved projects found. Create one below.</p>
                    )}
                </div>
                <div className="p-4 border-t border-gray-700">
                    <form onSubmit={handleCreateSlot} className="flex space-x-2">
                        <input
                            type="text"
                            value={newSlotName}
                            onChange={e => setNewSlotName(e.target.value)}
                            placeholder="New project name..."
                            className="flex-grow p-2 bg-gray-700 rounded-md"
                        />
                        <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md flex items-center"><PlusIcon className="w-4 h-4 mr-1"/>Create</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoadProjectPopup;
