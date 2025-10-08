/**
 * Formation Comparison Modal
 * 
 * Side-by-side comparison of two formations with AI analysis
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import type { ProfessionalFormation } from '../../data/professionalFormations';
import type { FormationAnalysis } from '../../utils/formationAnalyzer';

interface FormationComparisonModalProps {
  formation1: ProfessionalFormation;
  formation2: ProfessionalFormation;
  analysis1: FormationAnalysis;
  analysis2: FormationAnalysis;
  isOpen: boolean;
  onClose: () => void;
}

export const FormationComparisonModal: React.FC<FormationComparisonModalProps> = ({
  formation1,
  formation2,
  analysis1,
  analysis2,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const getDifference = (val1: number, val2: number) => val1 - val2;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-black text-white">Formation Comparison</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
            {/* Formation Names */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
                <h3 className="text-2xl font-black text-white mb-1">{formation1.displayName}</h3>
                <p className="text-sm text-gray-400 capitalize">{formation1.category}</p>
                <div className="mt-3 text-3xl font-black text-blue-400">
                  {analysis1.overallScore.toFixed(0)}%
                </div>
                <p className="text-xs text-gray-500">Overall Score</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
                <h3 className="text-2xl font-black text-white mb-1">{formation2.displayName}</h3>
                <p className="text-sm text-gray-400 capitalize">{formation2.category}</p>
                <div className="mt-3 text-3xl font-black text-purple-400">
                  {analysis2.overallScore.toFixed(0)}%
                </div>
                <p className="text-xs text-gray-500">Overall Score</p>
              </div>
            </div>

            {/* Tactical Balance Comparison */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Tactical Balance</h3>
              <div className="space-y-4">
                <ComparisonRow
                  label="Defensive"
                  value1={analysis1.tacticalBalance.defensive}
                  value2={analysis2.tacticalBalance.defensive}
                />
                <ComparisonRow
                  label="Attacking"
                  value1={analysis1.tacticalBalance.attacking}
                  value2={analysis2.tacticalBalance.attacking}
                />
                <ComparisonRow
                  label="Possession"
                  value1={analysis1.tacticalBalance.possession}
                  value2={analysis2.tacticalBalance.possession}
                />
                <ComparisonRow
                  label="Width"
                  value1={analysis1.tacticalBalance.width}
                  value2={analysis2.tacticalBalance.width}
                />
                <ComparisonRow
                  label="Compactness"
                  value1={analysis1.tacticalBalance.compactness}
                  value2={analysis2.tacticalBalance.compactness}
                />
              </div>
            </div>

            {/* Strengths Comparison */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h4 className="font-bold text-white mb-3">Strengths</h4>
                <div className="space-y-2">
                  {analysis1.strengths.map((s, idx) => (
                    <div key={idx} className="bg-green-900/20 border border-green-700 rounded-lg p-2">
                      <p className="text-sm font-medium text-green-400">{s.aspect}</p>
                      <p className="text-xs text-gray-400">{s.score.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h4 className="font-bold text-white mb-3">Strengths</h4>
                <div className="space-y-2">
                  {analysis2.strengths.map((s, idx) => (
                    <div key={idx} className="bg-green-900/20 border border-green-700 rounded-lg p-2">
                      <p className="text-sm font-medium text-green-400">{s.aspect}</p>
                      <p className="text-xs text-gray-400">{s.score.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weaknesses Comparison */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h4 className="font-bold text-white mb-3">Weaknesses</h4>
                <div className="space-y-2">
                  {analysis1.weaknesses.map((w, idx) => (
                    <div key={idx} className="bg-red-900/20 border border-red-700 rounded-lg p-2">
                      <p className="text-sm font-medium text-red-400">{w.aspect}</p>
                      <p className="text-xs text-gray-400">Risk: {w.severity.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h4 className="font-bold text-white mb-3">Weaknesses</h4>
                <div className="space-y-2">
                  {analysis2.weaknesses.map((w, idx) => (
                    <div key={idx} className="bg-red-900/20 border border-red-700 rounded-lg p-2">
                      <p className="text-sm font-medium text-red-400">{w.aspect}</p>
                      <p className="text-xs text-gray-400">Risk: {w.severity.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Comparison Row Component
const ComparisonRow: React.FC<{
  label: string;
  value1: number;
  value2: number;
}> = ({ label, value1, value2 }) => {
  const difference = value1 - value2;

  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      {/* Formation 1 Bar */}
      <div className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <span className="text-white font-bold text-sm">{value1.toFixed(0)}</span>
          <div className="w-24 bg-gray-700 rounded-full h-2">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${value1}%` }}
            />
          </div>
        </div>
      </div>

      {/* Label & Difference */}
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <div className="flex items-center justify-center space-x-1">
          {difference === 0 ? (
            <Minus className="w-4 h-4 text-gray-400" />
          ) : difference > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-bold">+{Math.abs(difference).toFixed(0)}</span>
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400 font-bold">-{Math.abs(difference).toFixed(0)}</span>
            </>
          )}
        </div>
      </div>

      {/* Formation 2 Bar */}
      <div className="text-left">
        <div className="flex items-center justify-start space-x-2">
          <div className="w-24 bg-gray-700 rounded-full h-2">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${value2}%` }}
            />
          </div>
          <span className="text-white font-bold text-sm">{value2.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

export default FormationComparisonModal;

