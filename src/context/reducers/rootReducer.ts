

import { produce } from 'immer';
import type { RootState, Action, NewsItem, InboxItem, Player, TransferPlayer, LeagueTableEntry, PlaybookStep, PlaybookItem, DailySchedule, WeeklySchedule, PlayerAttributes, MatchCommentary, MatchEvent } from '../../types';
import { tacticsReducer } from './tacticsReducer';
import { franchiseReducer } from './franchiseReducer';
import { uiReducer } from './uiReducer';
import { authReducer } from './authReducer';
import { INITIAL_STATE, PLAYER_ROLES, TRAINING_DRILLS } from '../../constants';

const getModifier = (value: Player['form'] | Player['morale']): number => {
    const scale = { 'Excellent': 1.1, 'Good': 1.05, 'Okay': 1.0, 'Average': 1.0, 'Poor': 0.95, 'Very Poor': 0.9 };
    return scale[value] || 1.0;
};

const addInboxItem = (draft: RootState, type: InboxItem['type'], title: string, content: string, payload?: any) => {
    draft.franchise.inbox.unshift({
        id: `inbox_${Date.now()}_${Math.random()}`,
        week: draft.franchise.gameWeek,
        type,
        title,
        content,
        isRead: false,
        payload,
    });
};

const addNewsItem = (draft: RootState, title: string, content: string, type: NewsItem['type'] = 'rumor') => {
    draft.franchise.newsFeed.unshift({
        id: `news_${Date.now()}_${Math.random()}`,
        date: new Date().toISOString(),
        type,
        title,
        content,
    });
};

export const rootReducer = (state: RootState = INITIAL_STATE, action: Action): RootState => {
    // Handle actions that replace the whole state first
    switch (action.type) {
        case 'LOAD_STATE':
            return {
                ...INITIAL_STATE,
                ...action.payload,
                 ui: { ...INITIAL_STATE.ui, ...action.payload.ui }
            };
        case 'RESET_STATE':
            return INITIAL_STATE;
        default:
            // For all other actions, produce the next state by modifying a draft
            return produce(state, (draft: RootState) => {
                // Delegate to sub-reducers first for slice-specific logic
                tacticsReducer(draft.tactics, action);
                franchiseReducer(draft.franchise, action);
                uiReducer(draft.ui, action);
                authReducer(draft.auth, action);

                // Then handle cross-cutting actions that need access to multiple state slices
                switch (action.type) {
                    case 'SOFT_RESET_APP': {
                        draft.tactics.drawings = [];
                        const homeFormation = draft.tactics.formations[draft.tactics.activeFormationIds.home];
                        const awayFormation = draft.tactics.formations[draft.tactics.activeFormationIds.away];
                        draft.tactics.players.forEach(p => {
                            const formation = p.team === 'home' ? homeFormation : awayFormation;
                            const slot = formation?.slots.find(s => s.playerId === p.id);
                            p.position = slot ? slot.defaultPosition : {x: -100, y: -100};
                        });
                        break;
                    }

                    case 'ADVANCE_WEEK': {
                         // Log player attribute history BEFORE advancing the week
                        draft.tactics.players.forEach(p => {
                            p.attributeHistory.push({
                                week: draft.franchise.gameWeek,
                                attributes: { ...p.attributes }
                            });
                        });

                        draft.franchise.gameWeek++;
                        
                        // Slowly develop rivalries from clashing personalities
                        const ambitiousOrTemperamentalPlayers = draft.tactics.players.filter(p => p.traits.includes('Ambitious') || p.traits.includes('Temperamental'));
                        if (ambitiousOrTemperamentalPlayers.length > 1) {
                            for (let i = 0; i < ambitiousOrTemperamentalPlayers.length; i++) {
                                for (let j = i + 1; j < ambitiousOrTemperamentalPlayers.length; j++) {
                                    const p1 = ambitiousOrTemperamentalPlayers[i];
                                    const p2 = ambitiousOrTemperamentalPlayers[j];
                                    if (Math.random() < 0.02) { // 2% chance per week
                                        if (!draft.franchise.relationships[p1.id]) draft.franchise.relationships[p1.id] = {};
                                        draft.franchise.relationships[p1.id][p2.id] = 'rivalry';
                                        addNewsItem(draft, 'Squad Tension', `Reports suggest a growing rivalry between ${p1.name} and ${p2.name} on the training ground.`, 'rumor');
                                    }
                                }
                            }
                        }
                        
                        const teamsToProcess: ('home' | 'away')[] = ['home', 'away'];

                        teamsToProcess.forEach(team => {
                            const teamStaff = draft.franchise.staff[team];
                            const fitnessCoachBonus = teamStaff.fitnessCoach ? (teamStaff.fitnessCoach.fitnessCoaching / 20) * 0.20 : 0; // Max 20% bonus
                            const assistantManagerBonus = teamStaff.assistantManager ? (teamStaff.assistantManager.tacticalKnowledge / 20) * 0.25 : 0; // Max 25% bonus

                            // Tactical familiarity increase from tactical drills
                            const teamSchedule = draft.franchise.trainingSchedule[team];
                            const activeFormationId = draft.tactics.activeFormationIds[team];
                            let tacticalDrillCount = 0;
                            (Object.values(teamSchedule) as DailySchedule[]).forEach(day => {
                                if (day.isRestDay) return;
                                const sessionDrills = [day.morning.warmup, day.morning.main, day.morning.cooldown, day.afternoon.warmup, day.afternoon.main, day.afternoon.cooldown];
                                sessionDrills.forEach(drillId => {
                                    if(drillId) {
                                        const drill = TRAINING_DRILLS.find(d => d.id === drillId);
                                        if (drill && drill.category === 'tactical') {
                                            tacticalDrillCount += drill.intensity === 'high' ? 1.5 : 1;
                                        }
                                    }
                                });
                            });

                            if (activeFormationId && tacticalDrillCount > 0) {
                                let familiarityIncrease = tacticalDrillCount * 0.5 * (1 + assistantManagerBonus);
                                const currentFamiliarity = draft.tactics.tacticalFamiliarity[activeFormationId] || 0;
                                draft.tactics.tacticalFamiliarity[activeFormationId] = Math.min(100, currentFamiliarity + familiarityIncrease);
                            }
                            
                            // Training, Development, Stamina
                            const DEVELOPMENT_THRESHOLD = 100;
                            const teamPlayers = draft.tactics.players.filter(p => p.team === team);
                            const teamFacilitiesLevel = draft.franchise.stadium[team].trainingFacilitiesLevel;

                            teamPlayers.forEach(player => {
                                const schedule = player.customTrainingSchedule || teamSchedule;
                                if (!player.attributeDevelopmentProgress) {
                                    player.attributeDevelopmentProgress = {};
                                }

                                let weeklyStaminaChange = 0;
                                let improvements: string[] = [];

                                (Object.values(schedule) as DailySchedule[]).forEach(day => {
                                    if (day.isRestDay) {
                                        weeklyStaminaChange += 25;
                                    } else {
                                        weeklyStaminaChange += 5; // Base recovery on training day
                                        const dailyDrills = [day.morning.warmup, day.morning.main, day.morning.cooldown, day.afternoon.warmup, day.afternoon.main, day.afternoon.cooldown];
                                        
                                        dailyDrills.forEach(drillId => {
                                            if (!drillId) return;
                                            
                                            const drill = TRAINING_DRILLS.find(d => d.id === drillId);
                                            if (!drill) return;

                                            const processAttribute = (attr: keyof PlayerAttributes, isPrimary: boolean) => {
                                                if (player.attributes[attr] >= 99) return;
                                                let points = isPrimary ? 2 : 1;
                                                if (drill.intensity === 'medium') points *= 1.5;
                                                if (drill.intensity === 'high') points *= 2;

                                                const ageFactor = Math.max(0, (32 - player.age) / 10);
                                                points *= ageFactor;
                                                
                                                if (player.currentPotential < player.potential[1]) points *= 1.5;
                                                
                                                points *= (1 + (teamFacilitiesLevel - 1) * 0.1);
                                                
                                                if (player.individualTrainingFocus?.attribute === attr) {
                                                    points *= 2.5;
                                                }

                                                const currentProgress = player.attributeDevelopmentProgress[attr] || 0;
                                                const newProgress = currentProgress + points;
                                                
                                                if (newProgress >= DEVELOPMENT_THRESHOLD) {
                                                    player.attributes[attr]++;
                                                    player.attributeDevelopmentProgress[attr] = newProgress - DEVELOPMENT_THRESHOLD;
                                                    improvements.push(attr);
                                                } else {
                                                    player.attributeDevelopmentProgress[attr] = newProgress;
                                                }
                                            };

                                            drill.primaryAttributes.forEach(attr => processAttribute(attr, true));
                                            drill.secondaryAttributes.forEach(attr => processAttribute(attr, false));
                                        });
                                    }
                                });
                                
                                weeklyStaminaChange *= (1 + fitnessCoachBonus);
                                player.stamina = Math.max(0, Math.min(100, player.stamina + weeklyStaminaChange));
                                
                                if (improvements.length > 0) {
                                    const uniqueImprovements = [...new Set(improvements)];
                                    addInboxItem(
                                        draft, 'training', `${player.name} Training Report`,
                                        `${player.name} has improved in the following areas this week: ${uniqueImprovements.join(', ')}.`
                                    );
                                }
                            });
                        });
                        break;
                    }
                    
                    case 'SIMULATE_MATCH_UPDATE': {
                        draft.ui.simulationTimeline.push(action.payload);
                        break;
                    }

                    case 'SIMULATE_MATCH_SUCCESS': {
                        const result = action.payload;
                        draft.franchise.lastMatchResult = result;
                        draft.franchise.matchHistory.push(result);
                        draft.ui.activeModal = 'postMatchReport';
                        
                        // Handle relationship changes from assists
                        result.events.forEach(event => {
                            if (event.type === 'Goal' && event.assisterName) {
                                const scorer = draft.tactics.players.find(p => p.name === event.playerName && p.team === event.team);
                                const assister = draft.tactics.players.find(p => p.name === event.assisterName && p.team === event.team);
                                if (scorer && assister && Math.random() < 0.25) { // 25% chance to become friends
                                    if (!draft.franchise.relationships[scorer.id]) draft.franchise.relationships[scorer.id] = {};
                                    draft.franchise.relationships[scorer.id][assister.id] = 'friendship';
                                    addNewsItem(draft, 'Strong Partnership', `A strong on-field partnership seems to be brewing between ${scorer.name} and ${assister.name}!`, 'social_media');
                                }
                            }
                        });

                        const userTeamName = draft.franchise.season.leagueTeams.find(t => t.isUser)?.name || 'Astral FC';
                        
                        const fixture = draft.franchise.season.fixtures.find(f => f.week === draft.franchise.gameWeek && (f.homeTeam === userTeamName || f.awayTeam === userTeamName));
                        if (!fixture) {
                             addInboxItem(draft, 'match', `Friendly Result: Home vs. Away`, `Final score: ${result.homeScore} - ${result.awayScore}.`);
                             break;
                        }

                        const isHome = fixture.homeTeam === userTeamName;
                        const didWin = isHome ? result.homeScore > result.awayScore : result.awayScore > result.homeScore;

                        draft.franchise.jobSecurity = Math.max(0, Math.min(100, draft.franchise.jobSecurity + (didWin ? 2 : -2)));
                        draft.franchise.fanConfidence = Math.max(0, Math.min(100, draft.franchise.fanConfidence + (didWin ? 3 : -3)));

                        const homeEntry = draft.franchise.season.leagueTable[fixture.homeTeam];
                        const awayEntry = draft.franchise.season.leagueTable[fixture.awayTeam];
                        
                        if (homeEntry && awayEntry) {
                            homeEntry.played++;
                            awayEntry.played++;
                            homeEntry.goalsFor += result.homeScore;
                            awayEntry.goalsFor += result.awayScore;
                            homeEntry.goalsAgainst += result.awayScore;
                            awayEntry.goalsAgainst += result.homeScore;
                            homeEntry.goalDifference = homeEntry.goalsFor - homeEntry.goalsAgainst;
                            awayEntry.goalDifference = awayEntry.goalsFor - awayEntry.goalsAgainst;

                            if (result.homeScore > result.awayScore) {
                                homeEntry.won++;
                                awayEntry.lost++;
                                homeEntry.points += 3;
                            } else if (result.awayScore > result.homeScore) {
                                awayEntry.won++;
                                homeEntry.lost++;
                                awayEntry.points += 3;
                            } else {
                                homeEntry.drawn++;
                                awayEntry.drawn++;
                                homeEntry.points++;
                                awayEntry.points++;
                            }
                        }

                        addInboxItem(draft, 'match', `Match Result: ${fixture.homeTeam} vs. ${fixture.awayTeam}`, `Final score: ${result.homeScore} - ${result.awayScore}.`);
                        break;
                    }
                    case 'ADD_LIBRARY_PLAY_TO_PLAYBOOK': {
                        const newId = `pb_${Date.now()}`;
                        draft.tactics.playbook[newId] = { ...action.payload, id: newId };
                        // Now, set the state to load this new item
                        const { formationId, steps } = action.payload;
                        const activeTeam = draft.ui.activeTeamContext === 'away' ? 'away' : 'home';
                        
                        // 1. Set formation
                        draft.tactics.activeFormationIds[activeTeam] = formationId;
                        const newFormation = draft.tactics.formations[formationId];
                        
                        // 2. Assign players
                        const firstStepPositions = steps[0].playerPositions;
                        const playerIdsInPlay = Object.keys(firstStepPositions);
                        
                        // Clear current players from slots for the active team
                        Object.values(draft.tactics.formations).forEach(f => {
                            f.slots.forEach(s => {
                                if (playerIdsInPlay.includes(s.playerId || '')) {
                                    s.playerId = null;
                                }
                            });
                        });
                        
                        // Assign players based on the play
                        playerIdsInPlay.forEach((playerId, index) => {
                            if (newFormation.slots[index]) {
                                newFormation.slots[index].playerId = playerId;
                            }
                        });

                        // 3. Update player positions
                        draft.tactics.players.forEach(p => {
                            const assignedSlot = newFormation.slots.find(s => s.playerId === p.id);
                            p.position = assignedSlot ? assignedSlot.defaultPosition : { x: -100, y: -100 };
                        });
                        
                        // 4. Set UI state to show the play
                        draft.ui.activePlaybookItemId = newId;
                        draft.ui.activeStepIndex = 0;
                        draft.tactics.drawings = [];
                        draft.ui.isAnimating = false;
                        draft.ui.animationTrails = null;
                        draft.ui.playerInitialPositions = null;
                        break;
                    }

                    case 'CREATE_PLAYBOOK_ITEM': {
                        const { name, category } = action.payload;
                        const newItemId = `pb_${Date.now()}`;
                        const activeTeam = draft.ui.activeTeamContext === 'away' ? 'away' : 'home';
                        const activeFormationId = draft.tactics.activeFormationIds[activeTeam];
                        
                        // Create initial step with current player positions
                        const initialStep: PlaybookStep = {
                            id: 'step1',
                            playerPositions: draft.tactics.players.reduce((acc, player) => {
                                acc[player.id] = { ...player.position };
                                return acc;
                            }, {} as Record<string, { x: number; y: number }>),
                            drawings: [...draft.tactics.drawings] // Copy current drawings
                        };
                        
                        const newItem: PlaybookItem = {
                            id: newItemId,
                            name,
                            category,
                            formationId: activeFormationId,
                            steps: [initialStep]
                        };
                        
                        draft.tactics.playbook[newItemId] = newItem;
                        
                        // Set it as active
                        draft.ui.activePlaybookItemId = newItemId;
                        draft.ui.activeStepIndex = 0;
                        break;
                    }

                    case 'ADD_PLAYBOOK_STEP': {
                        const activeItemId = draft.ui.activePlaybookItemId;
                        if (activeItemId && draft.tactics.playbook[activeItemId]) {
                            const playbookItem = draft.tactics.playbook[activeItemId];
                            const currentStepIndex = draft.ui.activeStepIndex || 0;
                            const currentStep = playbookItem.steps[currentStepIndex];
                            
                            // Create new step based on current state
                            const newStep: PlaybookStep = {
                                id: `step${playbookItem.steps.length + 1}`,
                                playerPositions: draft.tactics.players.reduce((acc, player) => {
                                    acc[player.id] = { ...player.position };
                                    return acc;
                                }, {} as Record<string, { x: number; y: number }>),
                                drawings: [...draft.tactics.drawings]
                            };
                            
                            // Insert after current step
                            playbookItem.steps.splice(currentStepIndex + 1, 0, newStep);
                            
                            // Move to the new step
                            draft.ui.activeStepIndex = currentStepIndex + 1;
                        }
                        break;
                    }

                    case 'SET_PLAYBOOK_EVENT': {
                        const activeItemId = draft.ui.activePlaybookItemId;
                        const { stepIndex, event } = action.payload;
                        
                        if (activeItemId && draft.tactics.playbook[activeItemId]) {
                            const playbookItem = draft.tactics.playbook[activeItemId];
                            const step = playbookItem.steps[stepIndex];
                            
                            if (step) {
                                if (event) {
                                    step.event = event;
                                } else {
                                    delete step.event;
                                }
                            }
                        }
                        break;
                    }
                }
            });
    }
};