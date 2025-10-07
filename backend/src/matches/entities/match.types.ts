export enum MatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum MatchEventType {
  GOAL = 'goal',
  ASSIST = 'assist',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  SUBSTITUTION_IN = 'substitution_in',
  SUBSTITUTION_OUT = 'substitution_out',
  INJURY = 'injury',
}
