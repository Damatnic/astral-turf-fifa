// Financial and business related types

export type BudgetCategory =
  | 'transfer'
  | 'wage'
  | 'infrastructure'
  | 'youth'
  | 'medical'
  | 'marketing';

export interface FinancialReport {
  period: 'weekly' | 'monthly' | 'seasonal';
  team: 'home' | 'away';
  income: {
    ticketSales: number;
    sponsorship: number;
    prizeMoney: number;
    merchandising?: number;
    broadcasting?: number;
  };
  expenses: {
    playerWages: number;
    staffWages: number;
    stadiumMaintenance: number;
    travel: number;
    marketing?: number;
    utilities?: number;
    insurance?: number;
  };
  balance?: number;
  analytics: any;
  recommendations: string[];
  generatedAt: string;
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
}

export interface TeamFinances {
  transferBudget: number;
  wageBudget: number;
  sponsorshipIncome: number;
  matchdayIncome: number;
  seasonalFees: FeeItem[];
  balance?: number;
  initialTransferBudget?: number;
  expenses: {
    playerWages: number;
    staffWages: number;
    stadiumMaintenance: number;
    travel: number;
    marketing?: number;
    utilities?: number;
    insurance?: number;
  };
  income: {
    ticketSales: number;
    sponsorship: number;
    prizeMoney: number;
    merchandising?: number;
    broadcasting?: number;
  };
}

// Stadium and facilities
export interface Stadium {
  capacity: number;
  trainingFacilitiesLevel: number;
  youthFacilitiesLevel: number;
}

// Sponsorship
export interface SponsorshipDeal {
  id: string;
  name: string;
  weeklyIncome: number;
  perWinBonus: number;
}
