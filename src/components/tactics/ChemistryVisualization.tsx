import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Player } from '../../types';

interface ChemistryConnection {
  playerId1: string;
  playerId2: string;
  chemistry: number; // 0-100 scale
  type: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
}

interface ChemistryVisualizationProps {
  players: Player[];
  showChemistry: boolean;
  viewMode?: 'standard' | 'fullscreen' | 'presentation';
  fieldDimensions?: { width: number; height: number };
}

// Calculate chemistry between two players based on their attributes and relationship
const calculateChemistry = (player1: Player, player2: Player): number => {
  // Base chemistry calculation using various factors
  let chemistry = 50; // Base neutral chemistry
  
  // Same team bonus
  if (player1.team === player2.team) {
    chemistry += 20;
  }
  
  // Position compatibility (complementary roles work better together)
  const positionBonus = getPositionCompatibility(player1.roleId, player2.roleId);
  chemistry += positionBonus;
  
  // Age compatibility (similar ages work better together)
  const ageDiff = Math.abs(player1.age - player2.age);
  if (ageDiff <= 3) chemistry += 10;
  else if (ageDiff <= 6) chemistry += 5;
  else if (ageDiff > 10) chemistry -= 10;
  
  // Nationality compatibility
  if (player1.nationality === player2.nationality) {
    chemistry += 15;
  }
  
  // Morale compatibility (good morale players boost each other)
  const moraleBonus = getMoraleCompatibility(player1.morale, player2.morale);
  chemistry += moraleBonus;
  
  // Form compatibility
  const formBonus = getFormCompatibility(player1.form, player2.form);
  chemistry += formBonus;
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, chemistry));
};

// Get position compatibility bonus
const getPositionCompatibility = (role1: string, role2: string): number => {
  const compatibilityMap: Record<string, string[]> = {
    'gk': ['cb', 'fb'],
    'cb': ['gk', 'cb', 'fb', 'dm'],
    'fb': ['gk', 'cb', 'wb', 'cm'],
    'wb': ['fb', 'cm', 'wm'],
    'dm': ['cb', 'cm'],
    'cm': ['fb', 'wb', 'dm', 'cm', 'am'],
    'wm': ['wb', 'cm', 'w'],
    'am': ['cm', 'cf', 'w'],
    'w': ['wm', 'am', 'cf'],
    'cf': ['am', 'w', 'st'],
    'st': ['cf', 'am']
  };
  
  const compatible = compatibilityMap[role1]?.includes(role2) || compatibilityMap[role2]?.includes(role1);
  return compatible ? 15 : 0;
};

// Get morale compatibility bonus
const getMoraleCompatibility = (morale1: string, morale2: string): number => {
  const moraleValues = {
    'Excellent': 5,
    'Good': 4,
    'Okay': 3,
    'Poor': 2,
    'Very Poor': 1
  };
  
  const val1 = moraleValues[morale1 as keyof typeof moraleValues] || 3;
  const val2 = moraleValues[morale2 as keyof typeof moraleValues] || 3;
  
  if (val1 >= 4 && val2 >= 4) return 10; // Both good/excellent
  if (val1 <= 2 && val2 <= 2) return -10; // Both poor
  if (Math.abs(val1 - val2) <= 1) return 5; // Similar levels
  
  return 0;
};

// Get form compatibility bonus
const getFormCompatibility = (form1: string, form2: string): number => {
  const formValues = {
    'Excellent': 5,
    'Good': 4,
    'Average': 3,
    'Poor': 2,
    'Very Poor': 1
  };
  
  const val1 = formValues[form1 as keyof typeof formValues] || 3;
  const val2 = formValues[form2 as keyof typeof formValues] || 3;
  
  if (val1 >= 4 && val2 >= 4) return 10; // Both in good form
  if (val1 <= 2 && val2 <= 2) return -5; // Both in poor form
  
  return 0;
};

// Convert chemistry score to type
const getChemistryType = (chemistry: number): ChemistryConnection['type'] => {
  if (chemistry >= 80) return 'excellent';
  if (chemistry >= 65) return 'good';
  if (chemistry >= 35) return 'neutral';
  if (chemistry >= 20) return 'poor';
  return 'terrible';
};

// Get color for chemistry type
const getChemistryColor = (type: ChemistryConnection['type']): string => {
  switch (type) {
    case 'excellent': return '#10b981'; // green-500
    case 'good': return '#3b82f6'; // blue-500
    case 'neutral': return '#6b7280'; // gray-500
    case 'poor': return '#f59e0b'; // amber-500
    case 'terrible': return '#ef4444'; // red-500
  }
};

// Get line width based on chemistry strength
const getLineWidth = (chemistry: number): number => {
  if (chemistry >= 80) return 3;
  if (chemistry >= 65) return 2.5;
  if (chemistry >= 35) return 1.5;
  if (chemistry >= 20) return 1;
  return 0.5;
};

// Connection line component
const ChemistryLine: React.FC<{
  connection: ChemistryConnection;
  player1Position: { x: number; y: number };
  player2Position: { x: number; y: number };
  fieldDimensions: { width: number; height: number };
}> = ({ connection, player1Position, player2Position, fieldDimensions }) => {
  const color = getChemistryColor(connection.type);
  const width = getLineWidth(connection.chemistry);
  
  // Convert percentage positions to absolute coordinates
  const x1 = (player1Position.x / 100) * fieldDimensions.width;
  const y1 = (player1Position.y / 100) * fieldDimensions.height;
  const x2 = (player2Position.x / 100) * fieldDimensions.width;
  const y2 = (player2Position.y / 100) * fieldDimensions.height;
  
  // Calculate midpoint for chemistry indicator
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Connection line */}
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeOpacity={0.7}
        strokeDasharray={connection.type === 'neutral' ? '5,5' : undefined}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      
      {/* Chemistry strength indicator (only for non-neutral connections) */}
      {connection.type !== 'neutral' && (
        <motion.circle
          cx={midX}
          cy={midY}
          r={4}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        />
      )}
      
      {/* Excellent chemistry gets a glow effect */}
      {connection.type === 'excellent' && (
        <motion.circle
          cx={midX}
          cy={midY}
          r={8}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.3}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ delay: 0.8, duration: 2, repeat: Infinity }}
        />
      )}
    </motion.g>
  );
};

const ChemistryVisualization: React.FC<ChemistryVisualizationProps> = ({
  players,
  showChemistry,
  viewMode = 'standard',
  fieldDimensions = { width: 800, height: 600 }
}) => {
  // Calculate all chemistry connections
  const connections = useMemo(() => {
    const result: ChemistryConnection[] = [];
    
    // Only show connections for players on the field (not benched)
    const activePlayers = players.filter(p => 
      p.position && p.position.x >= 0 && p.position.y >= 0
    );
    
    for (let i = 0; i < activePlayers.length; i++) {
      for (let j = i + 1; j < activePlayers.length; j++) {
        const player1 = activePlayers[i];
        const player2 = activePlayers[j];
        
        // Only calculate chemistry between teammates
        if (player1.team === player2.team) {
          const chemistry = calculateChemistry(player1, player2);
          const type = getChemistryType(chemistry);
          
          // Only show meaningful connections (not neutral ones, unless specifically requested)
          if (type !== 'neutral' || showChemistry) {
            result.push({
              playerId1: player1.id,
              playerId2: player2.id,
              chemistry,
              type
            });
          }
        }
      }
    }
    
    return result;
  }, [players, showChemistry]);
  
  // Get player positions
  const playerPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    players.forEach(player => {
      if (player.position) {
        positions[player.id] = player.position;
      }
    });
    return positions;
  }, [players]);
  
  if (!showChemistry || connections.length === 0) {
    return null;
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${fieldDimensions.width} ${fieldDimensions.height}`}
        className="absolute inset-0"
        style={{ zIndex: 5 }}
      >
        <AnimatePresence>
          {connections.map((connection) => {
            const player1Pos = playerPositions[connection.playerId1];
            const player2Pos = playerPositions[connection.playerId2];
            
            if (!player1Pos || !player2Pos) return null;
            
            return (
              <ChemistryLine
                key={`${connection.playerId1}-${connection.playerId2}`}
                connection={connection}
                player1Position={player1Pos}
                player2Position={player2Pos}
                fieldDimensions={fieldDimensions}
              />
            );
          })}
        </AnimatePresence>
      </svg>
      
      {/* Chemistry Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-sm"
        style={{ zIndex: 10 }}
      >
        <div className="text-white font-medium mb-2">Player Chemistry</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-green-400 text-xs">Excellent (80+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-blue-400 text-xs">Good (65-79)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-gray-500 border-dashed border-b"></div>
            <span className="text-gray-400 text-xs">Neutral (35-64)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-amber-500"></div>
            <span className="text-amber-400 text-xs">Poor (20-34)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-red-500"></div>
            <span className="text-red-400 text-xs">Terrible (0-19)</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChemistryVisualization;