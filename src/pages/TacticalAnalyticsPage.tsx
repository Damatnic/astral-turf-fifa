/**
 * Tactical Analytics Page
 * 
 * Comprehensive analytics for formations, players, and team performance
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTacticsContext } from '../hooks';
import { TacticalAnalyticsDashboard } from '../components/analytics/TacticalAnalyticsDashboard';
import { FormationHeatMap } from '../components/analytics/FormationHeatMap';
import { PROFESSIONAL_FORMATIONS } from '../data/professionalFormations';
import { analyzeFormation } from '../utils/formationAnalyzer';
import { calculateTeamChemistry } from '../utils/playerChemistry';
import { generateTacticalReport, downloadReport } from '../utils/professionalReports';
import type { ProfessionalFormation } from '../data/professionalFormations';
import {
  BarChart3,
  TrendingUp,
  Download,
  Flame,
} from 'lucide-react';

const TacticalAnalyticsPage: React.FC = () => {
  const { tacticsState } = useTacticsContext();
  const [selectedFormation, setSelectedFormation] = useState<ProfessionalFormation>(
    PROFESSIONAL_FORMATIONS[0]
  );
  const [activeTab, setActiveTab] = useState<'dashboard' | 'heatmap' | 'reports'>('dashboard');

  // Get current players
  const allPlayers = useMemo(() => tacticsState?.players || [], [tacticsState?.players]);

  // Calculate analyses
  const formationAnalysis = useMemo(
    () => analyzeFormation(selectedFormation, allPlayers),
    [selectedFormation, allPlayers]
  );

  const chemistryAnalysis = useMemo(
    () => calculateTeamChemistry(allPlayers),
    [allPlayers]
  );

  // Handle report download
  const handleDownloadReport = (format: 'txt' | 'json') => {
    const report = generateTacticalReport(
      selectedFormation,
      allPlayers,
      formationAnalysis,
      chemistryAnalysis
    );
    downloadReport(report, format);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center space-x-3">
              <BarChart3 className="w-10 h-10 text-blue-400" />
              <span>Tactical Analytics</span>
            </h1>
            <p className="text-gray-400">
              Comprehensive analysis of formations, players, and team performance
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleDownloadReport('txt')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Report (TXT)</span>
            </button>
            <button
              onClick={() => handleDownloadReport('json')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Data (JSON)</span>
            </button>
          </div>
        </div>

        {/* Formation Selector */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <label className="text-sm font-medium text-gray-400 mb-2 block">
            Select Formation to Analyze
          </label>
          <select
            value={selectedFormation.id}
            onChange={(e) => {
              const formation = PROFESSIONAL_FORMATIONS.find(f => f.id === e.target.value);
              if (formation) setSelectedFormation(formation);
            }}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {PROFESSIONAL_FORMATIONS.map((formation) => (
              <option key={formation.id} value={formation.id}>
                {formation.displayName} ({formation.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <TabButton
          icon={<BarChart3 className="w-4 h-4" />}
          label="Dashboard"
          isActive={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
        />
        <TabButton
          icon={<Flame className="w-4 h-4" />}
          label="Heat Map"
          isActive={activeTab === 'heatmap'}
          onClick={() => setActiveTab('heatmap')}
        />
        <TabButton
          icon={<TrendingUp className="w-4 h-4" />}
          label="Reports"
          isActive={activeTab === 'reports'}
          onClick={() => setActiveTab('reports')}
        />
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'dashboard' && (
          <TacticalAnalyticsDashboard
            formation={selectedFormation}
            players={allPlayers}
          />
        )}

        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span>Formation Coverage Heat Map</span>
              </h2>
              <p className="text-gray-400 mb-6">
                Visualizes player positioning and field coverage for {selectedFormation.displayName}
              </p>
              <div className="flex justify-center">
                <FormationHeatMap
                  formation={selectedFormation}
                  width={600}
                  height={900}
                  showGrid={true}
                  opacity={0.7}
                />
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Coverage Analysis</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Defensive Coverage</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formationAnalysis.tacticalBalance.defensive.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Midfield Control</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formationAnalysis.tacticalBalance.possession.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Width Coverage</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {formationAnalysis.tacticalBalance.width.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <span>Professional Reports</span>
            </h2>
            <p className="text-gray-400 mb-6">
              Generate comprehensive tactical reports for presentations and analysis
            </p>

            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-2">Report Contents</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Formation details and tactical description</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>AI analysis (overall score: {formationAnalysis.overallScore.toFixed(1)}%)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Tactical balance breakdown (5 metrics)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Key strengths ({formationAnalysis.strengths.length})</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Areas to address ({formationAnalysis.weaknesses.length})</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Team chemistry analysis ({chemistryAnalysis.overallChemistry.toFixed(0)}%)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>Player roster with ratings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>AI recommendations ({formationAnalysis.recommendations.length})</span>
                  </li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleDownloadReport('txt')}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-3 text-lg font-bold"
                >
                  <Download className="w-6 h-6" />
                  <span>Download Text Report</span>
                </button>
                <button
                  onClick={() => handleDownloadReport('json')}
                  className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-3 text-lg font-bold"
                >
                  <Download className="w-6 h-6" />
                  <span>Download JSON Data</span>
                </button>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>💡 Tip:</strong> Text reports are formatted for easy reading and sharing. 
                  JSON data can be imported into other tools for further analysis.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default TacticalAnalyticsPage;

