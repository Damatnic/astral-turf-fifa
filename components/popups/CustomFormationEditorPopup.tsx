import React, { useState, useRef } from 'react';
import { useUIContext, useTacticsContext } from '../../hooks';
import { CloseIcon, SaveIcon } from '../ui/icons';
import { Formation, FormationSlot, PositionRole } from '../../types';
import { PLAYER_ROLES } from '../../constants';

const RoleToken: React.FC<{ role: { id: string, name: string, abbreviation: string }, onDragStart: (e: React.DragEvent) => void }> = ({ role, onDragStart }) => (
    <div
        draggable
        onDragStart={onDragStart}
        className="p-1 bg-gray-700 rounded-md text-center cursor-grab"
        title={role.name}
    >
        <span className="font-bold text-xs">{role.abbreviation}</span>
    </div>
);

const CustomFormationEditorPopup: React.FC = () => {
    const { dispatch } = useUIContext();
    const { dispatch: tacticsDispatch } = useTacticsContext();
    const [slots, setSlots] = useState<FormationSlot[]>(Array(11).fill(null).map((_, i) => ({
        id: `custom_slot_${i}`,
        role: 'MF',
        defaultPosition: { x: -100, y: -100 },
        playerId: null
    })));
    const [formationName, setFormationName] = useState('');
    const fieldRef = useRef<HTMLDivElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (!data || !fieldRef.current) return;
        
        const { type, payload } = JSON.parse(data);
        const fieldRect = fieldRef.current.getBoundingClientRect();
        const x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
        const y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

        if (type === 'new_role') {
            const emptySlotIndex = slots.findIndex(s => s.defaultPosition.x < 0);
            if (emptySlotIndex !== -1) {
                const newSlots = [...slots];
                newSlots[emptySlotIndex] = {
                    ...newSlots[emptySlotIndex],
                    role: payload.category as PositionRole,
                    defaultPosition: { x, y }
                };
                setSlots(newSlots);
            }
        } else if (type === 'move_slot') {
            const slotIndex = slots.findIndex(s => s.id === payload.id);
            if (slotIndex !== -1) {
                const newSlots = [...slots];
                newSlots[slotIndex].defaultPosition = { x, y };
                setSlots(newSlots);
            }
        }
    };

    const handleSave = () => {
        const name = formationName.trim();
        if (!name) {
            alert('Please enter a formation name.');
            return;
        }
        if (slots.some(s => s.defaultPosition.x < 0)) {
            alert('Please place all 11 player roles on the field.');
            return;
        }

        const newFormation: Formation = {
            id: name,
            name,
            slots,
            isCustom: true
        };
        tacticsDispatch({ type: 'SAVE_CUSTOM_FORMATION', payload: newFormation });
        dispatch({ type: 'CLOSE_MODAL' });
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
            <div onClick={e => e.stopPropagation()} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-teal-400">Custom Formation Editor</h2>
                    <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"><CloseIcon className="w-5 h-5" /></button>
                </div>

                <div className="p-4 flex flex-grow min-h-0">
                    <aside className="w-48 bg-gray-900/50 p-2 rounded-lg flex-shrink-0 overflow-y-auto">
                        <h3 className="font-bold text-gray-300 mb-2 text-center">Roles</h3>
                        <div className="grid grid-cols-3 gap-1">
                            {PLAYER_ROLES.map(role => (
                                <RoleToken key={role.id} role={role} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new_role', payload: role }))} />
                            ))}
                        </div>
                    </aside>
                    <main
                        ref={fieldRef}
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        className="flex-grow ml-4 bg-green-900/20 rounded-lg relative border-2 border-dashed border-gray-600"
                    >
                         <div className="absolute inset-0 bg-[url('/field_lines.svg')] bg-cover bg-center opacity-30"></div>
                        {slots.filter(s => s.defaultPosition.x >= 0).map(slot => (
                             <div
                                key={slot.id}
                                draggable
                                onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify({ type: 'move_slot', payload: { id: slot.id } }))}
                                className="absolute -translate-x-1/2 -translate-y-1/2 p-2 bg-gray-800 rounded-full cursor-move border-2 border-teal-400"
                                style={{ left: `${slot.defaultPosition.x}%`, top: `${slot.defaultPosition.y}%` }}
                            >
                                <span className="font-bold text-sm text-white">{slot.role}</span>
                            </div>
                        ))}
                    </main>
                </div>

                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                    <input
                        type="text"
                        value={formationName}
                        onChange={e => setFormationName(e.target.value)}
                        placeholder="Enter Formation Name (e.g., 4-1-4-1)"
                        className="w-1/2 p-2 bg-gray-700 rounded-md"
                    />
                    <button onClick={handleSave} className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md flex items-center">
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Save Formation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomFormationEditorPopup;
