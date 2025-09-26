import React from 'react';
import { useAuthContext, useTacticsContext, useFranchiseContext } from '../../hooks';
import {
  UserXIcon as UserIcon,
  CalendarIcon as Calendar,
  MessageSquareIcon as MessageCircle,
  ChartLineIcon as TrendingUp,
  HeartIcon as Heart,
  MoneyIcon as DollarSign,
  FileTextIcon as FileText,
} from '../ui/icons';

const FamilyDashboard: React.FC = () => {
  const { authState } = useAuthContext();
  const { tacticsState } = useTacticsContext();
  const { franchiseState: _franchiseState } = useFranchiseContext();

  // Get the family member's associated players
  const associatedPlayers = tacticsState.players.filter(player =>
    authState.user?.playerIds?.includes(player.id),
  );

  // For demo purposes, get the first associated player
  const mainPlayer = associatedPlayers[0];

  if (!authState.user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Family Dashboard Loading...</h2>
        </div>
      </div>
    );
  }

  if (!mainPlayer) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Player Association Found</h2>
          <p className="text-gray-500">
            Your family account is not yet linked to a player. Please contact the coach to set up
            the association.
          </p>
        </div>
      </div>
    );
  }

  const getMoraleColor = (morale: string): string => {
    switch (morale) {
      case 'Excellent':
        return 'text-green-400';
      case 'Good':
        return 'text-green-300';
      case 'Okay':
        return 'text-yellow-400';
      case 'Poor':
        return 'text-red-400';
      case 'Very Poor':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getAttributeColor = (value: number): string => {
    if (value >= 85) {
      return 'text-green-400';
    }
    if (value >= 70) {
      return 'text-yellow-400';
    }
    if (value >= 55) {
      return 'text-orange-400';
    }
    return 'text-red-400';
  };

  // Mock upcoming schedule data
  const upcomingEvents = [
    { type: 'Training', date: 'Tomorrow, 3:00 PM', location: 'Training Ground A' },
    {
      type: 'Match',
      date: 'Saturday, 2:00 PM',
      location: 'Home Stadium',
      opponent: 'vs Quantum Rovers',
    },
    { type: 'Medical Check', date: 'Friday, 10:00 AM', location: 'Medical Center' },
  ];

  // Mock family-specific notifications
  const familyNotifications = [
    {
      title: 'Monthly Report Available',
      message: `${mainPlayer.name}'s performance report for this month is ready for review.`,
      time: '2 hours ago',
      type: 'report',
    },
    {
      title: 'Training Schedule Updated',
      message: "Next week's training schedule has been updated. Please check for any conflicts.",
      time: '1 day ago',
      type: 'schedule',
    },
    {
      title: 'Fee Payment Due',
      message: 'Monthly training fees are due by the end of the week.',
      time: '2 days ago',
      type: 'payment',
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-[var(--bg-primary)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Welcome, {authState.user.firstName}!
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Following {mainPlayer.name}&apos;s journey • #{mainPlayer.jerseyNumber}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm">
                  <span className="text-[var(--text-secondary)]">Player Status:</span>
                  <span className="ml-1 font-semibold text-green-400">
                    {mainPlayer.availability.status}
                  </span>
                </span>
                <span className="text-sm">
                  <span className="text-[var(--text-secondary)]">Morale:</span>
                  <span className={`ml-1 font-semibold ${getMoraleColor(mainPlayer.morale)}`}>
                    {mainPlayer.morale}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Performance Overview */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {mainPlayer.name}&apos;s Performance
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{mainPlayer.stats.goals}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Goals</div>
                </div>
                <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{mainPlayer.stats.assists}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Assists</div>
                </div>
                <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {mainPlayer.stats.matchesPlayed}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Matches</div>
                </div>
                <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="text-2xl font-bold text-orange-400">{mainPlayer.form}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Current Form</div>
                </div>
              </div>
            </div>

            {/* Development Progress */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
              <div className="flex items-center mb-4">
                <Heart className="w-5 h-5 text-red-400 mr-2" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Development Progress
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">Overall Potential</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{
                          width: `${
                            ((mainPlayer.currentPotential - mainPlayer.potential[0]) /
                              (mainPlayer.potential[1] - mainPlayer.potential[0])) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {mainPlayer.currentPotential}/{mainPlayer.potential[1]}
                    </span>
                  </div>
                </div>

                {/* Top 3 Attributes */}
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(mainPlayer.attributes)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([attr, value]) => (
                      <div
                        key={attr}
                        className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg"
                      >
                        <div className={`text-lg font-bold ${getAttributeColor(value)}`}>
                          {value}
                        </div>
                        <div className="text-xs capitalize text-[var(--text-secondary)]">
                          {attr}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
              <div className="flex items-center mb-4">
                <MessageCircle className="w-5 h-5 text-green-400 mr-2" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Family Notifications
                </h2>
              </div>
              <div className="space-y-3">
                {familyNotifications.map((notification, index) => (
                  <div key={index} className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 ${
                          notification.type === 'payment'
                            ? 'bg-red-400'
                            : notification.type === 'report'
                              ? 'bg-blue-400'
                              : 'bg-yellow-400'
                        }`}
                      ></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {notification.title}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          {notification.message}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-2">
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Schedule */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Upcoming Schedule
                </h3>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {event.type}
                      {event.opponent && (
                        <span className="text-yellow-400 ml-1">{event.opponent}</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">{event.date}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      📍 {event.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Coach
                </button>
                <button className="w-full py-2 px-3 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </button>
                <button className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Overview
                </button>
                <button className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg transition-colors flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Payment Center
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[var(--text-secondary)]">Head Coach</div>
                  <div className="text-[var(--text-primary)] font-medium">Mike Anderson</div>
                  <div className="text-[var(--text-secondary)]">coach@astralfc.com</div>
                </div>
                <div>
                  <div className="text-[var(--text-secondary)]">Training Facility</div>
                  <div className="text-[var(--text-primary)] font-medium">
                    Astral FC Training Center
                  </div>
                  <div className="text-[var(--text-secondary)]">(555) 123-4567</div>
                </div>
                <div>
                  <div className="text-[var(--text-secondary)]">Emergency Contact</div>
                  <div className="text-[var(--text-primary)] font-medium">Medical Team</div>
                  <div className="text-[var(--text-secondary)]">(555) 911-HELP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboard;
