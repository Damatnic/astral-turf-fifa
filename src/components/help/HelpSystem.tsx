/**
 * Comprehensive Help System Component
 *
 * Provides contextual help, tooltips, guided tours, and interactive tutorials
 * for the Astral Turf application. Supports multiple languages and accessibility.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Book,
  Video,
  FileText,
  Lightbulb,
  Target,
  MessageCircle,
  Keyboard,
  Eye,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  Share2,
} from 'lucide-react';
import { useUIContext, useAuthContext } from '../../hooks';
import { useTheme, useAccessibility } from '../../context/ThemeContext';
import { Button } from '../ui/modern/Button';
import { Input } from '../ui/modern/Input';
import { Card } from '../ui/modern/Card';
import { Badge } from '../ui/modern/Badge';
import { Tooltip } from '../ui/modern/Tooltip';
import { Dialog } from '../ui/modern/Dialog';

// Help System Types
interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'getting-started' | 'tactics' | 'players' | 'analysis' | 'advanced';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  lastUpdated: string;
  rating: number;
  views: number;
  helpful: number;
  videoUrl?: string;
  interactiveDemo?: boolean;
  relatedArticles: string[];
  prerequisites: string[];
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'type' | 'drag';
  highlightColor?: string;
  skippable: boolean;
  waitForElement?: boolean;
  validation?: () => boolean;
}

interface ContextualHelp {
  id: string;
  component: string;
  triggers: string[];
  content: string;
  priority: 'low' | 'medium' | 'high';
  showCondition?: () => boolean;
  dismissible: boolean;
  maxShows: number;
  category: string;
}

interface HelpSystemState {
  isVisible: boolean;
  currentTutorial: string | null;
  currentStep: number;
  searchQuery: string;
  selectedCategory: string | null;
  showTooltips: boolean;
  showOnboarding: boolean;
  completedTutorials: string[];
  viewedArticles: string[];
  userPreferences: {
    autoPlayVideos: boolean;
    showAnimations: boolean;
    voiceGuidance: boolean;
    keyboardShortcuts: boolean;
    highContrast: boolean;
  };
}

// Help System Context
const HelpContext = createContext<{
  state: HelpSystemState;
  actions: {
    showHelp: (articleId?: string) => void;
    hideHelp: () => void;
    startTutorial: (tutorialId: string) => void;
    nextStep: () => void;
    previousStep: () => void;
    skipTutorial: () => void;
    showTooltip: (elementId: string, content: string) => void;
    hideTooltip: () => void;
    searchHelp: (query: string) => void;
    rateArticle: (articleId: string, rating: number) => void;
    markHelpful: (articleId: string, helpful: boolean) => void;
    updatePreferences: (preferences: Partial<HelpSystemState['userPreferences']>) => void;
  };
} | null>(null);

export const useHelpSystem = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelpSystem must be used within a HelpSystemProvider');
  }
  return context;
};

// Sample Help Content
const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started-basics',
    title: 'Getting Started with Astral Turf',
    content: `
# Welcome to Astral Turf

Astral Turf is an AI-powered soccer tactical planning application that helps coaches, players, and enthusiasts create, analyze, and optimize team formations and strategies.

## Key Features

### Tactical Board
- **Drag & Drop Players**: Easily position players on the field
- **Formation Templates**: Choose from professional formations like 4-3-3, 4-4-2, 3-5-2
- **Real-time Chemistry**: See how player combinations affect team chemistry
- **Drawing Tools**: Annotate tactics with arrows, lines, and shapes

### AI Analysis
- **Formation Analysis**: Get AI insights on your tactical setup
- **Player Recommendations**: Discover optimal player positions
- **Opponent Analysis**: Analyze opposition tactics and find weaknesses
- **Match Simulation**: Simulate matches with realistic outcomes

### Player Management
- **Comprehensive Stats**: Track detailed player attributes and performance
- **Development Tracking**: Monitor player growth and potential
- **Contract Management**: Handle player contracts and transfers
- **Training Programs**: Design custom training regimens

## Getting Started

1. **Create Your Team**: Add players to your squad with detailed attributes
2. **Choose Formation**: Select a formation that suits your playing style
3. **Position Players**: Drag players to their optimal positions
4. **Analyze Tactics**: Use AI analysis to optimize your setup
5. **Save & Share**: Save formations and share with your team

## Tips for New Users

- Start with pre-built formations to learn the basics
- Use the chemistry visualization to understand player relationships
- Experiment with different tactical styles
- Take advantage of AI suggestions for improvements
- Complete the interactive tutorials for hands-on learning

Ready to begin? Let's start with creating your first formation!
    `,
    category: 'getting-started',
    tags: ['basics', 'introduction', 'tutorial'],
    difficulty: 'beginner',
    estimatedTime: 10,
    lastUpdated: '2024-01-15',
    rating: 4.8,
    views: 15420,
    helpful: 1231,
    videoUrl: '/videos/getting-started.mp4',
    interactiveDemo: true,
    relatedArticles: ['tactical-board-basics', 'player-management-101'],
    prerequisites: [],
  },
  {
    id: 'tactical-board-basics',
    title: 'Mastering the Tactical Board',
    content: `
# Tactical Board Guide

The tactical board is the heart of Astral Turf, where you'll design and visualize your team's strategy.

## Interface Overview

### Field Layout
- **3D Perspective**: Modern 3D field view with realistic proportions
- **Grid System**: Optional grid overlay for precise positioning
- **Zoom Controls**: Zoom in/out for detailed positioning
- **Field Markings**: Authentic football field markings and dimensions

### Player Tokens
- **Drag & Drop**: Click and drag players to reposition
- **Color Coding**: Different colors for home/away teams
- **Position Labels**: Clear position indicators (GK, CB, CM, etc.)
- **Chemistry Lines**: Visual connections showing player chemistry

### Toolbar Functions
- **Formation Selector**: Quick access to formation templates
- **Drawing Tools**: Arrows, lines, circles for tactical annotations
- **Save/Load**: Save formations and tactical setups
- **Export**: Share formations as images or PDFs

## Advanced Features

### Chemistry Visualization
- **Relationship Mapping**: See how players work together
- **Chemistry Scores**: Numerical chemistry ratings
- **Optimal Partnerships**: AI-suggested player combinations
- **Real-time Updates**: Chemistry updates as you move players

### Tactical Analysis
- **Formation Strength**: Visual representation of formation effectiveness
- **Weakness Detection**: Identify tactical vulnerabilities
- **Pressure Maps**: See how your formation handles pressure
- **Transition Analysis**: Analyze defensive to offensive transitions

### Drawing and Annotation
- **Arrow Tools**: Show player movements and passing lanes
- **Shape Tools**: Highlight areas of focus
- **Text Labels**: Add tactical notes and instructions
- **Layer Management**: Organize annotations in layers

## Best Practices

1. **Start with Structure**: Begin with a solid defensive shape
2. **Balance the Field**: Ensure good spacing between players
3. **Consider Chemistry**: Place compatible players near each other
4. **Plan Transitions**: Think about both attacking and defensive phases
5. **Use AI Feedback**: Let AI analysis guide improvements

## Keyboard Shortcuts

- **Space**: Toggle between formation templates
- **Ctrl+Z**: Undo last action
- **Ctrl+S**: Save current formation
- **Delete**: Remove selected element
- **Tab**: Cycle through player selection

Master these fundamentals, and you'll be creating professional-level tactics in no time!
    `,
    category: 'tactics',
    tags: ['tactical-board', 'formation', 'positioning'],
    difficulty: 'beginner',
    estimatedTime: 15,
    lastUpdated: '2024-01-14',
    rating: 4.9,
    views: 12890,
    helpful: 1089,
    videoUrl: '/videos/tactical-board-guide.mp4',
    interactiveDemo: true,
    relatedArticles: ['formation-guide', 'chemistry-system'],
    prerequisites: ['getting-started-basics'],
  },
  {
    id: 'ai-analysis-guide',
    title: 'Understanding AI Tactical Analysis',
    content: `
# AI Tactical Analysis

Astral Turf's AI system provides intelligent insights to help you optimize your tactical approach.

## How AI Analysis Works

### Real-time Evaluation
The AI continuously analyzes your formation, considering:
- **Player Attributes**: Individual strengths and weaknesses
- **Positional Effectiveness**: How well players fit their roles
- **Team Chemistry**: Compatibility between players
- **Tactical Balance**: Overall formation stability

### Analysis Categories

#### Formation Analysis
- **Defensive Solidity**: How well your formation defends
- **Attacking Threat**: Offensive potential assessment
- **Midfield Control**: Ability to dominate the middle of the park
- **Width Utilization**: Effective use of field width

#### Player Insights
- **Individual Ratings**: Player performance in current position
- **Role Suitability**: How well players fit their assigned roles
- **Chemistry Impact**: Effect on team chemistry
- **Development Suggestions**: Recommendations for improvement

#### Tactical Recommendations
- **Formation Adjustments**: Suggested position changes
- **Player Substitutions**: Optimal player swaps
- **Tactical Tweaks**: Style and approach modifications
- **Counter-Tactics**: Responses to opponent strategies

## Using AI Insights Effectively

### Interpreting Ratings
- **90-100**: Exceptional - Maintain this setup
- **80-89**: Very Good - Minor tweaks possible
- **70-79**: Good - Some improvements needed
- **60-69**: Average - Significant changes recommended
- **Below 60**: Poor - Major overhaul required

### Acting on Recommendations
1. **Prioritize High-Impact Changes**: Focus on suggestions with biggest impact
2. **Consider Player Chemistry**: Don't ignore chemistry for tactical gains
3. **Test Variations**: Try different approaches to find optimal setup
4. **Monitor Changes**: Track improvements after implementing suggestions

### Advanced AI Features

#### Opponent Analysis
- Upload opponent formations for comparison
- Receive counter-tactical suggestions
- Identify opponent weaknesses to exploit
- Plan specific game strategies

#### Historical Learning
- AI learns from your tactical preferences
- Suggestions improve over time
- Personalized recommendations based on your style
- Pattern recognition for consistent improvements

## Pro Tips

- **Regular Analysis**: Check AI insights after major changes
- **Question Everything**: Use AI as guide, not absolute truth
- **Experiment**: Try unexpected AI suggestions
- **Compare Options**: Analyze multiple formation variants
- **Track Results**: Monitor real-world performance vs AI predictions

The AI is your tactical assistant - use it wisely to elevate your coaching game!
    `,
    category: 'analysis',
    tags: ['ai', 'analysis', 'insights', 'recommendations'],
    difficulty: 'intermediate',
    estimatedTime: 12,
    lastUpdated: '2024-01-13',
    rating: 4.7,
    views: 8765,
    helpful: 745,
    videoUrl: '/videos/ai-analysis-guide.mp4',
    interactiveDemo: false,
    relatedArticles: ['tactical-board-basics', 'formation-optimization'],
    prerequisites: ['getting-started-basics', 'tactical-board-basics'],
  },
];

// Tutorial Definitions
const TUTORIALS = {
  'first-formation': {
    id: 'first-formation',
    title: 'Create Your First Formation',
    description: 'Learn to create and customize tactical formations',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Formation Creator',
        description:
          "Let's create your first tactical formation together. This tutorial will guide you through the basics.",
        target: '.tactical-board',
        position: 'top',
        skippable: true,
        waitForElement: true,
      },
      {
        id: 'select-formation',
        title: 'Choose a Formation Template',
        description:
          'Click on the formation selector to choose a starting template. We recommend 4-3-3 for beginners.',
        target: '.formation-selector',
        position: 'bottom',
        action: 'click',
        skippable: false,
        waitForElement: true,
      },
      {
        id: 'position-player',
        title: 'Position Your First Player',
        description:
          'Drag a player token to position them on the field. Try moving the striker to a different position.',
        target: '.player-token[data-position="ST"]',
        position: 'top',
        action: 'drag',
        skippable: false,
        validation: () => {
          // Check if player was moved from default position
          const player = document.querySelector('.player-token[data-position="ST"]');
          return player?.getAttribute('data-moved') === 'true';
        },
      },
      {
        id: 'view-chemistry',
        title: 'Check Player Chemistry',
        description:
          'Click the chemistry button to see how your players work together. Good chemistry improves team performance.',
        target: '.chemistry-button',
        position: 'left',
        action: 'click',
        skippable: false,
        waitForElement: true,
      },
      {
        id: 'ai-analysis',
        title: 'Get AI Insights',
        description:
          'Click the AI analysis button to get intelligent feedback on your formation. The AI will suggest improvements.',
        target: '.ai-analysis-button',
        position: 'right',
        action: 'click',
        skippable: false,
        waitForElement: true,
      },
      {
        id: 'save-formation',
        title: 'Save Your Formation',
        description:
          "Don't forget to save your formation! Click the save button and give it a memorable name.",
        target: '.save-button',
        position: 'top',
        action: 'click',
        skippable: true,
        waitForElement: true,
      },
      {
        id: 'completion',
        title: 'Congratulations!',
        description:
          "You've created your first formation! Explore the advanced features or start a new formation.",
        target: '.tactical-board',
        position: 'center',
        skippable: true,
        waitForElement: false,
      },
    ],
  },
};

// Main Help System Component
export const HelpSystem: React.FC = () => {
  const { theme } = useTheme();
  const [state, setState] = useState<HelpSystemState>({
    isVisible: false,
    currentTutorial: null,
    currentStep: 0,
    searchQuery: '',
    selectedCategory: null,
    showTooltips: true,
    showOnboarding: true,
    completedTutorials: [],
    viewedArticles: [],
    userPreferences: {
      autoPlayVideos: false,
      showAnimations: true,
      voiceGuidance: false,
      keyboardShortcuts: true,
      highContrast: false,
    },
  });

  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    content: string;
    position: { x: number; y: number };
  } | null>(null);

  const helpPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    return HELP_ARTICLES.filter(article => {
      const matchesSearch =
        !state.searchQuery ||
        article.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()));

      const matchesCategory =
        !state.selectedCategory || article.category === state.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [state.searchQuery, state.selectedCategory]);

  // Help system actions
  const actions = useMemo(
    () => ({
      showHelp: (articleId?: string) => {
        setState(prev => ({
          ...prev,
          isVisible: true,
          searchQuery: articleId ? '' : prev.searchQuery,
        }));

        if (articleId) {
          // Scroll to specific article
          setTimeout(() => {
            const element = document.getElementById(`article-${articleId}`);
            element?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      },

      hideHelp: () => {
        setState(prev => ({ ...prev, isVisible: false }));
      },

      startTutorial: (tutorialId: string) => {
        setState(prev => ({
          ...prev,
          currentTutorial: tutorialId,
          currentStep: 0,
          isVisible: false,
        }));
      },

      nextStep: () => {
        setState(prev => {
          const tutorial = TUTORIALS[prev.currentTutorial as keyof typeof TUTORIALS];
          if (!tutorial) {
            return prev;
          }

          const nextStep = prev.currentStep + 1;
          if (nextStep >= tutorial.steps.length) {
            // Tutorial completed
            return {
              ...prev,
              currentTutorial: null,
              currentStep: 0,
              completedTutorials: [...prev.completedTutorials, tutorial.id],
            };
          }

          return { ...prev, currentStep: nextStep };
        });
      },

      previousStep: () => {
        setState(prev => ({
          ...prev,
          currentStep: Math.max(0, prev.currentStep - 1),
        }));
      },

      skipTutorial: () => {
        setState(prev => ({
          ...prev,
          currentTutorial: null,
          currentStep: 0,
        }));
      },

      showTooltip: (elementId: string, content: string) => {
        const element = document.getElementById(elementId);
        if (element) {
          const rect = element.getBoundingClientRect();
          setActiveTooltip({
            id: elementId,
            content,
            position: { x: rect.left + rect.width / 2, y: rect.top },
          });
        }
      },

      hideTooltip: () => {
        setActiveTooltip(null);
      },

      searchHelp: (query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }));
      },

      rateArticle: (articleId: string, rating: number) => {
        // Implementation for rating articles
        console.log(`Rating article ${articleId}: ${rating}`);
      },

      markHelpful: (articleId: string, helpful: boolean) => {
        // Implementation for marking articles as helpful
        console.log(`Article ${articleId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
      },

      updatePreferences: (preferences: Partial<HelpSystemState['userPreferences']>) => {
        setState(prev => ({
          ...prev,
          userPreferences: { ...prev.userPreferences, ...preferences },
        }));
      },
    }),
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (!state.userPreferences.keyboardShortcuts) {
        return;
      }

      // F1 - Toggle help
      if (event.key === 'F1') {
        event.preventDefault();
        actions.showHelp();
      }

      // Escape - Close help/tutorial
      if (event.key === 'Escape') {
        if (state.currentTutorial) {
          actions.skipTutorial();
        } else if (state.isVisible) {
          actions.hideHelp();
        }
      }

      // Ctrl+K - Focus search
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        if (state.isVisible) {
          searchInputRef.current?.focus();
        } else {
          actions.showHelp();
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [state.isVisible, state.currentTutorial, state.userPreferences.keyboardShortcuts, actions]);

  // Auto-focus search on help open
  useEffect(() => {
    if (state.isVisible && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [state.isVisible]);

  // Current tutorial step
  const currentTutorialStep = useMemo(() => {
    if (!state.currentTutorial) {
      return null;
    }

    const tutorial = TUTORIALS[state.currentTutorial as keyof typeof TUTORIALS];
    return tutorial?.steps[state.currentStep] || null;
  }, [state.currentTutorial, state.currentStep]);

  return (
    <HelpContext.Provider value={{ state, actions }}>
      {/* Help Panel */}
      <AnimatePresence>
        {state.isVisible && (
          <Dialog open={state.isVisible} onOpenChange={actions.hideHelp}>
            <motion.div
              ref={helpPanelRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            >
              <div className="w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Book className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Help & Documentation
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => actions.startTutorial('first-formation')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Start Tutorial
                    </Button>

                    <Button variant="ghost" size="sm" onClick={actions.hideHelp}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex h-[calc(100%-88px)]">
                  {/* Sidebar */}
                  <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
                    {/* Search */}
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search help articles..."
                        value={state.searchQuery}
                        onChange={e => actions.searchHelp(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Categories
                      </h3>

                      {['getting-started', 'tactics', 'players', 'analysis', 'advanced'].map(
                        category => (
                          <button
                            key={category}
                            onClick={() =>
                              setState(prev => ({
                                ...prev,
                                selectedCategory:
                                  prev.selectedCategory === category ? null : category,
                              }))
                            }
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              state.selectedCategory === category
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {category
                              .split('-')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')}
                          </button>
                        )
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 space-y-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Quick Actions
                      </h3>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => actions.startTutorial('first-formation')}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Interactive Tutorial
                      </Button>

                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Video className="w-4 h-4 mr-2" />
                        Video Guides
                      </Button>

                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Keyboard className="w-4 h-4 mr-2" />
                        Keyboard Shortcuts
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 overflow-y-auto">
                    {filteredArticles.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No articles found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Try adjusting your search or browse categories
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredArticles.map(article => (
                          <HelpArticleCard
                            key={article.id}
                            article={article}
                            onRate={actions.rateArticle}
                            onMarkHelpful={actions.markHelpful}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        step={currentTutorialStep as any}
        onNext={actions.nextStep}
        onPrevious={actions.previousStep}
        onSkip={actions.skipTutorial}
        preferences={state.userPreferences}
      />

      {/* Active Tooltip */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-50 max-w-xs p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
            style={{
              left: activeTooltip.position.x,
              top: activeTooltip.position.y - 10,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            {activeTooltip.content}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Button */}
      <Tooltip content="Help & Documentation (F1)">
        <Button
          onClick={() => actions.showHelp()}
          className="fixed bottom-6 right-6 z-40 rounded-full w-12 h-12 shadow-lg"
          variant="primary"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </Tooltip>
    </HelpContext.Provider>
  );
};

// Help Article Card Component
interface HelpArticleCardProps {
  article: HelpArticle;
  onRate: (articleId: string, rating: number) => void;
  onMarkHelpful: (articleId: string, helpful: boolean) => void;
}

const HelpArticleCard: React.FC<HelpArticleCardProps> = ({ article, onRate, onMarkHelpful }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  return (
    <Card id={`article-${article.id}`} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{article.title}</h3>
            <Badge
              variant={
                article.difficulty === 'beginner'
                  ? 'primary'
                  : article.difficulty === 'intermediate'
                    ? 'secondary'
                    : ('error' as any)
              }
            >
              {article.difficulty}
            </Badge>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {article.views.toLocaleString()} views
            </span>
            <span>~{article.estimatedTime} min read</span>
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              {article.rating.toFixed(1)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {article.videoUrl && (
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
          )}

          {article.interactiveDemo && (
            <Button variant="ghost" size="sm">
              <Target className="w-4 h-4" />
            </Button>
          )}

          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Preview/Full */}
      <div className="prose dark:prose-invert max-w-none">
        {isExpanded ? (
          <div
            dangerouslySetInnerHTML={{
              __html: article.content.replace(/\n/g, '<br>'),
            }}
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-300">{article.content.substring(0, 200)}...</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Show Less' : 'Read More'}
        </Button>

        <div className="flex items-center space-x-4">
          {/* Helpful buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onMarkHelpful(article.id, true)}>
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onMarkHelpful(article.id, false)}>
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Star rating */}
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => {
                  setUserRating(star);
                  onRate(article.id, star);
                }}
                className={`text-lg ${
                  star <= (userRating || 0) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                } hover:text-yellow-500 transition-colors`}
              >
                <Star className="w-4 h-4" fill="currentColor" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Tutorial Overlay Component
interface TutorialOverlayProps {
  step: TutorialStep | null;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  preferences: HelpSystemState['userPreferences'];
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  onNext,
  onPrevious,
  onSkip,
  preferences,
}) => {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!step) {
      return undefined;
    }

    const findTarget = () => {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    if (step.waitForElement) {
      const observer = new MutationObserver(() => {
        findTarget();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    } else {
      findTarget();
      return undefined;
    }
  }, [step]);

  if (!step || !highlightPosition) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute bg-white/10 border-2 border-blue-500 rounded-lg pointer-events-none"
        style={{
          left: highlightPosition.x - 4,
          top: highlightPosition.y - 4,
          width: highlightPosition.width + 8,
          height: highlightPosition.height + 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Tutorial Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute pointer-events-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm p-6"
        style={{
          left:
            step.position === 'left'
              ? highlightPosition.x - 300
              : step.position === 'right'
                ? highlightPosition.x + highlightPosition.width + 20
                : highlightPosition.x + highlightPosition.width / 2 - 150,
          top:
            step.position === 'top'
              ? highlightPosition.y - 200
              : step.position === 'bottom'
                ? highlightPosition.y + highlightPosition.height + 20
                : highlightPosition.y + highlightPosition.height / 2 - 100,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
          {step.skippable && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={false} // You might want to disable on first step
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <Button onClick={onNext} size="sm">
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default HelpSystem;
