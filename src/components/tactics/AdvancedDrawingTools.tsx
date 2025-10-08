/**
 * Advanced Drawing Tools
 * 
 * Professional drawing tools for tactical annotations:
 * - Arrows (straight, curved, dashed)
 * - Zones (pressing, defensive, attacking)
 * - Text annotations
 * - Measurements
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Circle, Square, Type, Minus,
  Move, Eraser, Palette, Layers
} from 'lucide-react';

export type DrawingToolType =
  | 'select'
  | 'arrow'
  | 'curved-arrow'
  | 'dashed-arrow'
  | 'line'
  | 'dashed-line'
  | 'rectangle'
  | 'circle'
  | 'zone'
  | 'text'
  | 'eraser';

export interface DrawingTool {
  id: DrawingToolType;
  name: string;
  icon: React.ReactNode;
  description: string;
  shortcut?: string;
  category: 'select' | 'arrows' | 'shapes' | 'zones' | 'text' | 'edit';
}

export const DRAWING_TOOLS: DrawingTool[] = [
  // Selection
  {
    id: 'select',
    name: 'Select',
    icon: <Move className="w-5 h-5" />,
    description: 'Select and move objects',
    shortcut: 'V',
    category: 'select',
  },

  // Arrows
  {
    id: 'arrow',
    name: 'Straight Arrow',
    icon: <ArrowRight className="w-5 h-5" />,
    description: 'Draw straight arrows for player movement',
    shortcut: 'A',
    category: 'arrows',
  },
  {
    id: 'curved-arrow',
    name: 'Curved Arrow',
    icon: <ArrowRight className="w-5 h-5" style={{ transform: 'rotate(-15deg)' }} />,
    description: 'Draw curved arrows for runs and passes',
    shortcut: 'Shift+A',
    category: 'arrows',
  },
  {
    id: 'dashed-arrow',
    name: 'Dashed Arrow',
    icon: <ArrowRight className="w-5 h-5" style={{ strokeDasharray: '4' }} />,
    description: 'Draw dashed arrows for optional movements',
    shortcut: 'Alt+A',
    category: 'arrows',
  },

  // Lines
  {
    id: 'line',
    name: 'Line',
    icon: <Minus className="w-5 h-5" />,
    description: 'Draw straight lines',
    shortcut: 'L',
    category: 'shapes',
  },
  {
    id: 'dashed-line',
    name: 'Dashed Line',
    icon: <Minus className="w-5 h-5" style={{ strokeDasharray: '4' }} />,
    description: 'Draw dashed lines for offside or zones',
    shortcut: 'Shift+L',
    category: 'shapes',
  },

  // Shapes
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: <Square className="w-5 h-5" />,
    description: 'Draw rectangular zones',
    shortcut: 'R',
    category: 'shapes',
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: <Circle className="w-5 h-5" />,
    description: 'Draw circular zones',
    shortcut: 'C',
    category: 'shapes',
  },

  // Zones
  {
    id: 'zone',
    name: 'Tactical Zone',
    icon: <Layers className="w-5 h-5" />,
    description: 'Draw tactical zones (pressing, defending, attacking)',
    shortcut: 'Z',
    category: 'zones',
  },

  // Text
  {
    id: 'text',
    name: 'Text',
    icon: <Type className="w-5 h-5" />,
    description: 'Add text annotations',
    shortcut: 'T',
    category: 'text',
  },

  // Edit
  {
    id: 'eraser',
    name: 'Eraser',
    icon: <Eraser className="w-5 h-5" />,
    description: 'Erase drawings',
    shortcut: 'E',
    category: 'edit',
  },
];

interface AdvancedDrawingToolsProps {
  activeTool: DrawingToolType;
  onToolChange: (tool: DrawingToolType) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

export const AdvancedDrawingTools: React.FC<AdvancedDrawingToolsProps> = ({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
  ];

  const strokeWidths = [2, 4, 6, 8, 10];

  const categories = [
    { id: 'select', label: 'Select' },
    { id: 'arrows', label: 'Arrows' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'zones', label: 'Zones' },
    { id: 'text', label: 'Text' },
    { id: 'edit', label: 'Edit' },
  ];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 shadow-xl">
      {/* Tool Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryTools = DRAWING_TOOLS.filter(t => t.category === category.id);
          
          return (
            <div key={category.id}>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{category.label}</h4>
              <div className="grid grid-cols-2 gap-2">
                {categoryTools.map((tool) => (
                  <motion.button
                    key={tool.id}
                    onClick={() => onToolChange(tool.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-lg transition-all ${
                      activeTool === tool.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    title={`${tool.description}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {tool.icon}
                      <span className="text-xs font-medium">{tool.name}</span>
                      {tool.shortcut && (
                        <span className="text-xs opacity-60">{tool.shortcut}</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawing Properties */}
      <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
        {/* Color Picker */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Color</label>
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded border-2 border-gray-600"
                  style={{ backgroundColor: activeColor }}
                />
                <span className="text-white text-sm">
                  {colors.find(c => c.value === activeColor)?.name || 'Custom'}
                </span>
              </div>
              <Palette className="w-4 h-4 text-gray-400" />
            </button>

            {/* Color Palette */}
            {showColorPicker && (
              <div className="absolute z-10 mt-2 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        onColorChange(color.value);
                        setShowColorPicker(false);
                      }}
                      className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                        activeColor === color.value ? 'border-white' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
            Stroke Width: {strokeWidth}px
          </label>
          <div className="flex items-center space-x-2">
            {strokeWidths.map((width) => (
              <button
                key={width}
                onClick={() => onStrokeWidthChange(width)}
                className={`flex-1 p-2 rounded-lg transition-all ${
                  strokeWidth === width
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div
                  className="w-full rounded"
                  style={{
                    height: `${width}px`,
                    backgroundColor: strokeWidth === width ? 'white' : 'currentColor'
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Quick Tips</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Hold <kbd className="px-1 bg-gray-700 rounded">Shift</kbd> for straight lines</p>
          <p>• Hold <kbd className="px-1 bg-gray-700 rounded">Ctrl</kbd> to snap to grid</p>
          <p>• Press <kbd className="px-1 bg-gray-700 rounded">Delete</kbd> to remove selected</p>
          <p>• Press <kbd className="px-1 bg-gray-700 rounded">?</kbd> for all shortcuts</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDrawingTools;

