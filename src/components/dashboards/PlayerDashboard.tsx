import React from 'react';
import { useAuthContext, useTacticsContext, useFranchiseContext } from '../../hooks';
import type { Player, WeeklySchedule } from '../../types';
import { StarIcon, DumbbellIcon, HeartHandshakeIcon, AwardIcon } from '../ui/icons';
import { PLAYER_ROLES } from '../../constants';

const AttributeBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm py-1">
    <span className="font-medium text-gray-300 capitalize">{label}</span>
    <div className="w-1/2 bg-gray-600 rounded-full h-2.5">
      <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
    </div>
    <span className="font-bold text-white w-8 text-right">{value}</span>
  </div>
);

const TrainingDay: React.FC<{ day: string; schedule: WeeklySchedule[keyof WeeklySchedule] }> = ({
  day,
  schedule,
}) => (
  <div className={`p-2 rounded-md ${schedule.isRestDay ? 'bg-blue-900/30' : 'bg-gray-700/50'}`}>
    <p className="font-bold text-center text-xs text-white capitalize">{day}</p>
    <div className="mt-1 text-[10px] text-gray-400 text-center">
      {schedule.isRestDay ? 'Rest Day' : 'Training'}
    </div>
  </div>
);

const PlayerDashboard: React.FC = () => {
  const { authState } = useAuthContext();
  const { tacticsState } = useTacticsContext();
  const { franchiseState } = useFranchiseContext();

  const player = tacticsState.players.find(p => p.id === authState.user?.playerId);
  const role = player ? PLAYER_ROLES.find(r => r.id === player.roleId) : null;
  const trainingSchedule = player?.customTrainingSchedule || franchiseState.trainingSchedule.home;
  const skillChallenges = franchiseState.skillChallenges;

  if (!player || !role) {
    return <div className="p-8 text-center text-gray-400">Player data not found.</div>;
  }

  const completedChallenges = skillChallenges.filter(sc =>
    player.completedChallenges.includes(sc.id),
  );

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl mr-4 border-2 border-[var(--accent-primary)]"
              style={{ backgroundColor: player.teamColor }}
            >
              {player.jerseyNumber}
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-400">Welcome, {player.name}</h2>
              <p className="text-sm text-gray-400">
                {role.name} | {player.age} years old
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attributes */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="font-bold text-lg text-gray-200 flex items-center mb-2">
              <StarIcon className="w-5 h-5 mr-2 text-yellow-400" /> My Attributes
            </h3>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              {Object.entries(player.attributes).map(([key, value]) => (
                <AttributeBar key={key} label={key} value={value} />
              ))}
            </div>
          </div>

          {/* Training & Contract */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-gray-200 flex items-center mb-2">
                <DumbbellIcon className="w-5 h-5 mr-2" /> My Weekly Schedule
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(trainingSchedule).map(([day, schedule]) => (
                  <TrainingDay key={day} day={day} schedule={schedule} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-200 flex items-center mb-2">
                <HeartHandshakeIcon className="w-5 h-5 mr-2" /> My Contract
              </h3>
              <div className="bg-gray-700/50 p-4 rounded-lg space-y-2">
                {player.contract.clauses.map(clause => (
                  <div key={clause.id} className="flex justify-between items-center text-sm">
                    <p className="text-gray-300">{clause.text}</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${clause.status === 'Met' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                    >
                      {clause.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-200 flex items-center mb-2">
                <AwardIcon className="w-5 h-5 mr-2" /> My Skill Badges
              </h3>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                {completedChallenges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {completedChallenges.map(challenge => (
                      <div
                        key={challenge.id}
                        className="flex items-center p-2 rounded-md"
                        style={{ backgroundColor: challenge.color + '20' }}
                        title={challenge.description}
                      >
                        <AwardIcon className="w-4 h-4 mr-2" style={{ color: challenge.color }} />
                        <span className="text-xs font-semibold">{challenge.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-gray-500">
                    No badges earned yet. Keep training!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;
