// Communication and messaging related types

export type InboxItemPayload = {
  offer?: {
    type: 'transfer_offer' | 'loan_offer';
    fromClub: string;
    playerId: string;
    value: number;
    wageContribution?: number; // for loans
  }
  conversationRequest?: {
    playerId: string;
    reason: string;
  }
}

export interface LoanReport {
  playerId: string;
  report: string;
}

export interface InboxItem {
  id: string;
  week: number;
  type: 'match' | 'injury' | 'transfer' | 'contract' | 'training' | 'award' | 'finance' | 'objective' | 'conversation' | 'social_media' | 'transfer_offer' | 'loan_offer' | 'scout_report' | 'loan_report' | 'mentoring';
  title: string;
  content: string;
  isRead: boolean;
  payload?: InboxItemPayload | LoanReport;
}