// Financial and business related types

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
  expenses: {
    playerWages: number;
    staffWages: number;
    stadiumMaintenance: number;
    travel: number;
  };
  income: {
    ticketSales: number;
    sponsorship: number;
    prizeMoney: number;
  }
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