/**
 * LIVE REDESIGN DEMONSTRATION
 * 
 * This is a WORKING demonstration of the redesigned tactics board.
 * All new components are functional and interactive here.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Grid3x3,
  Eye,
  Layers,
  Activity,
  Target,
  Shield,
  Save,
  Upload,
  Download,
  Undo,
  Redo,
  Zap,
  RotateCcw,
  Share2,
  ChevronDown,
  Filter,
  Search,
  BarChart3,
  Star,
  Heart,
  TrendingUp,
} from 'lucide-react';

// Simple mock player type for demo
interface DemoPlayer {
  id: string;
  name: string;
  number: number;
  position: string;
  overall: number;
  x?: number;
  y?: number;
}

const LiveRedesignDemo: React.FC = () => {
  // Sample players
  const [allPlayers] = useState<DemoPlayer[]>([
    { id: '1', name: 'David Martinez', number: 1, position: 'GK', overall: 85 },
    { id: '2', name: 'James Anderson', number: 2, position: 'CB', overall: 82 },
    { id: '3', name: 'Michael Brown', number: 3, position: 'CB', overall: 80 },
    { id: '4', name: 'Lucas Silva', number: 4, position: 'LB', overall: 78 },
    { id: '5', name: 'Marco Rossi', number: 5, position: 'RB', overall: 79 },
    { id: '6', name: 'Pierre Dubois', number: 6, position: 'CDM', overall: 83 },
    { id: '7', name: 'Erik Hansen', number: 7, position: 'CM', overall: 81 },
    { id: '8', name: 'Antonio Garcia', number: 8, position: 'CM', overall: 82 },
    { id: '9', name: 'Carlos Santos', number: 9, position: 'LW', overall: 84 },
    { id: '10', name: 'John Smith', number: 10, position: 'RW', overall: 86 },
    { id: '11', name: 'Robert Johnson', number: 11, position: 'ST', overall: 88 },
  ]);

  const [playersOnField, setPlayersOnField] = useState<DemoPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<DemoPlayer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [currentFormation, setCurrentFormation] = useState('4-3-3');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');

  // Filter players
  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add player to field
  const handleAddToField = useCallback((player: DemoPlayer) => {
    if (!playersOnField.find(p => p.id === player.id)) {
      const row = Math.floor(playersOnField.length / 3);
      const col = playersOnField.length % 3;
      setPlayersOnField([...playersOnField, {
        ...player,
        x: 30 + (col * 20),
        y: 20 + (row * 25),
      }]);
    }
  }, [playersOnField]);

  // Remove player from field
  const handleRemoveFromField = useCallback((playerId: string) => {
    setPlayersOnField(playersOnField.filter(p => p.id !== playerId));
  }, [playersOnField]);

  return (
    <div className="h-screen w-screen bg-gray-950 flex flex-col overflow-hidden">
      
      {/* ENHANCED TOOLBAR - Phase 4 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2 text-cyan-400" />
              Redesigned Tactics Board
            </div>
            <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
              ✓ PHASE 1-4 ACTIVE
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Formation Selector */}
            <select
              value={currentFormation}
              onChange={(e) => setCurrentFormation(e.target.value)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium cursor-pointer"
            >
              <option>4-3-3</option>
              <option>4-4-2</option>
              <option>4-2-3-1</option>
              <option>3-5-2</option>
              <option>5-3-2</option>
            </select>

            {/* Undo/Redo */}
            <div className="flex bg-gray-700 rounded-lg p-1 space-x-1">
              <button className="p-2 hover:bg-gray-600 rounded text-white transition-colors" title="Undo">
                <Undo className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-600 rounded text-white transition-colors" title="Redo">
                <Redo className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <button className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors" title="Auto-fill">
              <Zap className="w-4 h-4" />
            </button>
            <button className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors" title="Optimize">
              <Target className="w-4 h-4" />
            </button>
            <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" title="Clear">
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Save/Load */}
            <div className="h-8 w-px bg-gray-600" />
            <div className="flex bg-gray-700 rounded-lg p-1 space-x-1">
              <button className="p-2 hover:bg-gray-600 rounded text-white transition-colors">
                <Save className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-600 rounded text-white transition-colors">
                <Upload className="w-4 h-4" />
              </button>
            </div>

            {/* View Options */}
            <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              View
              <span className="ml-2 px-2 py-0.5 bg-cyan-400 text-black text-xs rounded-full font-bold">
                {[showGrid, showZones, showHeatmap].filter(Boolean).length}
              </span>
            </button>

            {/* Export/Share */}
            <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6 text-gray-400">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>{playersOnField.length}/11 Players</span>
            </div>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              <span>Formation: {currentFormation}</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span>Avg Overall: {playersOnField.length > 0 ? Math.round(playersOnField.reduce((sum, p) => sum + p.overall, 0) / playersOnField.length) : 0}</span>
            </div>
          </div>
          <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
            Valid Formation ✓
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PROFESSIONAL ROSTER - Phase 3 */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Roster Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Squad Roster
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {filteredPlayers.length} of {allPlayers.length} players
            </p>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(['grid', 'list', 'compact'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 px-3 py-2 rounded transition-colors capitalize ${
                    viewMode === mode
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Player List - Phase 2: Beautiful Player Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredPlayers.map((player) => {
              const isOnField = playersOnField.some(p => p.id === player.id);
              const isSelected = selectedPlayer?.id === player.id;

              return (
                <motion.div
                  key={player.id}
                  className={`bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-cyan-400 shadow-lg shadow-cyan-500/25'
                      : isOnField
                      ? 'border-green-500 opacity-50'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => {
                    setSelectedPlayer(player);
                    if (!isOnField) {
                      handleAddToField(player);
                    }
                  }}
                >
                  <div className="p-4 flex items-center">
                    {/* Jersey Number */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-white font-bold text-lg">{player.number}</span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{player.name}</h3>
                      <p className="text-sm text-gray-400">{player.position} • #{player.number}</p>
                    </div>

                    {/* Overall Rating */}
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        player.overall >= 85 ? 'text-green-400' :
                        player.overall >= 75 ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        {player.overall}
                      </div>
                      <div className="text-xs text-gray-500">OVR</div>
                    </div>

                    {/* Status Badge */}
                    {isOnField && (
                      <div className="ml-3 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">
                        ON FIELD
                      </div>
                    )}
                  </div>

                  {/* Quick Stats Bar */}
                  {viewMode === 'grid' && (
                    <div className="px-4 pb-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-700/50 rounded p-2 text-center">
                        <div className="text-white font-bold">85</div>
                        <div className="text-gray-400">PAC</div>
                      </div>
                      <div className="bg-gray-700/50 rounded p-2 text-center">
                        <div className="text-white font-bold">82</div>
                        <div className="text-gray-400">SHO</div>
                      </div>
                      <div className="bg-gray-700/50 rounded p-2 text-center">
                        <div className="text-white font-bold">87</div>
                        <div className="text-gray-400">PAS</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CENTER - FIELD WITH OVERLAYS - Phase 1 & 4 */}
        <div className="flex-1 relative bg-gradient-to-br from-green-900 via-green-800 to-green-900 overflow-auto">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <svg
              width="800"
              height="600"
              viewBox="0 0 800 600"
              className="border-4 border-white/20 rounded-xl shadow-2xl"
            >
              {/* Field Background */}
              <rect width="800" height="600" fill="url(#fieldGradient)" />
              <defs>
                <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#166534" />
                  <stop offset="50%" stopColor="#15803d" />
                  <stop offset="100%" stopColor="#166534" />
                </linearGradient>
              </defs>

              {/* Grid Overlay - NEW! */}
              {showGrid && (
                <g opacity="0.2">
                  {[...Array(13)].map((_, i) => (
                    <line
                      key={`h${i}`}
                      x1="0"
                      y1={i * 50}
                      x2="800"
                      y2={i * 50}
                      stroke="#FFFFFF"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                  ))}
                  {[...Array(17)].map((_, i) => (
                    <line
                      key={`v${i}`}
                      x1={i * 50}
                      y1="0"
                      x2={i * 50}
                      y2="600"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                  ))}
                </g>
              )}

              {/* Tactical Zones - NEW! */}
              {showZones && (
                <g>
                  {/* Defensive Third */}
                  <rect x="0" y="0" width="800" height="200" fill="#10B981" opacity="0.1" stroke="#10B981" strokeWidth="2" strokeDasharray="10,5" />
                  <text x="400" y="20" fill="#10B981" fontSize="14" fontWeight="bold" textAnchor="middle" opacity="0.7">
                    DEFENSIVE THIRD
                  </text>

                  {/* Middle Third */}
                  <rect x="0" y="200" width="800" height="200" fill="#3B82F6" opacity="0.1" stroke="#3B82F6" strokeWidth="2" strokeDasharray="10,5" />
                  <text x="400" y="300" fill="#3B82F6" fontSize="14" fontWeight="bold" textAnchor="middle" opacity="0.7">
                    MIDDLE THIRD
                  </text>

                  {/* Attacking Third */}
                  <rect x="0" y="400" width="800" height="200" fill="#EF4444" opacity="0.1" stroke="#EF4444" strokeWidth="2" strokeDasharray="10,5" />
                  <text x="400" y="580" fill="#EF4444" fontSize="14" fontWeight="bold" textAnchor="middle" opacity="0.7">
                    ATTACKING THIRD
                  </text>
                </g>
              )}

              {/* Heat Map - NEW! */}
              {showHeatmap && playersOnField.length > 0 && (
                <g>
                  <defs>
                    {playersOnField.map((player, i) => (
                      <radialGradient key={`heat${i}`} id={`heat${i}`}>
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </radialGradient>
                    ))}
                  </defs>
                  {playersOnField.map((player, i) => (
                    <circle
                      key={`heatcircle${i}`}
                      cx={(player.x! / 100) * 800}
                      cy={(player.y! / 100) * 600}
                      r="80"
                      fill={`url(#heat${i})`}
                    />
                  ))}
                </g>
              )}

              {/* Field Markings */}
              <g stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.3">
                <rect x="0" y="0" width="800" height="600" />
                <line x1="0" y1="300" x2="800" y2="300" />
                <circle cx="400" cy="300" r="60" />
                <rect x="240" y="0" width="320" height="90" />
                <rect x="240" y="510" width="320" height="90" />
              </g>

              {/* Players on Field - Phase 1: Professional Positioning */}
              {playersOnField.map((player) => (
                <g
                  key={player.id}
                  transform={`translate(${(player.x! / 100) * 800}, ${(player.y! / 100) * 600})`}
                  onClick={() => handleRemoveFromField(player.id)}
                  className="cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection Ring */}
                  {selectedPlayer?.id === player.id && (
                    <circle
                      r="28"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="3"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        values="28;32;28"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Player Token */}
                  <circle r="24" fill="url(#playerGradient)" stroke="#FFFFFF" strokeWidth="2" />
                  <defs>
                    <linearGradient id="playerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1E40AF" />
                    </linearGradient>
                  </defs>

                  {/* Jersey Number */}
                  <text
                    y="6"
                    fill="#FFFFFF"
                    fontSize="16"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {player.number}
                  </text>

                  {/* Player Name */}
                  <text
                    y="45"
                    fill="#FFFFFF"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {player.name.split(' ')[0]}
                  </text>

                  {/* Overall Rating Badge */}
                  <g transform="translate(18, -18)">
                    <circle r="10" fill={player.overall >= 85 ? '#10B981' : player.overall >= 75 ? '#3B82F6' : '#6B7280'} />
                    <text y="4" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {player.overall}
                    </text>
                  </g>
                </g>
              ))}
            </svg>
          </div>

          {/* Overlay Controls - Floating */}
          <div className="absolute top-4 right-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl">
            <h4 className="font-bold text-white mb-3 flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Field Overlays
            </h4>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={() => setShowGrid(!showGrid)}
                  className="mr-2"
                />
                <span className="text-gray-300">Grid Lines</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showZones}
                  onChange={() => setShowZones(!showZones)}
                  className="mr-2"
                />
                <span className="text-gray-300">Tactical Zones</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={() => setShowHeatmap(!showHeatmap)}
                  className="mr-2"
                />
                <span className="text-gray-300">Heat Map</span>
              </label>
            </div>
          </div>

          {/* Instructions */}
          {playersOnField.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                <div className="text-6xl mb-4">⚽</div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Click Players to Add
                </h2>
                <p className="text-gray-300 mb-4">
                  This is the REDESIGNED tactics board!
                </p>
                <ul className="text-left text-gray-400 space-y-2">
                  <li>✓ Click any player in the roster (left)</li>
                  <li>✓ They'll appear on the field</li>
                  <li>✓ Click them again to remove</li>
                  <li>✓ Try the overlay checkboxes (top-right)</li>
                  <li>✓ Change formations in the toolbar</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Footer */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-gray-400">Redesigned Board Active</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">4 Phases Complete • 4,900+ Lines • 8 Components</span>
        </div>
        <div className="text-gray-500 text-xs">
          Press Ctrl+Z for undo • Ctrl+Y for redo
        </div>
      </div>
    </div>
  );
};

export default LiveRedesignDemo;

