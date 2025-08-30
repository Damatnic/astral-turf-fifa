
import React, { useState, useRef, useEffect } from 'react';
import { useTacticsContext, useFranchiseContext, useUIContext } from '../../../hooks';
import { FilePlusIcon, SaveIcon, FolderOpenIcon, UploadIcon, DownloadIcon, BookOpenIcon } from '../icons';
import { save, open } from '@tauri-apps/api/dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/api/fs';
import type { Player, PlayerAttributes, PlayerAvailability, PlayerAvailabilityStatus, PlayerMorale, PlayerForm, PlaybookItem, PlayerContract, PlayerStats, LoanStatus, PlayerTrait, DevelopmentLogEntry, PlayerHistoryStats, IndividualTrainingFocus, ChatMessage } from '../../../types';
import { APP_VERSION } from '../../../constants';
import Papa from 'papaparse';

export const FileMenu: React.FC = () => {
    const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
    const { franchiseState } = useFranchiseContext();
    const { uiState, dispatch: uiDispatch } = useUIContext();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const VALID_TRAITS: PlayerTrait[] = ['Leader', 'Ambitious', 'Loyal', 'Injury Prone', 'Consistent', 'Temperamental'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNewProject = () => {
        if (confirm('Are you sure you want to start a new project? Any unsaved changes will be lost.')) {
            tacticsDispatch({ type: 'RESET_STATE' });
        }
        setIsOpen(false);
    };

    const handleSaveProject = async () => {
        setIsOpen(false);
        if (uiState.activeSaveSlotId) {
             const slots = JSON.parse(localStorage.getItem('astralTurfSaveSlots') || '{}');
             const slotName = slots[uiState.activeSaveSlotId]?.name || 'Current Project';
             uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Project "${slotName}" saved.`, type: 'success' } });
        } else {
             uiDispatch({ type: 'OPEN_MODAL', payload: 'loadProject' });
             uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Please select or create a save slot.', type: 'info' } });
        }
    };

    const handleLoadProject = async () => {
        setIsOpen(false);
        uiDispatch({ type: 'OPEN_MODAL', payload: 'loadProject' });
    };

     const handleImportRoster = async () => {
        setIsOpen(false);
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'CSV Roster File', extensions: ['csv'] }]
            });

            if (typeof selected === 'string') {
                const fileContents = await readTextFile(selected);
                Papa.parse<any>(fileContents, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        try {
                            const newPlayers: Player[] = results.data.map((row, index) => {
                                const attributes: PlayerAttributes = {
                                    speed: parseInt(row.speed, 10) || 50,
                                    passing: parseInt(row.passing, 10) || 50,
                                    tackling: parseInt(row.tackling, 10) || 50,
                                    shooting: parseInt(row.shooting, 10) || 50,
                                    dribbling: parseInt(row.dribbling, 10) || 50,
                                    positioning: parseInt(row.positioning, 10) || 50,
                                    stamina: parseInt(row.stamina, 10) || 85,
                                };

                                const availability: PlayerAvailability = {
                                    status: (['Available', 'Minor Injury', 'Major Injury', 'Suspended', 'International Duty'].includes(row.availabilityStatus) ? row.availabilityStatus : 'Available') as PlayerAvailabilityStatus,
                                    returnDate: row.returnDate || undefined,
                                };
                                
                                const contract: PlayerContract = {
                                    clauses: [],
                                }

                                const loan: LoanStatus = { isLoaned: false };
                                
                                const team = row.team === 'home' || row.team === 'away' ? row.team : 'home';
                                
                                const traits = (row.traits?.split(',') || []).map((t:string) => t.trim()).filter((t:string): t is PlayerTrait => VALID_TRAITS.includes(t as PlayerTrait));
                                
                                const potentialParts = (row.potential || '70-80').split('-').map((s: string) => parseInt(s.trim(), 10));
                                const potential: [number, number] = potentialParts.length === 2 && !isNaN(potentialParts[0]) && !isNaN(potentialParts[1])
                                    ? [potentialParts[0], potentialParts[1]]
                                    : [70, 80];
                                const currentPotential = parseInt(row.currentPotential, 10) || potential[0];

                                return {
                                    id: `imported_${Date.now()}_${index}`,
                                    name: row.name || 'Unknown Player',
                                    jerseyNumber: parseInt(row.jerseyNumber, 10) || 0,
                                    age: parseInt(row.age, 10) || 25,
                                    nationality: row.nationality || '',
                                    potential: potential,
                                    currentPotential: currentPotential,
                                    roleId: row.roleId || 'cm',
                                    instructions: {},
                                    team,
                                    teamColor: team === 'away' ? uiState.teamKits.away.primaryColor : uiState.teamKits.home.primaryColor,
                                    attributes,
                                    position: { x: -100, y: -100 },
                                    availability,
                                    morale: (['Excellent', 'Good', 'Okay', 'Poor', 'Very Poor'].includes(row.morale) ? row.morale : 'Okay') as PlayerMorale,
                                    form: (['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'].includes(row.form) ? row.form : 'Average') as PlayerForm,
                                    stamina: 100,
                                    developmentLog: [] as DevelopmentLogEntry[],
                                    contract,
                                    stats: { careerHistory: [], goals: 0, assists: 0, matchesPlayed: 0, shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 },
                                    loan,
                                    traits: traits,
                                    notes: row.notes || '',
                                    individualTrainingFocus: null,
                                    conversationHistory: [] as ChatMessage[],
                                    attributeHistory: [],
                                    attributeDevelopmentProgress: {},
                                    communicationLog: [],
                                    customTrainingSchedule: null,
                                    fatigue: 0,
                                    injuryRisk: 1,
                                    lastConversationInitiatedWeek: 0,
                                    moraleBoost: null,
                                    completedChallenges: [],
                                };
                            });
                            tacticsDispatch({ type: 'UPDATE_PLAYERS', payload: [...tacticsState.players, ...newPlayers] });
                            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${newPlayers.length} players imported successfully.`, type: 'success' } });
                        } catch (parseErr) {
                             uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Error parsing CSV. ${parseErr instanceof Error ? parseErr.message : ''}`, type: 'error' } });
                        }
                    },
                    error: (err) => {
                         uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `CSV parsing error: ${err.message}`, type: 'error' } });
                    }
                });
            }
        } catch (err) {
            console.error("Error importing roster:", err);
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Error importing roster.`, type: 'error' } });
        }
    };

    const handleExportRoster = async () => {
        setIsOpen(false);
        try {
            const csv = Papa.unparse(tacticsState.players.map(p => ({
                name: p.name,
                jerseyNumber: p.jerseyNumber,
                age: p.age,
                nationality: p.nationality,
                potential: `${p.potential[0]}-${p.potential[1]}`,
                currentPotential: p.currentPotential,
                roleId: p.roleId,
                team: p.team,
                ...p.attributes,
                availabilityStatus: p.availability.status,
                returnDate: p.availability.returnDate,
                morale: p.morale,
                form: p.form,
                notes: p.notes,
                traits: p.traits.join(','),
            })));

            const filePath = await save({
                title: 'Export Roster CSV',
                defaultPath: 'astral-turf-roster.csv',
                filters: [{ name: 'CSV File', extensions: ['csv'] }]
            });
            if (filePath) {
                await writeTextFile(filePath, csv);
                uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Roster exported successfully.', type: 'success' } });
            }
        } catch (err) {
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Error exporting roster. ${err instanceof Error ? err.message : ''}`, type: 'error' } });
        }
    };
    
    const handleExportPlaybook = async () => {
        setIsOpen(false);
        try {
            const filePath = await save({
                title: 'Export Playbook',
                defaultPath: 'astral-turf-playbook.json',
                filters: [{ name: 'JSON File', extensions: ['json'] }]
            });
            if (filePath) {
                await writeTextFile(filePath, JSON.stringify(tacticsState.playbook, null, 2));
                uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Playbook exported successfully.', type: 'success' } });
            }
        } catch (err) {
            console.error("Error exporting playbook:", err);
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Error exporting playbook.`, type: 'error' } });
        }
    };

    const handleImportPlaybook = async () => {
        setIsOpen(false);
        try {
            const selected = await open({
                multiple: false,
                filters: [{ name: 'JSON File', extensions: ['json'] }]
            });
            if (typeof selected === 'string') {
                const fileContents = await readTextFile(selected);
                const loadedPlaybook = JSON.parse(fileContents) as Record<string, PlaybookItem>;
                // Basic validation
                if (typeof loadedPlaybook !== 'object' || loadedPlaybook === null) {
                    throw new Error("Invalid playbook file format.");
                }
                tacticsDispatch({ type: 'LOAD_PLAYBOOK', payload: loadedPlaybook });
                uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Playbook loaded successfully.', type: 'success' } });
            }
        } catch (err) {
            console.error("Error loading playbook:", err);
            uiDispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Error loading playbook. ${err instanceof Error ? err.message : ''}`, type: 'error' } });
        }
    };


    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-md">
                File
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-lg z-20">
                    <button onClick={handleNewProject} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]"><FilePlusIcon className="w-4 h-4 mr-2" />New Project</button>
                    <button onClick={handleSaveProject} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]"><SaveIcon className="w-4 h-4 mr-2" />Save Project</button>
                    <button onClick={handleLoadProject} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]"><FolderOpenIcon className="w-4 h-4 mr-2" />Load Project...</button>
                    <div className="border-t border-[var(--border-primary)] my-1" />
                    <button onClick={handleImportPlaybook} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]"><BookOpenIcon className="w-4 h-4 mr-2" />Import Playbook</button>
                    <button onClick={handleExportPlaybook} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]"><DownloadIcon className="w-4 h-4 mr-2" />Export Playbook</button>
                    <div className="border-t border-[var(--border-primary)] my-1" />
                    <button onClick={handleImportRoster} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]"><UploadIcon className="w-4 h-4 mr-2" />Import Roster (CSV)</button>
                    <button onClick={handleExportRoster} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-[var(--bg-tertiary)]"><DownloadIcon className="w-4 h-4 mr-2" />Export Roster (CSV)</button>
                </div>
            )}
        </div>
    );
};