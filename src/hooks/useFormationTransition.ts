/**
 * Formation Transition Hook
 * Manages smooth animated transitions between tactical formations
 * Uses Framer Motion spring physics and stagger effects for visual appeal
 */

import { useCallback, useRef, useState, useMemo } from 'react';
import type { Player } from '../types';

export interface TransitionConfig {
  /** Duration of the transition in milliseconds */
  duration?: number;
  /** Stagger delay between each player animation in milliseconds */
  staggerDelay?: number;
  /** Spring physics stiffness (higher = faster) */
  stiffness?: number;
  /** Spring physics damping (higher = less bouncy) */
  damping?: number;
  /** Enable visual effects during transition (trails, particles) */
  enableEffects?: boolean;
  /** Transition order: 'sequential', 'defenders-first', 'attackers-first', 'random' */
  order?: 'sequential' | 'defenders-first' | 'attackers-first' | 'random';
}

export interface PlayerTransition {
  playerId: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  delay: number;
  duration: number;
}

const DEFAULT_CONFIG: Required<TransitionConfig> = {
  duration: 1200,
  staggerDelay: 60,
  stiffness: 200,
  damping: 25,
  enableEffects: true,
  order: 'sequential',
};

/**
 * Calculate stagger delay based on player order
 */
const calculateStaggerDelay = (
  index: number,
  total: number,
  baseDelay: number,
  order: TransitionConfig['order']
): number => {
  switch (order) {
    case 'sequential':
      return index * baseDelay;

    case 'defenders-first':
      // Defenders (lower indices) animate first
      return index * baseDelay;

    case 'attackers-first':
      // Attackers (higher indices) animate first
      return (total - index - 1) * baseDelay;

    case 'random':
      // Add random variation to base delay
      return index * baseDelay + Math.random() * baseDelay * 0.5;

    default:
      return index * baseDelay;
  }
};

/**
 * Sort players by their position (defenders to attackers)
 */
const sortPlayersByPosition = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    // Sort by y position (lower y = more defensive)
    const posA = a.position?.y ?? 50;
    const posB = b.position?.y ?? 50;
    return posA - posB;
  });
};

export const useFormationTransition = (config: TransitionConfig = {}) => {
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTransitions, setActiveTransitions] = useState<Map<string, PlayerTransition>>(
    new Map()
  );
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Start a formation transition
   */
  const startTransition = useCallback(
    (
      players: Player[],
      newPositions: Map<string, { x: number; y: number }>,
      customConfig?: TransitionConfig
    ) => {
      const config = { ...mergedConfig, ...customConfig };

      // Sort players based on transition order
      let orderedPlayers = players;
      if (config.order === 'defenders-first' || config.order === 'attackers-first') {
        orderedPlayers = sortPlayersByPosition(players);
        if (config.order === 'attackers-first') {
          orderedPlayers = orderedPlayers.reverse();
        }
      } else if (config.order === 'random') {
        orderedPlayers = [...players].sort(() => Math.random() - 0.5);
      }

      // Create transition data for each player
      const transitions = new Map<string, PlayerTransition>();
      orderedPlayers.forEach((player, index) => {
        const newPos = newPositions.get(player.id);
        if (newPos && player.position) {
          const delay = calculateStaggerDelay(
            index,
            orderedPlayers.length,
            config.staggerDelay,
            config.order
          );

          transitions.set(player.id, {
            playerId: player.id,
            fromPosition: { ...player.position },
            toPosition: { ...newPos },
            delay,
            duration: config.duration,
          });
        }
      });

      setActiveTransitions(transitions);
      setIsTransitioning(true);

      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Calculate total transition time (longest delay + duration)
      const maxDelay = Math.max(...Array.from(transitions.values()).map(t => t.delay));
      const totalTime = maxDelay + config.duration;

      // Set timeout to clear transition state
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setActiveTransitions(new Map());
      }, totalTime + 100); // Add small buffer

      return transitions;
    },
    [mergedConfig]
  );

  /**
   * Cancel ongoing transition
   */
  const cancelTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    setIsTransitioning(false);
    setActiveTransitions(new Map());
  }, []);

  /**
   * Get transition config for a specific player
   */
  const getPlayerTransition = useCallback(
    (playerId: string): PlayerTransition | null => {
      return activeTransitions.get(playerId) ?? null;
    },
    [activeTransitions]
  );

  /**
   * Check if a specific player is transitioning
   */
  const isPlayerTransitioning = useCallback(
    (playerId: string): boolean => {
      return activeTransitions.has(playerId);
    },
    [activeTransitions]
  );

  return {
    isTransitioning,
    activeTransitions,
    startTransition,
    cancelTransition,
    getPlayerTransition,
    isPlayerTransitioning,
    config: mergedConfig,
  };
};

export default useFormationTransition;
