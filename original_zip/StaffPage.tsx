import React, { useState } from 'react';
import { useFranchiseContext, useUIContext } from '../hooks';
import type {
  Team,
  HeadCoach,
  HeadScout,
  HeadOfMedicine,
  AssistantManager,
  GKCoach,
  FitnessCoach,
  LoanManager,
} from '../types';

const StaffPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const [selectedTeam, setSelectedTeam] = useState<Team>('home');
  const [activeTab, setActiveTab] = useState<'current' | 'available'>('current');

  const staff = franchiseState.staff[selectedTeam];
  const finances = franchiseState.finances[selectedTeam];

  // Mock available staff for hiring
  const availableStaff = {
    coaches: [
      { id: 'coach1', name: 'Marco Silva', specialty: 'attacking', bonus: 15, cost: 25000 },
      { id: 'coach2', name: 'Antonio Conte', specialty: 'defending', bonus: 18, cost: 35000 },
      { id: 'coach3', name: 'Pep Guardiola', specialty: 'balanced', bonus: 20, cost: 50000 },
    ] as HeadCoach[],
    scouts: [
      { id: 'scout1', name: 'John Morrison', rating: 3, cost: 15000 },
      { id: 'scout2', name: 'Maria Santos', rating: 4, cost: 22000 },
      { id: 'scout3', name: 'David Fletcher', rating: 5, cost: 30000 },
    ] as HeadScout[],
    medical: [
      { id: 'med1', name: 'Dr. Smith', injuryPreventionBonus: 15, rehabBonus: 20, cost: 20000 },
      { id: 'med2', name: 'Dr. Johnson', injuryPreventionBonus: 25, rehabBonus: 30, cost: 35000 },
    ] as HeadOfMedicine[],
    assistants: [
      {
        id: 'ass1',
        name: 'Roberto Martinez',
        tacticalKnowledge: 75,
        manManagement: 80,
        cost: 18000,
      },
      { id: 'ass2', name: 'Thierry Henry', tacticalKnowledge: 85, manManagement: 70, cost: 28000 },
    ] as AssistantManager[],
    gkCoaches: [
      { id: 'gk1', name: 'Gianluigi Buffon', goalkeepingCoaching: 85, cost: 15000 },
      { id: 'gk2', name: 'Petr Cech', goalkeepingCoaching: 90, cost: 25000 },
    ] as GKCoach[],
    fitnessCoaches: [
      { id: 'fit1', name: 'Carlos Rodriguez', fitnessCoaching: 80, cost: 12000 },
      { id: 'fit2', name: 'Andrea Berta', fitnessCoaching: 85, cost: 18000 },
    ] as FitnessCoach[],
    loanManagers: [
      { id: 'loan1', name: 'Jorge Mendes', negotiation: 85, judgingPlayerAbility: 80, cost: 20000 },
      { id: 'loan2', name: 'Mino Raiola', negotiation: 90, judgingPlayerAbility: 75, cost: 30000 },
    ] as LoanManager[],
  };

  const handleHireStaff = (staffMember: any, type: keyof typeof availableStaff) => {
    const staffCost = staffMember.cost;
    if (finances.transferBudget >= staffCost) {
      const staffType =
        type === 'coaches'
          ? 'coach'
          : type === 'scouts'
            ? 'scout'
            : type === 'medical'
              ? 'medicine'
              : type === 'assistants'
                ? 'assistantManager'
                : type === 'gkCoaches'
                  ? 'gkCoach'
                  : type === 'fitnessCoaches'
                    ? 'fitnessCoach'
                    : 'loanManager';

      dispatch({
        type: 'HIRE_STAFF',
        payload: { staff: staffMember, team: selectedTeam, type: staffType },
      });

      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Successfully hired ${staffMember.name} as ${staffType}!`,
          type: 'success',
        },
      });
    } else {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: `Insufficient budget to hire ${staffMember.name}`,
          type: 'error',
        },
      });
    }
  };

  const calculateTotalStaffWages = () => {
    return (
      (staff.coach?.cost || 0) +
      (staff.scout?.cost || 0) +
      (staff.medicine?.cost || 0) +
      (staff.assistantManager?.cost || 0) +
      (staff.gkCoach?.cost || 0) +
      (staff.fitnessCoach?.cost || 0) +
      (staff.loanManager?.cost || 0)
    );
  };

  const StaffCard = ({
    title,
    staffMember,
    emptyText,
    children,
  }: {
    title: string;
    staffMember: any;
    emptyText: string;
    children?: React.ReactNode;
  }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-teal-400 mb-4">{title}</h3>
      {staffMember ? (
        <div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-white font-medium">{staffMember.name}</h4>
              <p className="text-sm text-gray-400">
                Weekly Cost: ${staffMember.cost.toLocaleString()}
              </p>
            </div>
          </div>
          {children}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">{emptyText}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full p-6 bg-gray-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Staff Management</h1>
          <p className="text-gray-400">Manage your coaching and support staff</p>
        </div>

        {/* Team Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setSelectedTeam('home')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTeam === 'home'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Home Team
              </button>
              <button
                onClick={() => setSelectedTeam('away')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTeam === 'away'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                Away Team
              </button>
            </div>
            <div className="text-gray-400">
              <span className="text-sm">Total Staff Wages: </span>
              <span className="text-lg font-bold text-yellow-400">
                ${calculateTotalStaffWages().toLocaleString()}/week
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('current')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'current'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Current Staff
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'available'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Available Staff
              </button>
            </nav>
          </div>
        </div>

        {/* Current Staff */}
        {activeTab === 'current' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StaffCard title="Head Coach" staffMember={staff.coach} emptyText="No head coach hired">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Specialty:</span>
                  <span className="text-white capitalize">{staff.coach?.specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Bonus:</span>
                  <span className="text-green-400">+{staff.coach?.bonus}%</span>
                </div>
              </div>
            </StaffCard>

            <StaffCard title="Head Scout" staffMember={staff.scout} emptyText="No head scout hired">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Rating:</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < (staff.scout?.rating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </StaffCard>

            <StaffCard
              title="Head of Medicine"
              staffMember={staff.medicine}
              emptyText="No medical staff hired"
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Injury Prevention:</span>
                  <span className="text-green-400">+{staff.medicine?.injuryPreventionBonus}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Rehabilitation:</span>
                  <span className="text-blue-400">+{staff.medicine?.rehabBonus}%</span>
                </div>
              </div>
            </StaffCard>

            <StaffCard
              title="Assistant Manager"
              staffMember={staff.assistantManager}
              emptyText="No assistant manager hired"
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Tactical Knowledge:</span>
                  <span className="text-teal-400">{staff.assistantManager?.tacticalKnowledge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Man Management:</span>
                  <span className="text-purple-400">{staff.assistantManager?.manManagement}</span>
                </div>
              </div>
            </StaffCard>

            <StaffCard
              title="Goalkeeper Coach"
              staffMember={staff.gkCoach}
              emptyText="No goalkeeper coach hired"
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">GK Coaching:</span>
                  <span className="text-yellow-400">{staff.gkCoach?.goalkeepingCoaching}</span>
                </div>
              </div>
            </StaffCard>

            <StaffCard
              title="Fitness Coach"
              staffMember={staff.fitnessCoach}
              emptyText="No fitness coach hired"
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Fitness Coaching:</span>
                  <span className="text-red-400">{staff.fitnessCoach?.fitnessCoaching}</span>
                </div>
              </div>
            </StaffCard>

            <StaffCard
              title="Loan Manager"
              staffMember={staff.loanManager}
              emptyText="No loan manager hired"
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Negotiation:</span>
                  <span className="text-orange-400">{staff.loanManager?.negotiation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Player Judgment:</span>
                  <span className="text-cyan-400">{staff.loanManager?.judgingPlayerAbility}</span>
                </div>
              </div>
            </StaffCard>
          </div>
        )}

        {/* Available Staff */}
        {activeTab === 'available' && (
          <div className="space-y-8">
            {/* Available Coaches */}
            <div>
              <h3 className="text-xl font-semibold text-teal-400 mb-4">Available Head Coaches</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableStaff.coaches.map(coach => (
                  <div key={coach.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">{coach.name}</h4>
                        <p className="text-sm text-gray-400 capitalize">
                          Specialty: {coach.specialty}
                        </p>
                      </div>
                      <span className="text-green-400 font-bold">+{coach.bonus}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-bold">
                        ${coach.cost.toLocaleString()}/week
                      </span>
                      <button
                        onClick={() => handleHireStaff(coach, 'coaches')}
                        disabled={finances.transferBudget < coach.cost || !!staff.coach}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          finances.transferBudget >= coach.cost && !staff.coach
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {staff.coach ? 'Position Filled' : 'Hire'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Scouts */}
            <div>
              <h3 className="text-xl font-semibold text-teal-400 mb-4">Available Head Scouts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableStaff.scouts.map(scout => (
                  <div key={scout.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">{scout.name}</h4>
                        <div className="flex mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < scout.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-bold">
                        ${scout.cost.toLocaleString()}/week
                      </span>
                      <button
                        onClick={() => handleHireStaff(scout, 'scouts')}
                        disabled={finances.transferBudget < scout.cost || !!staff.scout}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          finances.transferBudget >= scout.cost && !staff.scout
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {staff.scout ? 'Position Filled' : 'Hire'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPage;
