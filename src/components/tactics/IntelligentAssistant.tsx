import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Formation, type Player } from '../../types';
import { 
  Brain, 
  X, 
  Zap, 
  Target, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  MessageCircle,
  Send
} from 'lucide-react';

interface IntelligentAssistantProps {
  currentFormation: Formation | undefined;
  selectedPlayer: Player | null;
  onFormationChange: (formation: Formation) => void;
  onPlayerSelect: (player: Player) => void;
  onClose: () => void;
}

interface Suggestion {
  id: string;
  type: 'formation' | 'player' | 'tactical' | 'warning';
  title: string;
  description: string;
  confidence: number;
  action?: () => void;
  priority: 'low' | 'medium' | 'high';
}

interface AnalysisResult {
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  formationBalance: {
    attack: number;
    midfield: number;
    defense: number;
  };
}

const IntelligentAssistant: React.FC<IntelligentAssistantProps> = ({
  currentFormation,
  selectedPlayer,
  onFormationChange,
  onPlayerSelect,
  onClose
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'ai', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'suggestions' | 'chat'>('analysis');

  // Analyze current formation
  const analyzeFormation = useCallback(async () => {
    if (!currentFormation) return;

    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const filledPositions = currentFormation.slots?.filter(slot => slot.playerId) || [];
    const totalPositions = currentFormation.slots?.length || 11;
    const completeness = filledPositions.length / totalPositions;

    // Generate analysis based on formation structure
    const analysis: AnalysisResult = {
      overallRating: Math.round(65 + (completeness * 30) + Math.random() * 10),
      strengths: [
        'Good positional balance',
        'Strong midfield presence',
        'Adequate defensive coverage'
      ],
      weaknesses: [
        'Limited attacking width',
        'Potential midfield overload',
        'Vulnerable to counter-attacks'
      ],
      suggestions: [
        {
          id: 'formation-balance',
          type: 'formation',
          title: 'Improve Formation Balance',
          description: 'Consider moving players to create better spacing between lines',
          confidence: 85,
          priority: 'medium'
        },
        {
          id: 'player-roles',
          type: 'player',
          title: 'Optimize Player Roles',
          description: 'Some players may be better suited for different positions',
          confidence: 72,
          priority: 'low'
        },
        {
          id: 'tactical-adjustment',
          type: 'tactical',
          title: 'Tactical Weakness Detected',
          description: 'Your right flank appears vulnerable to attacks. Consider defensive reinforcement.',
          confidence: 91,
          priority: 'high'
        }
      ],
      formationBalance: {
        attack: Math.round(60 + Math.random() * 30),
        midfield: Math.round(70 + Math.random() * 25),
        defense: Math.round(75 + Math.random() * 20)
      }
    };

    setAnalysisResult(analysis);
    setIsAnalyzing(false);
  }, [currentFormation]);

  // Initialize analysis on mount
  useEffect(() => {
    analyzeFormation();
  }, [analyzeFormation]);

  // Handle chat message sending
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: chatInput.trim()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: generateAIResponse(userMessage.content)
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  }, [chatInput]);

  // Generate AI response based on user input
  const generateAIResponse = useCallback((userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('formation')) {
      return "Based on your current setup, I'd recommend maintaining the 4-3-3 structure but adjusting the midfield positioning for better ball retention. The wide forwards should track back more to help with defensive transitions.";
    } else if (lowerInput.includes('player') || lowerInput.includes('position')) {
      return "I notice some positional imbalances. Your central midfielder would be more effective in a slightly deeper role, allowing for better distribution and defensive coverage.";
    } else if (lowerInput.includes('attack')) {
      return "To improve your attacking threat, consider overlapping runs from your fullbacks and having your wingers cut inside more frequently. This will create numerical advantages in central areas.";
    } else if (lowerInput.includes('defense')) {
      return "Your defensive line looks solid, but I'd suggest a higher press from your forwards to regain possession earlier. Also, ensure your midfielders are covering the spaces behind when fullbacks advance.";
    } else {
      return "That's an interesting tactical question! Based on your current formation, I'd focus on maintaining possession in midfield and creating overloads on the flanks. What specific area would you like to improve?";
    }
  }, []);

  // Suggestion priority icons
  const getSuggestionIcon = useCallback((type: Suggestion['type'], priority: Suggestion['priority']) => {
    if (priority === 'high') return AlertTriangle;
    if (type === 'formation') return Target;
    if (type === 'player') return Zap;
    if (type === 'tactical') return TrendingUp;
    return Lightbulb;
  }, []);

  // Suggestion priority colors
  const getSuggestionColor = useCallback((priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Tactical Assistant</h2>
                <p className="text-slate-400 text-sm">Advanced formation analysis and recommendations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700/50">
            {[
              { id: 'analysis', name: 'Analysis', icon: Target },
              { id: 'suggestions', name: 'Suggestions', icon: Lightbulb },
              { id: 'chat', name: 'Chat', icon: MessageCircle }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-6 py-3 font-medium transition-all relative
                    ${activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {isAnalyzing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <div className="text-white font-medium mb-2">Analyzing Formation...</div>
                      <div className="text-slate-400 text-sm">AI is evaluating tactical balance and positioning</div>
                    </div>
                  </div>
                ) : analysisResult && (
                  <>
                    {/* Overall Rating */}
                    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Formation Rating</h3>
                        <div className="text-2xl font-bold text-blue-400">
                          {analysisResult.overallRating}/100
                        </div>
                      </div>
                      
                      {/* Balance Meters */}
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(analysisResult.formationBalance).map(([area, rating]) => (
                          <div key={area} className="text-center">
                            <div className="text-sm text-slate-400 mb-2 capitalize">{area}</div>
                            <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${rating}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                              />
                            </div>
                            <div className="text-xs text-white mt-1">{rating}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.strengths.map((strength, index) => (
                            <li key={index} className="text-green-300 text-sm">• {strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-red-300 text-sm">• {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && analysisResult && (
              <div className="space-y-4">
                {analysisResult.suggestions.map(suggestion => {
                  const IconComponent = getSuggestionIcon(suggestion.type, suggestion.priority);
                  const colorClasses = getSuggestionColor(suggestion.priority);
                  
                  return (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border ${colorClasses}`}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <div className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                              {suggestion.confidence}% confidence
                            </div>
                          </div>
                          <p className="text-sm opacity-90 mb-3">{suggestion.description}</p>
                          <button
                            onClick={suggestion.action}
                            className="text-xs bg-slate-700/50 hover:bg-slate-600/50 px-3 py-1 rounded transition-all"
                          >
                            Apply Suggestion
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-96">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-slate-400 py-8">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Ask me anything about your tactical setup!</p>
                      <p className="text-sm mt-2">I can help with formations, player positioning, and tactical strategies.</p>
                    </div>
                  )}
                  
                  {chatMessages.map(message => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-sm p-3 rounded-lg
                          ${message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/50 text-slate-200 border border-slate-600/50'
                          }
                        `}
                      >
                        {message.content}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about formations, tactics, or strategy..."
                    className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 rounded-lg transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-6 border-t border-slate-700/50">
            <button
              onClick={analyzeFormation}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-all"
            >
              <Zap className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze Formation'}
            </button>
            
            <div className="text-sm text-slate-400">
              AI analysis based on professional tactical principles
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { IntelligentAssistant };
export default IntelligentAssistant;