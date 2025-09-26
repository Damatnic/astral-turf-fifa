// Challenge Service - Manages all challenge-related operations

import type {
  Challenge,
  ChallengeProgress,
  ChallengeFilters,
  ChallengeTemplate,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeStatus,
  EvidenceSubmission,
  TeamChallenge,
  ChallengeRequirement,
  ChallengeReward,
} from '../types/challenges';

class ChallengeService {
  private challenges: Map<string, Challenge> = new Map();
  private progress: Map<string, ChallengeProgress[]> = new Map();
  private templates: ChallengeTemplate[] = [];
  private activeTimers: Map<string, unknown> = new Map();

  constructor() {
    this.initializeDefaultChallenges();
    this.initializeTemplates();
    this.loadFromStorage();
  }

  // Initialize default system challenges
  private initializeDefaultChallenges() {
    const defaultChallenges: Challenge[] = [
      // Daily Challenges
      {
        id: 'daily-fitness-run',
        title: '5K Morning Run',
        description: 'Complete a 5-kilometer run to boost your stamina',
        category: 'fitness',
        difficulty: 'easy',
        frequency: 'daily',
        requirements: [
          {
            id: 'run-distance',
            type: 'metric',
            metric: 'distance',
            target: 5,
            unit: 'km',
            description: 'Run 5 kilometers',
            trackingMethod: 'manual',
          },
        ],
        rewards: [
          {
            type: 'xp',
            value: 100,
            description: '100 XP',
          },
        ],
        xpReward: 100,
        timeLimit: 24,
        createdBy: 'system',
        evidenceRequired: true,
        tags: ['cardio', 'endurance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'daily-technical-juggling',
        title: 'Ball Mastery',
        description: 'Practice juggling for 15 minutes',
        category: 'technical',
        difficulty: 'easy',
        frequency: 'daily',
        requirements: [
          {
            id: 'juggling-time',
            type: 'activity',
            target: 15,
            unit: 'minutes',
            description: 'Juggle for 15 minutes',
            trackingMethod: 'manual',
          },
        ],
        rewards: [
          {
            type: 'xp',
            value: 75,
            description: '75 XP',
          },
        ],
        xpReward: 75,
        timeLimit: 24,
        createdBy: 'system',
        tags: ['ball-control', 'technique'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },

      // Weekly Challenges
      {
        id: 'weekly-fitness-gym',
        title: 'Strength Building',
        description: 'Complete 3 gym sessions this week',
        category: 'fitness',
        difficulty: 'medium',
        frequency: 'weekly',
        requirements: [
          {
            id: 'gym-sessions',
            type: 'activity',
            target: 3,
            unit: 'sessions',
            description: 'Complete 3 gym sessions',
            trackingMethod: 'manual',
          },
        ],
        rewards: [
          {
            type: 'xp',
            value: 300,
            description: '300 XP',
          },
          {
            type: 'attribute_points',
            value: 1,
            description: '1 Attribute Point',
          },
        ],
        xpReward: 300,
        attributePointReward: 1,
        timeLimit: 168, // 7 days
        createdBy: 'system',
        tags: ['strength', 'power'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'weekly-tactical-study',
        title: 'Tactical Analysis',
        description: 'Study match footage and complete tactical quiz',
        category: 'tactical',
        difficulty: 'medium',
        frequency: 'weekly',
        requirements: [
          {
            id: 'video-study',
            type: 'activity',
            target: 2,
            unit: 'hours',
            description: 'Study match footage for 2 hours',
            trackingMethod: 'manual',
          },
          {
            id: 'quiz-score',
            type: 'performance',
            target: 80,
            unit: '%',
            description: 'Score 80% on tactical quiz',
            trackingMethod: 'automatic',
          },
        ],
        rewards: [
          {
            type: 'xp',
            value: 350,
            description: '350 XP',
          },
          {
            type: 'badge',
            value: 'tactical-genius',
            description: 'Tactical Genius Badge',
            rarity: 'uncommon',
          },
        ],
        xpReward: 350,
        badgeReward: 'tactical-genius',
        timeLimit: 168,
        createdBy: 'system',
        tags: ['tactics', 'intelligence'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },

      // Elite Challenges
      {
        id: 'elite-performance',
        title: 'Match Day Excellence',
        description: 'Achieve exceptional performance in official match',
        category: 'technical',
        difficulty: 'elite',
        frequency: 'special',
        requirements: [
          {
            id: 'match-rating',
            type: 'performance',
            target: 8.5,
            unit: 'rating',
            description: 'Achieve 8.5+ match rating',
            trackingMethod: 'automatic',
          },
          {
            id: 'key-passes',
            type: 'metric',
            metric: 'key_passes',
            target: 3,
            unit: 'passes',
            description: 'Make 3+ key passes',
            trackingMethod: 'automatic',
          },
        ],
        rewards: [
          {
            type: 'xp',
            value: 1000,
            description: '1000 XP',
          },
          {
            type: 'attribute_points',
            value: 3,
            description: '3 Attribute Points',
          },
          {
            type: 'badge',
            value: 'match-hero',
            description: 'Match Hero Badge',
            rarity: 'epic',
          },
        ],
        xpReward: 1000,
        attributePointReward: 3,
        badgeReward: 'match-hero',
        createdBy: 'system',
        tags: ['performance', 'excellence'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultChallenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge);
    });
  }

  // Initialize challenge templates for coaches
  private initializeTemplates() {
    this.templates = [
      {
        id: 'template-fitness-custom',
        name: 'Custom Fitness Challenge',
        description: 'Create a personalized fitness challenge',
        category: 'fitness',
        defaultRequirements: [
          {
            id: 'custom-metric',
            type: 'metric',
            target: 0,
            description: 'Set your target',
            trackingMethod: 'manual',
          },
        ],
        defaultRewards: [
          {
            type: 'xp',
            value: 200,
            description: 'Base XP reward',
          },
        ],
        customizable: true,
        popularityScore: 0,
        usageCount: 0,
      },
      {
        id: 'template-team-bonding',
        name: 'Team Bonding Activity',
        description: 'Create a team challenge to build chemistry',
        category: 'mental',
        defaultRequirements: [
          {
            id: 'team-activity',
            type: 'activity',
            target: 1,
            description: 'Complete team activity',
            trackingMethod: 'verified',
          },
        ],
        defaultRewards: [
          {
            type: 'xp',
            value: 150,
            description: 'XP for all participants',
          },
        ],
        customizable: true,
        popularityScore: 0,
        usageCount: 0,
      },
    ];
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      const savedChallenges = localStorage.getItem('astralTurf_challenges');
      const savedProgress = localStorage.getItem('astralTurf_challengeProgress');

      if (savedChallenges) {
        const parsed = JSON.parse(savedChallenges);
        Object.entries(parsed).forEach(([id, challenge]) => {
          this.challenges.set(id, challenge as Challenge);
        });
      }

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        Object.entries(parsed).forEach(([playerId, progress]) => {
          this.progress.set(playerId, progress as ChallengeProgress[]);
        });
      }
    } catch (_error) {
      console.error('Failed to load challenge data:', _error);
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      const challengesObj: Record<string, Challenge> = {};
      this.challenges.forEach((challenge, id) => {
        challengesObj[id] = challenge;
      });

      const progressObj: Record<string, ChallengeProgress[]> = {};
      this.progress.forEach((playerProgress, playerId) => {
        progressObj[playerId] = playerProgress;
      });

      localStorage.setItem('astralTurf_challenges', JSON.stringify(challengesObj));
      localStorage.setItem('astralTurf_challengeProgress', JSON.stringify(progressObj));
    } catch (_error) {
      console.error('Failed to save challenge data:', _error);
    }
  }

  // Get challenges with filters
  getChallenges(filters?: ChallengeFilters): Challenge[] {
    let filtered = Array.from(this.challenges.values());

    if (filters) {
      if (filters.categories?.length) {
        filtered = filtered.filter(c => filters.categories!.includes(c.category));
      }
      if (filters.difficulties?.length) {
        filtered = filtered.filter(c => filters.difficulties!.includes(c.difficulty));
      }
      if (filters.frequencies?.length) {
        filtered = filtered.filter(c => filters.frequencies!.includes(c.frequency));
      }
      if (filters.createdBy?.length) {
        filtered = filtered.filter(c => filters.createdBy!.includes(c.createdBy));
      }
      if (filters.teamChallenges !== undefined) {
        filtered = filtered.filter(c => c.teamChallenge === filters.teamChallenges);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          c =>
            c.title.toLowerCase().includes(searchLower) ||
            c.description.toLowerCase().includes(searchLower) ||
            c.tags?.some(tag => tag.toLowerCase().includes(searchLower)),
        );
      }

      // Sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            filtered.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
            break;
          case 'xp':
            filtered.sort((a, b) => b.xpReward - a.xpReward);
            break;
          case 'difficulty':
            const difficultyOrder = { easy: 1, medium: 2, hard: 3, elite: 4 };
            filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
            break;
          case 'expiring':
            filtered = filtered.filter(c => c.expiresAt);
            filtered.sort(
              (a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime(),
            );
            break;
        }
      }
    }

    return filtered;
  }

  // Get player's challenge progress
  getPlayerProgress(playerId: string): ChallengeProgress[] {
    return this.progress.get(playerId) || [];
  }

  // Get active challenges for a player
  getActiveChallenges(playerId: string): Challenge[] {
    const playerProgress = this.getPlayerProgress(playerId);
    const activeChallengeIds = playerProgress
      .filter(p => p.status === 'active')
      .map(p => p.challengeId);

    return activeChallengeIds.map(id => this.challenges.get(id)).filter(Boolean) as Challenge[];
  }

  // Get available challenges for a player
  getAvailableChallenges(playerId: string): Challenge[] {
    const playerProgress = this.getPlayerProgress(playerId);
    const completedIds = new Set(playerProgress.map(p => p.challengeId));

    return Array.from(this.challenges.values()).filter(challenge => {
      // Check if already completed
      if (completedIds.has(challenge.id)) {
        const progress = playerProgress.find(p => p.challengeId === challenge.id);
        if (progress?.status === 'completed' && !challenge.maxCompletions) {
          return false;
        }
      }

      // Check if targeted to specific players
      if (challenge.targetPlayers?.length && !challenge.targetPlayers.includes(playerId)) {
        return false;
      }

      // Check prerequisites
      if (challenge.prerequisiteChallengeIds?.length) {
        const hasPrereqs = challenge.prerequisiteChallengeIds.every(prereqId =>
          playerProgress.some(p => p.challengeId === prereqId && p.status === 'completed'),
        );
        if (!hasPrereqs) {
          return false;
        }
      }

      // Check availability dates
      const now = new Date();
      if (challenge.availableFrom && new Date(challenge.availableFrom) > now) {
        return false;
      }
      if (challenge.availableUntil && new Date(challenge.availableUntil) < now) {
        return false;
      }

      return true;
    });
  }

  // Start a challenge for a player
  startChallenge(playerId: string, challengeId: string): ChallengeProgress | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      return null;
    }

    const playerProgress = this.progress.get(playerId) || [];

    // Check if already active
    const existing = playerProgress.find(
      p => p.challengeId === challengeId && p.status === 'active',
    );
    if (existing) {
      return existing;
    }

    const newProgress: ChallengeProgress = {
      challengeId,
      playerId,
      status: 'active',
      startedAt: new Date().toISOString(),
      currentProgress: {},
      attempts: 1,
    };

    // Initialize progress tracking
    challenge.requirements.forEach(req => {
      newProgress.currentProgress[req.id] = 0;
    });

    playerProgress.push(newProgress);
    this.progress.set(playerId, playerProgress);

    // Set up expiration timer if needed
    if (challenge.timeLimit) {
      const timerId = setTimeout(
        () => {
          this.expireChallenge(playerId, challengeId);
        },
        challenge.timeLimit * 60 * 60 * 1000,
      );

      this.activeTimers.set(`${playerId}-${challengeId}`, timerId);
    }

    this.saveToStorage();
    return newProgress;
  }

  // Update challenge progress
  updateProgress(
    playerId: string,
    challengeId: string,
    requirementId: string,
    value: number,
  ): ChallengeProgress | null {
    const playerProgress = this.progress.get(playerId) || [];
    const progress = playerProgress.find(
      p => p.challengeId === challengeId && p.status === 'active',
    );

    if (!progress) {
      return null;
    }

    progress.currentProgress[requirementId] = value;

    // Check if challenge is complete
    const challenge = this.challenges.get(challengeId);
    if (challenge) {
      const isComplete = challenge.requirements.every(
        req => progress.currentProgress[req.id] >= req.target,
      );

      if (isComplete && challenge.autoValidate) {
        this.completeChallenge(playerId, challengeId);
      }
    }

    this.saveToStorage();
    return progress;
  }

  // Submit evidence for a challenge
  submitEvidence(
    playerId: string,
    challengeId: string,
    evidence: Omit<EvidenceSubmission, 'id' | 'submittedAt'>,
  ): boolean {
    const playerProgress = this.progress.get(playerId) || [];
    const progress = playerProgress.find(
      p => p.challengeId === challengeId && p.status === 'active',
    );

    if (!progress) {
      return false;
    }

    const submission: EvidenceSubmission = {
      ...evidence,
      id: `evidence-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      verificationStatus: 'pending',
    };

    if (!progress.evidenceSubmissions) {
      progress.evidenceSubmissions = [];
    }
    progress.evidenceSubmissions.push(submission);
    progress.approvalStatus = 'pending';

    this.saveToStorage();
    return true;
  }

  // Complete a challenge
  completeChallenge(playerId: string, challengeId: string): boolean {
    const playerProgress = this.progress.get(playerId) || [];
    const progress = playerProgress.find(
      p => p.challengeId === challengeId && p.status === 'active',
    );

    if (!progress) {
      return false;
    }

    progress.status = 'completed';
    progress.completedAt = new Date().toISOString();

    // Clear any active timers
    const timerId = this.activeTimers.get(`${playerId}-${challengeId}`);
    if (timerId) {
      clearTimeout(timerId);
      this.activeTimers.delete(`${playerId}-${challengeId}`);
    }

    this.saveToStorage();
    return true;
  }

  // Expire a challenge
  private expireChallenge(playerId: string, challengeId: string) {
    const playerProgress = this.progress.get(playerId) || [];
    const progress = playerProgress.find(
      p => p.challengeId === challengeId && p.status === 'active',
    );

    if (progress) {
      progress.status = 'expired';
      progress.failedAt = new Date().toISOString();
      this.saveToStorage();
    }

    this.activeTimers.delete(`${playerId}-${challengeId}`);
  }

  // Create custom challenge (for coaches)
  createCustomChallenge(challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>): Challenge {
    const newChallenge: Challenge = {
      ...challenge,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.challenges.set(newChallenge.id, newChallenge);
    this.saveToStorage();
    return newChallenge;
  }

  // Update challenge
  updateChallenge(challengeId: string, updates: Partial<Challenge>): Challenge | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      return null;
    }

    const updated = {
      ...challenge,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.challenges.set(challengeId, updated);
    this.saveToStorage();
    return updated;
  }

  // Delete challenge
  deleteChallenge(challengeId: string): boolean {
    const deleted = this.challenges.delete(challengeId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // Approve/Reject challenge completion
  reviewChallengeCompletion(
    playerId: string,
    challengeId: string,
    approved: boolean,
    reviewerId: string,
    notes?: string,
  ): boolean {
    const playerProgress = this.progress.get(playerId) || [];
    const progress = playerProgress.find(p => p.challengeId === challengeId);

    if (!progress || progress.approvalStatus !== 'pending') {
      return false;
    }

    progress.approvalStatus = approved ? 'approved' : 'rejected';
    progress.approvedBy = reviewerId;
    progress.approvalNotes = notes;

    if (approved) {
      progress.status = 'completed';
      progress.completedAt = new Date().toISOString();
    } else {
      progress.status = 'failed';
      progress.failedAt = new Date().toISOString();
    }

    this.saveToStorage();
    return true;
  }

  // Get challenge templates
  getTemplates(): ChallengeTemplate[] {
    return [...this.templates];
  }

  // Calculate XP with multipliers
  calculateXP(
    baseXP: number,
    difficulty: ChallengeDifficulty,
    streakDays: number,
    isTeamChallenge: boolean = false,
  ): number {
    let totalXP = baseXP;

    // Difficulty multiplier
    const difficultyMultipliers = {
      easy: 1,
      medium: 2,
      hard: 3,
      elite: 5,
    };
    totalXP *= difficultyMultipliers[difficulty];

    // Streak multiplier
    if (streakDays > 0) {
      const streakMultiplier = Math.min(1 + streakDays * 0.1, 2); // Max 2x for streaks
      totalXP *= streakMultiplier;
    }

    // Team challenge bonus
    if (isTeamChallenge) {
      totalXP *= 1.5;
    }

    return Math.round(totalXP);
  }

  // Generate daily challenges
  generateDailyChallenges(): Challenge[] {
    const dailyChallenges: Challenge[] = [];
    const categories: ChallengeCategory[] = ['fitness', 'technical', 'tactical', 'mental'];

    categories.forEach(category => {
      const challenge = this.generateRandomChallenge(category, 'easy', 'daily');
      dailyChallenges.push(challenge);
    });

    dailyChallenges.forEach(challenge => {
      this.challenges.set(challenge.id, challenge);
    });

    this.saveToStorage();
    return dailyChallenges;
  }

  // Generate random challenge
  private generateRandomChallenge(
    category: ChallengeCategory,
    difficulty: ChallengeDifficulty,
    frequency: 'daily' | 'weekly' | 'monthly',
  ): Challenge {
    const challengeData = {
      fitness: {
        titles: ['Morning Run', 'Gym Session', 'Sprint Training', 'Endurance Work'],
        descriptions: ['Build stamina', 'Increase strength', 'Improve speed', 'Boost endurance'],
      },
      technical: {
        titles: ['Ball Control', 'Passing Practice', 'Shooting Drills', 'First Touch'],
        descriptions: [
          'Master the ball',
          'Perfect your passing',
          'Improve accuracy',
          'Control improvement',
        ],
      },
      tactical: {
        titles: ['Video Analysis', 'Position Study', 'Formation Review', 'Tactical Quiz'],
        descriptions: [
          'Study gameplay',
          'Learn positioning',
          'Understand formations',
          'Test knowledge',
        ],
      },
      mental: {
        titles: ['Meditation', 'Team Building', 'Leadership Task', 'Visualization'],
        descriptions: [
          'Mental clarity',
          'Build chemistry',
          'Lead by example',
          'Mental preparation',
        ],
      },
    };

    const data = challengeData[category];
    const randomIndex = Math.floor(Math.random() * data.titles.length);

    return {
      id: `generated-${Date.now()}-${Math.random()}`,
      title: data.titles[randomIndex],
      description: data.descriptions[randomIndex],
      category,
      difficulty,
      frequency,
      requirements: [
        {
          id: 'req-1',
          type: 'activity',
          target: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
          unit: 'hours',
          description: 'Complete activity',
          trackingMethod: 'manual',
        },
      ],
      rewards: [
        {
          type: 'xp',
          value: difficulty === 'easy' ? 100 : difficulty === 'medium' ? 250 : 500,
          description: 'XP Reward',
        },
      ],
      xpReward: difficulty === 'easy' ? 100 : difficulty === 'medium' ? 250 : 500,
      timeLimit: frequency === 'daily' ? 24 : frequency === 'weekly' ? 168 : 720,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Clean up timers on service destruction
  cleanup() {
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeTimers.clear();
  }
}

// Export singleton instance
export const challengeService = new ChallengeService();
