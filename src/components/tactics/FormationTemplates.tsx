import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Formation } from '../../types';
import { X, Search, Filter, Star, TrendingUp, Shield, Zap } from 'lucide-react';

interface FormationTemplatesProps {
  onSelect: (formation: Formation) => void;
  onClose: () => void;
}

type FormationCategory = 'all' | 'attacking' | 'balanced' | 'defensive' | 'popular';

interface FormationTemplate {
  id: string;
  name: string;
  description: string;
  category: FormationCategory;
  popularity: number;
  strengths: string[];
  weaknesses: string[];
  formation: Formation;
  preview: string;
}

const FormationTemplates: React.FC<FormationTemplatesProps> = ({ onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FormationCategory>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<FormationTemplate | null>(null);

  // Formation templates data
  const formationTemplates: FormationTemplate[] = useMemo(() => [
    {
      id: '4-3-3',
      name: '4-3-3 Classic',
      description: 'Balanced formation with strong attacking width and midfield control',
      category: 'balanced',
      popularity: 95,
      strengths: ['Width in attack', 'Midfield control', 'Defensive stability'],
      weaknesses: ['Vulnerable to counter-attacks', 'Requires fit wingbacks'],
      preview: '🟦🟦🟦🟦\n  🟨🟨🟨\n🟩  🟩  🟩',
      formation: {
        id: '4-3-3',
        name: '4-3-3 Classic',
        slots: [
          // Goalkeeper
          { id: 'gk', position: { x: 50, y: 90 }, roleId: 'goalkeeper' },
          // Defense
          { id: 'lb', position: { x: 20, y: 75 }, roleId: 'left-back' },
          { id: 'cb1', position: { x: 40, y: 75 }, roleId: 'center-back' },
          { id: 'cb2', position: { x: 60, y: 75 }, roleId: 'center-back' },
          { id: 'rb', position: { x: 80, y: 75 }, roleId: 'right-back' },
          // Midfield
          { id: 'cm1', position: { x: 35, y: 55 }, roleId: 'central-midfielder' },
          { id: 'cm2', position: { x: 50, y: 50 }, roleId: 'central-midfielder' },
          { id: 'cm3', position: { x: 65, y: 55 }, roleId: 'central-midfielder' },
          // Attack
          { id: 'lw', position: { x: 25, y: 25 }, roleId: 'left-winger' },
          { id: 'st', position: { x: 50, y: 20 }, roleId: 'striker' },
          { id: 'rw', position: { x: 75, y: 25 }, roleId: 'right-winger' }
        ],
        players: []
      }
    },
    {
      id: '4-4-2',
      name: '4-4-2 Diamond',
      description: 'Compact midfield diamond with two strikers',
      category: 'attacking',
      popularity: 78,
      strengths: ['Strong central midfield', 'Good for counter-attacks', 'Two striker threat'],
      weaknesses: ['Lacks width', 'Vulnerable on flanks'],
      preview: '🟦🟦🟦🟦\n 🟨🟨🟨🟨\n  🟩🟩',
      formation: {
        id: '4-4-2',
        name: '4-4-2 Diamond',
        slots: [
          // Goalkeeper
          { id: 'gk', position: { x: 50, y: 90 }, roleId: 'goalkeeper' },
          // Defense
          { id: 'lb', position: { x: 20, y: 75 }, roleId: 'left-back' },
          { id: 'cb1', position: { x: 40, y: 75 }, roleId: 'center-back' },
          { id: 'cb2', position: { x: 60, y: 75 }, roleId: 'center-back' },
          { id: 'rb', position: { x: 80, y: 75 }, roleId: 'right-back' },
          // Midfield Diamond
          { id: 'cdm', position: { x: 50, y: 60 }, roleId: 'defensive-midfielder' },
          { id: 'lm', position: { x: 35, y: 45 }, roleId: 'left-midfielder' },
          { id: 'rm', position: { x: 65, y: 45 }, roleId: 'right-midfielder' },
          { id: 'cam', position: { x: 50, y: 35 }, roleId: 'attacking-midfielder' },
          // Attack
          { id: 'st1', position: { x: 40, y: 20 }, roleId: 'striker' },
          { id: 'st2', position: { x: 60, y: 20 }, roleId: 'striker' }
        ],
        players: []
      }
    },
    {
      id: '3-5-2',
      name: '3-5-2 Wing-backs',
      description: 'Attacking formation with wing-backs providing width',
      category: 'attacking',
      popularity: 72,
      strengths: ['Numerical advantage in midfield', 'Attacking wing-backs', 'Strong central defense'],
      weaknesses: ['Exposed flanks when attacking', 'Requires disciplined wing-backs'],
      preview: ' 🟦🟦🟦\n🟨🟨🟨🟨🟨\n  🟩🟩',
      formation: {
        id: '3-5-2',
        name: '3-5-2 Wing-backs',
        slots: [
          // Goalkeeper
          { id: 'gk', position: { x: 50, y: 90 }, roleId: 'goalkeeper' },
          // Defense
          { id: 'cb1', position: { x: 30, y: 75 }, roleId: 'center-back' },
          { id: 'cb2', position: { x: 50, y: 75 }, roleId: 'center-back' },
          { id: 'cb3', position: { x: 70, y: 75 }, roleId: 'center-back' },
          // Midfield
          { id: 'lwb', position: { x: 15, y: 55 }, roleId: 'left-wing-back' },
          { id: 'cm1', position: { x: 40, y: 50 }, roleId: 'central-midfielder' },
          { id: 'cm2', position: { x: 50, y: 55 }, roleId: 'central-midfielder' },
          { id: 'cm3', position: { x: 60, y: 50 }, roleId: 'central-midfielder' },
          { id: 'rwb', position: { x: 85, y: 55 }, roleId: 'right-wing-back' },
          // Attack
          { id: 'st1', position: { x: 40, y: 25 }, roleId: 'striker' },
          { id: 'st2', position: { x: 60, y: 25 }, roleId: 'striker' }
        ],
        players: []
      }
    },
    {
      id: '5-3-2',
      name: '5-3-2 Defensive',
      description: 'Solid defensive formation with counter-attacking threat',
      category: 'defensive',
      popularity: 68,
      strengths: ['Very solid defense', 'Good for counter-attacks', 'Hard to break down'],
      weaknesses: ['Limited attacking options', 'Relies on individual brilliance'],
      preview: '🟦🟦🟦🟦🟦\n  🟨🟨🟨\n   🟩🟩',
      formation: {
        id: '5-3-2',
        name: '5-3-2 Defensive',
        slots: [
          // Goalkeeper
          { id: 'gk', position: { x: 50, y: 90 }, roleId: 'goalkeeper' },
          // Defense
          { id: 'lwb', position: { x: 15, y: 75 }, roleId: 'left-wing-back' },
          { id: 'cb1', position: { x: 35, y: 75 }, roleId: 'center-back' },
          { id: 'cb2', position: { x: 50, y: 75 }, roleId: 'center-back' },
          { id: 'cb3', position: { x: 65, y: 75 }, roleId: 'center-back' },
          { id: 'rwb', position: { x: 85, y: 75 }, roleId: 'right-wing-back' },
          // Midfield
          { id: 'cm1', position: { x: 40, y: 50 }, roleId: 'central-midfielder' },
          { id: 'cm2', position: { x: 50, y: 45 }, roleId: 'central-midfielder' },
          { id: 'cm3', position: { x: 60, y: 50 }, roleId: 'central-midfielder' },
          // Attack
          { id: 'st1', position: { x: 40, y: 25 }, roleId: 'striker' },
          { id: 'st2', position: { x: 60, y: 25 }, roleId: 'striker' }
        ],
        players: []
      }
    },
    {
      id: '4-2-3-1',
      name: '4-2-3-1 Modern',
      description: 'Modern formation with double pivot and attacking midfielder',
      category: 'popular',
      popularity: 88,
      strengths: ['Balance in all areas', 'Creative freedom', 'Defensive solidity'],
      weaknesses: ['Complex to implement', 'Requires technical players'],
      preview: '🟦🟦🟦🟦\n  🟨🟨\n🟨🟨🟨\n  🟩',
      formation: {
        id: '4-2-3-1',
        name: '4-2-3-1 Modern',
        slots: [
          // Goalkeeper
          { id: 'gk', position: { x: 50, y: 90 }, roleId: 'goalkeeper' },
          // Defense
          { id: 'lb', position: { x: 20, y: 75 }, roleId: 'left-back' },
          { id: 'cb1', position: { x: 40, y: 75 }, roleId: 'center-back' },
          { id: 'cb2', position: { x: 60, y: 75 }, roleId: 'center-back' },
          { id: 'rb', position: { x: 80, y: 75 }, roleId: 'right-back' },
          // Double Pivot
          { id: 'cdm1', position: { x: 40, y: 55 }, roleId: 'defensive-midfielder' },
          { id: 'cdm2', position: { x: 60, y: 55 }, roleId: 'defensive-midfielder' },
          // Attacking Midfield
          { id: 'lam', position: { x: 25, y: 35 }, roleId: 'left-attacking-midfielder' },
          { id: 'cam', position: { x: 50, y: 30 }, roleId: 'attacking-midfielder' },
          { id: 'ram', position: { x: 75, y: 35 }, roleId: 'right-attacking-midfielder' },
          // Attack
          { id: 'st', position: { x: 50, y: 15 }, roleId: 'striker' }
        ],
        players: []
      }
    }
  ], []);

  // Category filters
  const categories = [
    { id: 'all', name: 'All Formations', icon: Filter, count: formationTemplates.length },
    { id: 'popular', name: 'Popular', icon: Star, count: formationTemplates.filter(f => f.category === 'popular').length },
    { id: 'attacking', name: 'Attacking', icon: TrendingUp, count: formationTemplates.filter(f => f.category === 'attacking').length },
    { id: 'balanced', name: 'Balanced', icon: Zap, count: formationTemplates.filter(f => f.category === 'balanced').length },
    { id: 'defensive', name: 'Defensive', icon: Shield, count: formationTemplates.filter(f => f.category === 'defensive').length }
  ];

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return formationTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [formationTemplates, searchQuery, selectedCategory]);

  // Handle template selection
  const handleSelectTemplate = useCallback((template: FormationTemplate) => {
    onSelect(template.formation);
    onClose();
  }, [onSelect, onClose]);

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
          className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-2xl font-bold text-white">Formation Templates</h2>
              <p className="text-slate-400 mt-1">Choose from professional football formations</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search formations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as FormationCategory)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all
                        ${selectedCategory === category.id
                          ? 'bg-blue-600/80 text-white border border-blue-500/50'
                          : 'bg-slate-800/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/50'
                        }
                      `}
                    >
                      <IconComponent className="w-4 h-4" />
                      {category.name}
                      <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-xs">
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Formation Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer group"
                  onClick={() => handleSelectTemplate(template)}
                >
                  {/* Formation Preview */}
                  <div className="relative bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
                    <div className="text-center text-white/80 font-mono text-sm whitespace-pre-line">
                      {template.preview}
                    </div>
                    <div className="absolute top-2 right-2 bg-slate-900/80 rounded-full px-2 py-1 text-xs text-white">
                      {template.popularity}%
                    </div>
                  </div>

                  {/* Formation Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">
                      {template.description}
                    </p>

                    {/* Strengths & Weaknesses */}
                    <div className="space-y-2">
                      <div>
                        <div className="text-green-400 text-xs font-medium mb-1">Strengths</div>
                        <div className="flex flex-wrap gap-1">
                          {template.strengths.slice(0, 2).map(strength => (
                            <span key={strength} className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-red-400 text-xs font-medium mb-1">Weaknesses</div>
                        <div className="flex flex-wrap gap-1">
                          {template.weaknesses.slice(0, 2).map(weakness => (
                            <span key={weakness} className="bg-red-900/30 text-red-400 text-xs px-2 py-1 rounded">
                              {weakness}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg mb-2">No formations found</div>
                <div className="text-slate-500 text-sm">Try adjusting your search or filters</div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export { FormationTemplates };
export default FormationTemplates;