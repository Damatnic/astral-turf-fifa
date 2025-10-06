import React, { useState } from 'react';
import { useUIContext, useTacticsContext, useFranchiseContext } from '../../hooks';
import { CloseIcon, PlayIcon, StopIcon, CalendarIcon } from '../ui/icons';
import type {
  TrainingDrill,
  TrainingDrillCategory,
  TrainingIntensity,
  DailySchedule,
  WeeklySchedule,
  Player,
} from '../../types';
import { TRAINING_DRILLS } from '../../constants';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ${
      active
        ? 'bg-gray-700 text-teal-300 border-b-2 border-teal-400'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700/50'
    }`}
  >
    {children}
  </button>
);

const DrillCard: React.FC<{
  drill: TrainingDrill;
  onSelect: (drill: TrainingDrill) => void;
  isSelected: boolean;
}> = ({ drill, onSelect, isSelected }) => (
  <div
    onClick={() => onSelect(drill)}
    className={`p-3 rounded-md border cursor-pointer transition-colors ${
      isSelected
        ? 'bg-teal-600 border-teal-500 text-white'
        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-medium">{drill.name}</h4>
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          drill.intensity === 'high'
            ? 'bg-red-600 text-white'
            : drill.intensity === 'medium'
              ? 'bg-yellow-600 text-white'
              : 'bg-green-600 text-white'
        }`}
      >
        {drill.intensity}
      </span>
    </div>
    <p className="text-xs opacity-75 mb-2">{drill.description}</p>
    <div className="flex flex-wrap gap-1">
      {drill.primaryAttributes.map(attr => (
        <span key={attr} className="text-xs px-2 py-1 bg-teal-700/50 rounded-full capitalize">
          {attr}
        </span>
      ))}
    </div>
    <div className="mt-2 flex justify-between text-xs opacity-75">
      <span>Fatigue: {drill.fatigueEffect}</span>
      <span>
        Morale: {drill.moraleEffect > 0 ? '+' : ''}
        {drill.moraleEffect}
      </span>
    </div>
  </div>
);

const TrainingPopup: React.FC = () => {
  const { uiState, dispatch } = useUIContext();
  const { tacticsState } = useTacticsContext();
  const { franchiseState } = useFranchiseContext();
  const { players } = tacticsState;
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule>('monday');
  const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon'>('morning');
  const [selectedDrillType, setSelectedDrillType] = useState<'warmup' | 'main' | 'cooldown'>(
    'warmup'
  );
  const [selectedCategory, setSelectedCategory] = useState<TrainingDrillCategory>('attacking');
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: {
      morning: { warmup: null, main: null, cooldown: null },
      afternoon: { warmup: null, main: null, cooldown: null },
      isRestDay: false,
    },
    tuesday: {
      morning: { warmup: null, main: null, cooldown: null },
      afternoon: { warmup: null, main: null, cooldown: null },
      isRestDay: false,
    },
    wednesday: {
      morning: { warmup: null, main: null, cooldown: null },
      afternoon: { warmup: null, main: null, cooldown: null },
      isRestDay: false,
    },
    thursday: {
      morning: { warmup: null, main: null, cooldown: null },
      afternoon: { warmup: null, main: null, cooldown: null },
      isRestDay: false,
    },
    friday: {
      morning: { warmup: null, main: null, cooldown: null },
      afternoon: { warmup: null, main: null, cooldown: null },
      isRestDay: false,
    },
    saturday: {
      morning: { warmup: null, main: null, cooldown: null },
      afternoon: { warmup: null, main: null, cooldown: null },
      isRestDay: true,
    },
    sunday: {
      morning: { warmup: null, main: null, cooldown: null },
      afternoon: { warmup: null, main: null, cooldown: null },
      isRestDay: true,
    },
  });

  const handleClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const filteredDrills = TRAINING_DRILLS.filter(drill =>
    selectedDrillType === 'warmup'
      ? drill.category === 'warmup'
      : selectedDrillType === 'cooldown'
        ? drill.category === 'cooldown'
        : drill.category === selectedCategory
  );

  const handleDrillSelect = (drill: TrainingDrill) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [selectedSession]: {
          ...prev[selectedDay][selectedSession],
          [selectedDrillType]: drill.id,
        },
      },
    }));
  };

  const toggleRestDay = (day: keyof WeeklySchedule) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isRestDay: !prev[day].isRestDay,
      },
    }));
  };

  const getDrillById = (drillId: string) => TRAINING_DRILLS.find(d => d.id === drillId);

  const homeTeamPlayers = players.filter(p => p.team === 'home');
  const averageStamina =
    homeTeamPlayers.reduce((sum, p) => sum + p.stamina, 0) / homeTeamPlayers.length;
  const averageFatigue =
    homeTeamPlayers.reduce((sum, p) => sum + p.fatigue, 0) / homeTeamPlayers.length;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-700/50 flex flex-col animate-fade-in-scale max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center">
            <CalendarIcon className="w-6 h-6 mr-3 text-teal-400" />
            <h2 className="text-xl font-bold text-teal-400">Training Center</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Team Status */}
        <div className="p-4 bg-gray-900/50 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-teal-400">{homeTeamPlayers.length}</div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{Math.round(averageStamina)}%</div>
              <div className="text-sm text-gray-400">Avg. Stamina</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {Math.round(averageFatigue)}%
              </div>
              <div className="text-sm text-gray-400">Avg. Fatigue</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-4 border-b border-gray-700">
          <div className="flex space-x-1">
            <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')}>
              Weekly Schedule
            </TabButton>
            <TabButton active={activeTab === 'drills'} onClick={() => setActiveTab('drills')}>
              Drill Library
            </TabButton>
            <TabButton
              active={activeTab === 'individual'}
              onClick={() => setActiveTab('individual')}
            >
              Individual Focus
            </TabButton>
            <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>
              Templates
            </TabButton>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Day Selection */}
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-3">Days of the Week</h3>
                <div className="space-y-2">
                  {Object.keys(weeklySchedule).map(day => (
                    <div key={day} className="flex items-center">
                      <button
                        onClick={() => setSelectedDay(day as keyof WeeklySchedule)}
                        className={`flex-grow text-left px-3 py-2 rounded-md transition-colors ${
                          selectedDay === day
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        } ${weeklySchedule[day as keyof WeeklySchedule].isRestDay ? 'opacity-50' : ''}`}
                      >
                        <div className="font-medium capitalize">{day}</div>
                        {weeklySchedule[day as keyof WeeklySchedule].isRestDay && (
                          <div className="text-xs opacity-75">Rest Day</div>
                        )}
                      </button>
                      <button
                        onClick={() => toggleRestDay(day as keyof WeeklySchedule)}
                        className={`ml-2 px-3 py-1 text-xs rounded-md transition-colors ${
                          weeklySchedule[day as keyof WeeklySchedule].isRestDay
                            ? 'bg-red-600 text-white hover:bg-red-500'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {weeklySchedule[day as keyof WeeklySchedule].isRestDay ? 'Rest' : 'Train'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Planning */}
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-3">
                  {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} Sessions
                </h3>

                {!weeklySchedule[selectedDay].isRestDay ? (
                  <div className="space-y-4">
                    {/* Morning Session */}
                    <div className="border border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-200">Morning Session</h4>
                        <button
                          onClick={() => setSelectedSession('morning')}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            selectedSession === 'morning'
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Warmup:</span>
                          <span className="text-teal-400">
                            {weeklySchedule[selectedDay].morning.warmup
                              ? getDrillById(weeklySchedule[selectedDay].morning.warmup)?.name
                              : 'Not Set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Main:</span>
                          <span className="text-teal-400">
                            {weeklySchedule[selectedDay].morning.main
                              ? getDrillById(weeklySchedule[selectedDay].morning.main)?.name
                              : 'Not Set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cooldown:</span>
                          <span className="text-teal-400">
                            {weeklySchedule[selectedDay].morning.cooldown
                              ? getDrillById(weeklySchedule[selectedDay].morning.cooldown)?.name
                              : 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Afternoon Session */}
                    <div className="border border-gray-600 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-200">Afternoon Session</h4>
                        <button
                          onClick={() => setSelectedSession('afternoon')}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            selectedSession === 'afternoon'
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Warmup:</span>
                          <span className="text-teal-400">
                            {weeklySchedule[selectedDay].afternoon.warmup
                              ? getDrillById(weeklySchedule[selectedDay].afternoon.warmup)?.name
                              : 'Not Set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Main:</span>
                          <span className="text-teal-400">
                            {weeklySchedule[selectedDay].afternoon.main
                              ? getDrillById(weeklySchedule[selectedDay].afternoon.main)?.name
                              : 'Not Set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cooldown:</span>
                          <span className="text-teal-400">
                            {weeklySchedule[selectedDay].afternoon.cooldown
                              ? getDrillById(weeklySchedule[selectedDay].afternoon.cooldown)?.name
                              : 'Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">😴</div>
                    <div>Rest Day - No training scheduled</div>
                  </div>
                )}
              </div>

              {/* Drill Selection */}
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-3">Select Drill</h3>

                {/* Drill Type Selection */}
                <div className="flex space-x-2 mb-4">
                  {(['warmup', 'main', 'cooldown'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedDrillType(type)}
                      className={`px-3 py-2 text-sm rounded-md transition-colors capitalize ${
                        selectedDrillType === type
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Category Selection for Main Drills */}
                {selectedDrillType === 'main' && (
                  <div className="mb-4">
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value as TrainingDrillCategory)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="attacking">Attacking</option>
                      <option value="defending">Defending</option>
                      <option value="physical">Physical</option>
                      <option value="technical">Technical</option>
                      <option value="tactical">Tactical</option>
                      <option value="set_pieces">Set Pieces</option>
                    </select>
                  </div>
                )}

                {/* Available Drills */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredDrills.map(drill => (
                    <DrillCard
                      key={drill.id}
                      drill={drill}
                      onSelect={handleDrillSelect}
                      isSelected={
                        weeklySchedule[selectedDay][selectedSession][selectedDrillType] === drill.id
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drills' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">Drill Library</h3>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(
                    [
                      'warmup',
                      'attacking',
                      'defending',
                      'physical',
                      'technical',
                      'tactical',
                      'set_pieces',
                      'cooldown',
                    ] as TrainingDrillCategory[]
                  ).map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-2 text-sm rounded-md transition-colors capitalize ${
                        selectedCategory === category
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {category.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Drill Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TRAINING_DRILLS.filter(drill => drill.category === selectedCategory).map(
                    drill => (
                      <DrillCard
                        key={drill.id}
                        drill={drill}
                        onSelect={() => {}}
                        isSelected={false}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'individual' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">
                  Individual Training Focus
                </h3>
                <p className="text-gray-400 mb-4">
                  Assign specific training focus areas to individual players to enhance their
                  development.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-200 mb-3">Player List</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {homeTeamPlayers.map(player => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-gray-700/50 rounded-md"
                        >
                          <div className="flex items-center">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                              style={{ backgroundColor: player.teamColor }}
                            >
                              {player.jerseyNumber}
                            </div>
                            <div>
                              <div className="font-medium text-white">{player.name}</div>
                              <div className="text-xs text-gray-400">
                                Current Focus: {player.individualTrainingFocus?.attribute || 'None'}
                              </div>
                            </div>
                          </div>
                          <button className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-md transition-colors">
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-200 mb-3">Focus Areas</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'speed',
                        'passing',
                        'tackling',
                        'shooting',
                        'dribbling',
                        'positioning',
                        'stamina',
                      ].map(attribute => (
                        <button
                          key={attribute}
                          className="p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-600 transition-colors text-left"
                        >
                          <div className="font-medium capitalize">{attribute}</div>
                          <div className="text-xs opacity-75 mt-1">
                            Targeted drills for {attribute} development
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-200 mb-4">Training Templates</h3>
                <p className="text-gray-400 mb-4">
                  Pre-built weekly training schedules for different focus areas.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: 'Attacking Focus',
                      description: 'Emphasis on goalscoring and creative play',
                      color: 'bg-red-600',
                    },
                    {
                      name: 'Defensive Shape',
                      description: 'Build solid defensive foundations',
                      color: 'bg-blue-600',
                    },
                    {
                      name: 'Physical Conditioning',
                      description: 'Improve fitness and stamina levels',
                      color: 'bg-orange-600',
                    },
                    {
                      name: 'Technical Development',
                      description: 'Enhance ball control and passing',
                      color: 'bg-green-600',
                    },
                    {
                      name: 'Tactical Discipline',
                      description: 'Focus on formation and positioning',
                      color: 'bg-purple-600',
                    },
                    {
                      name: 'Pre-Season',
                      description: 'Comprehensive preparation schedule',
                      color: 'bg-teal-600',
                    },
                  ].map(template => (
                    <div
                      key={template.name}
                      className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center mb-3">
                        <div className={`w-4 h-4 rounded-full ${template.color} mr-3`}></div>
                        <h4 className="font-medium text-white">{template.name}</h4>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                      <button className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors">
                        Apply Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-md transition-colors flex items-center">
              <PlayIcon className="w-4 h-4 mr-2" />
              Start Training
            </button>
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md transition-colors">
              Save as Template
            </button>
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingPopup;
