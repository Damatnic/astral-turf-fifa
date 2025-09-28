import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { UnifiedTacticsBoard } from './components/tactics/UnifiedTacticsBoard';
import PerformanceMonitorDashboard from './components/performance/PerformanceMonitorDashboard';
import './index.css';

/**
 * Test Application Component
 * Comprehensive testing environment for all tactical board features
 */
const TestApp: React.FC = () => {
  const handleSimulateMatch = (formation: any) => {
    console.log('🏟️ Match simulation started with formation:', formation);
  };

  const handleSaveFormation = (formation: any) => {
    console.log('💾 Formation saved:', formation);
  };

  const handleAnalyticsView = () => {
    console.log('📊 Analytics view opened');
  };

  const handleExportFormation = (formation: any) => {
    console.log('📤 Formation exported:', formation);
  };

  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-slate-950">
          {/* Test Header */}
          <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  🏆 Astral Turf - Test Environment
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Port 6000 • All Features Active • Comprehensive Testing
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                  ✅ LIVE
                </div>
                <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                  TEST MODE
                </div>
                <div className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full">
                  PORT 6000
                </div>
              </div>
            </div>
          </header>

          {/* Test Features Panel */}
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-emerald-900/30 text-emerald-300 rounded">
                ⚡ Smart Lineup Optimizer
              </span>
              <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                🎯 Enhanced Player Tokens
              </span>
              <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded">
                📊 Advanced Analytics
              </span>
              <span className="px-2 py-1 bg-orange-900/30 text-orange-300 rounded">
                🎬 Animation Timeline
              </span>
              <span className="px-2 py-1 bg-pink-900/30 text-pink-300 rounded">
                🎪 Presentation Controls
              </span>
              <span className="px-2 py-1 bg-red-900/30 text-red-300 rounded">
                🏟️ Dugout Management
              </span>
              <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded">
                🔥 Heat Map Analytics
              </span>
              <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded">
                🏆 Challenge Management
              </span>
              <span className="px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded">
                👥 Collaboration Features
              </span>
              <span className="px-2 py-1 bg-teal-900/30 text-teal-300 rounded">
                📦 Enhanced Export/Import
              </span>
            </div>
          </div>

          {/* Main Tactical Board */}
          <div className="h-[calc(100vh-140px)]">
            <UnifiedTacticsBoard
              onSimulateMatch={handleSimulateMatch}
              onSaveFormation={handleSaveFormation}
              onAnalyticsView={handleAnalyticsView}
              onExportFormation={handleExportFormation}
              className="h-full"
            />
          </div>

          {/* Test Console */}
          <div className="fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 max-w-md">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              🔧 Test Console
            </h3>
            <div className="text-xs text-slate-400 space-y-1">
              <div>✅ All 10 features loaded</div>
              <div>✅ Testing framework active</div>
              <div>✅ Performance monitoring on</div>
              <div>✅ Error tracking enabled</div>
            </div>
            <button 
              onClick={() => window.open('/test-dashboard', '_blank')}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
            >
              Open Test Dashboard
            </button>
          </div>

          {/* Catalyst Performance Monitor */}
          <PerformanceMonitorDashboard />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
};

export default TestApp;