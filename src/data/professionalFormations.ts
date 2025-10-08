/**
 * Professional Formation Library
 * 
 * Comprehensive collection of 20+ professional soccer formations
 * with detailed positioning, tactical descriptions, and metadata
 */

export interface FormationPosition {
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  roleId: string;
  label?: string;
}

export interface ProfessionalFormation {
  id: string;
  name: string;
  displayName: string;
  category: 'defensive' | 'balanced' | 'attacking' | 'modern' | 'classic';
  description: string;
  positions: FormationPosition[];
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  famousTeams: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  popularity: number; // 1-10
}

export const PROFESSIONAL_FORMATIONS: ProfessionalFormation[] = [
  // ===== CLASSIC FORMATIONS =====
  {
    id: 'formation-4-4-2',
    name: '4-4-2',
    displayName: '4-4-2 Classic',
    category: 'classic',
    description: 'The most balanced and versatile formation. Two banks of four provide defensive stability while maintaining attacking options.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 15, y: 55, roleId: 'LM', label: 'LM' },
      { x: 35, y: 60, roleId: 'CM', label: 'CM' },
      { x: 65, y: 60, roleId: 'CM', label: 'CM' },
      { x: 85, y: 55, roleId: 'RM', label: 'RM' },
      // Attack
      { x: 35, y: 25, roleId: 'ST', label: 'ST' },
      { x: 65, y: 25, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Balanced', 'Easy to understand', 'Solid defensively', 'Good width'],
    weaknesses: ['Can be outnumbered in midfield', 'Less creative'],
    bestFor: ['Beginner coaches', 'Counter-attacking', 'Direct play'],
    famousTeams: ['Man United (Ferguson)', 'Atletico Madrid (Simeone)', 'Leicester (Ranieri 2016)'],
    difficulty: 'beginner',
    popularity: 9,
  },

  {
    id: 'formation-4-3-3',
    name: '4-3-3',
    displayName: '4-3-3 Attack',
    category: 'attacking',
    description: 'Modern attacking formation with three forwards providing width and penetration. Dominant in possession-based football.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 30, y: 60, roleId: 'CM', label: 'CM' },
      { x: 50, y: 55, roleId: 'CDM', label: 'CDM' },
      { x: 70, y: 60, roleId: 'CM', label: 'CM' },
      // Attack
      { x: 15, y: 25, roleId: 'LW', label: 'LW' },
      { x: 50, y: 20, roleId: 'ST', label: 'ST' },
      { x: 85, y: 25, roleId: 'RW', label: 'RW' },
    ],
    strengths: ['Strong attack', 'Width', 'Possession control', 'High pressing'],
    weaknesses: ['Vulnerable to counters', 'Requires fit fullbacks'],
    bestFor: ['Possession football', 'Teams with wingers', 'High pressing'],
    famousTeams: ['Barcelona (Guardiola)', 'Liverpool (Klopp)', 'Man City (Guardiola)'],
    difficulty: 'intermediate',
    popularity: 10,
  },

  {
    id: 'formation-4-2-3-1',
    name: '4-2-3-1',
    displayName: '4-2-3-1 Modern',
    category: 'modern',
    description: 'The most popular modern formation. Provides defensive stability with two holding midfielders while maintaining attacking creativity.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Defensive Mid
      { x: 35, y: 65, roleId: 'CDM', label: 'CDM' },
      { x: 65, y: 65, roleId: 'CDM', label: 'CDM' },
      // Attacking Mid
      { x: 20, y: 40, roleId: 'LM', label: 'LM' },
      { x: 50, y: 35, roleId: 'CAM', label: 'CAM' },
      { x: 80, y: 40, roleId: 'RM', label: 'RM' },
      // Attack
      { x: 50, y: 15, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Very balanced', 'Defensive solidarity', 'Creative attacking', 'Flexible'],
    weaknesses: ['Can be predictable', 'Striker can be isolated'],
    bestFor: ['Modern football', 'Counter-attacking', 'Possession and pressing'],
    famousTeams: ['Real Madrid (Ancelotti)', 'Chelsea (Mourinho)', 'Germany (Löw 2014)'],
    difficulty: 'intermediate',
    popularity: 10,
  },

  // ===== DEFENSIVE FORMATIONS =====
  {
    id: 'formation-5-3-2',
    name: '5-3-2',
    displayName: '5-3-2 Defensive',
    category: 'defensive',
    description: 'Solid defensive formation with five at the back. Wing-backs provide width while three center-backs ensure defensive security.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 10, y: 75, roleId: 'LWB', label: 'LWB' },
      { x: 30, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 70, y: 85, roleId: 'CB', label: 'CB' },
      { x: 90, y: 75, roleId: 'RWB', label: 'RWB' },
      // Midfield
      { x: 30, y: 55, roleId: 'CM', label: 'CM' },
      { x: 50, y: 57, roleId: 'CDM', label: 'CDM' },
      { x: 70, y: 55, roleId: 'CM', label: 'CM' },
      // Attack
      { x: 40, y: 25, roleId: 'ST', label: 'ST' },
      { x: 60, y: 25, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Very defensive', 'Hard to break down', 'Counter-attacking threat'],
    weaknesses: ['Lack of width in attack', 'Requires fit wing-backs'],
    bestFor: ['Defending leads', 'Counter-attacking', 'Against stronger opponents'],
    famousTeams: ['Italy (Conte)', 'Chelsea (Conte 2017)', 'Inter Milan (Conte)'],
    difficulty: 'advanced',
    popularity: 7,
  },

  {
    id: 'formation-5-4-1',
    name: '5-4-1',
    displayName: '5-4-1 Ultra Defensive',
    category: 'defensive',
    description: 'The ultimate defensive setup. Five defenders, four midfielders, one striker. Perfect for protecting a lead.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 10, y: 75, roleId: 'LWB', label: 'LWB' },
      { x: 30, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 70, y: 85, roleId: 'CB', label: 'CB' },
      { x: 90, y: 75, roleId: 'RWB', label: 'RWB' },
      // Midfield
      { x: 20, y: 55, roleId: 'LM', label: 'LM' },
      { x: 40, y: 60, roleId: 'CM', label: 'CM' },
      { x: 60, y: 60, roleId: 'CM', label: 'CM' },
      { x: 80, y: 55, roleId: 'RM', label: 'RM' },
      // Attack
      { x: 50, y: 20, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Maximum defensive cover', 'Compact shape', 'Counter-attack ready'],
    weaknesses: ['Very limited attacking', 'Isolated striker'],
    bestFor: ['Protecting a lead', 'Facing much stronger opponents', 'Time wasting'],
    famousTeams: ['Greece (Rehhagel 2004)', 'Defensive masterclasses'],
    difficulty: 'intermediate',
    popularity: 5,
  },

  // ===== BALANCED FORMATIONS =====
  {
    id: 'formation-4-1-4-1',
    name: '4-1-4-1',
    displayName: '4-1-4-1 Balanced',
    category: 'balanced',
    description: 'Balanced formation with a dedicated defensive midfielder. Provides defensive security while maintaining midfield presence.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Defensive Mid
      { x: 50, y: 68, roleId: 'CDM', label: 'CDM' },
      // Midfield
      { x: 15, y: 50, roleId: 'LM', label: 'LM' },
      { x: 35, y: 52, roleId: 'CM', label: 'CM' },
      { x: 65, y: 52, roleId: 'CM', label: 'CM' },
      { x: 85, y: 50, roleId: 'RM', label: 'RM' },
      // Attack
      { x: 50, y: 20, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Midfield control', 'Defensive protection', 'Balanced approach'],
    weaknesses: ['Striker isolation', 'Limited attacking width'],
    bestFor: ['Controlling midfield', 'Possession play', 'Balanced approach'],
    famousTeams: ['France (Deschamps)', 'Various national teams'],
    difficulty: 'intermediate',
    popularity: 7,
  },

  {
    id: 'formation-3-5-2',
    name: '3-5-2',
    displayName: '3-5-2 Wing-Back',
    category: 'balanced',
    description: 'Three center-backs with attacking wing-backs. Strong in midfield with two strikers for partnership.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 25, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 75, y: 85, roleId: 'CB', label: 'CB' },
      // Midfield
      { x: 10, y: 60, roleId: 'LWB', label: 'LWB' },
      { x: 35, y: 55, roleId: 'CM', label: 'CM' },
      { x: 50, y: 57, roleId: 'CDM', label: 'CDM' },
      { x: 65, y: 55, roleId: 'CM', label: 'CM' },
      { x: 90, y: 60, roleId: 'RWB', label: 'RWB' },
      // Attack
      { x: 40, y: 25, roleId: 'ST', label: 'ST' },
      { x: 60, y: 25, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Strong midfield', 'Flexible wing-backs', 'Strike partnership'],
    weaknesses: ['Requires very fit wing-backs', 'Wide areas vulnerable'],
    bestFor: ['Dominating midfield', 'Teams with strong wing-backs', 'Strike partnerships'],
    famousTeams: ['Juventus (Conte)', 'Inter Milan (Conte)', 'Italy (Conte)'],
    difficulty: 'advanced',
    popularity: 8,
  },

  // ===== ATTACKING FORMATIONS =====
  {
    id: 'formation-4-3-3-false9',
    name: '4-3-3 False 9',
    displayName: '4-3-3 False 9',
    category: 'attacking',
    description: 'Revolutionary false 9 system. The striker drops deep to create space and overload midfield.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 30, y: 60, roleId: 'CM', label: 'CM' },
      { x: 50, y: 55, roleId: 'CDM', label: 'CDM' },
      { x: 70, y: 60, roleId: 'CM', label: 'CM' },
      // Attack
      { x: 15, y: 25, roleId: 'LW', label: 'LW' },
      { x: 50, y: 35, roleId: 'CF', label: 'F9' }, // False 9 deeper
      { x: 85, y: 25, roleId: 'RW', label: 'RW' },
    ],
    strengths: ['Overloads midfield', 'Unpredictable', 'Creates space for wingers'],
    weaknesses: ['No target man', 'Requires intelligent striker'],
    bestFor: ['Possession football', 'Creative play', 'Confusing opponents'],
    famousTeams: ['Barcelona (Guardiola with Messi)', 'Spain (Del Bosque 2012)'],
    difficulty: 'expert',
    popularity: 8,
  },

  {
    id: 'formation-3-4-3',
    name: '3-4-3',
    displayName: '3-4-3 Attack',
    category: 'attacking',
    description: 'Aggressive attacking formation with three forwards. Wing-backs provide width while three strikers press high.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 25, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 75, y: 85, roleId: 'CB', label: 'CB' },
      // Midfield
      { x: 10, y: 60, roleId: 'LWB', label: 'LWB' },
      { x: 40, y: 55, roleId: 'CM', label: 'CM' },
      { x: 60, y: 55, roleId: 'CM', label: 'CM' },
      { x: 90, y: 60, roleId: 'RWB', label: 'RWB' },
      // Attack
      { x: 20, y: 25, roleId: 'LW', label: 'LW' },
      { x: 50, y: 20, roleId: 'ST', label: 'ST' },
      { x: 80, y: 25, roleId: 'RW', label: 'RW' },
    ],
    strengths: ['Maximum attacking threat', 'High pressing', 'Width and penetration'],
    weaknesses: ['Defensively exposed', 'Requires fit wing-backs'],
    bestFor: ['Attacking teams', 'Chasing a game', 'High pressing systems'],
    famousTeams: ['Chelsea (Tuchel)', 'Germany (Flick)'],
    difficulty: 'advanced',
    popularity: 8,
  },

  // ===== MODERN TACTICAL FORMATIONS =====
  {
    id: 'formation-4-3-3-holding',
    name: '4-3-3 Holding',
    displayName: '4-3-3 Holding',
    category: 'modern',
    description: 'Modern 4-3-3 with a dedicated holding midfielder for better defensive balance.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 30, y: 57, roleId: 'CM', label: 'CM' },
      { x: 50, y: 62, roleId: 'CDM', label: 'CDM' }, // Deeper holding
      { x: 70, y: 57, roleId: 'CM', label: 'CM' },
      // Attack
      { x: 15, y: 25, roleId: 'LW', label: 'LW' },
      { x: 50, y: 20, roleId: 'ST', label: 'ST' },
      { x: 85, y: 25, roleId: 'RW', label: 'RW' },
    ],
    strengths: ['Better defensive cover', 'Control transitions', 'Balanced'],
    weaknesses: ['Less creative than standard 4-3-3'],
    bestFor: ['Teams needing defensive stability', 'Transition play'],
    famousTeams: ['Liverpool (Klopp variant)', 'Real Madrid'],
    difficulty: 'intermediate',
    popularity: 9,
  },

  {
    id: 'formation-4-4-2-diamond',
    name: '4-4-2 Diamond',
    displayName: '4-4-2 Diamond',
    category: 'modern',
    description: 'Midfield diamond formation. Dominates central areas with a creative attacking midfielder.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield Diamond
      { x: 50, y: 68, roleId: 'CDM', label: 'CDM' },
      { x: 25, y: 53, roleId: 'LM', label: 'LM' },
      { x: 75, y: 53, roleId: 'RM', label: 'RM' },
      { x: 50, y: 38, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 40, y: 20, roleId: 'ST', label: 'ST' },
      { x: 60, y: 20, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Midfield dominance', 'Creative CAM', 'Strike partnership'],
    weaknesses: ['Lacks width', 'Fullbacks must provide width'],
    bestFor: ['Dominating possession', 'Central overload', 'Creative play'],
    famousTeams: ['AC Milan (Ancelotti)', 'Real Madrid (Ancelotti 2014)'],
    difficulty: 'advanced',
    popularity: 7,
  },

  {
    id: 'formation-4-1-2-1-2',
    name: '4-1-2-1-2',
    displayName: '4-1-2-1-2 Narrow',
    category: 'modern',
    description: 'Narrow formation focusing on central control. One holding midfielder protects the defense.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Defensive Mid
      { x: 50, y: 68, roleId: 'CDM', label: 'CDM' },
      // Central Mids
      { x: 40, y: 55, roleId: 'CM', label: 'CM' },
      { x: 60, y: 55, roleId: 'CM', label: 'CM' },
      // Attacking Mid
      { x: 50, y: 38, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 40, y: 20, roleId: 'ST', label: 'ST' },
      { x: 60, y: 20, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Central dominance', 'Compact defensive shape', 'Multiple passing options'],
    weaknesses: ['No natural width', 'Vulnerable to wide attacks'],
    bestFor: ['Narrow pitches', 'Central control', 'Technical teams'],
    famousTeams: ['Brazil (various eras)'],
    difficulty: 'advanced',
    popularity: 6,
  },

  // ===== ATTACKING VARIATIONS =====
  {
    id: 'formation-4-2-4',
    name: '4-2-4',
    displayName: '4-2-4 Ultra Attack',
    category: 'attacking',
    description: 'Extremely attacking formation with four forwards. High risk, high reward approach.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 35, y: 60, roleId: 'CDM', label: 'CDM' },
      { x: 65, y: 60, roleId: 'CDM', label: 'CDM' },
      // Attack
      { x: 15, y: 30, roleId: 'LW', label: 'LW' },
      { x: 40, y: 20, roleId: 'ST', label: 'ST' },
      { x: 60, y: 20, roleId: 'ST', label: 'ST' },
      { x: 85, y: 30, roleId: 'RW', label: 'RW' },
    ],
    strengths: ['Maximum attacking threat', 'Overwhelming opponents', 'Width and penetration'],
    weaknesses: ['Extremely exposed defensively', 'Requires dominance'],
    bestFor: ['Chasing games', 'Against weak opponents', 'All-out attack'],
    famousTeams: ['Brazil (1970)', 'Classic attacking football'],
    difficulty: 'expert',
    popularity: 5,
  },

  {
    id: 'formation-3-4-1-2',
    name: '3-4-1-2',
    displayName: '3-4-1-2 Christmas Tree',
    category: 'attacking',
    description: 'The "Christmas Tree" formation with a creative #10 behind two strikers.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 25, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 75, y: 85, roleId: 'CB', label: 'CB' },
      // Midfield
      { x: 10, y: 60, roleId: 'LM', label: 'LM' },
      { x: 40, y: 58, roleId: 'CM', label: 'CM' },
      { x: 60, y: 58, roleId: 'CM', label: 'CM' },
      { x: 90, y: 60, roleId: 'RM', label: 'RM' },
      // Attacking Mid
      { x: 50, y: 35, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 40, y: 18, roleId: 'ST', label: 'ST' },
      { x: 60, y: 18, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Creative #10', 'Strike partnership', 'Central overload'],
    weaknesses: ['Lacks width', 'Requires exceptional CAM'],
    bestFor: ['Teams with star playmaker', 'Technical football'],
    famousTeams: ['AC Milan (Ancelotti 2000s)'],
    difficulty: 'expert',
    popularity: 6,
  },

  // ===== MODERN HYBRID FORMATIONS =====
  {
    id: 'formation-3-4-2-1',
    name: '3-4-2-1',
    displayName: '3-4-2-1 Modern',
    category: 'modern',
    description: 'Modern hybrid with three center-backs, four in midfield, and two supporting one striker.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 25, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 75, y: 85, roleId: 'CB', label: 'CB' },
      // Midfield
      { x: 10, y: 60, roleId: 'LWB', label: 'LWB' },
      { x: 40, y: 58, roleId: 'CM', label: 'CM' },
      { x: 60, y: 58, roleId: 'CM', label: 'CM' },
      { x: 90, y: 60, roleId: 'RWB', label: 'RWB' },
      // Attacking Mid
      { x: 35, y: 32, roleId: 'CAM', label: 'CAM' },
      { x: 65, y: 32, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 50, y: 15, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Flexible', 'Strong midfield', 'Creative support for striker'],
    weaknesses: ['Complex positioning', 'Requires intelligent players'],
    bestFor: ['Flexible tactics', 'Creative teams'],
    famousTeams: ['Various modern teams'],
    difficulty: 'advanced',
    popularity: 7,
  },

  {
    id: 'formation-4-4-1-1',
    name: '4-4-1-1',
    displayName: '4-4-1-1 Compact',
    category: 'balanced',
    description: 'Compact formation with a #10 supporting a lone striker. Good for counter-attacking.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 15, y: 55, roleId: 'LM', label: 'LM' },
      { x: 35, y: 60, roleId: 'CM', label: 'CM' },
      { x: 65, y: 60, roleId: 'CM', label: 'CM' },
      { x: 85, y: 55, roleId: 'RM', label: 'RM' },
      // Attacking Mid
      { x: 50, y: 35, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 50, y: 15, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Compact', 'Good for counters', 'Creative #10'],
    weaknesses: ['Limited attacking numbers'],
    bestFor: ['Counter-attacking', 'Defensive teams with creative midfielder'],
    famousTeams: ['Various counter-attacking teams'],
    difficulty: 'intermediate',
    popularity: 6,
  },

  // ===== SPECIAL TACTICAL SETUPS =====
  {
    id: 'formation-3-3-3-1',
    name: '3-3-3-1',
    displayName: '3-3-3-1 Fluid',
    category: 'modern',
    description: 'Ultra-fluid attacking formation with three lines of three and a target striker.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 25, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 75, y: 85, roleId: 'CB', label: 'CB' },
      // Defensive Mid
      { x: 25, y: 62, roleId: 'CDM', label: 'CDM' },
      { x: 50, y: 65, roleId: 'CDM', label: 'CDM' },
      { x: 75, y: 62, roleId: 'CDM', label: 'CDM' },
      // Attacking Mid
      { x: 20, y: 38, roleId: 'CAM', label: 'CAM' },
      { x: 50, y: 35, roleId: 'CAM', label: 'CAM' },
      { x: 80, y: 38, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 50, y: 15, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Fluid movement', 'Creative freedom', 'Numerical superiority in all zones'],
    weaknesses: ['Complex', 'Requires highly technical players'],
    bestFor: ['Total football', 'Possession dominance'],
    famousTeams: ['Ajax (Cruyff philosophy)'],
    difficulty: 'expert',
    popularity: 4,
  },

  // ===== ALTERNATIVE SETUPS =====
  {
    id: 'formation-4-3-2-1',
    name: '4-3-2-1',
    displayName: '4-3-2-1 Inverted Tree',
    category: 'modern',
    description: 'Inverted pyramid with two attacking midfielders behind a lone striker.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 30, y: 62, roleId: 'CM', label: 'CM' },
      { x: 50, y: 65, roleId: 'CDM', label: 'CDM' },
      { x: 70, y: 62, roleId: 'CM', label: 'CM' },
      // Attacking Mid
      { x: 35, y: 35, roleId: 'CAM', label: 'CAM' },
      { x: 65, y: 35, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 50, y: 15, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Two #10s', 'Creative central play', 'Midfield control'],
    weaknesses: ['Lacks width', 'Isolated striker'],
    bestFor: ['Creative football', 'Technical teams'],
    famousTeams: ['France (various tournaments)'],
    difficulty: 'advanced',
    popularity: 6,
  },

  {
    id: 'formation-3-1-4-2',
    name: '3-1-4-2',
    displayName: '3-1-4-2 Pressing',
    category: 'modern',
    description: 'Modern pressing formation with a dedicated holding midfielder and four in midfield.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 25, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 75, y: 85, roleId: 'CB', label: 'CB' },
      // Defensive Mid
      { x: 50, y: 68, roleId: 'CDM', label: 'CDM' },
      // Midfield
      { x: 15, y: 52, roleId: 'LM', label: 'LM' },
      { x: 40, y: 55, roleId: 'CM', label: 'CM' },
      { x: 60, y: 55, roleId: 'CM', label: 'CM' },
      { x: 85, y: 52, roleId: 'RM', label: 'RM' },
      // Attack
      { x: 40, y: 22, roleId: 'ST', label: 'ST' },
      { x: 60, y: 22, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['High pressing', 'Midfield dominance', 'Good transitions'],
    weaknesses: ['Defensive vulnerability', 'Requires high fitness'],
    bestFor: ['High pressing systems', 'Energetic teams'],
    famousTeams: ['RB Leipzig', 'Modern pressing teams'],
    difficulty: 'advanced',
    popularity: 7,
  },

  // ===== SPECIFIC TACTICAL SETUPS =====
  {
    id: 'formation-4-5-1',
    name: '4-5-1',
    displayName: '4-5-1 Defensive Block',
    category: 'defensive',
    description: 'Defensive formation with five midfielders forming a solid block. Perfect for sitting deep.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 15, y: 55, roleId: 'LM', label: 'LM' },
      { x: 30, y: 60, roleId: 'CM', label: 'CM' },
      { x: 50, y: 62, roleId: 'CDM', label: 'CDM' },
      { x: 70, y: 60, roleId: 'CM', label: 'CM' },
      { x: 85, y: 55, roleId: 'RM', label: 'RM' },
      // Attack
      { x: 50, y: 25, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Very defensive', 'Compact shape', 'Counter-attack ready'],
    weaknesses: ['Limited attacking', 'Isolated striker'],
    bestFor: ['Parking the bus', 'Defending leads', 'Weak teams vs strong'],
    famousTeams: ['Defensive masterclasses', 'Mourinho tactics'],
    difficulty: 'intermediate',
    popularity: 7,
  },

  {
    id: 'formation-4-3-3-inverted',
    name: '4-3-3 Inverted Wingers',
    displayName: '4-3-3 Inverted Wingers',
    category: 'modern',
    description: 'Modern 4-3-3 with inverted wingers cutting inside. Creates central overload and shooting opportunities.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Midfield
      { x: 30, y: 60, roleId: 'CM', label: 'CM' },
      { x: 50, y: 55, roleId: 'CDM', label: 'CDM' },
      { x: 70, y: 60, roleId: 'CM', label: 'CM' },
      // Attack (wingers positioned to cut inside)
      { x: 25, y: 28, roleId: 'LW', label: 'IW' },
      { x: 50, y: 20, roleId: 'ST', label: 'ST' },
      { x: 75, y: 28, roleId: 'RW', label: 'IW' },
    ],
    strengths: ['Shooting from cutting inside', 'Central overload', 'Fullbacks provide width'],
    weaknesses: ['Requires overlapping fullbacks'],
    bestFor: ['Teams with wingers who can shoot', 'Modern football'],
    famousTeams: ['Man City (Guardiola)', 'Bayern Munich'],
    difficulty: 'advanced',
    popularity: 9,
  },

  // ===== ADDITIONAL PROFESSIONAL FORMATIONS =====
  {
    id: 'formation-3-5-1-1',
    name: '3-5-1-1',
    displayName: '3-5-1-1 Counter',
    category: 'defensive',
    description: 'Counter-attacking setup with a #10 behind the striker and packed midfield.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 25, y: 85, roleId: 'CB', label: 'CB' },
      { x: 50, y: 87, roleId: 'CB', label: 'CB' },
      { x: 75, y: 85, roleId: 'CB', label: 'CB' },
      // Midfield
      { x: 10, y: 60, roleId: 'LWB', label: 'LWB' },
      { x: 30, y: 58, roleId: 'CM', label: 'CM' },
      { x: 50, y: 60, roleId: 'CDM', label: 'CDM' },
      { x: 70, y: 58, roleId: 'CM', label: 'CM' },
      { x: 90, y: 60, roleId: 'RWB', label: 'RWB' },
      // Attacking Mid
      { x: 50, y: 35, roleId: 'CAM', label: 'CAM' },
      // Attack
      { x: 50, y: 15, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Very compact', 'Counter-attack ready', 'Defensive stability'],
    weaknesses: ['Limited attacking numbers'],
    bestFor: ['Counter-attacking', 'Defending deep'],
    famousTeams: ['Mourinho teams'],
    difficulty: 'advanced',
    popularity: 6,
  },

  {
    id: 'formation-4-1-3-2',
    name: '4-1-3-2',
    displayName: '4-1-3-2 Hybrid',
    category: 'balanced',
    description: 'Hybrid formation with one holding midfielder, three attacking midfielders, and two strikers.',
    positions: [
      // GK
      { x: 50, y: 95, roleId: 'GK', label: 'GK' },
      // Defense
      { x: 15, y: 80, roleId: 'LB', label: 'LB' },
      { x: 35, y: 85, roleId: 'CB', label: 'CB' },
      { x: 65, y: 85, roleId: 'CB', label: 'CB' },
      { x: 85, y: 80, roleId: 'RB', label: 'RB' },
      // Defensive Mid
      { x: 50, y: 68, roleId: 'CDM', label: 'CDM' },
      // Attacking Mid
      { x: 20, y: 45, roleId: 'LM', label: 'LM' },
      { x: 50, y: 42, roleId: 'CAM', label: 'CAM' },
      { x: 80, y: 45, roleId: 'RM', label: 'RM' },
      // Attack
      { x: 40, y: 20, roleId: 'ST', label: 'ST' },
      { x: 60, y: 20, roleId: 'ST', label: 'ST' },
    ],
    strengths: ['Attacking creativity', 'Strike partnership', 'Defensive anchor'],
    weaknesses: ['Midfield can be bypassed'],
    bestFor: ['Attacking teams', 'Creative play'],
    famousTeams: ['Various attacking teams'],
    difficulty: 'advanced',
    popularity: 6,
  },
];

/**
 * Get formations by category
 */
export function getFormationsByCategory(category: ProfessionalFormation['category']): ProfessionalFormation[] {
  return PROFESSIONAL_FORMATIONS.filter(f => f.category === category);
}

/**
 * Get formations by difficulty
 */
export function getFormationsByDifficulty(difficulty: ProfessionalFormation['difficulty']): ProfessionalFormation[] {
  return PROFESSIONAL_FORMATIONS.filter(f => f.difficulty === difficulty);
}

/**
 * Get top formations by popularity
 */
export function getPopularFormations(limit: number = 5): ProfessionalFormation[] {
  return [...PROFESSIONAL_FORMATIONS]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/**
 * Search formations by name or description
 */
export function searchFormations(query: string): ProfessionalFormation[] {
  const lowerQuery = query.toLowerCase();
  return PROFESSIONAL_FORMATIONS.filter(f =>
    f.name.toLowerCase().includes(lowerQuery) ||
    f.displayName.toLowerCase().includes(lowerQuery) ||
    f.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get formation by ID
 */
export function getFormationById(id: string): ProfessionalFormation | undefined {
  return PROFESSIONAL_FORMATIONS.find(f => f.id === id);
}

