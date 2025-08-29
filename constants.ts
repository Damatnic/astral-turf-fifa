

import { RootState, Formation, Player, PlayerInstruction, PlayerRole, PositionRole, TeamKit, TeamTactics, Season, LeagueTeam, LeagueTableEntry, Fixture, WeeklySchedule, PlayerAttributes, TrainingDrill, DailySchedule, PlayerContract, PlaybookItem, TrainingPlanTemplate, User } from './types';

export const PLAYER_ROLES: PlayerRole[] = [
    // Goalkeepers
    { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', category: 'GK', description: 'Standard goalkeeper focused on shot-stopping.' },
    { id: 'sk', name: 'Sweeper Keeper', abbreviation: 'SK', category: 'GK', description: 'A proactive goalkeeper who operates outside the box.' },
    // Defenders
    { id: 'cb', name: 'Central Defender', abbreviation: 'CB', category: 'DF', description: 'A standard defender focused on marking and tackling.' },
    { id: 'bpd', name: 'Ball-Playing Defender', abbreviation: 'BPD', category: 'DF', description: 'A central defender skilled at passing and initiating attacks.' },
    { id: 'ncb', name: 'No-Nonsense Centre-Back', abbreviation: 'NCB', category: 'DF', description: 'A defender who prioritizes clearing danger above all else.' },
    { id: 'fb', name: 'Full-Back', abbreviation: 'FB', category: 'DF', description: 'A wide defender who balances attack and defense.' },
    { id: 'wb', name: 'Wing-Back', abbreviation: 'WB', category: 'DF', description: 'A more attacking version of a full-back, controlling the entire flank.' },
    // Midfielders
    { id: 'dm', name: 'Defensive Midfielder', abbreviation: 'DM', category: 'MF', description: 'Shields the defense and breaks up opposition attacks.' },
    { id: 'dlp', name: 'Deep-Lying Playmaker', abbreviation: 'DLP', category: 'MF', description: 'Dictates play from a deep position with excellent passing.' },
    { id: 'cm', name: 'Central Midfielder', abbreviation: 'CM', category: 'MF', description: 'A versatile midfielder balancing attack and defense.' },
    { id: 'b2b', name: 'Box-to-Box Midfielder', abbreviation: 'B2B', category: 'MF', description: 'Contributes to both defense and attack with high stamina.' },
    { id: 'ap', name: 'Advanced Playmaker', abbreviation: 'AP', category: 'MF', description: 'Operates in the final third, creating chances for forwards.' },
    { id: 'wm', name: 'Wide Midfielder', abbreviation: 'WM', category: 'MF', description: 'Provides width and support on the flanks.' },
    // Forwards
    { id: 'w', name: 'Winger', abbreviation: 'W', category: 'FW', description: 'An attacking player who operates on the wings, focused on crossing and dribbling.' },
    { id: 'iw', name: 'Inverted Winger', abbreviation: 'IW', category: 'FW', description: 'A winger who cuts inside to shoot or create chances.' },
    { id: 'p', name: 'Poacher', abbreviation: 'P', category: 'FW', description: 'A forward who stays in the box, focused on finishing chances.' },
    { id: 'tf', name: 'Target Forward', abbreviation: 'TF', category: 'FW', description: 'A physically strong forward used to hold up the ball.' },
    { id: 'cf', name: 'Complete Forward', abbreviation: 'CF', category: 'FW', description: 'An all-around striker skilled in all aspects of attacking play.' },
];

export const DETAILED_PLAYER_INSTRUCTIONS: Record<string, { name: string; options: {id: string; name: string}[]; description: string }> = {
    'attacking_runs': { name: 'Attacking Runs', description: 'When and how the player makes forward runs.', options: [ {id: 'default', name: 'Default'}, {id: 'get_forward', name: 'Get Forward'}, {id: 'stay_back', name: 'Stay Back'} ] },
    'width': { name: 'Width', description: 'The horizontal positioning of the player.', options: [ {id: 'default', name: 'Default'}, {id: 'cut_inside', name: 'Cut Inside'}, {id: 'stay_wide', name: 'Stay Wide'} ] },
    'defensive_style': { name: 'Defensive Style', description: 'The player\'s approach to defending.', options: [ {id: 'default', name: 'Default'}, {id: 'man_mark', name: 'Man Mark'}, {id: 'zonal_mark', name: 'Zonal Mark'} ] },
    'positioning_freedom': { name: 'Positioning Freedom', description: 'How much the player roams from their set position.', options: [ {id: 'default', name: 'Default'}, {id: 'roam', name: 'Roam'}, {id: 'hold_position', name: 'Hold Position'} ] },
    'dribbling_style': { name: 'Dribbling Style', description: 'How often the player attempts to dribble.', options: [ {id: 'default', name: 'Default'}, {id: 'dribble_more', name: 'Dribble More'}, {id: 'dribble_less', name: 'Dribble Less'} ] },
    'shooting_style': { name: 'Shooting Style', description: 'How often the player attempts to shoot.', options: [ {id: 'default', name: 'Default'}, {id: 'shoot_more', name: 'Shoot More'}, {id: 'shoot_less', name: 'Shoot Less'} ] },
    'pressing_intensity': { name: 'Pressing Intensity', description: 'How aggressively the player presses opponents.', options: [ {id: 'default', name: 'Default'}, {id: 'press_aggressively', name: 'Press Aggressively'}, {id: 'press_less', name: 'Press Less'} ] },
};

export const TACTIC_OPTIONS = {
    mentality: [
        { value: 'very-defensive', label: 'Very Defensive' },
        { value: 'defensive', label: 'Defensive' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'attacking', label: 'Attacking' },
        { value: 'very-attacking', label: 'Very Attacking' },
    ],
    pressing: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
    ],
    defensiveLine: [
        { value: 'deep', label: 'Deep' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
    ],
    attackingWidth: [
        { value: 'narrow', label: 'Narrow' },
        { value: 'medium', label: 'Medium' },
        { value: 'wide', label: 'Wide' },
    ],
} as const;

export const TRAINING_DRILLS: readonly TrainingDrill[] = [
    // Warmup
    { id: 'warmup_jog', name: 'Light Jog & Stretches', category: 'warmup', description: 'Prepare muscles for session.', primaryAttributes: ['stamina'], secondaryAttributes: [], intensity: 'low', fatigueEffect: 2, moraleEffect: 0, injuryRisk: 0.05 },
    { id: 'warmup_rondo', name: 'Rondo (5v2)', category: 'warmup', description: 'Improve passing and awareness under light pressure.', primaryAttributes: ['passing', 'positioning'], secondaryAttributes: [], intensity: 'low', fatigueEffect: 4, moraleEffect: 1, injuryRisk: 0.1 },
    // Attacking
    { id: 'att_shoot', name: 'Shooting Practice', category: 'attacking', description: 'Focus on finishing chances.', primaryAttributes: ['shooting'], secondaryAttributes: ['positioning'], intensity: 'medium', fatigueEffect: 10, moraleEffect: 1, injuryRisk: 0.2 },
    { id: 'att_cross', name: 'Crossing Drills', category: 'attacking', description: 'Improve accuracy of wide deliveries.', primaryAttributes: ['passing'], secondaryAttributes: ['dribbling'], intensity: 'medium', fatigueEffect: 8, moraleEffect: 0, injuryRisk: 0.1 },
    { id: 'att_final_third', name: 'Final Third Play', category: 'attacking', description: 'Complex attacking scenarios.', primaryAttributes: ['passing', 'positioning', 'shooting'], secondaryAttributes: ['dribbling'], intensity: 'high', fatigueEffect: 15, moraleEffect: 1, injuryRisk: 0.3 },
    { id: 'att_1v1', name: '1v1 Attacking', category: 'attacking', description: 'Practice beating defenders.', primaryAttributes: ['dribbling', 'speed'], secondaryAttributes: ['shooting'], intensity: 'high', fatigueEffect: 12, moraleEffect: 0, injuryRisk: 0.4 },
    { id: 'att_counter', name: 'Counter-Attacking', category: 'attacking', description: 'Drill rapid transitions from defense to attack.', primaryAttributes: ['speed', 'passing'], secondaryAttributes: ['positioning'], intensity: 'high', fatigueEffect: 16, moraleEffect: 0, injuryRisk: 0.3 },
    // Defending
    { id: 'def_pos', name: 'Defensive Positioning', category: 'defending', description: 'Improve team shape and awareness.', primaryAttributes: ['positioning'], secondaryAttributes: ['tackling'], intensity: 'medium', fatigueEffect: 8, moraleEffect: 0, injuryRisk: 0.1 },
    { id: 'def_tackle', name: 'Tackling Drills', category: 'defending', description: 'Focus on clean and effective tackling.', primaryAttributes: ['tackling'], secondaryAttributes: [], intensity: 'high', fatigueEffect: 12, moraleEffect: 0, injuryRisk: 0.4 },
    { id: 'def_shape', name: 'Shape Recovery', category: 'defending', description: 'Practice quickly regaining defensive shape after losing possession.', primaryAttributes: ['positioning', 'stamina'], secondaryAttributes: ['speed'], intensity: 'medium', fatigueEffect: 14, moraleEffect: 0, injuryRisk: 0.2 },
    { id: 'def_1v1', name: '1v1 Defending', category: 'defending', description: 'Practice containing and dispossessing attackers.', primaryAttributes: ['tackling', 'positioning'], secondaryAttributes: ['speed'], intensity: 'high', fatigueEffect: 12, moraleEffect: 0, injuryRisk: 0.4 },
    // Physical
    { id: 'phys_sprints', name: 'Sprint Training', category: 'physical', description: 'High intensity sprints to boost speed.', primaryAttributes: ['speed'], secondaryAttributes: ['stamina'], intensity: 'high', fatigueEffect: 18, moraleEffect: -1, injuryRisk: 0.5 },
    { id: 'phys_endurance', name: 'Endurance Running', category: 'physical', description: 'Long-distance running to build stamina.', primaryAttributes: ['stamina'], secondaryAttributes: ['speed'], intensity: 'medium', fatigueEffect: 15, moraleEffect: -1, injuryRisk: 0.2 },
    { id: 'phys_agility', name: 'Agility Ladders', category: 'physical', description: 'Improve footwork, balance, and coordination.', primaryAttributes: ['speed'], secondaryAttributes: ['dribbling'], intensity: 'medium', fatigueEffect: 10, moraleEffect: 0, injuryRisk: 0.2 },
    // Technical
    { id: 'tech_passing', name: 'Passing Triangle', category: 'technical', description: 'Improve short passing and movement.', primaryAttributes: ['passing'], secondaryAttributes: ['positioning'], intensity: 'low', fatigueEffect: 5, moraleEffect: 1, injuryRisk: 0.1 },
    { id: 'tech_dribble', name: 'Dribbling Course', category: 'technical', description: 'Close control and agility.', primaryAttributes: ['dribbling'], secondaryAttributes: ['speed'], intensity: 'medium', fatigueEffect: 9, moraleEffect: 0, injuryRisk: 0.2 },
    { id: 'tech_longpass', name: 'Long Passing', category: 'technical', description: 'Practice switching play and long-range passes.', primaryAttributes: ['passing'], secondaryAttributes: [], intensity: 'medium', fatigueEffect: 7, moraleEffect: 0, injuryRisk: 0.1 },
    { id: 'tech_gk_dist', name: 'Goalkeeper Distribution', category: 'technical', description: 'Improve kicking and throwing accuracy for goalkeepers.', primaryAttributes: ['passing'], secondaryAttributes: ['positioning'], intensity: 'medium', fatigueEffect: 8, moraleEffect: 0, injuryRisk: 0.1 },
    // Tactical
    { id: 'tact_shape', name: 'Formation Shape', category: 'tactical', description: 'Work on maintaining formation discipline.', primaryAttributes: ['positioning'], secondaryAttributes: [], intensity: 'low', fatigueEffect: 4, moraleEffect: 0, injuryRisk: 0.05 },
    { id: 'tact_press', name: 'Pressing Triggers', category: 'tactical', description: 'Coordinate high-intensity pressing.', primaryAttributes: ['stamina', 'positioning'], secondaryAttributes: ['tackling'], intensity: 'high', fatigueEffect: 16, moraleEffect: 0, injuryRisk: 0.3 },
    { id: 'tact_possession', name: 'Positional Play Game', category: 'tactical', description: 'Small-sided game focused on keeping possession and creating overloads.', primaryAttributes: ['passing', 'positioning'], secondaryAttributes: ['dribbling'], intensity: 'medium', fatigueEffect: 15, moraleEffect: 1, injuryRisk: 0.2 },
    // Set Pieces
    { id: 'set_corners', name: 'Corner Routines', category: 'set_pieces', description: 'Practice attacking and defending corners.', primaryAttributes: ['passing', 'positioning'], secondaryAttributes: ['shooting'], intensity: 'low', fatigueEffect: 6, moraleEffect: 0, injuryRisk: 0.1 },
    { id: 'set_delivery', name: 'Set Piece Delivery', category: 'set_pieces', description: 'Focus on quality of free kick and corner delivery.', primaryAttributes: ['passing'], secondaryAttributes: [], intensity: 'low', fatigueEffect: 5, moraleEffect: 0, injuryRisk: 0.1 },
    // Cooldown
    { id: 'cooldown_stretch', name: 'Yoga & Stretching', category: 'cooldown', description: 'Improve flexibility and aid recovery.', primaryAttributes: ['stamina'], secondaryAttributes: [], intensity: 'low', fatigueEffect: -5, moraleEffect: 1, injuryRisk: 0.05 },
];

const defaultContract: PlayerContract = {
    clauses: [
        { id: 'c1', text: 'Maintain good standing in the Code of Conduct', status: 'Met', isCustom: false },
        { id: 'c2', text: 'Remain academically eligible throughout the season', status: 'Met', isCustom: false },
        { id: 'c3', text: 'Team fees are paid in full', status: 'Unmet', isCustom: false },
    ]
};

const demoPlayer1: Player = { id: 'player1_demo', name: 'Alex Hunter', jerseyNumber: 7, age: 18, nationality: 'GB-ENG', potential: [85, 92], currentPotential: 86, roleId: 'iw', instructions: { width: 'cut_inside' }, team: 'home', teamColor: '#3b82f6', attributes: { speed: 88, passing: 82, tackling: 65, shooting: 85, dribbling: 90, positioning: 84, stamina: 88 }, position: { x: 0, y: 0 }, availability: { status: 'Available' }, morale: 'Excellent', form: 'Good', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Ambitious'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] };
const demoPlayer2: Player = { id: 'player2_demo', name: 'Ben Carter', jerseyNumber: 8, age: 19, nationality: 'US', potential: [84, 90], currentPotential: 85, roleId: 'b2b', instructions: {}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 82, passing: 86, tackling: 80, shooting: 78, dribbling: 84, positioning: 87, stamina: 94 }, position: { x: 0, y: 0 }, availability: { status: 'Available' }, morale: 'Good', form: 'Average', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Consistent', 'Leader'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] };
const demoPlayer3: Player = { id: 'player3_demo', name: 'Carlos Diaz', jerseyNumber: 6, age: 20, nationality: 'MX', potential: [86, 93], currentPotential: 87, roleId: 'dlp', instructions: { positioning_freedom: 'roam' }, team: 'home', teamColor: '#3b82f6', attributes: { speed: 78, passing: 91, tackling: 79, shooting: 75, dribbling: 88, positioning: 86, stamina: 85 }, position: { x: 0, y: 0 }, availability: { status: 'Available' }, morale: 'Good', form: 'Excellent', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: [], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] };
const demoPlayer4: Player = { id: 'player4_demo', name: 'David Chen', jerseyNumber: 2, age: 18, nationality: 'CA', potential: [83, 89], currentPotential: 84, roleId: 'bpd', instructions: {}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 84, passing: 80, tackling: 88, shooting: 60, dribbling: 72, positioning: 85, stamina: 87 }, position: { x: 0, y: 0 }, availability: { status: 'Available' }, morale: 'Okay', form: 'Good', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Loyal'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] };


export const DEMO_USERS: User[] = [
    { id: 'coach1', email: 'coach@astralfc.com', role: 'coach' },
    { id: 'player1', email: 'player1@astralfc.com', role: 'player', playerId: demoPlayer1.id },
    { id: 'player2', email: 'player2@astralfc.com', role: 'player', playerId: demoPlayer2.id },
    { id: 'player3', email: 'player3@astralfc.com', role: 'player', playerId: demoPlayer3.id },
    { id: 'player4', email: 'player4@astralfc.com', role: 'player', playerId: demoPlayer4.id },
];

const defaultPlayers: Player[] = [
  // HOME TEAM
  { id: 'p1', name: 'A. Becker', jerseyNumber: 1, age: 31, nationality: 'BR', potential: [90, 93], currentPotential: 92, roleId: 'sk', instructions: {}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 60, passing: 75, tackling: 20, shooting: 30, dribbling: 40, positioning: 92, stamina: 90 }, position: { x: 8, y: 50 }, availability: {status: 'Available'}, morale: 'Excellent', form: 'Good', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Leader', 'Consistent'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] },
  demoPlayer4,
  { id: 'p3', name: 'T. Alexander-Arnold', jerseyNumber: 66, age: 25, nationality: 'GB-ENG', potential: [90, 94], currentPotential: 92, roleId: 'wb', instructions: {attacking_runs: 'get_forward'}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 88, passing: 94, tackling: 75, shooting: 80, dribbling: 82, positioning: 85, stamina: 92 }, position: { x: 30, y: 15 }, availability: {status: 'Available'}, morale: 'Good', form: 'Average', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: [], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] }, // RB
  { id: 'p4', name: 'A. Robertson', jerseyNumber: 26, age: 30, nationality: 'GB-SCT', potential: [86, 88], currentPotential: 87, roleId: 'wb', instructions: {attacking_runs: 'get_forward'}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 90, passing: 85, tackling: 83, shooting: 70, dribbling: 84, positioning: 86, stamina: 95 }, position: { x: 30, y: 85 }, availability: {status: 'Available'}, morale: 'Good', form: 'Excellent', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [{ season: 2022, club: 'Liverpool', matchesPlayed: 29, goals: 0, assists: 8 }, { season: 2021, club: 'Liverpool', matchesPlayed: 35, goals: 1, assists: 10 }], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Temperamental'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] }, // LB
  demoPlayer1,
  demoPlayer2,
  demoPlayer3,
  { id: 'p8', name: 'M. Salah', jerseyNumber: 11, age: 31, nationality: 'EG', potential: [91, 93], currentPotential: 92, roleId: 'p', instructions: {}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 95, passing: 85, tackling: 50, shooting: 93, dribbling: 94, positioning: 90, stamina: 89 }, position: { x: 80, y: 40 }, availability: {status: 'Available'}, morale: 'Good', form: 'Excellent', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Ambitious'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] }, // R-ST
  { id: 'p9', name: 'L. Díaz', jerseyNumber: 23, age: 27, nationality: 'CO', potential: [87, 90], currentPotential: 88, roleId: 'w', instructions: {dribbling_style: 'dribble_more'}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 92, passing: 80, tackling: 60, shooting: 85, dribbling: 93, positioning: 88, stamina: 91 }, position: { x: 55, y: 80 }, availability: {status: 'Available'}, morale: 'Okay', form: 'Average', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: [], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] }, // LM
  { id: 'p10', name: 'D. Núñez', jerseyNumber: 27, age: 24, nationality: 'UY', potential: [88, 92], currentPotential: 89, roleId: 'p', instructions: {}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 91, passing: 75, tackling: 45, shooting: 89, dribbling: 82, positioning: 90, stamina: 87 }, position: { x: 80, y: 60 }, availability: {status: 'Available'}, morale: 'Good', form: 'Good', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Temperamental'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] }, // L-ST
  { id: 'p11', name: 'I. Konaté', jerseyNumber: 5, age: 24, nationality: 'FR', potential: [88, 91], currentPotential: 89, roleId: 'ncb', instructions: {}, team: 'home', teamColor: '#3b82f6', attributes: { speed: 85, passing: 70, tackling: 88, shooting: 50, dribbling: 65, positioning: 86, stamina: 86 }, position: { x: 25, y: 40 }, availability: {status: 'Available'}, morale: 'Good', form: 'Average', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: [], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] }, // RCB
  
  // AWAY TEAM
  { id: 'p12', name: 'C. Jones', jerseyNumber: 17, age: 23, nationality: 'GB-ENG', potential: [86, 89], currentPotential: 87, roleId: 'cm', instructions: {}, team: 'away', teamColor: '#ef4444', attributes: { speed: 80, passing: 85, tackling: 75, shooting: 78, dribbling: 88, positioning: 84, stamina: 89 }, position: { x: -100, y: -100 }, availability: {status: 'Available'}, morale: 'Good', form: 'Average', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: [], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] },
  { id: 'p13', name: 'H. Elliott', jerseyNumber: 19, age: 21, nationality: 'GB-ENG', potential: [87, 91], currentPotential: 88, roleId: 'ap', instructions: {}, team: 'away', teamColor: '#ef4444', attributes: { speed: 79, passing: 86, tackling: 70, shooting: 77, dribbling: 89, positioning: 83, stamina: 85 }, position: { x: -100, y: -100 }, availability: {status: 'Available'}, morale: 'Good', form: 'Good', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: [], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] },
  { id: 'p14', name: 'K. Tsimikas', jerseyNumber: 21, age: 28, nationality: 'GR', potential: [82, 84], currentPotential: 83, roleId: 'fb', instructions: {}, team: 'away', teamColor: '#ef4444', attributes: { speed: 86, passing: 82, tackling: 79, shooting: 65, dribbling: 81, positioning: 80, stamina: 90 }, position: { x: -100, y: -100 }, availability: {status: 'Suspended', returnDate: '2024-08-20'}, morale: 'Poor', form: 'Average', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: [], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] },
  { id: 'p15', name: 'D. Jota', jerseyNumber: 20, age: 27, nationality: 'PT', potential: [87, 89], currentPotential: 88, roleId: 'cf', instructions: {}, team: 'away', teamColor: '#ef4444', attributes: { speed: 87, passing: 80, tackling: 55, shooting: 88, dribbling: 87, positioning: 91, stamina: 88 }, position: { x: -100, y: -100 }, availability: {status: 'Available'}, morale: 'Excellent', form: 'Excellent', developmentLog: [], contract: defaultContract, stats: { goals: 0, assists: 0, matchesPlayed: 0, careerHistory: [], shotsOnTarget: 0, tacklesWon: 0, saves: 0, passesCompleted: 0, passesAttempted: 0 }, loan: { isLoaned: false }, traits: ['Consistent'], conversationHistory: [], stamina: 100, attributeHistory: [], attributeDevelopmentProgress: {}, communicationLog: [], customTrainingSchedule: null, fatigue: 0, injuryRisk: 1, lastConversationInitiatedWeek: 0, moraleBoost: null, completedChallenges: [] },
];

const formations: Record<string, Formation> = {
  '4-4-2': { id: '4-4-2', name: '4-4-2', slots: [ { id: 's1', role: 'GK', defaultPosition: { x: 8, y: 50 }, playerId: 'p1' }, { id: 's2', role: 'DF', defaultPosition: { x: 30, y: 85 }, playerId: 'p4' }, { id: 's3', role: 'DF', defaultPosition: { x: 25, y: 60 }, playerId: demoPlayer4.id }, { id: 's4', role: 'DF', defaultPosition: { x: 25, y: 40 }, playerId: 'p11' }, { id: 's5', role: 'DF', defaultPosition: { x: 30, y: 15 }, playerId: 'p3' }, { id: 's6', role: 'MF', defaultPosition: { x: 55, y: 80 }, playerId: 'p9' }, { id: 's7', role: 'MF', defaultPosition: { x: 50, y: 60 }, playerId: demoPlayer3.id }, { id: 's8', role: 'MF', defaultPosition: { x: 50, y: 40 }, playerId: demoPlayer2.id }, { id: 's9', role: 'MF', defaultPosition: { x: 55, y: 20 }, playerId: demoPlayer1.id }, { id: 's10', role: 'FW', defaultPosition: { x: 80, y: 60 }, playerId: 'p10' }, { id: 's11', role: 'FW', defaultPosition: { x: 80, y: 40 }, playerId: 'p8' } ] },
  '4-3-3': { id: '4-3-3', name: '4-3-3', slots: [ { id: 's1', role: 'GK', defaultPosition: { x: 8, y: 50 }, playerId: null }, { id: 's2', role: 'DF', defaultPosition: { x: 30, y: 85 }, playerId: null }, { id: 's3', role: 'DF', defaultPosition: { x: 25, y: 60 }, playerId: null }, { id: 's4', role: 'DF', defaultPosition: { x: 25, y: 40 }, playerId: null }, { id: 's5', role: 'DF', defaultPosition: { x: 30, y: 15 }, playerId: null }, { id: 's6', role: 'MF', defaultPosition: { x: 45, y: 50 }, playerId: null }, { id: 's7', role: 'MF', defaultPosition: { x: 60, y: 65 }, playerId: null }, { id: 's8', role: 'MF', defaultPosition: { x: 60, y: 35 }, playerId: null }, { id: 's9', 'role': 'FW', defaultPosition: { x: 80, y: 80 }, playerId: null }, { id: 's10', role: 'FW', defaultPosition: { x: 85, y: 50 }, playerId: null }, { id: 's11', role: 'FW', defaultPosition: { x: 80, y: 20 }, playerId: null } ] },
  '3-5-2': { id: '3-5-2', name: '3-5-2', slots: [ { id: 's1', role: 'GK', defaultPosition: { x: 8, y: 50 }, playerId: null }, { id: 's2', role: 'DF', defaultPosition: { x: 25, y: 70 }, playerId: null }, { id: 's3', role: 'DF', defaultPosition: { x: 22, y: 50 }, playerId: null }, { id: 's4', role: 'DF', defaultPosition: { x: 25, y: 30 }, playerId: null }, { id: 's5', role: 'MF', defaultPosition: { x: 45, y: 90 }, playerId: null }, { id: 's6', role: 'MF', defaultPosition: { x: 50, y: 65 }, playerId: null }, { id: 's7', role: 'MF', defaultPosition: { x: 50, y: 35 }, playerId: null }, { id: 's8', role: 'MF', defaultPosition: { x: 45, y: 10 }, playerId: null }, { id: 's9', role: 'MF', defaultPosition: { x: 65, y: 50 }, playerId: null }, { id: 's10', role: 'FW', defaultPosition: { x: 80, y: 60 }, playerId: null }, { id: 's11', role: 'FW', defaultPosition: { x: 80, y: 40 }, playerId: null } ] },
};

export const APP_VERSION = "8.0.0";

const defaultTactics: TeamTactics = { mentality: 'balanced', pressing: 'medium', defensiveLine: 'medium', attackingWidth: 'medium' };
const defaultKit: TeamKit = { primaryColor: '#3b82f6', secondaryColor: '#ffffff', pattern: 'solid' };

// Create a mock league for the initial season
const leagueTeams: LeagueTeam[] = [
    { name: "Astral FC", isUser: true, strength: 85 },
    { name: "Quantum Rovers", isUser: false, strength: 88 },
    { name: "Nebula United", isUser: false, strength: 84 },
    { name: "Celestial City", isUser: false, strength: 86 },
    { name: "Stardust Wanderers", isUser: false, strength: 82 },
    { name: "Meteor Milan", isUser: false, strength: 80 },
    { name: "Galaxy Rangers", isUser: false, strength: 83 },
    { name: "Cosmos County", isUser: false, strength: 79 },
];

const generateFixtures = (teams: LeagueTeam[]): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamNames = teams.map(t => t.name);
    for (let i = 0; i < teamNames.length; i++) {
        for (let j = i + 1; j < teamNames.length; j++) {
            fixtures.push({ week: 0, homeTeam: teamNames[i], awayTeam: teamNames[j] });
            fixtures.push({ week: 0, homeTeam: teamNames[j], awayTeam: teamNames[i] });
        }
    }
    // Simple shuffle and assign weeks
    fixtures.sort(() => Math.random() - 0.5);
    fixtures.forEach((fixture, index) => {
        fixture.week = Math.floor(index / (teamNames.length / 2)) + 1;
    });
    return fixtures.sort((a,b) => a.week - b.week);
};

const initialSeason: Season = {
    year: 2024,
    leagueTeams,
    leagueTable: leagueTeams.reduce((acc, team) => {
        acc[team.name] = { teamName: team.name, isUserTeam: team.isUser, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
        return acc;
    }, {} as Record<string, LeagueTableEntry>),
    fixtures: generateFixtures(leagueTeams),
};

const defaultDailySchedule: DailySchedule = {
  morning: { warmup: null, main: null, cooldown: null },
  afternoon: { warmup: null, main: null, cooldown: null },
  isRestDay: false,
};

const defaultSchedule: WeeklySchedule = {
  monday: { morning: { warmup: 'warmup_rondo', main: 'tech_passing', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'def_pos', cooldown: null }, isRestDay: false },
  tuesday: { morning: { warmup: 'warmup_jog', main: 'tact_shape', cooldown: null }, afternoon: { warmup: null, main: 'att_shoot', cooldown: 'cooldown_stretch' }, isRestDay: false },
  wednesday: { morning: { warmup: 'warmup_jog', main: 'phys_sprints', cooldown: null }, afternoon: { warmup: null, main: 'def_tackle', cooldown: 'cooldown_stretch' }, isRestDay: false },
  thursday: { morning: { warmup: 'warmup_rondo', main: 'tech_dribble', cooldown: null }, afternoon: { warmup: null, main: 'tact_press', cooldown: 'cooldown_stretch' }, isRestDay: false },
  friday: { morning: { warmup: 'warmup_jog', main: 'att_final_third', cooldown: null }, afternoon: { warmup: null, main: 'set_corners', cooldown: 'cooldown_stretch' }, isRestDay: false },
  saturday: { ...defaultDailySchedule, isRestDay: true },
  sunday: { ...defaultDailySchedule, isRestDay: true },
};

const defaultFinances = {
  transferBudget: 50000, 
  wageBudget: 2500, 
  sponsorshipIncome: 500, 
  matchdayIncome: 1000,
  seasonalFees: [],
  expenses: { playerWages: 0, staffWages: 0, stadiumMaintenance: 500, travel: 100 },
  income: { ticketSales: 1000, sponsorship: 500, prizeMoney: 0 }
};

export const DEFAULT_PLAYBOOK_LIBRARY: readonly PlaybookItem[] = [
    {
        id: 'lib_att_overload_433',
        name: 'Attacking Overload (4-3-3)',
        category: 'General',
        formationId: '4-3-3',
        steps: [
            {
                id: 's1',
                playerPositions: { 'p3': {x: 40, y: 15}, 'p8': {x: 65, y: 20} },
                drawings: [
                    { id: 'd1', tool: 'arrow', color: '#34D399', points: [{x: 30, y: 15}, {x: 55, y: 15}] },
                    { id: 'd2', tool: 'arrow', color: '#FBBF24', points: [{x: 80, y: 20}, {x: 70, y: 35}] },
                    { id: 'd3', tool: 'arrow', color: '#60A5FA', points: [{x: 55, y: 15}, {x: 75, y: 18}] },
                ],
            },
            {
                id: 's2',
                playerPositions: { 'p3': {x: 55, y: 15}, 'p8': {x: 70, y: 35} },
                drawings: [
                     { id: 'd1', tool: 'arrow', color: '#FBBF24', points: [{x: 70, y: 35}, {x: 85, y: 30}] },
                     { id: 'd2', tool: 'arrow', color: '#60A5FA', points: [{x: 55, y: 15}, {x: 75, y: 18}] },
                ]
            }
        ]
    },
    {
        id: 'lib_high_press_442',
        name: 'High Press Trap (4-4-2)',
        category: 'General',
        formationId: '4-4-2',
        steps: [
            {
                id: 's1',
                playerPositions: {},
                drawings: [
                    { id: 'd1', tool: 'arrow', color: '#FBBF24', points: [{x: 80, y: 40}, {x: 70, y: 30}] },
                    { id: 'd2', tool: 'arrow', color: '#FBBF24', points: [{x: 80, y: 60}, {x: 70, y: 70}] },
                    { id: 'd3', tool: 'arrow', color: '#60A5FA', points: [{x: 55, y: 20}, {x: 65, y: 25}] },
                     { id: 'd4', tool: 'zone', color: '#EF4444', points: [{x: 60, y: 40}, {x: 80, y: 60}] },
                ]
            }
        ]
    },
    {
        id: 'lib_corner_defense',
        name: 'Zonal Corner Defense',
        category: 'Defending Corner',
        formationId: '4-4-2',
        steps: [
            {
                id: 's1',
                playerPositions: { 'p1': {x: 8, y: 40}, 'p2': {x: 12, y: 45}, 'p11': {x:12, y: 55}, 'p4': {x: 18, y: 60} },
                drawings: []
            }
        ]
    }
];

const defaultTemplates: Record<string, TrainingPlanTemplate> = {
    'default_pre_season': {
        id: 'default_pre_season',
        name: 'Pre-Season Fitness',
        isDefault: true,
        schedule: {
            monday: { morning: { warmup: 'warmup_jog', main: 'phys_endurance', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'phys_sprints', cooldown: 'cooldown_stretch' }, isRestDay: false },
            tuesday: { morning: { warmup: 'warmup_rondo', main: 'phys_agility', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'phys_endurance', cooldown: 'cooldown_stretch' }, isRestDay: false },
            wednesday: { morning: { warmup: 'warmup_jog', main: 'phys_sprints', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: null, cooldown: null }, isRestDay: false },
            thursday: { morning: { warmup: 'warmup_rondo', main: 'phys_agility', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'phys_endurance', cooldown: 'cooldown_stretch' }, isRestDay: false },
            friday: { morning: { warmup: 'warmup_jog', main: 'tact_possession', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: null, cooldown: null }, isRestDay: false },
            saturday: { ...defaultDailySchedule, isRestDay: true },
            sunday: { ...defaultDailySchedule, isRestDay: true },
        }
    },
    'default_tactical_prep': {
        id: 'default_tactical_prep',
        name: 'Tactical Prep Week',
        isDefault: true,
        schedule: {
            monday: { morning: { warmup: 'warmup_rondo', main: 'tact_shape', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'def_pos', cooldown: null }, isRestDay: false },
            tuesday: { morning: { warmup: 'warmup_jog', main: 'att_final_third', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'tact_press', cooldown: null }, isRestDay: false },
            wednesday: { ...defaultDailySchedule, isRestDay: true },
            thursday: { morning: { warmup: 'warmup_rondo', main: 'tact_possession', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'def_shape', cooldown: null }, isRestDay: false },
            friday: { morning: { warmup: 'warmup_jog', main: 'set_corners', cooldown: 'cooldown_stretch' }, afternoon: { warmup: null, main: 'att_counter', cooldown: null }, isRestDay: false },
            saturday: { ...defaultDailySchedule, isRestDay: true },
            sunday: { ...defaultDailySchedule, isRestDay: true },
        }
    }
};

export const INITIAL_STATE: RootState = {
  auth: {
    isAuthenticated: false,
    user: null,
    error: null,
  },
  tactics: {
    players: defaultPlayers,
    formations: formations,
    playbook: {},
    activeFormationIds: { home: '4-4-2', away: '4-3-3' },
    teamTactics: { home: { ...defaultTactics }, away: { ...defaultTactics, pressing: 'low' } },
    drawings: [],
    tacticalFamiliarity: { '4-4-2': 50, '4-3-3': 20, '3-5-2': 10 },
    chemistry: {},
    captainIds: { home: 'p2', away: null },
    setPieceTakers: { home: {}, away: {} },
  },
  franchise: {
    gameWeek: 1,
    season: initialSeason,
    manager: { name: "The Gaffer", reputation: 60, trophyCabinet: [] },
    boardObjectives: [
        { id: 'obj1', description: 'Finish in the top half of the league', isMet: false, isCritical: true },
        { id: 'obj2', description: 'Sign a player younger than 21 for the first team', isMet: false, isCritical: false },
    ],
    jobSecurity: 75,
    fanConfidence: 70,
    finances: { 
      home: defaultFinances,
      away: { ...defaultFinances, transferBudget: 25000000, wageBudget: 1500000 }
    },
    trainingSchedule: { home: { ...defaultSchedule }, away: { ...defaultSchedule } },
    inbox: [],
    transferMarket: { forSale: [], forLoan: [], freeAgents: [] },
    matchHistory: [],
    youthAcademy: { home: { level: 1, prospects: [], lastGeneratedWeek: 0 }, away: { level: 1, prospects: [], lastGeneratedWeek: 0 } },
    staff: { 
        home: { coach: { id: 'coach1', name: 'John Smith', specialty: 'balanced', bonus: 5, cost: 25000 }, scout: { id: 's1', name: 'Juni Calafat', rating: 5, cost: 50000 }, medicine: null, assistantManager: null, gkCoach: null, fitnessCoach: null, loanManager: null },
        away: { coach: { id: 'coach2', name: 'Jane Doe', specialty: 'defending', bonus: 5, cost: 20000 }, scout: null, medicine: null, assistantManager: null, gkCoach: null, fitnessCoach: null, loanManager: null }
    },
    stadium: { home: { capacity: 50000, trainingFacilitiesLevel: 3, youthFacilitiesLevel: 2 }, away: { capacity: 30000, trainingFacilitiesLevel: 2, youthFacilitiesLevel: 1 } },
    sponsorships: { home: null, away: null },
    historicalData: [],
    hallOfFame: [],
    newsFeed: [],
    lastMatchResult: null,
    negotiationData: null,
    mentoringGroups: { home: [], away: [] },
    relationships: {},
    scoutingAssignments: [],
    pressNarratives: [],
    lastSeasonAwards: null,
    promises: [],
    trainingPlanTemplates: defaultTemplates,
    skillChallenges: [],
  },
  ui: {
    theme: 'dark',
    notifications: [],
    selectedPlayerId: null,
    activeTeamContext: 'both',
    activeModal: null,
    editingPlayerId: null,
    playerToCompareId: null,
    slotActionMenuData: null,
    tutorial: {
      isActive: false,
      step: 0,
    },
    playerConversationData: null,
    drawingTool: 'select',
    drawingColor: '#FFFF00', // yellow
    isGridVisible: false,
    isFormationStrengthVisible: false,
    positioningMode: 'snap' as const,
    activePlaybookItemId: null,
    activeStepIndex: null,
    isAnimating: false,
    isPaused: false,
    playerInitialPositions: null,
    animationTrails: null,
    isPresentationMode: false,
    setPieceEditor: { isEditing: false, activeTool: null, selectedPlayerId: null },
    rosterSearchQuery: '',
    rosterRoleFilters: [],
    advancedRosterFilters: { age: { min: 16, max: 40 }, availability: [], attributes: [] },
    transferMarketFilters: { name: '', position: 'All', age: { min: 16, max: 40 }, potential: { min: 50, max: 99 }, price: { min: 0, max: 100000000 }},
    playbookCategories: { 'General': true },
    settings: { aiPersonality: 'balanced' },
    isLoadingAI: false,
    aiInsight: null,
    isComparingAI: false,
    aiComparisonResult: null,
    isSuggestingFormation: false,
    aiSuggestedFormation: null,
    chatHistory: [],
    isChatProcessing: false,
    highlightedByAIPlayerIds: [],
    isLoadingOppositionReport: false,
    oppositionReport: null,
    isSimulatingMatch: false,
    simulationTimeline: [],
    isLoadingPostMatchReport: false,
    postMatchReport: null,
    isLoadingPressConference: false,
    pressConferenceData: null,
    isLoadingNegotiation: false,
    isLoadingAISubSuggestion: false,
    aiSubSuggestionData: null,
    isScoutingPlayer: false,
    scoutedPlayerId: null,
    scoutReport: null,
    isLoadingConversation: false,
    saveSlots: {},
    activeSaveSlotId: null,
    isExportingLineup: false,
    teamKits: {
      home: defaultKit,
      away: { primaryColor: '#ef4444', secondaryColor: '#ffffff', pattern: 'solid' },
    },
    isLoadingDevelopmentSummary: false,
    developmentSummary: null,
    isLoadingTeamTalk: false,
    teamTalkData: null,
    pendingPromiseRequest: null,
  }
};