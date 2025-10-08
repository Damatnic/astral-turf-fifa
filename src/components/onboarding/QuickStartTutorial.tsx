/**
 * Quick Start Tutorial
 * 
 * Interactive onboarding tutorial for new users
 * Shows key features and how to use the platform
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Check, Trophy,
  Target, Users, BarChart3, Settings, Sparkles
} from 'lucide-react';

interface QuickStartTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  userRole: 'coach' | 'player' | 'family';
}

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  image?: string;
}

const COACH_TUTORIAL: TutorialStep[] = [
  {
    title: 'Welcome, Coach!',
    description: 'Astral Turf is your complete tactical planning platform. Let me show you around.',
    icon: <Trophy className="w-12 h-12 text-yellow-400" />,
  },
  {
    title: 'Tactics Board',
    description: 'Create and manage your formations with our advanced drag-and-drop tactics board. Access 12+ professional formations.',
    icon: <Target className="w-12 h-12 text-blue-400" />,
    action: 'Navigate to Tactics',
  },
  {
    title: 'Formation Library',
    description: 'Browse 12 professional formations (4-4-2, 4-3-3, 4-2-3-1, etc.) with AI analysis showing strengths and weaknesses.',
    icon: <Sparkles className="w-12 h-12 text-purple-400" />,
    action: 'Tactics → Formation Library',
  },
  {
    title: 'Player Management',
    description: 'Manage your squad, create challenges, and track player development.',
    icon: <Users className="w-12 h-12 text-green-400" />,
    action: 'Squad Menu',
  },
  {
    title: 'Analytics',
    description: 'Access advanced analytics, performance metrics, and tactical insights.',
    icon: <BarChart3 className="w-12 h-12 text-cyan-400" />,
    action: 'Analytics Menu',
  },
  {
    title: 'You\'re Ready!',
    description: 'Start building your tactics and managing your team. Need help? Press ? for keyboard shortcuts.',
    icon: <Check className="w-12 h-12 text-green-400" />,
  },
];

const PLAYER_TUTORIAL: TutorialStep[] = [
  {
    title: 'Welcome, Player!',
    description: 'Track your development, complete challenges, and level up your player card!',
    icon: <Trophy className="w-12 h-12 text-yellow-400" />,
  },
  {
    title: 'Your Player Card',
    description: 'View your enhanced player card with 4 tabs: Overview, Statistics, Achievements, and Activity.',
    icon: <Target className="w-12 h-12 text-blue-400" />,
    action: 'My Profile → Player Card',
  },
  {
    title: 'Complete Challenges',
    description: 'Earn XP by completing challenges. Level up from 1 to 99 and progress through 5 ranks: Bronze → Silver → Gold → Diamond → Legend.',
    icon: <Sparkles className="w-12 h-12 text-purple-400" />,
    action: 'Challenges Menu',
  },
  {
    title: 'Unlock Achievements',
    description: 'Unlock 40+ achievements across 5 categories. Achievements unlock automatically as you progress!',
    icon: <Trophy className="w-12 h-12 text-yellow-400" />,
    action: 'Player Card → Achievements Tab',
  },
  {
    title: 'Build Your Streak',
    description: 'Complete challenges daily to build your streak. 30+ day streaks give you 2x XP multiplier!',
    icon: <BarChart3 className="w-12 h-12 text-orange-400" />,
  },
  {
    title: 'You\'re Ready!',
    description: 'Start completing challenges and leveling up! Check the leaderboard to see how you rank.',
    icon: <Check className="w-12 h-12 text-green-400" />,
  },
];

const FAMILY_TUTORIAL: TutorialStep[] = [
  {
    title: 'Welcome, Family Member!',
    description: 'Monitor your player\'s progress and development through Astral Turf.',
    icon: <Users className="w-12 h-12 text-blue-400" />,
  },
  {
    title: 'Player Profile',
    description: 'View your associated player\'s card, challenges, statistics, and achievements.',
    icon: <Target className="w-12 h-12 text-purple-400" />,
    action: 'My Profile',
  },
  {
    title: 'Track Progress',
    description: 'Monitor their XP, level, rank, and achievement unlocks in real-time.',
    icon: <BarChart3 className="w-12 h-12 text-green-400" />,
    action: 'Player Card → Statistics',
  },
  {
    title: 'View Rankings',
    description: 'See how your player ranks against teammates on the leaderboard.',
    icon: <Trophy className="w-12 h-12 text-yellow-400" />,
    action: 'Player Rankings',
  },
  {
    title: 'You\'re Ready!',
    description: 'You have view access to monitor your player\'s development and progress.',
    icon: <Check className="w-12 h-12 text-green-400" />,
  },
];

export const QuickStartTutorial: React.FC<QuickStartTutorialProps> = ({
  isOpen,
  onClose,
  onComplete,
  userRole
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorial = userRole === 'coach' ? COACH_TUTORIAL :
                   userRole === 'player' ? PLAYER_TUTORIAL :
                   FAMILY_TUTORIAL;

  const isLastStep = currentStep === tutorial.length - 1;
  const step = tutorial[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      onClose();
      // Mark tutorial as completed in localStorage
      localStorage.setItem('astralturf_tutorial_completed', 'true');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('astralturf_tutorial_completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Tutorial Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full border border-gray-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
            <div className="flex justify-center mb-4">
              {step.icon}
            </div>
            <h2 className="text-3xl font-black text-white mb-2">{step.title}</h2>
            <p className="text-white/80">{step.description}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {step.action && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-300 text-center">
                  📍 <span className="font-bold">{step.action}</span>
                </p>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {tutorial.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-8 bg-indigo-600'
                      : idx < currentStep
                      ? 'w-2 bg-indigo-400'
                      : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>

              <div className="flex items-center space-x-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all flex items-center space-x-2"
                >
                  <span>{isLastStep ? 'Get Started!' : 'Next'}</span>
                  {!isLastStep && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickStartTutorial;

/**
 * Hook to check if user should see tutorial
 */
export function useShouldShowTutorial(): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  React.useEffect(() => {
    const completed = localStorage.getItem('astralturf_tutorial_completed');
    setShouldShow(!completed);
  }, []);

  return shouldShow;
}

