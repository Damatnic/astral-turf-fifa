import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  Zap,
  Shield,
  Users,
  Brain,
  Clock,
  Star,
  Award,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  TrendingUp,
  ChevronRight,
  Medal,
  Flame,
  X,
  Calendar,
  Timer,
  Activity,
  Eye,
  Settings,
} from 'lucide-react';
import { type Player, type Formation } from '../../types';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'tactical' | 'formation' | 'skills' | 'teamwork' | 'strategy';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // in minutes
  objectives: ChallengeObjective[];
  rewards: ChallengeReward[];
  prerequisites: string[];
  isCompleted: boolean;
  bestScore?: number;
  attempts: number;
  unlocked: boolean;
  icon: any;
  color: string;
}

interface ChallengeObjective {
  id: string;
  description: string;
  type: 'formation_create' | 'player_positioning' | 'tactical_analysis' | 'time_limit' | 'accuracy';
  target: number;
  current: number;
  isCompleted: boolean;
}

interface ChallengeReward {
  type: 'xp' | 'badge' | 'formation_template' | 'skill_unlock';
  value: string | number;
  description: string;
}

interface ChallengeManagementProps {
  players: Player[];
  formations: Record<string, Formation>;
  completedChallenges: string[];
  onChallengeStart: (challengeId: string) => void;
  onChallengeComplete: (challengeId: string, score: number) => void;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

type ChallengeCategory = 'all' | 'tactical' | 'formation' | 'skills' | 'teamwork' | 'strategy';
type ChallengeDifficulty = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

const ChallengeManagement: React.FC<ChallengeManagementProps> = ({
  players,
  formations,
  completedChallenges,
  onChallengeStart,
  onChallengeComplete,
  className,
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChallengeDifficulty>('all');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeInProgress, setChallengeInProgress] = useState(false);
  const [currentObjectives, setCurrentObjectives] = useState<ChallengeObjective[]>([]);
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Pre-defined challenge database
  const allChallenges = useMemo((): Challenge[] => [
    {
      id: 'formation_master_442',
      title: 'Formation Master: 4-4-2',
      description: 'Master the classic 4-4-2 formation by creating a balanced setup',
      category: 'formation',
      difficulty: 'beginner',
      duration: 10,
      objectives: [
        {
          id: 'obj1',
          description: 'Create a 4-4-2 formation',
          type: 'formation_create',
          target: 1,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj2',
          description: 'Position all 11 players correctly',
          type: 'player_positioning',
          target: 11,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj3',
          description: 'Complete within 5 minutes',
          type: 'time_limit',
          target: 300,
          current: 0,
          isCompleted: false,
        },
      ],
      rewards: [
        { type: 'xp', value: 100, description: '+100 Tactical XP' },
        { type: 'badge', value: '4-4-2 Master', description: 'Formation Specialist Badge' },
      ],
      prerequisites: [],
      isCompleted: completedChallenges.includes('formation_master_442'),
      attempts: 0,
      unlocked: true,
      icon: Target,
      color: 'bg-blue-500',
    },
    {
      id: 'pressing_game',
      title: 'High-Intensity Pressing',
      description: 'Learn to coordinate team pressing and win possession quickly',
      category: 'tactical',
      difficulty: 'intermediate',
      duration: 15,
      objectives: [
        {
          id: 'obj1',
          description: 'Set up defensive press triggers',
          type: 'tactical_analysis',
          target: 3,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj2',
          description: 'Coordinate 6+ players in press',
          type: 'player_positioning',
          target: 6,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj3',
          description: 'Achieve 85% accuracy',
          type: 'accuracy',
          target: 85,
          current: 0,
          isCompleted: false,
        },
      ],
      rewards: [
        { type: 'xp', value: 200, description: '+200 Tactical XP' },
        { type: 'skill_unlock', value: 'pressing_specialist', description: 'Pressing Specialist Skill' },
      ],
      prerequisites: ['formation_master_442'],
      isCompleted: completedChallenges.includes('pressing_game'),
      attempts: 0,
      unlocked: completedChallenges.includes('formation_master_442'),
      icon: Zap,
      color: 'bg-yellow-500',
    },
    {
      id: 'defensive_masterclass',
      title: 'Defensive Masterclass',
      description: 'Build an impenetrable defense with proper positioning',
      category: 'strategy',
      difficulty: 'advanced',
      duration: 20,
      objectives: [
        {
          id: 'obj1',
          description: 'Create defensive line coordination',
          type: 'player_positioning',
          target: 4,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj2',
          description: 'Set up cover and support systems',
          type: 'tactical_analysis',
          target: 2,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj3',
          description: 'Complete without errors',
          type: 'accuracy',
          target: 100,
          current: 0,
          isCompleted: false,
        },
      ],
      rewards: [
        { type: 'xp', value: 300, description: '+300 Strategic XP' },
        { type: 'formation_template', value: 'defensive_masterclass_template', description: 'Defensive Template' },
        { type: 'badge', value: 'defensive_guru', description: 'Defensive Guru Badge' },
      ],
      prerequisites: ['pressing_game'],
      isCompleted: completedChallenges.includes('defensive_masterclass'),
      attempts: 0,
      unlocked: completedChallenges.includes('pressing_game'),
      icon: Shield,
      color: 'bg-green-500',
    },
    {
      id: 'team_chemistry',
      title: 'Perfect Team Chemistry',
      description: 'Create optimal player partnerships and synergies',
      category: 'teamwork',
      difficulty: 'intermediate',
      duration: 12,
      objectives: [
        {
          id: 'obj1',
          description: 'Form 3 strong partnerships',
          type: 'player_positioning',
          target: 3,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj2',
          description: 'Achieve 90%+ team chemistry',
          type: 'tactical_analysis',
          target: 90,
          current: 0,
          isCompleted: false,
        },
      ],
      rewards: [
        { type: 'xp', value: 150, description: '+150 Team XP' },
        { type: 'skill_unlock', value: 'chemistry_expert', description: 'Chemistry Expert Skill' },
      ],
      prerequisites: [],
      isCompleted: completedChallenges.includes('team_chemistry'),
      attempts: 0,
      unlocked: true,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      id: 'tactical_genius',
      title: 'Tactical Genius',
      description: 'Master advanced tactical concepts and formations',
      category: 'tactical',
      difficulty: 'expert',
      duration: 30,
      objectives: [
        {
          id: 'obj1',
          description: 'Create 3 different formations',
          type: 'formation_create',
          target: 3,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj2',
          description: 'Demonstrate tactical flexibility',
          type: 'tactical_analysis',
          target: 5,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj3',
          description: 'Perfect execution (100% accuracy)',
          type: 'accuracy',
          target: 100,
          current: 0,
          isCompleted: false,
        },
        {
          id: 'obj4',
          description: 'Complete under time pressure',
          type: 'time_limit',
          target: 1800,
          current: 0,
          isCompleted: false,
        },
      ],
      rewards: [
        { type: 'xp', value: 500, description: '+500 Master XP' },
        { type: 'badge', value: 'tactical_genius', description: 'Tactical Genius Badge' },
        { type: 'formation_template', value: 'genius_formations_pack', description: 'Genius Formations Pack' },
      ],
      prerequisites: ['defensive_masterclass', 'team_chemistry'],
      isCompleted: completedChallenges.includes('tactical_genius'),
      attempts: 0,
      unlocked: completedChallenges.includes('defensive_masterclass') && completedChallenges.includes('team_chemistry'),
      icon: Brain,
      color: 'bg-red-500',
    },
  ], [completedChallenges]);

  // Filter challenges based on selections
  const filteredChallenges = useMemo(() => {
    return allChallenges.filter(challenge => {
      const categoryMatch = selectedCategory === 'all' || challenge.category === selectedCategory;
      const difficultyMatch = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty;
      return categoryMatch && difficultyMatch;
    });
  }, [allChallenges, selectedCategory, selectedDifficulty]);

  // Group challenges by status
  const groupedChallenges = useMemo(() => {
    const groups = {
      available: filteredChallenges.filter(c => c.unlocked && !c.isCompleted),
      completed: filteredChallenges.filter(c => c.isCompleted),
      locked: filteredChallenges.filter(c => !c.unlocked),
    };
    return groups;
  }, [filteredChallenges]);

  const startChallenge = useCallback((challenge: Challenge) => {
    setActiveChallenge(challenge);
    setCurrentObjectives(challenge.objectives.map(obj => ({ ...obj })));
    setChallengeInProgress(true);
    setChallengeTimer(challenge.duration * 60); // Convert to seconds
    onChallengeStart(challenge.id);
  }, [onChallengeStart]);

  const completeChallenge = useCallback((score: number) => {
    if (activeChallenge) {
      onChallengeComplete(activeChallenge.id, score);
      setChallengeInProgress(false);
      setActiveChallenge(null);
      setCurrentObjectives([]);
    }
  }, [activeChallenge, onChallengeComplete]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-900/30';
      case 'intermediate': return 'text-yellow-400 bg-yellow-900/30';
      case 'advanced': return 'text-orange-400 bg-orange-900/30';
      case 'expert': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getDifficultyStars = (difficulty: string) => {
    const stars = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };
    return stars[difficulty as keyof typeof stars] || 1;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`
          bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl
          w-full max-w-7xl h-[85vh] flex flex-col shadow-2xl
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Challenge Management</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Medal className="w-4 h-4" />
                  {groupedChallenges.completed.length} completed
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {groupedChallenges.available.length} available
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Filter Challenges</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All', icon: Activity },
                  { id: 'tactical', label: 'Tactical', icon: Brain },
                  { id: 'formation', label: 'Formation', icon: Target },
                  { id: 'skills', label: 'Skills', icon: Zap },
                  { id: 'teamwork', label: 'Teamwork', icon: Users },
                  { id: 'strategy', label: 'Strategy', icon: Shield },
                ].map(category => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as ChallengeCategory)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${selectedCategory === category.id
                          ? 'bg-blue-600/80 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50'
                        }
                      `}
                    >
                      <IconComponent className="w-4 h-4" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Levels' },
                  { id: 'beginner', label: 'Beginner' },
                  { id: 'intermediate', label: 'Intermediate' },
                  { id: 'advanced', label: 'Advanced' },
                  { id: 'expert', label: 'Expert' },
                ].map(difficulty => (
                  <button
                    key={difficulty.id}
                    onClick={() => setSelectedDifficulty(difficulty.id as ChallengeDifficulty)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedDifficulty === difficulty.id
                        ? 'bg-blue-600/80 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50'
                      }
                    `}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Lists */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Available Challenges */}
            {groupedChallenges.available.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Available Challenges ({groupedChallenges.available.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupedChallenges.available.map(challenge => {
                    const IconComponent = challenge.icon;
                    return (
                      <motion.div
                        key={challenge.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-slate-800/40 border border-slate-600/50 rounded-xl p-5 hover:border-slate-500/60 transition-all cursor-pointer group"
                        onClick={() => startChallenge(challenge)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 ${challenge.color} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex">
                            {Array.from({ length: getDifficultyStars(challenge.difficulty) }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>

                        <h4 className="font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                          {challenge.title}
                        </h4>
                        
                        <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                          {challenge.description}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                            {challenge.difficulty.toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {challenge.duration}m
                          </div>
                        </div>

                        <div className="space-y-1 mb-4">
                          {challenge.objectives.slice(0, 2).map(objective => (
                            <div key={objective.id} className="text-xs text-slate-400">
                              • {objective.description}
                            </div>
                          ))}
                          {challenge.objectives.length > 2 && (
                            <div className="text-xs text-slate-400">
                              +{challenge.objectives.length - 2} more objectives
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <Award className="w-3 h-3" />
                            {challenge.rewards.length} rewards
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Challenges */}
            {groupedChallenges.completed.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Completed Challenges ({groupedChallenges.completed.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupedChallenges.completed.map(challenge => {
                    const IconComponent = challenge.icon;
                    return (
                      <div
                        key={challenge.id}
                        className="bg-slate-800/20 border border-green-500/30 rounded-xl p-5 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/20 rounded-full -mr-8 -mt-8" />
                        <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-green-400" />

                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-10 h-10 ${challenge.color} rounded-lg flex items-center justify-center opacity-80`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{challenge.title}</h4>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-green-400">✓ Completed</span>
                              {challenge.bestScore && (
                                <span className="text-slate-400">Score: {challenge.bestScore}%</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 mb-3">
                          Attempts: {challenge.attempts}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {challenge.rewards.map((reward, index) => (
                            <span
                              key={index}
                              className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded"
                            >
                              {reward.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Locked Challenges */}
            {groupedChallenges.locked.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-slate-400" />
                  Locked Challenges ({groupedChallenges.locked.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupedChallenges.locked.map(challenge => {
                    const IconComponent = challenge.icon;
                    return (
                      <div
                        key={challenge.id}
                        className="bg-slate-800/20 border border-slate-600/30 rounded-xl p-5 opacity-60 relative"
                      >
                        <div className="absolute inset-0 bg-black/20 rounded-xl" />
                        
                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="text-slate-400">🔒</div>
                          </div>

                          <h4 className="font-semibold text-slate-300 mb-2">{challenge.title}</h4>
                          
                          <div className="text-xs text-slate-400 mb-3">
                            Prerequisites: {challenge.prerequisites.join(', ') || 'None'}
                          </div>

                          <div className="text-xs text-slate-500">
                            Complete required challenges to unlock
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Challenges Message */}
            {filteredChallenges.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No challenges found</h3>
                <p className="text-sm text-slate-400">Try adjusting your filters to see more challenges.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { ChallengeManagement };
export default ChallengeManagement;