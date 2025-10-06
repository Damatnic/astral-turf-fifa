import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { useAnalyticsDashboard } from '../../services/analyticsDashboard';
import { useSessionRecorder } from '../../services/sessionRecorder';
import { useHeatmapAnalytics } from '../../services/heatmapAnalytics';
import type { AnalyticsDashboardData } from '../../services/analyticsDashboard';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SessionRecordingDashboardProps {
  playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>;
  className?: string;
}

const SessionRecordingDashboard: React.FC<SessionRecordingDashboardProps> = ({
  playerPositions,
  className = '',
}) => {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'performance' | 'behavior' | 'tactical' | 'heatmap' | 'timeline'
  >('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { generateDashboard, exportAnalytics } = useAnalyticsDashboard();
  const { startRecording, stopRecording, getTimeline, getSummary } = useSessionRecorder();
  const { generateCompleteHeatmap } = useHeatmapAnalytics();

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshDashboard();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }

    // Return cleanup function even when autoRefresh is false
    return () => {};
  }, [autoRefresh, playerPositions]);

  const refreshDashboard = () => {
    const data = generateDashboard(playerPositions);
    setDashboardData(data);
  };

  const handleStartRecording = () => {
    startRecording();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    stopRecording();
    setIsRecording(false);
    refreshDashboard();
  };

  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    if (!dashboardData) {
      return;
    }

    const exported = exportAnalytics(dashboardData, {
      format,
      includeCharts: true,
      includeSessions: true,
      includeHeatmaps: format === 'json',
    });

    const blob = new Blob([exported], {
      type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/html',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${Date.now()}.${format === 'pdf' ? 'html' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'behavior', label: 'User Behavior', icon: '👤' },
    { id: 'tactical', label: 'Tactical Insights', icon: '⚽' },
    { id: 'heatmap', label: 'Heatmaps', icon: '🔥' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
  ] as const;

  return (
    <div className={`bg-gray-900 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="text-3xl mr-3">📊</span>
              Advanced Analytics Dashboard
            </h2>
            <p className="text-gray-400 mt-1">
              Session recording, heatmaps, and performance metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Recording controls */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRecording ? '⏹️ Stop Recording' : '⏺️ Start Recording'}
            </button>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                autoRefresh
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : '🔄 Auto-Refresh OFF'}
            </button>

            {/* Refresh button */}
            <button
              onClick={refreshDashboard}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              🔄 Refresh
            </button>

            {/* Export dropdown */}
            <div className="relative group">
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
                📤 Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 rounded-t-lg"
                >
                  📄 Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700"
                >
                  📊 Export CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 rounded-b-lg"
                >
                  📑 Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!dashboardData && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No analytics data available yet.</p>
            <button
              onClick={refreshDashboard}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              Generate Dashboard
            </button>
          </div>
        )}

        {dashboardData && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <OverviewTab data={dashboardData} isRecording={isRecording} />
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && <PerformanceTab data={dashboardData} />}

            {/* User Behavior Tab */}
            {activeTab === 'behavior' && <UserBehaviorTab data={dashboardData} />}

            {/* Tactical Insights Tab */}
            {activeTab === 'tactical' && <TacticalTab data={dashboardData} />}

            {/* Heatmap Tab */}
            {activeTab === 'heatmap' && (
              <HeatmapTab data={dashboardData} playerPositions={playerPositions} />
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && <TimelineTab />}
          </>
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ data: AnalyticsDashboardData; isRecording: boolean }> = ({
  data,
  isRecording,
}) => {
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const metrics = [
    {
      label: 'Session Duration',
      value: formatDuration(data.performance.sessionDuration),
      icon: '⏱️',
      color: 'blue',
    },
    {
      label: 'Actions/Minute',
      value: data.performance.actionsPerMinute.toFixed(2),
      icon: '⚡',
      color: 'yellow',
    },
    {
      label: 'Formation Changes',
      value: data.performance.formationChanges,
      icon: '🔄',
      color: 'green',
    },
    {
      label: 'AI Suggestions',
      value: data.performance.aiSuggestionsUsed,
      icon: '🤖',
      color: 'purple',
    },
    {
      label: 'Error Rate',
      value: `${data.performance.errorRate.toFixed(2)}%`,
      icon: '⚠️',
      color: data.performance.errorRate > 5 ? 'red' : 'green',
    },
    {
      label: 'User Engagement',
      value: `${data.userBehavior.userEngagement}%`,
      icon: '📈',
      color: data.userBehavior.userEngagement > 70 ? 'green' : 'yellow',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Recording Status */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-600 rounded-lg p-4 flex items-center"
        >
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-3" />
          <span className="text-red-400 font-semibold">Recording in progress...</span>
        </motion.div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span
                className={`text-xs px-2 py-1 rounded bg-${metric.color}-600/20 text-${metric.color}-400`}
              >
                Live
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{metric.value}</div>
            <div className="text-sm text-gray-400">{metric.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Session Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📋 Session Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Total Events</div>
            <div className="text-xl font-bold text-white">{data.session.totalEvents}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Tactical Changes</div>
            <div className="text-xl font-bold text-white">{data.session.tacticalChanges}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">AI Interactions</div>
            <div className="text-xl font-bold text-white">{data.session.aiInteractions}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Collaborators</div>
            <div className="text-xl font-bold text-white">{data.session.collaborators}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab: React.FC<{ data: AnalyticsDashboardData }> = ({ data }) => {
  const performanceChartData = {
    labels: ['Actions/Min', 'Formation Changes', 'Tactic Updates', 'AI Suggestions'],
    datasets: [
      {
        label: 'Performance Metrics',
        data: [
          data.performance.actionsPerMinute,
          data.performance.formationChanges,
          data.performance.tacticUpdates,
          data.performance.aiSuggestionsUsed,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(139, 92, 246, 0.5)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⚡ Performance Overview</h3>
        <div className="h-64">
          <Bar
            data={performanceChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Avg Response Time</h4>
          <div className="text-3xl font-bold text-white">{data.performance.avgResponseTime}ms</div>
          <div className="text-sm text-gray-400 mt-1">
            {data.performance.avgResponseTime < 100
              ? '✅ Excellent'
              : data.performance.avgResponseTime < 300
                ? '👍 Good'
                : '⚠️ Needs Improvement'}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Error Rate</h4>
          <div className="text-3xl font-bold text-white">
            {data.performance.errorRate.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {data.performance.errorRate < 1
              ? '✅ Excellent'
              : data.performance.errorRate < 5
                ? '👍 Good'
                : '⚠️ High'}
          </div>
        </div>
      </div>
    </div>
  );
};

// User Behavior Tab Component
const UserBehaviorTab: React.FC<{ data: AnalyticsDashboardData }> = ({ data }) => {
  const featureData = {
    labels: data.userBehavior.mostUsedFeatures.slice(0, 5).map(f => f.feature),
    datasets: [
      {
        data: data.userBehavior.mostUsedFeatures.slice(0, 5).map(f => f.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">👤 Most Used Features</h3>
        <div className="h-64">
          <Doughnut
            data={featureData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Sessions</div>
          <div className="text-2xl font-bold text-white">{data.userBehavior.totalSessions}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Engagement Score</div>
          <div className="text-2xl font-bold text-white">{data.userBehavior.userEngagement}%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Completion Rate</div>
          <div className="text-2xl font-bold text-white">{data.userBehavior.completionRate}%</div>
        </div>
      </div>
    </div>
  );
};

// Tactical Tab Component
const TacticalTab: React.FC<{ data: AnalyticsDashboardData }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⚽ Favorite Formations</h3>
        <div className="space-y-3">
          {data.tactical.favoriteFormations.map((formation, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <span className="text-2xl mr-3">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'}
                </span>
                <span className="text-white font-semibold">{formation.formation}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Usage</div>
                  <div className="text-white font-bold">{formation.usage}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Win Rate</div>
                  <div className="text-green-400 font-bold">{formation.winRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Acceptance Rate</h4>
          <div className="text-3xl font-bold text-white">{data.tactical.aiAcceptanceRate}%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Collaboration Score</h4>
          <div className="text-3xl font-bold text-white">{data.tactical.collaborationScore}</div>
        </div>
      </div>
    </div>
  );
};

// Heatmap Tab Component
const HeatmapTab: React.FC<{
  data: AnalyticsDashboardData;
  playerPositions: Array<{ playerId: string; playerName: string; x: number; y: number }>;
}> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔥 Zone Coverage Analysis</h3>
        <div className="space-y-3">
          {data.heatmap.zoneCoverage.slice(0, 5).map((zone, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white">{zone.zone}</span>
                <span className="text-gray-400">{zone.coverage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${zone.dominant ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${zone.coverage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Heatmap Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Total Data Points</div>
            <div className="text-xl font-bold text-white">{data.heatmap.metadata.dataPoints}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Movement Patterns</div>
            <div className="text-xl font-bold text-white">
              {data.heatmap.movementPatterns.length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Influence Zones</div>
            <div className="text-xl font-bold text-white">{data.heatmap.influenceZones.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Zones Covered</div>
            <div className="text-xl font-bold text-white">{data.heatmap.zoneCoverage.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timeline Tab Component
const TimelineTab: React.FC = () => {
  const { getTimeline } = useSessionRecorder();
  const timeline = getTimeline();

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⏱️ Session Timeline</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {timeline.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No timeline events recorded yet</p>
          ) : (
            timeline.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: entry.color + '33' }}
                >
                  <span className="text-lg">{entry.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{entry.description}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionRecordingDashboard;
