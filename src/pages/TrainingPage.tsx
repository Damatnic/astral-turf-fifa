import React, { useState } from 'react';
import { useFranchiseContext, useTacticsContext } from '../hooks';
import type { Team, WeeklySchedule, TrainingDrill } from '../types';
import { ResponsivePage } from '../components/Layout/ResponsivePage';
import {
  ResponsiveGrid,
  TouchButton,
  ResponsiveCard,
} from '../components/Layout/AdaptiveLayout.tsx';

const TrainingPage: React.FC = () => {
  const { franchiseState, dispatch } = useFranchiseContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const [selectedTeam, setSelectedTeam] = useState<Team>('home');
  const [selectedDay, setSelectedDay] = useState<keyof WeeklySchedule>('monday');
  const [newTemplateName, setNewTemplateName] = useState('');

  const schedule = franchiseState.trainingSchedule[selectedTeam];
  const daySchedule = schedule[selectedDay];
  const players = tacticsState.players.filter(p => p.team === selectedTeam);

  const days: { key: keyof WeeklySchedule; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const mockDrills: Record<string, TrainingDrill> = {
    warmup_1: {
      id: 'warmup_1',
      name: 'Light Jogging',
      category: 'warmup',
      description: 'Easy pace jogging to warm up muscles',
      primaryAttributes: ['stamina'],
      secondaryAttributes: [],
      intensity: 'low',
      fatigueEffect: 2,
      moraleEffect: 0,
      injuryRisk: 0.01,
    },
    shooting_1: {
      id: 'shooting_1',
      name: 'Shooting Practice',
      category: 'attacking',
      description: 'Practice shooting from various positions',
      primaryAttributes: ['shooting'],
      secondaryAttributes: ['positioning'],
      intensity: 'medium',
      fatigueEffect: 8,
      moraleEffect: 1,
      injuryRisk: 0.05,
    },
    passing_1: {
      id: 'passing_1',
      name: 'Passing Drills',
      category: 'technical',
      description: 'Short and long passing accuracy training',
      primaryAttributes: ['passing'],
      secondaryAttributes: ['positioning'],
      intensity: 'medium',
      fatigueEffect: 6,
      moraleEffect: 0,
      injuryRisk: 0.03,
    },
  };

  // Alias for backward compatibility
  const comprehensiveDrills = mockDrills;

  const handleOptimizeTraining = async () => {
    try {
      // Calculate average player fitness for the team
      const averageFitness =
        players.reduce((sum, p) => sum + ((p.stamina as number) || 70), 0) / (players.length || 1);

      // Calculate average morale (if available in player type)
      const averageMorale = 70; // Default morale value

      // Identify player weaknesses (attributes below 70)
      const teamWeaknesses = players.flatMap(player => {
        const weaknesses: string[] = [];
        if ((player.pace ?? 70) < 70) {
          weaknesses.push('pace');
        }
        if ((player.shooting ?? 70) < 70) {
          weaknesses.push('shooting');
        }
        if ((player.passing ?? 70) < 70) {
          weaknesses.push('passing');
        }
        if ((player.dribbling ?? 70) < 70) {
          weaknesses.push('dribbling');
        }
        if ((player.defending ?? 70) < 70) {
          weaknesses.push('defending');
        }
        if ((player.physical ?? 70) < 70) {
          weaknesses.push('physical');
        }
        return weaknesses;
      });

      // Count weakness frequency
      const weaknessCount: Record<string, number> = {};
      teamWeaknesses.forEach(weakness => {
        weaknessCount[weakness] = (weaknessCount[weakness] || 0) + 1;
      });

      // Find top 3 weaknesses
      const topWeaknesses = Object.entries(weaknessCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([weakness]) => weakness);

      // Determine optimal training intensity based on fitness and day of week
      let recommendedIntensity: 'low' | 'medium' | 'high';
      const daysUntilMatch = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ].indexOf(selectedDay);

      if (averageFitness > 80 && daysUntilMatch > 2) {
        recommendedIntensity = 'high';
      } else if (averageFitness > 60 && daysUntilMatch > 1) {
        recommendedIntensity = 'medium';
      } else {
        recommendedIntensity = 'low';
      }

      // Select optimal drills based on weaknesses and intensity
      const recommendedDrills: {
        session: 'morning' | 'afternoon';
        part: 'warmup' | 'main' | 'cooldown';
        drill: TrainingDrill;
        reason: string;
      }[] = [];

      // Morning warmup - always low intensity
      const warmupDrill = Object.values(mockDrills).find(d => d.category === 'warmup');
      if (warmupDrill) {
        recommendedDrills.push({
          session: 'morning',
          part: 'warmup',
          drill: warmupDrill,
          reason: 'Prepare muscles and reduce injury risk',
        });
      }

      // Morning main - focus on top weakness with recommended intensity
      const morningMainCategory =
        topWeaknesses[0] === 'shooting'
          ? 'attacking'
          : topWeaknesses[0] === 'defending'
            ? 'defending'
            : topWeaknesses[0] === 'passing'
              ? 'technical'
              : topWeaknesses[0] === 'physical'
                ? 'physical'
                : topWeaknesses[0] === 'pace'
                  ? 'physical'
                  : 'technical';

      const morningMainDrill =
        Object.values(mockDrills).find(
          d => d.category === morningMainCategory && d.intensity === recommendedIntensity
        ) || Object.values(mockDrills).find(d => d.category === morningMainCategory);

      if (morningMainDrill) {
        recommendedDrills.push({
          session: 'morning',
          part: 'main',
          drill: morningMainDrill,
          reason: `Address primary weakness: ${topWeaknesses[0]}`,
        });
      }

      // Morning cooldown - always low intensity
      const cooldownDrill = Object.values(mockDrills).find(d => d.category === 'cooldown');
      if (!cooldownDrill) {
        // Create a mock cooldown drill if none exists
        const mockCooldown: TrainingDrill = {
          id: 'cooldown_1',
          name: 'Stretching',
          category: 'cooldown',
          description: 'Light stretching to prevent muscle soreness',
          primaryAttributes: ['stamina'],
          secondaryAttributes: [],
          intensity: 'low',
          fatigueEffect: 1,
          moraleEffect: 0,
          injuryRisk: 0.01,
        };
        recommendedDrills.push({
          session: 'morning',
          part: 'cooldown',
          drill: mockCooldown,
          reason: 'Prevent muscle soreness and aid recovery',
        });
      } else {
        recommendedDrills.push({
          session: 'morning',
          part: 'cooldown',
          drill: cooldownDrill,
          reason: 'Prevent muscle soreness and aid recovery',
        });
      }

      // Afternoon warmup
      if (warmupDrill) {
        recommendedDrills.push({
          session: 'afternoon',
          part: 'warmup',
          drill: warmupDrill,
          reason: 'Prepare for afternoon session',
        });
      }

      // Afternoon main - focus on second weakness if fitness allows
      if (averageFitness > 50 && topWeaknesses.length > 1) {
        const afternoonMainCategory =
          topWeaknesses[1] === 'shooting'
            ? 'attacking'
            : topWeaknesses[1] === 'defending'
              ? 'defending'
              : topWeaknesses[1] === 'passing'
                ? 'technical'
                : 'technical';

        const afternoonMainDrill = Object.values(mockDrills).find(
          d => d.category === afternoonMainCategory
        );

        if (afternoonMainDrill) {
          recommendedDrills.push({
            session: 'afternoon',
            part: 'main',
            drill: afternoonMainDrill,
            reason: `Address secondary weakness: ${topWeaknesses[1]}`,
          });
        }
      }

      // Afternoon cooldown
      if (cooldownDrill) {
        recommendedDrills.push({
          session: 'afternoon',
          part: 'cooldown',
          drill: cooldownDrill,
          reason: 'Complete recovery process',
        });
      }

      // Apply recommended drills to schedule
      recommendedDrills.forEach(({ session, part, drill }) => {
        dispatch({
          type: 'SET_SESSION_DRILL',
          payload: {
            team: selectedTeam,
            day: selectedDay,
            session,
            sessionPart: part,
            drillId: drill.id,
          },
        });
      });

      // Log optimization results (development only)
      // eslint-disable-next-line no-console
      console.log('Training Optimization Complete:', {
        day: selectedDay,
        averageFitness: averageFitness.toFixed(1),
        averageMorale: averageMorale.toFixed(1),
        topWeaknesses,
        recommendedIntensity,
        drillsApplied: recommendedDrills.length,
        recommendations: recommendedDrills.map(r => ({
          session: r.session,
          part: r.part,
          drill: r.drill.name,
          reason: r.reason,
        })),
      });

      // Show success message (in a real app, this would use a toast/notification system)
      window.alert(
        `Training optimized for ${selectedDay}!\n\n` +
          `Team Fitness: ${averageFitness.toFixed(1)}%\n` +
          `Team Morale: ${averageMorale.toFixed(1)}%\n` +
          `Recommended Intensity: ${recommendedIntensity}\n` +
          `Focus Areas: ${topWeaknesses.join(', ')}\n\n` +
          `${recommendedDrills.length} drills have been scheduled.`
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Training optimization failed:', error);
      window.alert('Failed to optimize training. Please try again.');
    }
  };

  const handleSimulateTraining = () => {
    try {
      // Get the current day's training schedule
      const currentDaySchedule = schedule[selectedDay];

      // Check if it's a rest day
      if (currentDaySchedule.isRestDay) {
        window.alert('Cannot simulate training on a rest day.');
        return;
      }

      // Collect all drills from morning and afternoon sessions
      const scheduledDrills: TrainingDrill[] = [];

      // Morning session drills
      if (currentDaySchedule.morning.warmup && mockDrills[currentDaySchedule.morning.warmup]) {
        scheduledDrills.push(mockDrills[currentDaySchedule.morning.warmup]);
      }
      if (currentDaySchedule.morning.main && mockDrills[currentDaySchedule.morning.main]) {
        scheduledDrills.push(mockDrills[currentDaySchedule.morning.main]);
      }
      if (currentDaySchedule.morning.cooldown && mockDrills[currentDaySchedule.morning.cooldown]) {
        scheduledDrills.push(mockDrills[currentDaySchedule.morning.cooldown]);
      }

      // Afternoon session drills
      if (currentDaySchedule.afternoon.warmup && mockDrills[currentDaySchedule.afternoon.warmup]) {
        scheduledDrills.push(mockDrills[currentDaySchedule.afternoon.warmup]);
      }
      if (currentDaySchedule.afternoon.main && mockDrills[currentDaySchedule.afternoon.main]) {
        scheduledDrills.push(mockDrills[currentDaySchedule.afternoon.main]);
      }
      if (
        currentDaySchedule.afternoon.cooldown &&
        mockDrills[currentDaySchedule.afternoon.cooldown]
      ) {
        scheduledDrills.push(mockDrills[currentDaySchedule.afternoon.cooldown]);
      }

      // Check if there are any drills scheduled
      if (scheduledDrills.length === 0) {
        window.alert(
          'No drills scheduled for this day. Please add drills before simulating training.'
        );
        return;
      }

      // Simulate training for each player
      const updatedPlayers = players.map(player => {
        // Calculate total fatigue effect from all drills
        const totalFatigueEffect = scheduledDrills.reduce(
          (sum, drill) => sum + drill.fatigueEffect,
          0
        );

        // Calculate total morale effect from all drills
        const totalMoraleEffect = scheduledDrills.reduce(
          (sum, drill) => sum + drill.moraleEffect,
          0
        );

        // Calculate total injury risk (cumulative but capped)
        const totalInjuryRisk = Math.min(
          scheduledDrills.reduce((max, drill) => Math.max(max, drill.injuryRisk), 0),
          0.15
        ); // Cap at 15%

        // Simulate injury (simple random check)
        const hasInjury = Math.random() < totalInjuryRisk;

        // Calculate attribute improvements based on drill focus
        const attributeGains: Partial<Record<string, number>> = {};

        scheduledDrills.forEach(drill => {
          // Primary attributes get more improvement
          drill.primaryAttributes.forEach(attr => {
            const baseGain =
              drill.intensity === 'high' ? 0.3 : drill.intensity === 'medium' ? 0.2 : 0.1;
            const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            const gain = baseGain * randomFactor;
            attributeGains[attr] = (attributeGains[attr] || 0) + gain;
          });

          // Secondary attributes get less improvement
          drill.secondaryAttributes.forEach(attr => {
            const baseGain =
              drill.intensity === 'high' ? 0.15 : drill.intensity === 'medium' ? 0.1 : 0.05;
            const randomFactor = 0.8 + Math.random() * 0.4;
            const gain = baseGain * randomFactor;
            attributeGains[attr] = (attributeGains[attr] || 0) + gain;
          });
        });

        // Apply attribute changes to player
        const updatedPlayer = { ...player };

        // Update core attributes (pace, shooting, passing, dribbling, defending, physical)
        if (attributeGains.pace) {
          updatedPlayer.pace = Math.min(99, (player.pace ?? 70) + attributeGains.pace);
        }
        if (attributeGains.shooting) {
          updatedPlayer.shooting = Math.min(99, (player.shooting ?? 70) + attributeGains.shooting);
        }
        if (attributeGains.passing) {
          updatedPlayer.passing = Math.min(99, (player.passing ?? 70) + attributeGains.passing);
        }
        if (attributeGains.dribbling) {
          updatedPlayer.dribbling = Math.min(
            99,
            (player.dribbling ?? 70) + attributeGains.dribbling
          );
        }
        if (attributeGains.defending) {
          updatedPlayer.defending = Math.min(
            99,
            (player.defending ?? 70) + attributeGains.defending
          );
        }
        if (attributeGains.physical || attributeGains.stamina) {
          const physicalGain = (attributeGains.physical || 0) + (attributeGains.stamina || 0);
          updatedPlayer.physical = Math.min(99, (player.physical ?? 70) + physicalGain);
        }

        // Update stamina (reduced by fatigue, capped at 0-100)
        const newStamina = Math.max(0, Math.min(100, player.stamina - totalFatigueEffect));
        updatedPlayer.stamina = newStamina;

        // Update fatigue
        updatedPlayer.fatigue = Math.min(100, (player.fatigue || 0) + totalFatigueEffect);

        // Update morale (morale is a string status)
        if (player.morale) {
          // Positive morale effect improves status, negative worsens it
          if (totalMoraleEffect > 0) {
            if (player.morale === 'Poor') {
              updatedPlayer.morale = 'Okay';
            } else if (player.morale === 'Okay') {
              updatedPlayer.morale = 'Good';
            } else if (player.morale === 'Good') {
              updatedPlayer.morale = 'Excellent';
            }
          } else if (totalMoraleEffect < 0) {
            if (player.morale === 'Excellent') {
              updatedPlayer.morale = 'Good';
            } else if (player.morale === 'Good') {
              updatedPlayer.morale = 'Okay';
            } else if (player.morale === 'Okay') {
              updatedPlayer.morale = 'Poor';
            }
          }
        }

        // Update injury risk
        updatedPlayer.injuryRisk = Math.min(100, (player.injuryRisk || 0) + totalInjuryRisk * 100);

        // Handle injury
        if (hasInjury) {
          updatedPlayer.availability = {
            status: 'Minor Injury',
            returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
          };
        }

        return updatedPlayer;
      });

      // Update all players via tacticsDispatch
      updatedPlayers.forEach(player => {
        tacticsDispatch({
          type: 'UPDATE_PLAYER',
          payload: player,
        });
      });

      // Calculate summary statistics
      const totalFatigue = scheduledDrills.reduce((sum, drill) => sum + drill.fatigueEffect, 0);
      const totalMorale = scheduledDrills.reduce((sum, drill) => sum + drill.moraleEffect, 0);
      const injuredPlayers = updatedPlayers.filter(
        p => p.availability.status === 'Minor Injury' || p.availability.status === 'Major Injury'
      );

      // Count attribute improvements
      const attributeImprovements = new Map<string, number>();
      scheduledDrills.forEach(drill => {
        drill.primaryAttributes.forEach(attr => {
          attributeImprovements.set(attr, (attributeImprovements.get(attr) || 0) + 1);
        });
      });

      const topImprovedAttributes = Array.from(attributeImprovements.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([attr]) => attr);

      // Show simulation results
      const resultMessage =
        `Training Simulation Complete for ${selectedDay}!\n\n` +
        `Drills Executed: ${scheduledDrills.length}\n` +
        `Players Trained: ${players.length}\n\n` +
        `Effects:\n` +
        `• Fatigue: +${totalFatigue.toFixed(1)} per player\n` +
        `• Morale: ${totalMorale > 0 ? '+' : ''}${totalMorale.toFixed(1)} per player\n` +
        `• Injuries: ${injuredPlayers.length} player(s)\n\n` +
        `Top Improved Attributes:\n` +
        topImprovedAttributes.map(attr => `• ${attr}`).join('\n') +
        `\n\nPlayer attributes have been updated!`;

      // eslint-disable-next-line no-console
      console.log('Training Simulation Results:', {
        day: selectedDay,
        drillsExecuted: scheduledDrills.map(d => d.name),
        playersTrained: players.length,
        totalFatigue,
        totalMorale,
        injuries: injuredPlayers.length,
        topImprovedAttributes,
      });

      window.alert(resultMessage);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Training simulation failed:', error);
      window.alert('Failed to simulate training. Please try again.');
    }
  };

  const handleGeneratePlayerPlan = (player: unknown) => {
    try {
      // Type guard and validation
      if (!player || typeof player !== 'object') {
        window.alert('Invalid player selected.');
        return;
      }

      const typedPlayer = player as {
        id: string;
        name: string;
        age: number;
        pace?: number;
        shooting?: number;
        passing?: number;
        dribbling?: number;
        defending?: number;
        physical?: number;
        potential: readonly [number, number];
        currentPotential: number;
        position?: { x: number; y: number };
        positionRole?: string;
      };

      if (!typedPlayer.name || !typedPlayer.id) {
        window.alert('Player data is incomplete.');
        return;
      }

      // Analyze player attributes
      const attributes = {
        pace: typedPlayer.pace ?? 70,
        shooting: typedPlayer.shooting ?? 70,
        passing: typedPlayer.passing ?? 70,
        dribbling: typedPlayer.dribbling ?? 70,
        defending: typedPlayer.defending ?? 70,
        physical: typedPlayer.physical ?? 70,
      };

      // Calculate overall rating
      const overallRating = Math.round(
        Object.values(attributes).reduce((sum, val) => sum + val, 0) / 6
      );

      // Identify weaknesses (attributes below overall rating)
      const weaknesses: Array<{ attribute: string; value: number; gap: number }> = [];
      Object.entries(attributes).forEach(([attr, value]) => {
        if (value < overallRating) {
          weaknesses.push({
            attribute: attr,
            value,
            gap: overallRating - value,
          });
        }
      });

      // Sort weaknesses by gap (largest first)
      weaknesses.sort((a, b) => b.gap - a.gap);

      // Identify strengths (attributes at or above overall rating)
      const strengths: Array<{ attribute: string; value: number }> = [];
      Object.entries(attributes).forEach(([attr, value]) => {
        if (value >= overallRating) {
          strengths.push({ attribute: attr, value });
        }
      });
      strengths.sort((a, b) => b.value - a.value);

      // Calculate potential growth
      const [minPotential, maxPotential] = typedPlayer.potential;
      const currentPotential = typedPlayer.currentPotential;
      const potentialGrowth = maxPotential - overallRating;
      const ageBasedGrowth =
        typedPlayer.age < 24 ? 'High' : typedPlayer.age < 28 ? 'Medium' : 'Low';

      // Determine primary focus area based on position and weaknesses
      let primaryFocus = 'Technical Development';
      if (typedPlayer.positionRole) {
        const role = typedPlayer.positionRole.toUpperCase();
        if (role.includes('GK')) {
          primaryFocus = 'Goalkeeping Excellence';
        } else if (
          role.includes('CB') ||
          role.includes('LB') ||
          role.includes('RB') ||
          role.includes('WB')
        ) {
          primaryFocus = 'Defensive Fundamentals';
        } else if (role.includes('CM') || role.includes('CDM') || role.includes('CAM')) {
          primaryFocus = 'Midfield Mastery';
        } else if (
          role.includes('ST') ||
          role.includes('CF') ||
          role.includes('LW') ||
          role.includes('RW')
        ) {
          primaryFocus = 'Attacking Prowess';
        }
      }

      // Generate 12-week development roadmap
      const roadmap: Array<{
        week: number;
        focus: string;
        drills: string[];
        expectedGain: string;
      }> = [];

      // Week 1-3: Foundation building - focus on biggest weakness
      const primaryWeakness = weaknesses[0]?.attribute || 'physical';
      roadmap.push(
        {
          week: 1,
          focus: `${primaryWeakness.charAt(0).toUpperCase() + primaryWeakness.slice(1)} Foundation`,
          drills: [
            `Basic ${primaryWeakness} drills`,
            'Low-intensity conditioning',
            'Technique refinement',
          ],
          expectedGain: '+0.5-1.0',
        },
        {
          week: 2,
          focus: `${primaryWeakness.charAt(0).toUpperCase() + primaryWeakness.slice(1)} Progression`,
          drills: [
            `Advanced ${primaryWeakness} drills`,
            'Medium-intensity training',
            'Position-specific work',
          ],
          expectedGain: '+0.5-1.0',
        },
        {
          week: 3,
          focus: `${primaryWeakness.charAt(0).toUpperCase() + primaryWeakness.slice(1)} Consolidation`,
          drills: [
            `Match-realistic ${primaryWeakness}`,
            'High-intensity sessions',
            'Game situation practice',
          ],
          expectedGain: '+0.3-0.8',
        }
      );

      // Week 4-6: Secondary weakness improvement
      const secondaryWeakness = weaknesses[1]?.attribute || 'passing';
      roadmap.push(
        {
          week: 4,
          focus: `${secondaryWeakness.charAt(0).toUpperCase() + secondaryWeakness.slice(1)} Development`,
          drills: [`${secondaryWeakness} basics`, 'Combination drills', 'Small-sided games'],
          expectedGain: '+0.5-1.0',
        },
        {
          week: 5,
          focus: `${secondaryWeakness.charAt(0).toUpperCase() + secondaryWeakness.slice(1)} Enhancement`,
          drills: [
            `Complex ${secondaryWeakness} scenarios`,
            'Pressure training',
            'Decision-making drills',
          ],
          expectedGain: '+0.5-1.0',
        },
        {
          week: 6,
          focus: 'Dual Attribute Integration',
          drills: [
            `Combined ${primaryWeakness} + ${secondaryWeakness}`,
            'Tactical exercises',
            'Match simulation',
          ],
          expectedGain: '+0.3-0.8',
        }
      );

      // Week 7-9: Strength maintenance and tactical awareness
      const primaryStrength = strengths[0]?.attribute || 'dribbling';
      roadmap.push(
        {
          week: 7,
          focus: `${primaryStrength.charAt(0).toUpperCase() + primaryStrength.slice(1)} Maintenance`,
          drills: [
            `${primaryStrength} skill refinement`,
            'Tactical positioning',
            'Set piece practice',
          ],
          expectedGain: '+0.2-0.5',
        },
        {
          week: 8,
          focus: 'Tactical Intelligence',
          drills: [
            'Video analysis',
            'Team shape drills',
            'Opposition study',
            'Pattern recognition',
          ],
          expectedGain: '+0.3-0.6',
        },
        {
          week: 9,
          focus: 'Mental Resilience',
          drills: [
            'Pressure situations',
            'Clutch moment training',
            'Confidence building',
            'Leadership',
          ],
          expectedGain: '+0.2-0.5',
        }
      );

      // Week 10-12: Integration and match preparation
      roadmap.push(
        {
          week: 10,
          focus: 'Full Integration',
          drills: [
            'Complete attribute blend',
            'Match-day intensity',
            'Position mastery',
            'Team cohesion',
          ],
          expectedGain: '+0.3-0.7',
        },
        {
          week: 11,
          focus: 'Performance Peak',
          drills: ['High-pressure scenarios', 'Competitive drills', 'Personal target achievement'],
          expectedGain: '+0.2-0.6',
        },
        {
          week: 12,
          focus: 'Assessment & Refinement',
          drills: [
            'Skills evaluation',
            'Progress review',
            'Future goal setting',
            'Maintenance plan',
          ],
          expectedGain: '+0.1-0.3',
        }
      );

      // Calculate total expected improvement
      const totalExpectedGain =
        weaknesses.length > 0
          ? `+${(weaknesses.length * 2).toFixed(1)}-${(weaknesses.length * 4).toFixed(1)} overall`
          : '+2.0-4.0 overall';

      // Production: Optionally enhance with AI-powered analysis
      // Integration example with OpenAI/Claude API:
      // import OpenAI from 'openai';
      // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // const aiResponse = await openai.chat.completions.create({
      //   model: 'gpt-4',
      //   messages: [{
      //     role: 'system',
      //     content: 'You are a professional football coach analyzing player development.',
      //   }, {
      //     role: 'user',
      //     content: `Analyze development plan for ${typedPlayer.name} (${typedPlayer.age}yo, ${typedPlayer.positionRole}). Current rating: ${overallRating}/99, Potential: ${minPotential}-${maxPotential}. Weaknesses: ${weaknesses.map(w => w.attribute).join(', ')}`,
      //   }],
      // });
      // const aiInsights = aiResponse.choices[0].message.content;
      // console.log('AI Development Insights:', aiInsights);

      // Generate comprehensive development plan summary
      const planSummary = `
🎯 12-WEEK DEVELOPMENT PLAN FOR ${typedPlayer.name.toUpperCase()}

📊 CURRENT PROFILE:
• Overall Rating: ${overallRating}/99
• Age: ${typedPlayer.age} years old
• Position: ${typedPlayer.positionRole || 'Unknown'}
• Potential: ${minPotential}-${maxPotential} (Current: ${currentPotential})
• Growth Trajectory: ${ageBasedGrowth}

💪 STRENGTHS (Top 3):
${strengths
  .slice(0, 3)
  .map(
    (s, i) =>
      `${i + 1}. ${s.attribute.charAt(0).toUpperCase() + s.attribute.slice(1)}: ${s.value}/99`
  )
  .join('\n')}

⚠️ AREAS FOR IMPROVEMENT (Top 3):
${
  weaknesses
    .slice(0, 3)
    .map(
      (w, i) =>
        `${i + 1}. ${w.attribute.charAt(0).toUpperCase() + w.attribute.slice(1)}: ${w.value}/99 (Gap: -${w.gap})`
    )
    .join('\n') || 'No significant weaknesses identified'
}

📅 12-WEEK ROADMAP:

PHASE 1: Foundation (Weeks 1-3)
Focus: ${roadmap[0].focus} - ${roadmap[2].focus}
Expected Gain: +1.3-2.8 combined

PHASE 2: Development (Weeks 4-6)
Focus: ${roadmap[3].focus} - ${roadmap[5].focus}
Expected Gain: +1.3-2.8 combined

PHASE 3: Refinement (Weeks 7-9)
Focus: ${roadmap[6].focus} - ${roadmap[8].focus}
Expected Gain: +0.7-1.6 combined

PHASE 4: Integration (Weeks 10-12)
Focus: ${roadmap[9].focus} - ${roadmap[11].focus}
Expected Gain: +0.6-1.6 combined

🎯 TOTAL EXPECTED IMPROVEMENT: ${totalExpectedGain}

🔑 PRIMARY DEVELOPMENT FOCUS:
${primaryFocus}

💡 COACHING RECOMMENDATIONS:
• Prioritize ${primaryWeakness} drills in morning sessions
• Maintain ${primaryStrength} excellence through regular practice
• Monitor fatigue levels closely during high-intensity weeks
• Schedule rest days after weeks 3, 6, 9, and 12
• Track progress weekly and adjust plan as needed

📈 SUCCESS METRICS:
• Week 4 checkpoint: +1.5 improvement minimum
• Week 8 checkpoint: +3.0 improvement minimum
• Week 12 target: ${overallRating + 4}+ overall rating

✨ This personalized plan has been generated based on ${typedPlayer.name}'s current attributes, age, position, and potential. Execute drills consistently and track progress for optimal results!
      `.trim();

      // Log detailed roadmap for development tracking
      // eslint-disable-next-line no-console
      console.log('Generated Development Roadmap:', {
        player: typedPlayer.name,
        currentRating: overallRating,
        targetRating: overallRating + 4,
        roadmap,
        weaknesses,
        strengths,
        potentialGrowth,
      });

      // Display plan to user
      window.alert(planSummary);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Player plan generation failed:', error);
      window.alert('Failed to generate player development plan. Please try again.');
    }
  };

  const handleSetDayAsRest = () => {
    dispatch({
      type: 'SET_DAY_AS_REST',
      payload: { team: selectedTeam, day: selectedDay },
    });
  };

  const handleSetDayAsTraining = () => {
    dispatch({
      type: 'SET_DAY_AS_TRAINING',
      payload: { team: selectedTeam, day: selectedDay },
    });
  };

  const handleSetSessionDrill = (
    session: 'morning' | 'afternoon',
    sessionPart: 'warmup' | 'main' | 'cooldown',
    drillId: string | null
  ) => {
    dispatch({
      type: 'SET_SESSION_DRILL',
      payload: { team: selectedTeam, day: selectedDay, session, sessionPart, drillId },
    });
  };

  const handleSaveTemplate = () => {
    if (newTemplateName.trim()) {
      dispatch({
        type: 'SAVE_TRAINING_TEMPLATE',
        payload: { team: selectedTeam, name: newTemplateName.trim() },
      });
      setNewTemplateName('');
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    dispatch({
      type: 'LOAD_TRAINING_TEMPLATE',
      payload: { team: selectedTeam, templateId },
    });
  };

  return (
    <ResponsivePage title="Training Center" maxWidth="full">
      <div className="space-y-6">
        {/* Team Selector */}
        <div className="bg-gray-800 rounded-lg p-1 inline-flex gap-1">
          <TouchButton
            onClick={() => setSelectedTeam('home')}
            variant={selectedTeam === 'home' ? 'primary' : 'secondary'}
            size="md"
          >
            Home Team
          </TouchButton>
          <TouchButton
            onClick={() => setSelectedTeam('away')}
            variant={selectedTeam === 'away' ? 'primary' : 'secondary'}
            size="md"
          >
            Away Team
          </TouchButton>
        </div>

        {/* Templates Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">Training Templates</h3>
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Template name..."
            />
            <button
              onClick={handleSaveTemplate}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Save Current Schedule
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(franchiseState.trainingPlanTemplates).map(([id, template]) => (
              <button
                key={id}
                onClick={() => handleLoadTemplate(id)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Day Selector */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-teal-400 mb-4">Training Days</h3>
            <ResponsiveGrid cols={{ mobile: 2, tablet: 1, desktop: 1 }} gap="sm">
              {days.map(({ key, label }) => (
                <TouchButton
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  variant={selectedDay === key ? 'primary' : 'secondary'}
                  size="md"
                  fullWidth
                  className={
                    schedule[key].isRestDay ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : ''
                  }
                >
                  <div className="flex justify-between items-center w-full">
                    <span>{label}</span>
                    {schedule[key].isRestDay && (
                      <span className="text-xs bg-red-600 px-2 py-1 rounded">REST</span>
                    )}
                  </div>
                </TouchButton>
              ))}
            </ResponsiveGrid>
          </div>

          {/* Training Schedule */}
          <div className="lg:col-span-3 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-teal-400">
                {days.find(d => d.key === selectedDay)?.label} Schedule
              </h3>
              <div className="flex flex-wrap gap-2">
                <TouchButton
                  onClick={handleOptimizeTraining}
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  AI Optimize
                </TouchButton>
                <TouchButton
                  onClick={handleSimulateTraining}
                  variant="primary"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Simulate
                </TouchButton>
                <TouchButton
                  onClick={handleSetDayAsTraining}
                  variant={!daySchedule.isRestDay ? 'primary' : 'secondary'}
                  size="sm"
                  className={!daySchedule.isRestDay ? 'bg-green-600' : ''}
                >
                  Training Day
                </TouchButton>
                <TouchButton
                  onClick={handleSetDayAsRest}
                  variant={daySchedule.isRestDay ? 'primary' : 'secondary'}
                  size="sm"
                  className={daySchedule.isRestDay ? 'bg-red-600' : ''}
                >
                  Rest Day
                </TouchButton>
              </div>
            </div>

            {daySchedule.isRestDay ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-red-400 mb-2">Rest Day</h4>
                <p className="text-gray-400">Players will recover stamina and reduce injury risk</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Morning Session */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-yellow-400 mb-3">Morning Session</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['warmup', 'main', 'cooldown'] as const).map(part => (
                      <div key={part} className="bg-gray-600 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                          {part}
                        </label>
                        <select
                          value={daySchedule.morning[part] || ''}
                          onChange={e =>
                            handleSetSessionDrill('morning', part, e.target.value || null)
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">No drill selected</option>
                          {Object.values(comprehensiveDrills)
                            .filter(
                              drill =>
                                (part === 'warmup' && drill.category === 'warmup') ||
                                (part === 'cooldown' && drill.category === 'cooldown') ||
                                (part === 'main' &&
                                  !['warmup', 'cooldown'].includes(drill.category))
                            )
                            .map(drill => (
                              <option key={drill.id} value={drill.id}>
                                {drill.name} ({drill.intensity})
                              </option>
                            ))}
                        </select>
                        {daySchedule.morning[part] &&
                          comprehensiveDrills[daySchedule.morning[part]!] && (
                            <div className="text-xs text-gray-400 mt-1">
                              <p>{comprehensiveDrills[daySchedule.morning[part]!].description}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="bg-blue-600/20 text-blue-400 px-1 rounded">
                                  Fatigue: +
                                  {comprehensiveDrills[daySchedule.morning[part]!].fatigueEffect}
                                </span>
                                <span className="bg-green-600/20 text-green-400 px-1 rounded">
                                  Morale:{' '}
                                  {comprehensiveDrills[daySchedule.morning[part]!].moraleEffect > 0
                                    ? '+'
                                    : ''}
                                  {comprehensiveDrills[daySchedule.morning[part]!].moraleEffect}
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Afternoon Session */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-orange-400 mb-3">Afternoon Session</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['warmup', 'main', 'cooldown'] as const).map(part => (
                      <div key={part} className="bg-gray-600 rounded-lg p-3">
                        <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                          {part}
                        </label>
                        <select
                          value={daySchedule.afternoon[part] || ''}
                          onChange={e =>
                            handleSetSessionDrill('afternoon', part, e.target.value || null)
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">No drill selected</option>
                          {Object.values(comprehensiveDrills)
                            .filter(
                              drill =>
                                (part === 'warmup' && drill.category === 'warmup') ||
                                (part === 'cooldown' && drill.category === 'cooldown') ||
                                (part === 'main' &&
                                  !['warmup', 'cooldown'].includes(drill.category))
                            )
                            .map(drill => (
                              <option key={drill.id} value={drill.id}>
                                {drill.name} ({drill.intensity})
                              </option>
                            ))}
                        </select>
                        {daySchedule.afternoon[part] &&
                          comprehensiveDrills[daySchedule.afternoon[part]!] && (
                            <div className="text-xs text-gray-400 mt-1">
                              <p>{comprehensiveDrills[daySchedule.afternoon[part]!].description}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="bg-blue-600/20 text-blue-400 px-1 rounded">
                                  Fatigue: +
                                  {comprehensiveDrills[daySchedule.afternoon[part]!].fatigueEffect}
                                </span>
                                <span className="bg-green-600/20 text-green-400 px-1 rounded">
                                  Morale:{' '}
                                  {comprehensiveDrills[daySchedule.afternoon[part]!].moraleEffect >
                                  0
                                    ? '+'
                                    : ''}
                                  {comprehensiveDrills[daySchedule.afternoon[part]!].moraleEffect}
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Development Progress */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-teal-400 mb-4">
            Player Development & Individual Training
          </h3>
          <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
            {players.slice(0, 9).map(player => (
              <ResponsiveCard
                key={player.id}
                padding="md"
                className="bg-gray-700 hover:bg-gray-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium">{player.name}</h4>
                    <p className="text-sm text-gray-400">
                      Age {player.age} • #{player.jerseyNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-teal-400">
                      Potential: {player.currentPotential}
                    </span>
                    <br />
                    <span
                      className={`text-xs ${
                        player.stamina >= 80
                          ? 'text-green-400'
                          : player.stamina >= 60
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      Stamina: {player.stamina}%
                    </span>
                  </div>
                </div>

                {/* Training Focus Areas */}
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-2">Focus Areas:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(player.attributes)
                      .sort(([, a], [, b]) => a - b)
                      .slice(0, 2)
                      .map(([attr]) => (
                        <span
                          key={attr}
                          className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded"
                        >
                          {attr}
                        </span>
                      ))}
                    {Object.entries(player.attributes)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 1)
                      .map(([attr]) => (
                        <span
                          key={attr}
                          className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded"
                        >
                          {attr}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Development Progress */}
                <div className="space-y-2 mb-3">
                  {Object.entries(player.attributeDevelopmentProgress)
                    .slice(0, 3)
                    .map(([attr, progress]) => (
                      <div key={attr} className="flex justify-between items-center">
                        <span className="text-sm text-gray-300 capitalize">{attr}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress >= 80
                                  ? 'bg-green-400'
                                  : progress >= 50
                                    ? 'bg-yellow-400'
                                    : 'bg-teal-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400 w-8">{progress}%</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Individual Training Actions */}
                <div className="flex gap-2">
                  <TouchButton
                    onClick={() => handleGeneratePlayerPlan(player)}
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs"
                  >
                    AI Plan
                  </TouchButton>
                  <TouchButton variant="primary" size="sm" className="flex-1 text-xs">
                    View Profile
                  </TouchButton>
                </div>

                {/* Fatigue & Injury Risk Indicators */}
                <div className="mt-2 flex justify-between text-xs">
                  <span
                    className={`${
                      player.fatigue <= 20
                        ? 'text-green-400'
                        : player.fatigue <= 60
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    Fatigue: {player.fatigue}%
                  </span>
                  <span
                    className={`${
                      player.injuryRisk <= 20
                        ? 'text-green-400'
                        : player.injuryRisk <= 60
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    Risk: {Math.round(player.injuryRisk)}%
                  </span>
                </div>
              </ResponsiveCard>
            ))}
          </ResponsiveGrid>

          {/* Training Analysis Summary */}
          <div className="mt-6 bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Team Training Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {players.filter(p => p.stamina >= 80).length}
                </div>
                <div className="text-xs text-gray-400">High Fitness</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {players.filter(p => p.fatigue > 60).length}
                </div>
                <div className="text-xs text-gray-400">High Fatigue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {players.filter(p => p.injuryRisk > 60).length}
                </div>
                <div className="text-xs text-gray-400">Injury Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-400">
                  {Math.round(
                    players.reduce(
                      (sum, p) =>
                        sum +
                        Object.values(p.attributeDevelopmentProgress).reduce((a, b) => a + b, 0) /
                          Object.keys(p.attributeDevelopmentProgress).length,
                      0
                    ) / players.length
                  )}
                  %
                </div>
                <div className="text-xs text-gray-400">Avg Development</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsivePage>
  );
};

export default TrainingPage;
