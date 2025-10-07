export enum FormationShape {
  F_4_4_2 = '4-4-2',
  F_4_3_3 = '4-3-3',
  F_4_2_3_1 = '4-2-3-1',
  F_3_5_2 = '3-5-2',
  F_3_4_3 = '3-4-3',
  F_5_3_2 = '5-3-2',
  F_4_1_4_1 = '4-1-4-1',
  F_4_3_2_1 = '4-3-2-1',
  F_4_1_2_1_2 = '4-1-2-1-2',
  F_3_4_1_2 = '3-4-1-2',
}

export enum PlayerRole {
  // Defensive Roles
  SWEEPER_KEEPER = 'Sweeper Keeper',
  BALL_PLAYING_DEFENDER = 'Ball-Playing Defender',
  STOPPER = 'Stopper',
  COVERING_DEFENDER = 'Covering Defender',
  WING_BACK = 'Wing Back',
  FULL_BACK = 'Full Back',
  
  // Midfield Roles
  DEFENSIVE_MIDFIELDER = 'Defensive Midfielder',
  DEEP_LYING_PLAYMAKER = 'Deep-Lying Playmaker',
  BOX_TO_BOX = 'Box-to-Box Midfielder',
  CENTRAL_MIDFIELDER = 'Central Midfielder',
  ATTACKING_MIDFIELDER = 'Attacking Midfielder',
  PLAYMAKER = 'Playmaker',
  WIDE_MIDFIELDER = 'Wide Midfielder',
  WINGER = 'Winger',
  
  // Attacking Roles
  STRIKER = 'Striker',
  TARGET_MAN = 'Target Man',
  POACHER = 'Poacher',
  FALSE_NINE = 'False Nine',
  INSIDE_FORWARD = 'Inside Forward',
  SHADOW_STRIKER = 'Shadow Striker',
}

export interface TacticalInstructions {
  tempo?: 'slow' | 'normal' | 'fast';
  width?: 'narrow' | 'normal' | 'wide';
  pressing?: 'low' | 'medium' | 'high' | 'very-high';
  defensiveLine?: 'deep' | 'normal' | 'high' | 'very-high';
  passingStyle?: 'direct' | 'mixed' | 'possession';
  buildUpPlay?: 'slow' | 'balanced' | 'fast';
  attackingWidth?: 'narrow' | 'balanced' | 'wide';
  playersInBox?: number;
  corners?: number;
  freeKicks?: number;
}
