import React from 'react';
import { useFranchiseContext, useTacticsContext } from '../../hooks';
import { NewspaperIcon, BanknoteIcon, TrophyIcon, UsersIcon, ShieldCheck } from '../ui/icons';
import { useNavigate } from 'react-router-dom';

const InfoCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, icon, onClick, children }) => (
  <div
    onClick={onClick}
    className="bg-gray-700/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/80 transition-colors border border-transparent hover:border-teal-500/50"
  >
    <div className="flex items-center text-gray-300 mb-2">
      {icon}
      <h3 className="font-bold text-lg ml-2">{title}</h3>
    </div>
    <div className="text-sm text-gray-200">{children}</div>
  </div>
);

const Gauge: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const colorClass = value > 70 ? 'bg-green-500' : value > 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-semibold text-gray-300">{label}</p>
        <p className="font-bold text-lg text-white">{value}%</p>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-2.5">
        <div
          className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
};

const CoachDashboard: React.FC = () => {
  const { franchiseState } = useFranchiseContext();
  const { tacticsState } = useTacticsContext();
  const navigate = useNavigate();

  const { finances, season, gameWeek, inbox, jobSecurity, fanConfidence, boardObjectives } =
    franchiseState;
  const { players } = tacticsState;

  const nextFixture = season.fixtures.find(
    f => f.week === gameWeek && (f.homeTeam === 'Astral FC' || f.awayTeam === 'Astral FC')
  );
  const unreadMessages = inbox.filter(i => !i.isRead).length;
  const injuredPlayers = players.filter(p => p.availability.status.includes('Injury')).length;
  const criticalObjective = boardObjectives.find(o => o.isCritical && !o.isMet);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900 overflow-hidden">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-teal-400">Command Center</h2>
            <p className="text-sm text-gray-400">
              Week {gameWeek} | Season {season.year}
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard
                title="Next Match"
                icon={<TrophyIcon className="w-5 h-5 text-yellow-400" />}
                onClick={() => navigate('/league-table')}
              >
                {nextFixture ? (
                  <>
                    <p>
                      vs{' '}
                      <span className="font-bold">
                        {nextFixture.homeTeam === 'Astral FC'
                          ? nextFixture.awayTeam
                          : nextFixture.homeTeam}
                      </span>{' '}
                      ({nextFixture.homeTeam === 'Astral FC' ? 'H' : 'A'})
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ready your tactics for the upcoming game.
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">No match this week. Focus on training.</p>
                )}
              </InfoCard>
              <InfoCard
                title="Inbox"
                icon={<NewspaperIcon className="w-5 h-5 text-blue-400" />}
                onClick={() => navigate('/inbox')}
              >
                <p>{inbox.length} total messages</p>
                {unreadMessages > 0 ? (
                  <p className="font-bold text-teal-400 animate-pulse">
                    {unreadMessages} unread messages require attention.
                  </p>
                ) : (
                  <p className="text-gray-400">You are all caught up.</p>
                )}
              </InfoCard>
            </div>
            <InfoCard
              title="Squad Status"
              icon={<UsersIcon className="w-5 h-5 text-gray-300" />}
              onClick={() => navigate('/medical-center')}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-bold">
                    {players.filter(p => p.team === 'home').length}
                  </p>
                  <p className="text-xs text-gray-400">Players in Squad</p>
                </div>
                <div>
                  {injuredPlayers > 0 ? (
                    <>
                      <p className="text-lg font-bold text-red-400">{injuredPlayers}</p>
                      <p className="text-xs text-red-400">Injured Players</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-green-400">0</p>
                      <p className="text-xs text-green-400">Squad Fully Fit</p>
                    </>
                  )}
                </div>
              </div>
            </InfoCard>
            <InfoCard
              title="Board Objective"
              icon={<ShieldCheck className="w-5 h-5 text-gray-300" />}
              onClick={() => navigate('/board-objectives')}
            >
              {criticalObjective ? (
                <>
                  <p className="font-semibold text-yellow-300">"{criticalObjective.description}"</p>
                  <p className="text-xs text-red-400 font-bold mt-1">(CRITICAL)</p>
                </>
              ) : (
                <p className="text-gray-400">
                  All critical objectives are currently met. Keep up the good work.
                </p>
              )}
            </InfoCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-lg text-gray-300 mb-4 text-center">Confidence</h3>
              <div className="space-y-4">
                <Gauge label="Board Confidence" value={jobSecurity} />
                <Gauge label="Fan Confidence" value={fanConfidence} />
              </div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="font-bold text-lg text-gray-300 mb-2 flex items-center">
                <BanknoteIcon className="w-5 h-5 text-green-400 mr-2" />
                Finances
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transfer Budget</span>
                  <span className="font-semibold text-white">
                    ${finances.home.transferBudget.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wage Budget (rem.)</span>
                  <span className="font-semibold text-white">
                    $
                    {(
                      finances.home.wageBudget -
                      players
                        .filter(p => p.team === 'home')
                        .reduce((s, p) => s + (p.contract.wage || 0), 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/finances')}
                className="w-full mt-4 text-xs text-center py-1.5 bg-teal-600/50 hover:bg-teal-600 rounded-md"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
