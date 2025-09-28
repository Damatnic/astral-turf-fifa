import { produce } from 'immer';
import type {
  TacticsState,
  Action,
  Player,
  Team,
  DrawingShape,
  PlaybookItem,
  CommunicationLogEntry,
  ContractClause,
} from '../../types';
import { PLAYER_ROLES } from '../../constants';
import { autoAssignPlayersToFormation, updatePlayerPositionsFromFormation } from '../../services/formationAutoAssignment';

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
      if (!player) {
        break;
      }

      if (player.team === 'home' && draft.captainIds.away === player.id) {
        draft.captainIds.away = null;
      }
      if (player.team === 'away' && draft.captainIds.home === player.id) {
        draft.captainIds.home = null;
      }

      draft.captainIds[player.team] =
        draft.captainIds[player.team] === player.id ? null : player.id;
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
      if (!player) {
        break;
      }
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
      if (!formation) {
        break;
      }
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
        if (player) {
          player.position = slot.defaultPosition;
        }
      }
      break;
    }
    case 'SET_ACTIVE_FORMATION': {
      const { formationId, team } = action.payload;
      draft.activeFormationIds[team] = formationId;
      
      // Use intelligent auto-assignment system
      const baseFormation = draft.formations[formationId];
      const autoAssignedFormation = autoAssignPlayersToFormation(draft.players, baseFormation, team);
      
      // Update the formation with auto-assigned players
      draft.formations[formationId] = autoAssignedFormation;
      
      // Update player positions to match their assigned slots
      const updatedPlayers = updatePlayerPositionsFromFormation(draft.players, autoAssignedFormation, team);
      draft.players = updatedPlayers;
      
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
        const newMoraleIndex = Math.max(
          0,
          Math.min(moraleOrder.length - 1, currentMoraleIndex + moraleEffect),
        );
        player.morale = moraleOrder[newMoraleIndex];
      }
      break;
    }

    case 'SEND_PLAYER_MESSAGE_FAILURE': {
      const player = draft.players.find(p => p.id === action.payload.playerId);
      if (player) {
        player.conversationHistory.push({
          id: 'error',
          sender: 'ai',
          text: 'Sorry, I am not available to talk right now.',
        });
      }
      break;
    }

    case 'ADD_COMMUNICATION_LOG': {
      const player = draft.players.find(p => p.id === action.payload.playerId);
      if (player) {
        const newEntry: CommunicationLogEntry = {
          ...action.payload.entry,
          id: `comm_${Date.now()}`,
          date: new Date().toISOString(),
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
          isCustom: true,
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
        player.contract.clauses = player.contract.clauses.filter(
          c => c.id !== action.payload.clauseId,
        );
      }
      break;
    }

    case 'TERMINATE_PLAYER_CONTRACT': {
      const playerIndex = draft.players.findIndex(p => p.id === action.payload);
      if (playerIndex > -1) {
        draft.players.splice(playerIndex, 1);
        // Also remove from any formation
        Object.values(draft.formations).forEach(f => {
          f.slots.forEach(s => {
            if (s.playerId === action.payload) {
              s.playerId = null;
            }
          });
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
      if (player) {
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

    case 'SWAP_PLAYERS': {
      const { playerId1, playerId2 } = action.payload;
      const player1 = draft.players.find(p => p.id === playerId1);
      const player2 = draft.players.find(p => p.id === playerId2);
      
      if (player1 && player2) {
        // Swap positions
        const tempPosition = player1.position;
        player1.position = player2.position;
        player2.position = tempPosition;
        
        // Swap formation slot assignments if they exist
        const formation1 = draft.formations[draft.activeFormationIds[player1.team]];
        const formation2 = draft.formations[draft.activeFormationIds[player2.team]];
        
        if (formation1) {
          const slot1 = formation1.slots.find(s => s.playerId === playerId1);
          const slot2 = formation1.slots.find(s => s.playerId === playerId2);
          
          if (slot1 && slot2) {
            slot1.playerId = playerId2;
            slot2.playerId = playerId1;
          }
        }
      }
      break;
    }

    case 'MOVE_TO_BENCH': {
      const { playerId } = action.payload;
      const player = draft.players.find(p => p.id === playerId);
      
      if (player) {
        // Remove from formation slot
        const formation = draft.formations[draft.activeFormationIds[player.team]];
        if (formation) {
          const slot = formation.slots.find(s => s.playerId === playerId);
          if (slot) {
            slot.playerId = null;
          }
        }
        
        // Move to bench position
        player.position = { x: -100, y: -100 };
      }
      break;
    }

    default:
      return;
  }
};
