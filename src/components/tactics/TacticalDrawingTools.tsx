import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Pen,
  ArrowRight,
  Square,
  Circle,
  Triangle,
  Eraser,
  Undo,
  Redo,
  Palette,
  Settings,
  Save,
  Trash2,
} from 'lucide-react';

export interface DrawingShape {
  id: string;
  type: 'line' | 'arrow' | 'rectangle' | 'circle' | 'triangle' | 'zone' | 'text';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  timestamp: number;
}

export interface TacticalDrawingToolsProps {
  isVisible: boolean;
  onClose: () => void;
  onSaveDrawing: (shapes: DrawingShape[]) => void;
  initialShapes?: DrawingShape[];
  fieldDimensions?: { width: number; height: number };
  viewMode?: 'standard' | 'fullscreen' | 'presentation';
}

type DrawingTool =
  | 'select'
  | 'pen'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'zone'
  | 'text'
  | 'eraser';

const COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#10b981', // emerald
  '#6366f1', // indigo
  '#ffffff', // white
];

const TacticalDrawingTools: React.FC<TacticalDrawingToolsProps> = ({
  isVisible,
  onClose,
  onSaveDrawing,
  initialShapes = [],
  fieldDimensions = { width: 800, height: 600 },
  viewMode = 'standard',
}) => {
  const [shapes, setShapes] = useState<DrawingShape[]>(initialShapes);
  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [history, setHistory] = useState<DrawingShape[][]>([initialShapes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<SVGSVGElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Convert screen coordinates to field percentage coordinates
  const screenToField = useCallback((clientX: number, clientY: number) => {
    if (!fieldRef.current) {
      return { x: 0, y: 0 };
    }

    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }, []);

  // Add shape to history for undo/redo
  const addToHistory = useCallback(
    (newShapes: DrawingShape[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...newShapes]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex],
  );

  // Generate unique ID for shapes
  const generateId = () => `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Start drawing
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (activeTool === 'select' || activeTool === 'eraser') {
        return;
      }

      const point = screenToField(event.clientX, event.clientY);

      if (activeTool === 'text') {
        setTextPosition(point);
        return;
      }

      const newShape: DrawingShape = {
        id: generateId(),
        type: activeTool === 'pen' ? 'line' : activeTool === 'zone' ? 'zone' : activeTool,
        points: [point],
        color: currentColor,
        strokeWidth,
        opacity,
        timestamp: Date.now(),
      };

      setCurrentShape(newShape);
      setIsDrawing(true);
    },
    [activeTool, screenToField, currentColor, strokeWidth, opacity],
  );

  // Continue drawing
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDrawing || !currentShape) {
        return;
      }

      const point = screenToField(event.clientX, event.clientY);

      if (currentShape.type === 'line' || currentShape.type === 'zone') {
        // For lines and zones, add points continuously
        setCurrentShape(prev =>
          prev
            ? {
                ...prev,
                points: [...prev.points, point],
              }
            : null,
        );
      } else {
        // For shapes like rectangles, circles, arrows - update end point
        setCurrentShape(prev =>
          prev
            ? {
                ...prev,
                points: [prev.points[0], point],
              }
            : null,
        );
      }
    },
    [isDrawing, currentShape, screenToField],
  );

  // Finish drawing
  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentShape) {
      const newShapes = [...shapes, currentShape];
      setShapes(newShapes);
      addToHistory(newShapes);
      setCurrentShape(null);
    }
    setIsDrawing(false);
  }, [isDrawing, currentShape, shapes, addToHistory]);

  // Handle eraser
  const handleShapeClick = useCallback(
    (shapeId: string) => {
      if (activeTool === 'eraser') {
        const newShapes = shapes.filter(s => s.id !== shapeId);
        setShapes(newShapes);
        addToHistory(newShapes);
      }
    },
    [activeTool, shapes, addToHistory],
  );

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setShapes(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setShapes(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Clear all drawings
  const clearAll = useCallback(() => {
    setShapes([]);
    addToHistory([]);
  }, [addToHistory]);

  // Add text
  const addText = useCallback(() => {
    if (textPosition && textInput.trim()) {
      const textShape: DrawingShape = {
        id: generateId(),
        type: 'text',
        points: [textPosition],
        color: currentColor,
        strokeWidth,
        opacity,
        text: textInput.trim(),
        timestamp: Date.now(),
      };

      const newShapes = [...shapes, textShape];
      setShapes(newShapes);
      addToHistory(newShapes);
      setTextInput('');
      setTextPosition(null);
    }
  }, [textPosition, textInput, currentColor, strokeWidth, opacity, shapes, addToHistory]);

  // Render individual shape
  const renderShape = (shape: DrawingShape) => {
    const key = shape.id;

    switch (shape.type) {
      case 'line':
        return (
          <path
            key={key}
            d={`M ${shape.points.map(p => `${(p.x / 100) * fieldDimensions.width} ${(p.y / 100) * fieldDimensions.height}`).join(' L ')}`}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            strokeOpacity={shape.opacity}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => handleShapeClick(shape.id)}
            className={activeTool === 'eraser' ? 'cursor-pointer hover:stroke-red-500' : ''}
          />
        );

      case 'arrow':
        if (shape.points.length >= 2) {
          const start = shape.points[0];
          const end = shape.points[shape.points.length - 1];
          const startX = (start.x / 100) * fieldDimensions.width;
          const startY = (start.y / 100) * fieldDimensions.height;
          const endX = (end.x / 100) * fieldDimensions.width;
          const endY = (end.y / 100) * fieldDimensions.height;

          // Calculate arrow head
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowLength = 15;
          const arrowAngle = Math.PI / 6;

          const arrowX1 = endX - arrowLength * Math.cos(angle - arrowAngle);
          const arrowY1 = endY - arrowLength * Math.sin(angle - arrowAngle);
          const arrowX2 = endX - arrowLength * Math.cos(angle + arrowAngle);
          const arrowY2 = endY - arrowLength * Math.sin(angle + arrowAngle);

          return (
            <g
              key={key}
              onClick={() => handleShapeClick(shape.id)}
              className={activeTool === 'eraser' ? 'cursor-pointer' : ''}
            >
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={shape.color}
                strokeWidth={shape.strokeWidth}
                strokeOpacity={shape.opacity}
                strokeLinecap="round"
              />
              <path
                d={`M ${endX} ${endY} L ${arrowX1} ${arrowY1} L ${arrowX2} ${arrowY2} Z`}
                fill={shape.color}
                fillOpacity={shape.opacity}
              />
            </g>
          );
        }
        return null;

      case 'rectangle':
        if (shape.points.length >= 2) {
          const start = shape.points[0];
          const end = shape.points[1];
          const x = Math.min(start.x, end.x);
          const y = Math.min(start.y, end.y);
          const width = Math.abs(end.x - start.x);
          const height = Math.abs(end.y - start.y);

          return (
            <rect
              key={key}
              x={(x / 100) * fieldDimensions.width}
              y={(y / 100) * fieldDimensions.height}
              width={(width / 100) * fieldDimensions.width}
              height={(height / 100) * fieldDimensions.height}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              strokeOpacity={shape.opacity}
              fill="none"
              onClick={() => handleShapeClick(shape.id)}
              className={activeTool === 'eraser' ? 'cursor-pointer hover:stroke-red-500' : ''}
            />
          );
        }
        return null;

      case 'circle':
        if (shape.points.length >= 2) {
          const center = shape.points[0];
          const edge = shape.points[1];
          const radius = Math.sqrt(
            Math.pow(((edge.x - center.x) * fieldDimensions.width) / 100, 2) +
              Math.pow(((edge.y - center.y) * fieldDimensions.height) / 100, 2),
          );

          return (
            <circle
              key={key}
              cx={(center.x / 100) * fieldDimensions.width}
              cy={(center.y / 100) * fieldDimensions.height}
              r={radius}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              strokeOpacity={shape.opacity}
              fill="none"
              onClick={() => handleShapeClick(shape.id)}
              className={activeTool === 'eraser' ? 'cursor-pointer hover:stroke-red-500' : ''}
            />
          );
        }
        return null;

      case 'zone':
        if (shape.points.length >= 3) {
          return (
            <path
              key={key}
              d={`M ${shape.points.map(p => `${(p.x / 100) * fieldDimensions.width} ${(p.y / 100) * fieldDimensions.height}`).join(' L ')} Z`}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              strokeOpacity={shape.opacity}
              fill={shape.color}
              fillOpacity={shape.opacity * 0.2}
              onClick={() => handleShapeClick(shape.id)}
              className={activeTool === 'eraser' ? 'cursor-pointer hover:stroke-red-500' : ''}
            />
          );
        }
        return null;

      case 'text':
        if (shape.points.length >= 1 && shape.text) {
          return (
            <text
              key={key}
              x={(shape.points[0].x / 100) * fieldDimensions.width}
              y={(shape.points[0].y / 100) * fieldDimensions.height}
              fill={shape.color}
              fillOpacity={shape.opacity}
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              onClick={() => handleShapeClick(shape.id)}
              className={activeTool === 'eraser' ? 'cursor-pointer hover:fill-red-500' : ''}
            >
              {shape.text}
            </text>
          );
        }
        return null;

      default:
        return null;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-800 "
    >
      <div className="flex h-full">
        {/* Drawing Canvas */}
        <div className="flex-1 relative">
          <div
            ref={fieldRef}
            className="absolute inset-4 bg-green-700 rounded-lg cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
          >
            {/* Field markings background */}
            <svg
              ref={canvasRef}
              width="100%"
              height="100%"
              className="absolute inset-0"
              viewBox={`0 0 ${fieldDimensions.width} ${fieldDimensions.height}`}
            >
              {/* Render all shapes */}
              {shapes.map(renderShape)}

              {/* Render current drawing shape */}
              {currentShape && renderShape(currentShape)}
            </svg>
          </div>
        </div>

        {/* Toolbar */}
        <motion.div
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          exit={{ x: 100 }}
          className="w-80 bg-slate-800/95  border-l border-slate-600 p-4 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-lg">Tactical Drawing</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tools */}
          <div className="mb-6">
            <label className="text-slate-300 text-sm font-medium mb-3 block">Drawing Tools</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { tool: 'pen' as DrawingTool, icon: Pen, label: 'Pen' },
                { tool: 'arrow' as DrawingTool, icon: ArrowRight, label: 'Arrow' },
                { tool: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle' },
                { tool: 'circle' as DrawingTool, icon: Circle, label: 'Circle' },
                { tool: 'zone' as DrawingTool, icon: Triangle, label: 'Zone' },
                { tool: 'eraser' as DrawingTool, icon: Eraser, label: 'Eraser' },
              ].map(({ tool, icon: Icon, label }) => (
                <button
                  key={tool}
                  onClick={() => setActiveTool(tool)}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    activeTool === tool
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          {textPosition && (
            <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Add Text</label>
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="w-full p-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 mb-2"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={addText}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setTextPosition(null);
                    setTextInput('');
                  }}
                  className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Colors */}
          <div className="mb-6">
            <label className="text-slate-300 text-sm font-medium mb-3 block">Color</label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    currentColor === color
                      ? 'border-white scale-110'
                      : 'border-slate-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="mb-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full text-slate-300 text-sm font-medium mb-3"
            >
              <span>Settings</span>
              <Settings
                className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Stroke Width</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={strokeWidth}
                      onChange={e => setStrokeWidth(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-slate-400 text-xs">{strokeWidth}px</span>
                  </div>

                  <div>
                    <label className="text-slate-400 text-xs mb-1 block">Opacity</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={opacity}
                      onChange={e => setOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-slate-400 text-xs">{Math.round(opacity * 100)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="flex-1 flex items-center justify-center p-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo className="w-4 h-4 mr-2" />
                Undo
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="flex-1 flex items-center justify-center p-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo className="w-4 h-4 mr-2" />
                Redo
              </button>
            </div>

            <button
              onClick={clearAll}
              className="w-full flex items-center justify-center p-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </button>

            <button
              onClick={() => onSaveDrawing(shapes)}
              className="w-full flex items-center justify-center p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Drawing
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-slate-600">
            <div className="text-slate-400 text-xs">
              <div>Shapes: {shapes.length}</div>
              <div>Tool: {activeTool}</div>
              <div>Color: {currentColor}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TacticalDrawingTools;
