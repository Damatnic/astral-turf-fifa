import React, { useState, useMemo } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import type { BudgetCategory, FinancialReport } from '../types';
import { ResponsivePage } from '../components/Layout/ResponsivePage';
import {
  ResponsiveGrid,
  TouchButton,
  ResponsiveCard,
} from '../components/Layout/AdaptiveLayout.tsx';

const FinancesPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { uiState } = useUIContext();
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [newFeeItem, setNewFeeItem] = useState({ name: '', amount: 0 });
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState<
    'weekly' | 'monthly' | 'seasonal'
  >('monthly');
  const [budgetForecast, setBudgetForecast] = useState(12); // months ahead

  const finances = franchiseState.finances[selectedTeam];

  const handleAddFeeItem = () => {
    if (newFeeItem.name.trim() && newFeeItem.amount > 0) {
      dispatch({
        type: 'ADD_FEE_ITEM',
        payload: {
          team: selectedTeam,
          item: {
            name: newFeeItem.name,
            amount: newFeeItem.amount,
          },
        },
      });
      setNewFeeItem({ name: '', amount: 0 });
    }
  };

  const handleRemoveFeeItem = (itemId: string) => {
    dispatch({
      type: 'REMOVE_FEE_ITEM',
      payload: {
        team: selectedTeam,
        itemId,
      },
    });
  };

  // Enhanced financial calculations
  const financialAnalytics = useMemo(() => {
    const income = finances.income;
    const expenses = finances.expenses;

    const totalIncome =
      income.ticketSales +
      income.sponsorship +
      income.prizeMoney +
      (income.merchandising || 0) +
      (income.broadcasting || 0);
    const totalExpenses =
      expenses.playerWages +
      expenses.staffWages +
      expenses.stadiumMaintenance +
      expenses.travel +
      (expenses.marketing || 0) +
      (expenses.utilities || 0) +
      (expenses.insurance || 0);
    const netIncome = totalIncome - totalExpenses;

    // Financial health metrics
    const expenseRatio = totalExpenses / totalIncome;
    const wageRatio = (expenses.playerWages + expenses.staffWages) / totalIncome;
    const profitMargin = (netIncome / totalIncome) * 100;

    // Budget utilization
    const initialBudget = finances.initialTransferBudget || finances.transferBudget;
    const transferBudgetUsed = ((initialBudget - finances.transferBudget) / initialBudget) * 100;
    const wageBudgetUsed =
      ((expenses.playerWages + expenses.staffWages) / finances.wageBudget) * 100;

    // Financial projections
    const monthlyBurn = totalExpenses / 12;
    const balance = finances.balance || 0;
    const monthsOfRunway = balance / monthlyBurn;

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      expenseRatio,
      wageRatio,
      profitMargin,
      transferBudgetUsed,
      wageBudgetUsed,
      monthlyBurn,
      monthsOfRunway,
      financialHealth:
        profitMargin > 10
          ? 'Excellent'
          : profitMargin > 0
            ? 'Good'
            : profitMargin > -10
              ? 'Concerning'
              : 'Critical',
    };
  }, [finances]);

  // Budget management functions
  const adjustBudget = (category: BudgetCategory, amount: number) => {
    dispatch({
      type: 'ADJUST_BUDGET',
      payload: { team: selectedTeam, category, amount },
    });
  };

  const generateFinancialReport = () => {
    const report: FinancialReport = {
      period: selectedBudgetPeriod,
      team: selectedTeam,
      income: finances.income,
      expenses: finances.expenses,
      balance: finances.balance,
      analytics: financialAnalytics,
      recommendations: generateFinancialRecommendations(),
      generatedAt: new Date().toISOString(),
    };

    dispatch({
      type: 'GENERATE_FINANCIAL_REPORT',
      payload: { report },
    });
  };

  const generateFinancialRecommendations = (): string[] => {
    const recommendations: string[] = [];

    if (financialAnalytics.wageRatio > 0.7) {
      recommendations.push('Wage costs are high - consider optimizing player contracts');
    }

    if (financialAnalytics.profitMargin < 0) {
      recommendations.push('Club is operating at a loss - review expense categories');
    }

    if (financialAnalytics.monthsOfRunway < 6) {
      recommendations.push('Low cash reserves - secure additional funding or reduce expenses');
    }

    if (financialAnalytics.transferBudgetUsed > 90) {
      recommendations.push('Transfer budget nearly exhausted - plan for next window');
    }

    return recommendations;
  };

  return (
    <ResponsivePage title="Financial Management" maxWidth="full">
      <div className="space-y-6">
        {/* Description */}
        <p className="text-sm sm:text-base text-gray-400">Manage your club's finances and budget</p>

        {/* Financial Health Overview */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  ${financialAnalytics.netIncome.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Net Income</div>
                <div
                  className={`text-xs ${
                    financialAnalytics.profitMargin > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {financialAnalytics.profitMargin.toFixed(1)}% margin
                </div>
              </div>
              <div
                className={`text-2xl ${
                  financialAnalytics.profitMargin > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {financialAnalytics.profitMargin > 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">
              ${(finances.balance || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Available Balance</div>
            <div className="text-xs text-gray-500">
              {financialAnalytics.monthsOfRunway.toFixed(1)} months runway
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-yellow-400">
              {financialAnalytics.wageRatio.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Wage Ratio</div>
            <div
              className={`text-xs ${
                financialAnalytics.wageRatio > 70 ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {financialAnalytics.wageRatio > 70 ? 'High risk' : 'Healthy'}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div
              className={`text-2xl font-bold ${
                financialAnalytics.financialHealth === 'Excellent'
                  ? 'text-green-400'
                  : financialAnalytics.financialHealth === 'Good'
                    ? 'text-blue-400'
                    : financialAnalytics.financialHealth === 'Concerning'
                      ? 'text-yellow-400'
                      : 'text-red-400'
              }`}
            >
              {financialAnalytics.financialHealth}
            </div>
            <div className="text-sm text-gray-400">Financial Health</div>
            <div className="text-xs text-gray-500">Overall rating</div>
          </div>
        </ResponsiveGrid>

        {/* Team Selector */}
        <div className="bg-gray-800 rounded-lg p-1 inline-flex gap-1">
          <TouchButton
            onClick={() => setSelectedTeam('home')}
            variant={selectedTeam === 'home' ? 'primary' : 'secondary'}
            size="md"
          >
            Home Team
          </TouchButton>
          <TouchButton
            onClick={() => setSelectedTeam('away')}
            variant={selectedTeam === 'away' ? 'primary' : 'secondary'}
            size="md"
          >
            Away Team
          </TouchButton>
        </div>

        {/* Budget Overview */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Transfer Budget</p>
                <p className="text-2xl font-bold text-green-400">
                  ${finances.transferBudget.toLocaleString()}
                </p>
              </div>
              <div className="text-green-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Wage Budget</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${finances.wageBudget.toLocaleString()}
                </p>
              </div>
              <div className="text-blue-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2h13z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Net Income</p>
                <p
                  className={`text-2xl font-bold ${financialAnalytics.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  ${financialAnalytics.netIncome.toLocaleString()}
                </p>
              </div>
              <div
                className={financialAnalytics.netIncome >= 0 ? 'text-green-400' : 'text-red-400'}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      financialAnalytics.netIncome >= 0
                        ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                        : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                    }
                  />
                </svg>
              </div>
            </div>
          </div>
        </ResponsiveGrid>

        {/* Income and Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Income */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-green-400 mb-4">Income</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-white">Ticket Sales</span>
                <span className="text-green-400 font-medium">
                  ${finances.income.ticketSales.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-white">Sponsorship</span>
                <span className="text-green-400 font-medium">
                  ${finances.income.sponsorship.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-white">Prize Money</span>
                <span className="text-green-400 font-medium">
                  ${finances.income.prizeMoney.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-gray-600 pt-3">
                <div className="flex justify-between items-center p-3 bg-green-600/20 rounded">
                  <span className="text-white font-semibold">Total Income</span>
                  <span className="text-green-400 font-bold text-lg">
                    ${financialAnalytics.totalIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-red-400 mb-4">Expenses</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-white">Player Wages</span>
                <span className="text-red-400 font-medium">
                  ${finances.expenses.playerWages.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-white">Staff Wages</span>
                <span className="text-red-400 font-medium">
                  ${finances.expenses.staffWages.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-white">Stadium Maintenance</span>
                <span className="text-red-400 font-medium">
                  ${finances.expenses.stadiumMaintenance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-white">Travel</span>
                <span className="text-red-400 font-medium">
                  ${finances.expenses.travel.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-gray-600 pt-3">
                <div className="flex justify-between items-center p-3 bg-red-600/20 rounded">
                  <span className="text-white font-semibold">Total Expenses</span>
                  <span className="text-red-400 font-bold text-lg">
                    ${financialAnalytics.totalExpenses.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seasonal Fees */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-teal-400">Seasonal Fees</h3>
            <button
              onClick={handleAddFeeItem}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Add Fee
            </button>
          </div>

          {/* Add New Fee Form */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fee Name</label>
                <input
                  type="text"
                  value={newFeeItem.name}
                  onChange={e => setNewFeeItem({ ...newFeeItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., Equipment Costs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={newFeeItem.amount}
                  onChange={e =>
                    setNewFeeItem({ ...newFeeItem, amount: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Existing Fees */}
          <div className="space-y-3">
            {finances.seasonalFees.map(fee => (
              <div
                key={fee.id}
                className="flex justify-between items-center p-4 bg-gray-700 rounded-lg"
              >
                <span className="text-white font-medium">{fee.name}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-yellow-400 font-medium">
                    ${fee.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleRemoveFeeItem(fee.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Remove fee"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {finances.seasonalFees.length === 0 && (
              <p className="text-gray-400 text-center py-8">No seasonal fees configured</p>
            )}
          </div>
        </div>
      </div>
    </ResponsivePage>
  );
};

export default FinancesPage;
