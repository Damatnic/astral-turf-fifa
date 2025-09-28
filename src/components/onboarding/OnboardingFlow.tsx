/**
 * Progressive Onboarding Flow Component
 * 
 * Provides step-by-step guided introduction to Astral Turf features,
 * adapting to user progress and preferences with accessibility support.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle, 
  Circle,
  Play,
  Users,
  Target,
  BarChart3,
  Zap,
  Trophy,
  Settings,
  Book,
  Lightbulb,
  Rocket,
  Star,
  ArrowRight,
  Eye,
  Hand,
  Mouse,
  Keyboard,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuthContext, useUIContext } from '../../hooks';
import { useTheme, useAccessibility } from '../../context/ThemeContext';
import { Button } from '../ui/modern/Button';
import { Card } from '../ui/modern/Card';
import { Progress } from '../ui/modern/Progress';
import { Switch } from '../ui/modern/Switch';
import { Badge } from '../ui/modern/Badge';

// Onboarding Types
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  duration: number; // estimated completion time in seconds
  category: 'welcome' | 'basics' | 'features' | 'advanced' | 'completion';
  interactive: boolean;
  skippable: boolean;
  prerequisites: string[];
  achievements: string[];
  helpTopics: string[];
}

interface UserProgress {
  completedSteps: string[];
  skippedSteps: string[];
  timeSpent: Record<string, number>;
  startedAt: string;
  lastActiveStep: string | null;
  preferences: {
    showAnimations: boolean;
    autoAdvance: boolean;
    voiceGuidance: boolean;
    showHints: boolean;
    pace: 'slow' | 'normal' | 'fast';
  };
}

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  userProgress: UserProgress;
  isCompleted: boolean;
  showWelcome: boolean;
  adaptiveMode: boolean;
}

// Onboarding Steps Configuration
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Astral Turf!',
    description: 'Your AI-powered soccer tactical planning companion',
    content: null, // Will be rendered as WelcomeStep component
    duration: 30,
    category: 'welcome',
    interactive: false,
    skippable: false,
    prerequisites: [],
    achievements: ['first_login'],
    helpTopics: ['getting-started-basics']
  },
  {
    id: 'interface-overview',
    title: 'Interface Overview',
    description: 'Get familiar with the main interface elements',
    content: null, // Will be rendered as InterfaceOverviewStep
    duration: 60,
    category: 'basics',
    interactive: true,
    skippable: true,
    prerequisites: ['welcome'],
    achievements: ['interface_explorer'],
    helpTopics: ['navigation', 'interface-basics']
  },
  {
    id: 'create-first-team',
    title: 'Create Your First Team',
    description: 'Add players and set up your squad',
    content: null,
    duration: 120,
    category: 'basics',
    interactive: true,
    skippable: false,
    prerequisites: ['interface-overview'],
    achievements: ['team_creator', 'first_player'],
    helpTopics: ['player-management-101', 'team-setup']
  },
  {
    id: 'tactical-board-intro',
    title: 'Tactical Board Basics',
    description: 'Learn to position players and create formations',
    content: null,
    duration: 180,
    category: 'features',
    interactive: true,
    skippable: false,
    prerequisites: ['create-first-team'],
    achievements: ['formation_master', 'tactical_awareness'],
    helpTopics: ['tactical-board-basics', 'formation-guide']
  },
  {
    id: 'ai-analysis-intro',
    title: 'AI Tactical Analysis',
    description: 'Discover how AI can improve your tactics',
    content: null,
    duration: 90,
    category: 'features',
    interactive: true,
    skippable: true,
    prerequisites: ['tactical-board-intro'],
    achievements: ['ai_student', 'insight_seeker'],
    helpTopics: ['ai-analysis-guide', 'tactical-insights']
  },
  {
    id: 'advanced-features',
    title: 'Advanced Features',
    description: 'Explore match simulation, analytics, and more',
    content: null,
    duration: 150,
    category: 'advanced',
    interactive: true,
    skippable: true,
    prerequisites: ['ai-analysis-intro'],
    achievements: ['feature_explorer', 'advanced_user'],
    helpTopics: ['match-simulation', 'analytics-dashboard', 'advanced-tactics']
  },
  {
    id: 'completion',
    title: 'You\'re Ready to Coach!',
    description: 'Congratulations on completing the onboarding',
    content: null,
    duration: 45,
    category: 'completion',
    interactive: false,
    skippable: false,
    prerequisites: ['advanced-features'],
    achievements: ['onboarding_complete', 'astral_turf_coach'],
    helpTopics: ['next-steps', 'resources']
  }
];

// Main Onboarding Flow Component
export const OnboardingFlow: React.FC = () => {
  const { user } = useAuthContext();
  const { theme, accessibility } = useTheme();
  const [state, setState] = useState<OnboardingState>({
    isActive: false,
    currentStep: 0,
    userProgress: {
      completedSteps: [],
      skippedSteps: [],
      timeSpent: {},
      startedAt: new Date().toISOString(),
      lastActiveStep: null,
      preferences: {
        showAnimations: !accessibility.reducedMotion,
        autoAdvance: false,
        voiceGuidance: false,
        showHints: true,
        pace: 'normal'
      }
    },
    isCompleted: false,
    showWelcome: true,
    adaptiveMode: true
  });

  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  // Check if user should see onboarding
  useEffect(() => {
    const shouldShowOnboarding = !user?.hasCompletedOnboarding && 
                                 !localStorage.getItem('onboarding-completed');
    
    if (shouldShowOnboarding) {
      setState(prev => ({ ...prev, isActive: true }));
    }
  }, [user]);

  // Current step information
  const currentStepData = useMemo(() => {
    return ONBOARDING_STEPS[state.currentStep] || null;
  }, [state.currentStep]);

  // Progress calculation
  const progress = useMemo(() => {
    const totalSteps = ONBOARDING_STEPS.length;
    const completed = state.userProgress.completedSteps.length;
    return Math.round((completed / totalSteps) * 100);
  }, [state.userProgress.completedSteps]);

  // Adaptive recommendations
  const adaptiveRecommendations = useMemo(() => {
    const timeSpent = Object.values(state.userProgress.timeSpent);
    const avgTime = timeSpent.reduce((sum, time) => sum + time, 0) / timeSpent.length;
    
    const recommendations = [];
    
    if (avgTime > 120) {
      recommendations.push({
        type: 'pace',
        message: 'Consider increasing the pace or enabling auto-advance',
        action: () => updatePreferences({ pace: 'fast', autoAdvance: true })
      });
    }
    
    if (state.userProgress.skippedSteps.length > 2) {
      recommendations.push({
        type: 'engagement',
        message: 'Try interactive features for better learning',
        action: () => updatePreferences({ showHints: true })
      });
    }
    
    return recommendations;
  }, [state.userProgress]);

  // Update user preferences
  const updatePreferences = useCallback((newPrefs: Partial<UserProgress['preferences']>) => {
    setState(prev => ({
      ...prev,
      userProgress: {
        ...prev.userProgress,
        preferences: { ...prev.userProgress.preferences, ...newPrefs }
      }
    }));
  }, []);

  // Track step timing
  useEffect(() => {
    setStepStartTime(Date.now());
  }, [state.currentStep]);

  // Navigation functions
  const nextStep = useCallback(() => {
    if (!currentStepData) return;
    
    const timeSpent = (Date.now() - stepStartTime) / 1000;
    
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1),
      userProgress: {
        ...prev.userProgress,
        completedSteps: [...prev.userProgress.completedSteps, currentStepData.id],
        timeSpent: { ...prev.userProgress.timeSpent, [currentStepData.id]: timeSpent },
        lastActiveStep: currentStepData.id
      }
    }));
  }, [currentStepData, stepStartTime]);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
  }, []);

  const skipStep = useCallback(() => {
    if (!currentStepData || !currentStepData.skippable) return;
    
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1),
      userProgress: {
        ...prev.userProgress,
        skippedSteps: [...prev.userProgress.skippedSteps, currentStepData.id]
      }
    }));
  }, [currentStepData]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('onboarding-completed', 'true');
    setState(prev => ({ ...prev, isActive: false, isCompleted: true }));
    
    // Trigger completion API call if user is logged in
    if (user) {
      // API call to mark onboarding as completed
      console.log('Marking onboarding as completed for user:', user.id);
    }
  }, [user]);

  const restartOnboarding = useCallback(() => {
    setState({
      isActive: true,
      currentStep: 0,
      userProgress: {
        completedSteps: [],
        skippedSteps: [],
        timeSpent: {},
        startedAt: new Date().toISOString(),
        lastActiveStep: null,
        preferences: state.userProgress.preferences
      },
      isCompleted: false,
      showWelcome: true,
      adaptiveMode: true
    });
  }, [state.userProgress.preferences]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (!state.isActive) return;
      
      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            nextStep();
          }
          break;
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            previousStep();
          }
          break;
        case 'Escape':
          if (currentStepData?.skippable) {
            skipStep();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [state.isActive, nextStep, previousStep, skipStep, currentStepData]);

  // Auto-advance functionality
  useEffect(() => {
    if (!state.userProgress.preferences.autoAdvance || !currentStepData) return;
    
    const timer = setTimeout(() => {
      if (!currentStepData.interactive) {
        nextStep();
      }
    }, currentStepData.duration * 1000);
    
    return () => clearTimeout(timer);
  }, [state.currentStep, state.userProgress.preferences.autoAdvance, currentStepData, nextStep]);

  if (!state.isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Astral Turf Onboarding</h1>
                  <p className="text-blue-100">
                    Step {state.currentStep + 1} of {ONBOARDING_STEPS.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Settings */}
                <OnboardingSettings
                  preferences={state.userProgress.preferences}
                  onUpdatePreferences={updatePreferences}
                />
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={completeOnboarding}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress 
                value={progress} 
                className="bg-white/20"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData && (
                  <OnboardingStepContent
                    step={currentStepData}
                    progress={state.userProgress}
                    preferences={state.userProgress.preferences}
                    onComplete={nextStep}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Step indicators */}
                <div className="flex items-center space-x-2">
                  {ONBOARDING_STEPS.map((step, index) => (
                    <div
                      key={step.id}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index < state.currentStep
                          ? 'bg-green-500'
                          : index === state.currentStep
                          ? 'bg-blue-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Adaptive recommendations */}
                {adaptiveRecommendations.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {adaptiveRecommendations[0].message}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Previous button */}
                <Button
                  variant="ghost"
                  onClick={previousStep}
                  disabled={state.currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                {/* Skip button */}
                {currentStepData?.skippable && (
                  <Button
                    variant="ghost"
                    onClick={skipStep}
                    className="text-gray-500"
                  >
                    Skip
                  </Button>
                )}
                
                {/* Next/Complete button */}
                <Button
                  onClick={state.currentStep === ONBOARDING_STEPS.length - 1 ? completeOnboarding : nextStep}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {state.currentStep === ONBOARDING_STEPS.length - 1 ? (
                    <>
                      Complete
                      <Trophy className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Onboarding Step Content Component
interface OnboardingStepContentProps {
  step: OnboardingStep;
  progress: UserProgress;
  preferences: UserProgress['preferences'];
  onComplete: () => void;
}

const OnboardingStepContent: React.FC<OnboardingStepContentProps> = ({
  step,
  progress,
  preferences,
  onComplete
}) => {
  // Render different content based on step ID
  switch (step.id) {
    case 'welcome':
      return <WelcomeStep step={step} onComplete={onComplete} />;
    case 'interface-overview':
      return <InterfaceOverviewStep step={step} onComplete={onComplete} />;
    case 'create-first-team':
      return <CreateTeamStep step={step} onComplete={onComplete} />;
    case 'tactical-board-intro':
      return <TacticalBoardStep step={step} onComplete={onComplete} />;
    case 'ai-analysis-intro':
      return <AIAnalysisStep step={step} onComplete={onComplete} />;
    case 'advanced-features':
      return <AdvancedFeaturesStep step={step} onComplete={onComplete} />;
    case 'completion':
      return <CompletionStep step={step} progress={progress} />;
    default:
      return <DefaultStepContent step={step} onComplete={onComplete} />;
  }
};

// Individual Step Components
const WelcomeStep: React.FC<{ step: OnboardingStep; onComplete: () => void }> = ({
  step,
  onComplete
}) => (
  <div className="text-center">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: 0.2 }}
      className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center"
    >
      <Target className="w-12 h-12 text-white" />
    </motion.div>
    
    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      {step.title}
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
      {step.description}
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="p-4 text-center">
        <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <h3 className="font-semibold mb-1">Team Management</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create and manage your dream team
        </p>
      </Card>
      
      <Card className="p-4 text-center">
        <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
        <h3 className="font-semibold mb-1">AI-Powered Analysis</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Get intelligent tactical insights
        </p>
      </Card>
      
      <Card className="p-4 text-center">
        <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <h3 className="font-semibold mb-1">Advanced Analytics</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track performance and progress
        </p>
      </Card>
    </div>
    
    <Button onClick={onComplete} size="lg" className="bg-blue-600 hover:bg-blue-700">
      Let's Get Started
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

const InterfaceOverviewStep: React.FC<{ step: OnboardingStep; onComplete: () => void }> = ({
  step,
  onComplete
}) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      {step.title}
    </h2>
    <p className="text-gray-600 dark:text-gray-300 mb-6">
      {step.description}
    </p>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Main Navigation</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Target className="w-5 h-5 text-blue-600 mr-3" />
            <span>Tactical Board - Design formations</span>
          </div>
          <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Users className="w-5 h-5 text-green-600 mr-3" />
            <span>Team Management - Manage players</span>
          </div>
          <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600 mr-3" />
            <span>Analytics - View performance data</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Key Features</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span>Drag & Drop Players</span>
            <Mouse className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span>Keyboard Shortcuts</span>
            <Keyboard className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span>Voice Commands</span>
            <Volume2 className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
    
    <div className="mt-6 text-center">
      <Button onClick={onComplete}>
        I understand the interface
        <CheckCircle className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>
);

// Additional step components would be implemented similarly...
const CreateTeamStep: React.FC<{ step: OnboardingStep; onComplete: () => void }> = ({ step, onComplete }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
    <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>
    <Button onClick={onComplete}>Complete Team Creation</Button>
  </div>
);

const TacticalBoardStep: React.FC<{ step: OnboardingStep; onComplete: () => void }> = ({ step, onComplete }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
    <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>
    <Button onClick={onComplete}>Master the Tactical Board</Button>
  </div>
);

const AIAnalysisStep: React.FC<{ step: OnboardingStep; onComplete: () => void }> = ({ step, onComplete }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
    <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>
    <Button onClick={onComplete}>Explore AI Features</Button>
  </div>
);

const AdvancedFeaturesStep: React.FC<{ step: OnboardingStep; onComplete: () => void }> = ({ step, onComplete }) => (
  <div>
    <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
    <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>
    <Button onClick={onComplete}>Ready for Advanced Features</Button>
  </div>
);

const CompletionStep: React.FC<{ step: OnboardingStep; progress: UserProgress }> = ({
  step,
  progress
}) => (
  <div className="text-center">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", delay: 0.2 }}
      className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center"
    >
      <Trophy className="w-12 h-12 text-white" />
    </motion.div>
    
    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
      {step.title}
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
      {step.description}
    </p>
    
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{progress.completedSteps.length}</div>
        <div className="text-sm text-gray-500">Steps Completed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">
          {Math.round(Object.values(progress.timeSpent).reduce((sum, time) => sum + time, 0) / 60)}
        </div>
        <div className="text-sm text-gray-500">Minutes Spent</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">5</div>
        <div className="text-sm text-gray-500">Achievements Earned</div>
      </div>
    </div>
    
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      <Badge variant="default">Team Creator</Badge>
      <Badge variant="secondary">Formation Master</Badge>
      <Badge variant="default">AI Student</Badge>
      <Badge variant="secondary">Feature Explorer</Badge>
      <Badge variant="default">Astral Turf Coach</Badge>
    </div>
  </div>
);

const DefaultStepContent: React.FC<{ step: OnboardingStep; onComplete: () => void }> = ({
  step,
  onComplete
}) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      {step.title}
    </h2>
    <p className="text-gray-600 dark:text-gray-300 mb-6">
      {step.description}
    </p>
    <Button onClick={onComplete}>Continue</Button>
  </div>
);

// Onboarding Settings Component
interface OnboardingSettingsProps {
  preferences: UserProgress['preferences'];
  onUpdatePreferences: (prefs: Partial<UserProgress['preferences']>) => void;
}

const OnboardingSettings: React.FC<OnboardingSettingsProps> = ({
  preferences,
  onUpdatePreferences
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:bg-white/20"
      >
        <Settings className="w-4 h-4" />
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-10"
          >
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              Onboarding Preferences
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Animations</span>
                <Switch
                  checked={preferences.showAnimations}
                  onCheckedChange={(checked) => onUpdatePreferences({ showAnimations: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto Advance</span>
                <Switch
                  checked={preferences.autoAdvance}
                  onCheckedChange={(checked) => onUpdatePreferences({ autoAdvance: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Voice Guidance</span>
                <Switch
                  checked={preferences.voiceGuidance}
                  onCheckedChange={(checked) => onUpdatePreferences({ voiceGuidance: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Hints</span>
                <Switch
                  checked={preferences.showHints}
                  onCheckedChange={(checked) => onUpdatePreferences({ showHints: checked })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingFlow;