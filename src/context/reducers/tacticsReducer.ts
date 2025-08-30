import { produce } from 'immer';
import type { TacticsState, Action, Player, Team, DrawingShape, PlaybookItem, CommunicationLogEntry, ContractClause } from '../../types';
import { PLAYER_ROLES } from '../../constants';

export const tacticsReducer = (draft: TacticsState, action: Action): TacticsState | void => {
  switch (action.type) {
    case 'ADD_PLAYER':
        draft.players.push(action.payload);
        break;
    case 'UPDATE_PLAYER': {
        const playerUpdate = action.payload;
        const playerIndex = draft.players.findIndex(p => p.id === playerUpdate.id);
        if (playerIndex > -1) {
            draft.players[playerIndex] = playerUpdate;
        }
        break;
    }
    case 'UPDATE_PLAYERS':
        draft.players = [...action.payload];
        break;
    case 'SET_CAPTAIN': {
        const player = draft.players.find(p => p.id === action.payload);
        if (!player) break;
        
        if (player.team === 'home' && draft.captainIds.away === player.id) draft.captainIds.away = null;
        if (player.team === 'away' && draft.captainIds.home === player.id) draft.captainIds.home = null;

        draft.captainIds[player.team] = draft.captainIds[player.team] === player.id ? null : player.id;
        break;
    }
     case 'ADD_DRAWING': {
      draft.drawings.push(action.payload);
      break;
    }
    case 'UNDO_LAST_DRAWING':
      draft.drawings.pop();
      break;
    case 'CLEAR_DRAWINGS':
        draft.drawings = [];
        break;
    case 'SWAP_PLAYERS': {
        const { sourcePlayerId, targetPlayerId } = action.payload;
        const sourcePlayer = draft.players.find(p => p.id === sourcePlayerId);
        if (!sourcePlayer) break;
        
        const activeFormation = draft.formations[draft.activeFormationIds[sourcePlayer.team]];
        if (!activeFormation) break;

        const sourceSlot = activeFormation.slots.find(s => s.playerId === sourcePlayerId);
        const targetSlot = activeFormation.slots.find(s => s.playerId === targetPlayerId);

        if (sourceSlot && targetSlot) {
            [sourceSlot.playerId, targetSlot.playerId] = [targetSlot.playerId, sourceSlot.playerId];
        } else if (sourceSlot) { // Benching player by dragging to another on-field player who is then benched
            const benchedPlayer = draft.players.find(p => p.id === targetPlayerId);
            if(benchedPlayer) {
                benchedPlayer.position = {x: -100, y: -100};
                sourceSlot.playerId = targetPlayerId;
            }
        } else if (targetSlot) { // Dragging benched player onto field
            targetSlot.playerId = sourcePlayerId;
        }
        
        // Update positions after swap
        draft.players.forEach(p => {
            if (p.team === sourcePlayer.team) {
                const slot = activeFormation.slots.find(s => s.playerId === p.id);
                if (slot) {
                    p.position = slot.defaultPosition;
                }
            }
        });
        break;
    }
    case 'UPDATE_PLAYER_POSITION': {
        const { playerId, position } = action.payload;
        const player = draft.players.find(p => p.id === playerId);
        if (player) {
            player.position = position;

            // Also remove from any slot they were in, so they become a 'free' token
            const formation = draft.formations[draft.activeFormationIds[player.team]];
            if (formation) {
                const slot = formation.slots.find(s => s.playerId === playerId);
                if (slot) {
                    slot.playerId = null;
                }
            }
        }
        break;
    }
    case 'BENCH_PLAYER': {
        const { playerId } = action.payload;
        const player = draft.players.find(p => p.id === playerId);
        if(!player) break;
        const formation = draft.formations[draft.activeFormationIds[player.team]];
        const slot = formation?.slots.find(s => s.playerId === playerId);
        if (slot) {
            slot.playerId = null;
        }
        player.position = { x: -100, y: -100 };
        break;
    }
    case 'BENCH_ALL_PLAYERS': {
        const { team } = action.payload;
        const formation = draft.formations[draft.activeFormationIds[team]];
        if (!formation) break;
        formation.slots.forEach(slot => {
            slot.playerId = null;
        });
        draft.players.forEach(player => {
            if (player.team === team) {
                player.position = { x: -100, y: -100 };
            }
        });
        break;
    }
    case 'ASSIGN_PLAYER_TO_SLOT': {
        const { slotId, playerId, team } = action.payload;
        const formation = draft.formations[draft.activeFormationIds[team]];
        const slot = formation.slots.find(s => s.id === slotId);
        if (slot) {
            slot.playerId = playerId;
            const player = draft.players.find(p => p.id === playerId);
            if(player) {
                player.position = slot.defaultPosition;
            }
        }
        break;
    }
    case 'SET_ACTIVE_FORMATION': {
        const { formationId, team } = action.payload;
        draft.activeFormationIds[team] = formationId;
        const newFormation = draft.formations[formationId];
        // Assign players from bench if slots are empty
        const onFieldIds = new Set(newFormation.slots.map(s => s.playerId));
        const benchedPlayers = draft.players.filter(p => p.team === team && !onFieldIds.has(p.id));

        newFormation.slots.forEach(slot => {
            if(!slot.playerId) {
                // Try to find a player of the correct role
                let playerToAssign = benchedPlayers.find(p => PLAYER_ROLES.find(r => r.id === p.roleId)?.category === slot.role && !newFormation.slots.some(s => s.playerId === p.id));
                if (!playerToAssign) {
                     // If no specific role match, take any benched player
                     playerToAssign = benchedPlayers.find(p => !newFormation.slots.some(s => s.playerId === p.id));
                }
                if (playerToAssign) {
                    slot.playerId = playerToAssign.id;
                }
            }
        });

        // Update all player positions for the team
        draft.players.forEach(p => {
            if(p.team === team) {
                const assignedSlot = newFormation.slots.find(s => s.playerId === p.id);
                p.position = assignedSlot ? assignedSlot.defaultPosition : { x: -100, y: -100 };
            }
        });
        break;
    }
    case 'SAVE_CUSTOM_FORMATION':
        draft.formations[action.payload.id] = action.payload;
        break;
    case 'DELETE_CUSTOM_FORMATION':
        delete draft.formations[action.payload];
        break;
    case 'SET_TEAM_TACTIC':
        draft.teamTactics[action.payload.team][action.payload.tactic] = action.payload.value;
        break;
    case 'LOAD_PLAYBOOK_ITEM':
        draft.drawings = [];
        break;
    case 'LOAD_PLAYBOOK':
        draft.playbook = action.payload;
        break;

    case 'DELETE_PLAYBOOK_ITEM': {
      delete draft.playbook[action.payload];
      break;
    }

    case 'DUPLICATE_PLAYBOOK_ITEM': {
      const originalItem = draft.playbook[action.payload];
      if (originalItem) {
        const newItemId = `pb_${Date.now()}`;
        const duplicatedItem: PlaybookItem = JSON.parse(JSON.stringify(originalItem)); // Deep copy
        duplicatedItem.id = newItemId;
        duplicatedItem.name = `${originalItem.name} (Copy)`;
        draft.playbook[newItemId] = duplicatedItem;
      }
      break;
    }

    case 'CREATE_PLAYBOOK_ITEM': {
      // This should be handled in rootReducer where we have access to UI state
      // for activeTeamContext. Moving it there.
      break;
    }

    case 'ADD_PLAYBOOK_STEP': {
      // This action should be handled in rootReducer or with activePlaybookItemId from UI state
      // We need access to UI state to know which playbook item is active
      // For now, we'll handle it in rootReducer
      break;
    }

    case 'SET_PLAYBOOK_EVENT': {
      // This action should be handled in rootReducer or with activePlaybookItemId from UI state
      // We need access to UI state to know which playbook item is active
      // For now, we'll handle it in rootReducer
      break;
    }

    case 'ADD_DEVELOPMENT_LOG': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        if (player) {
            player.developmentLog.unshift({ ...action.payload.entry, id: `log_${Date.now()}` });
        }
        break;
    }
    
    case 'SEND_PLAYER_MESSAGE_START': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        if (player) {
            player.conversationHistory.push(action.payload.message);
        }
        break;
    }

    case 'SEND_PLAYER_MESSAGE_SUCCESS': {
        const { playerId, response, moraleEffect } = action.payload;
        const player = draft.players.find(p => p.id === playerId);
        if (player) {
            player.conversationHistory.push(response);
            const moraleOrder: Player['morale'][] = ['Very Poor', 'Poor', 'Okay', 'Good', 'Excellent'];
            const currentMoraleIndex = moraleOrder.indexOf(player.morale);
            const newMoraleIndex = Math.max(0, Math.min(moraleOrder.length - 1, currentMoraleIndex + moraleEffect));
            player.morale = moraleOrder[newMoraleIndex];
        }
        break;
    }
    
    case 'SEND_PLAYER_MESSAGE_FAILURE': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        if (player) {
            player.conversationHistory.push({ id: 'error', sender: 'ai', text: 'Sorry, I am not available to talk right now.' });
        }
        break;
    }
    
    case 'ADD_COMMUNICATION_LOG': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        if (player) {
            const newEntry: CommunicationLogEntry = {
                ...action.payload.entry,
                id: `comm_${Date.now()}`,
                date: new Date().toISOString()
            };
            player.communicationLog.unshift(newEntry);
        }
        break;
    }
    
    case 'ADD_CONTRACT_CLAUSE': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        if (player) {
            const newClause: ContractClause = {
                id: `clause_${Date.now()}`,
                text: action.payload.clauseText,
                status: 'Unmet',
                isCustom: true
            };
            player.contract.clauses.push(newClause);
        }
        break;
    }

    case 'UPDATE_CONTRACT_CLAUSE': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        const clause = player?.contract.clauses.find(c => c.id === action.payload.clauseId);
        if (clause) {
            clause.status = action.payload.status;
        }
        break;
    }

    case 'REMOVE_CONTRACT_CLAUSE': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        if (player) {
            player.contract.clauses = player.contract.clauses.filter(c => c.id !== action.payload.clauseId);
        }
        break;
    }

    case 'TERMINATE_PLAYER_CONTRACT': {
        const playerIndex = draft.players.findIndex(p => p.id === action.payload);
        if(playerIndex > -1) {
            draft.players.splice(playerIndex, 1);
            // Also remove from any formation
            Object.values(draft.formations).forEach(f => {
                f.slots.forEach(s => { if(s.playerId === action.payload) s.playerId = null; });
            });
        }
        break;
    }

    case 'SET_PLAYER_SESSION_DRILL': {
        const { playerId, day, session, sessionPart, drillId } = action.payload;
        const player = draft.players.find(p => p.id === playerId);
        if (player && player.customTrainingSchedule) {
            player.customTrainingSchedule[day][session][sessionPart] = drillId;
            if (drillId) {
                player.customTrainingSchedule[day].isRestDay = false;
            }
        }
        break;
    }
    case 'SET_PLAYER_DAY_AS_REST': {
        const { playerId, day } = action.payload;
        const player = draft.players.find(p => p.id === playerId);
        if (player && player.customTrainingSchedule) {
            player.customTrainingSchedule[day].isRestDay = true;
            player.customTrainingSchedule[day].morning = { warmup: null, main: null, cooldown: null };
            player.customTrainingSchedule[day].afternoon = { warmup: null, main: null, cooldown: null };
        }
        break;
    }
    case 'SET_PLAYER_DAY_AS_TRAINING': {
        const { playerId, day } = action.payload;
        const player = draft.players.find(p => p.id === playerId);
        if (player && player.customTrainingSchedule) {
            player.customTrainingSchedule[day].isRestDay = false;
        }
        break;
    }

    case 'APPLY_TEAM_TALK_EFFECT': {
        const { team, effect } = action.payload;
        draft.players.forEach(p => {
            if (p.team === team) {
                p.moraleBoost = { duration: 30, effect }; // 30 minutes duration
            }
        });
        break;
    }

    case 'CLEAR_MORALE_BOOSTS': {
        const { team } = action.payload;
        draft.players.forEach(p => {
            if (p.team === team) {
                p.moraleBoost = null;
            }
        });
        break;
    }

    case 'RECALL_PLAYER': {
        const player = draft.players.find(p => p.id === action.payload.playerId);
        if(player) {
            player.loan.isLoaned = false;
            player.loan.loanedTo = undefined;
            player.position = { x: -100, y: -100 };
        }
        break;
    }

    case 'UPDATE_PLAYER_CHALLENGE_COMPLETION': {
        const { playerId, challengeId } = action.payload;
        const player = draft.players.find(p => p.id === playerId);
        if (player) {
            const completedIndex = player.completedChallenges.indexOf(challengeId);
            if (completedIndex > -1) {
                player.completedChallenges.splice(completedIndex, 1);
            } else {
                player.completedChallenges.push(challengeId);
            }
        }
        break;
    }

    default:
      return;
  }
};
