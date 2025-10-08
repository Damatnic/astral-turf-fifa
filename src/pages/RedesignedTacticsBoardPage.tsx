/**
 * REDESIGNED TACTICS BOARD PAGE
 * 
 * This page showcases the completely redesigned tactics board with:
 * - Phase 1: Professional positioning system
 * - Phase 2: Beautiful player cards (4 sizes)
 * - Phase 3: Advanced roster management
 * - Phase 4: Enhanced toolbar and field overlays
 */

import React, { useMemo } from 'react';
import { RedesignedTacticsBoard } from '../components/tactics/RedesignedTacticsBoard';
import type { Player } from '../types';

const RedesignedTacticsBoardPage: React.FC = () => {
  // Generate sample players for demonstration
  const samplePlayers = useMemo<Player[]>(() => {
    const positions = [
      { role: 'GK', name: 'David Martinez' },
      { role: 'CB', name: 'James Anderson' },
      { role: 'CB', name: 'Michael Brown' },
      { role: 'LB', name: 'Lucas Silva' },
      { role: 'RB', name: 'Marco Rossi' },
      { role: 'CDM', name: 'Pierre Dubois' },
      { role: 'CM', name: 'Erik Hansen' },
      { role: 'CM', name: 'Antonio Garcia' },
      { role: 'LW', name: 'Carlos Santos' },
      { role: 'RW', name: 'John Smith' },
      { role: 'ST', name: 'Robert Johnson' },
      // Bench players
      { role: 'GK', name: 'Alex Thompson' },
      { role: 'CB', name: 'Kevin White' },
      { role: 'CM', name: 'Daniel Lee' },
      { role: 'ST', name: 'Chris Wilson' },
    ];

    return positions.map((pos, index) => ({
      id: `player-${index + 1}`,
      name: pos.name,
      jerseyNumber: index + 1,
      roleId: pos.role,
      age: 20 + Math.floor(Math.random() * 15),
      nationality: ['England', 'Spain', 'Brazil', 'Germany', 'France', 'Italy'][Math.floor(Math.random() * 6)],
      overall: 70 + Math.floor(Math.random() * 25),
      attributes: {
        // Add sample attributes
        acceleration: 60 + Math.floor(Math.random() * 35),
        sprintSpeed: 60 + Math.floor(Math.random() * 35),
        positioning: 60 + Math.floor(Math.random() * 35),
        finishing: 60 + Math.floor(Math.random() * 35),
        shotPower: 60 + Math.floor(Math.random() * 35),
        longShots: 60 + Math.floor(Math.random() * 35),
        volleys: 60 + Math.floor(Math.random() * 35),
        penalties: 60 + Math.floor(Math.random() * 35),
        vision: 60 + Math.floor(Math.random() * 35),
        crossing: 60 + Math.floor(Math.random() * 35),
        fkAccuracy: 60 + Math.floor(Math.random() * 35),
        shortPassing: 60 + Math.floor(Math.random() * 35),
        longPassing: 60 + Math.floor(Math.random() * 35),
        curve: 60 + Math.floor(Math.random() * 35),
        dribbling: 60 + Math.floor(Math.random() * 35),
        ballControl: 60 + Math.floor(Math.random() * 35),
        agility: 60 + Math.floor(Math.random() * 35),
        balance: 60 + Math.floor(Math.random() * 35),
        reactions: 60 + Math.floor(Math.random() * 35),
        composure: 60 + Math.floor(Math.random() * 35),
        interceptions: 60 + Math.floor(Math.random() * 35),
        headingAccuracy: 60 + Math.floor(Math.random() * 35),
        marking: 60 + Math.floor(Math.random() * 35),
        standingTackle: 60 + Math.floor(Math.random() * 35),
        slidingTackle: 60 + Math.floor(Math.random() * 35),
        jumping: 60 + Math.floor(Math.random() * 35),
        stamina: 60 + Math.floor(Math.random() * 35),
        strength: 60 + Math.floor(Math.random() * 35),
        aggression: 60 + Math.floor(Math.random() * 35),
      },
      potential: [70, 90] as [number, number],
      currentPotential: 75 + Math.floor(Math.random() * 15),
      form: 'Good' as const,
      fitness: 85 + Math.floor(Math.random() * 15),
      morale: 'Good' as const,
      sharpness: 85 + Math.floor(Math.random() * 15),
      stamina: 85 + Math.floor(Math.random() * 15),
      condition: 'Fit' as const,
      injuryProne: false,
      experience: Math.floor(Math.random() * 100),
      personality: ['Determined', 'Professional', 'Ambitious'][Math.floor(Math.random() * 3)] as any,
      consistency: 7 + Math.floor(Math.random() * 3),
      importantMatches: 7 + Math.floor(Math.random() * 3),
      versatility: Math.floor(Math.random() * 10),
      team: 'home' as const,
      availability: {
        status: 'available' as const,
        reason: null,
        returnDate: null,
        daysOut: null,
      },
    }));
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-950">
      <RedesignedTacticsBoard initialPlayers={samplePlayers} />
    </div>
  );
};

export default RedesignedTacticsBoardPage;

