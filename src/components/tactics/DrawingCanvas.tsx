import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import type { DrawingTool, DrawingShape } from '../../types';
import { useResponsive } from '../../hooks';

interface DrawingCanvasProps {
  fieldRef: React.RefObject<HTMLDivElement>;
  drawingTool: DrawingTool;
  drawingColor: string;
  drawings: DrawingShape[];
  onAddDrawing: (shape: DrawingShape) => void;
  onUpdateDrawing?: (id: string, shape: Partial<DrawingShape>) => void;
  onDeleteDrawing?: (id: string) => void;
  disabled?: boolean;
  className?: string;
  performanceMode?: boolean;
  gestureEnabled?: boolean;
}

interface TextInputState {
  position: { x: number; y: number };
  value: string;
}

interface TouchState {
  startTime: number;
  startPosition: { x: number; y: number };
  lastPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  pressure?: number;
}

/**
 * Enhanced Professional Drawing Canvas
 * Advanced drawing capabilities with gesture support, smooth animations, and delightful interactions
 */
const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  fieldRef,
  drawingTool,
  drawingColor,
  drawings,
  onAddDrawing,
  onUpdateDrawing,
  onDeleteDrawing,
  disabled = false,
  className = '',
  performanceMode = false,
  gestureEnabled = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { isMobile, isTablet } = useResponsive();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [textInput, setTextInput] = useState<TextInputState | null>(null);
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [hoveredShape, setHoveredShape] = useState<string | null>(null);
  const [selectedShapes, setSelectedShapes] = useState<Set<string>>(new Set());
  const [isMultiTouchGesture, setIsMultiTouchGesture] = useState(false);

  // Animation controls
  const controls = useAnimation();
  const cursorControls = useAnimation();

  /**
   * Convert screen coordinates to field percentage coordinates
   */
  const screenToField = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!fieldRef.current) {
        return null;
      }

      const rect = fieldRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    [fieldRef]
  );

  /**
   * Convert SVG coordinates to field percentage coordinates
   */
  const svgToField = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
      if (!svgRef.current) {
        return screenToField(e.clientX, e.clientY);
      }

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    [screenToField]
  );

  /**
   * Generate unique ID for shapes
   */
  const generateShapeId = () => `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Enhanced touch support with pressure sensitivity
  const getTouchPressure = useCallback((touch: Touch): number => {
    // Use force if available (Safari/iOS), otherwise estimate from touch radius
    if ('force' in touch && touch.force > 0) {
      return Math.min(touch.force * 2, 1); // Normalize and amplify
    }
    if ('radiusX' in touch && touch.radiusX > 0) {
      return Math.min(touch.radiusX / 10, 1); // Estimate from touch area
    }
    return 0.5; // Default pressure
  }, []);

  // Smooth line generation with pressure variation
  const generateSmoothPath = useCallback(
    (points: { x: number; y: number; pressure?: number }[]) => {
      if (points.length < 2) {
        return '';
      }

      let path = `M ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length; i++) {
        const curr = points[i];
        const prev = points[i - 1];

        // Use quadratic curves for smoothness
        if (i === 1) {
          path += ` Q ${prev.x} ${prev.y} ${(prev.x + curr.x) / 2} ${(prev.y + curr.y) / 2}`;
        } else {
          const cp1x = prev.x + (curr.x - points[i - 2].x) * 0.15;
          const cp1y = prev.y + (curr.y - points[i - 2].y) * 0.15;
          path += ` Q ${cp1x} ${cp1y} ${curr.x} ${curr.y}`;
        }
      }

      return path;
    },
    []
  );

  /**
   * Enhanced drawing start with gesture recognition
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || e.button !== 0) {
        return;
      }

      const point = svgToField(e);
      if (!point) {
        return;
      }

      // Handle text tool separately with animation
      if (drawingTool === 'text') {
        setTextInput({ position: point, value: '' });
        if (!performanceMode) {
          cursorControls.start({
            scale: [1, 1.2, 1],
            transition: { duration: 0.3 },
          });
        }
        return;
      }

      // Selection mode - handle shape selection
      if (drawingTool === 'select') {
        const clickedShape = findShapeAtPoint(point);
        if (clickedShape) {
          if (e.ctrlKey || e.metaKey) {
            // Multi-select
            setSelectedShapes(prev => {
              const newSet = new Set(prev);
              if (newSet.has(clickedShape.id)) {
                newSet.delete(clickedShape.id);
              } else {
                newSet.add(clickedShape.id);
              }
              return newSet;
            });
          } else {
            // Single select
            setSelectedShapes(new Set([clickedShape.id]));
          }
        } else {
          // Clear selection
          setSelectedShapes(new Set());
        }
        return;
      }

      setIsDrawing(true);
      const newShape: DrawingShape = {
        id: generateShapeId(),
        tool: drawingTool,
        color: drawingColor,
        points: [{ ...point, pressure: 0.5 } as any],
        timestamp: Date.now(),
      };

      setCurrentShape(newShape);

      // Haptic feedback for touch devices
      if ((isMobile || isTablet) && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }

      e.preventDefault();
    },
    [
      disabled,
      drawingTool,
      drawingColor,
      svgToField,
      performanceMode,
      cursorControls,
      isMobile,
      isTablet,
    ]
  );

  // Find shape at specific point for selection
  const findShapeAtPoint = useCallback(
    (point: { x: number; y: number }): DrawingShape | null => {
      // Simple hit detection - could be enhanced with more precise algorithms
      for (const shape of drawings) {
        if (shape.tool === 'text' && shape.points.length > 0) {
          const textPoint = shape.points[0];
          const distance = Math.sqrt(
            Math.pow(point.x - textPoint.x, 2) + Math.pow(point.y - textPoint.y, 2)
          );
          if (distance < 2) {
            return shape;
          } // 2% tolerance for text
        }
        // Add other shape hit detection as needed
      }
      return null;
    },
    [drawings]
  );

  /**
   * Enhanced drawing continuation with smoothing and pressure
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing || !currentShape) {
        // Handle hover effects for selection mode
        if (drawingTool === 'select') {
          const point = svgToField(e);
          if (point) {
            const hoveredShapeAtPoint = findShapeAtPoint(point);
            setHoveredShape(hoveredShapeAtPoint?.id || null);
          }
        }
        return;
      }

      const point = svgToField(e);
      if (!point) {
        return;
      }

      // Throttle point addition for performance
      const now = Date.now();
      const lastPoint = currentShape.points[currentShape.points.length - 1];
      const timeDiff = now - ((lastPoint as any).timestamp || currentShape.timestamp);
      const distance = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2)
      );

      const updatedPoints = [...currentShape.points];

      switch (currentShape.tool) {
        case 'pen':
          // For pen tool, add continuous points with smoothing
          if (timeDiff > 10 && distance > 0.5) {
            // Throttle and minimum distance
            updatedPoints.push({ ...point, pressure: 0.5, timestamp: now } as any);
          }
          break;
        case 'arrow':
        case 'line':
        case 'zone':
          // For geometric shapes, update the end point
          if (updatedPoints.length === 1) {
            updatedPoints.push(point);
          } else {
            updatedPoints[1] = point;
          }
          break;
      }

      setCurrentShape({
        ...currentShape,
        points: updatedPoints,
      });
    },
    [isDrawing, currentShape, svgToField, drawingTool, findShapeAtPoint]
  );

  /**
   * Enhanced drawing completion with validation and effects
   */
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentShape) {
      return;
    }

    // Enhanced validation and smoothing for pen tool
    const finalShape = { ...currentShape };

    if (currentShape.tool === 'pen' && currentShape.points.length > 2) {
      // Apply smoothing to pen strokes
      const smoothedPoints = currentShape.points.filter((_, index, arr) => {
        if (index === 0 || index === arr.length - 1) {
          return true;
        }
        // Keep every nth point based on density
        return index % Math.max(1, Math.floor(arr.length / 20)) === 0;
      });
      finalShape.points = smoothedPoints;
    }

    // Only add shapes with sufficient points
    const minPoints = currentShape.tool === 'pen' ? 2 : 1;
    if (finalShape.points.length >= minPoints) {
      onAddDrawing(finalShape);

      // Success feedback
      if (!performanceMode) {
        controls.start({
          scale: [1, 1.05, 1],
          transition: { duration: 0.2 },
        });
      }

      // Haptic success feedback
      if ((isMobile || isTablet) && 'vibrate' in navigator) {
        navigator.vibrate([10, 5, 15]);
      }
    }

    setIsDrawing(false);
    setCurrentShape(null);
  }, [isDrawing, currentShape, onAddDrawing, performanceMode, controls, isMobile, isTablet]);

  /**
   * Handle text input completion
   */
  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }

    const textShape: DrawingShape = {
      id: generateShapeId(),
      tool: 'text',
      color: drawingColor,
      points: [textInput.position],
      text: textInput.value.trim(),
      timestamp: Date.now(),
    };

    onAddDrawing(textShape);
    setTextInput(null);
  }, [textInput, drawingColor, onAddDrawing]);

  /**
   * Handle text input key events
   */
  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTextSubmit();
      } else if (e.key === 'Escape') {
        setTextInput(null);
      }
    },
    [handleTextSubmit]
  );

  // Touch event handlers for gesture support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (disabled || !gestureEnabled) {
        return;
      }

      const touches = Array.from(e.touches);

      if (touches.length > 1) {
        setIsMultiTouchGesture(true);
        // Handle multi-touch gestures (zoom, rotate, etc.)
        return;
      }

      const touch = touches[0];
      const point = screenToField(touch.clientX, touch.clientY);
      if (!point) {
        return;
      }

      const pressure = getTouchPressure(touch as any as Touch);

      setTouchState({
        startTime: Date.now(),
        startPosition: point,
        lastPosition: point,
        velocity: { x: 0, y: 0 },
        pressure,
      });

      // Convert to mouse event equivalent
      const mouseEvent = {
        ...e,
        button: 0,
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as any;

      handleMouseDown(mouseEvent);
    },
    [disabled, gestureEnabled, screenToField, getTouchPressure, handleMouseDown]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (disabled || !gestureEnabled || isMultiTouchGesture) {
        return;
      }

      const touch = e.touches[0];
      if (!touch || !touchState) {
        return;
      }

      const point = screenToField(touch.clientX, touch.clientY);
      if (!point) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - touchState.startTime;
      const velocity = {
        x: (point.x - touchState.lastPosition.x) / Math.max(timeDiff, 1),
        y: (point.y - touchState.lastPosition.y) / Math.max(timeDiff, 1),
      };

      setTouchState(prev =>
        prev
          ? {
              ...prev,
              lastPosition: point,
              velocity,
              pressure: getTouchPressure(touch as any as Touch),
            }
          : null
      );

      // Convert to mouse event equivalent
      const mouseEvent = {
        ...e,
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as any;

      handleMouseMove(mouseEvent);

      e.preventDefault(); // Prevent scrolling
    },
    [
      disabled,
      gestureEnabled,
      isMultiTouchGesture,
      touchState,
      screenToField,
      getTouchPressure,
      handleMouseMove,
    ]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (disabled || !gestureEnabled) {
        return;
      }

      if (e.touches.length === 0) {
        setIsMultiTouchGesture(false);
        setTouchState(null);
      }

      handleMouseUp();
    },
    [disabled, gestureEnabled, handleMouseUp]
  );

  /**
   * Enhanced shape interaction with animation feedback
   */
  const handleShapeClick = useCallback(
    (shape: DrawingShape, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      if (drawingTool === 'select') {
        if (e?.ctrlKey || e?.metaKey) {
          // Multi-select toggle
          setSelectedShapes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(shape.id)) {
              newSet.delete(shape.id);
            } else {
              newSet.add(shape.id);
            }
            return newSet;
          });
        } else {
          // Single select or delete if already selected
          if (selectedShapes.has(shape.id) && onDeleteDrawing) {
            onDeleteDrawing(shape.id);
            setSelectedShapes(new Set());

            // Deletion feedback
            if ((isMobile || isTablet) && 'vibrate' in navigator) {
              navigator.vibrate([20, 10, 20]);
            }
          } else {
            setSelectedShapes(new Set([shape.id]));
          }
        }
      }
    },
    [drawingTool, selectedShapes, onDeleteDrawing, isMobile, isTablet]
  );

  /**
   * Enhanced shape rendering with animations and selection states
   */
  const renderShape = useCallback(
    (shape: DrawingShape, isPreview = false) => {
      const { id, tool, color, points, text } = shape;
      const isSelected = selectedShapes.has(id);
      const isHovered = hoveredShape === id;
      const opacity = isPreview ? 0.7 : isSelected ? 0.9 : 1;
      const strokeWidth = isPreview ? 0.4 : isSelected ? 0.5 : isHovered ? 0.4 : 0.3;
      const glowEffect = isSelected || isHovered;

      // Enhanced stroke properties with pressure sensitivity
      const getStrokeProps = (point: any, index: number) => {
        if (tool === 'pen' && point.pressure !== undefined) {
          return {
            strokeWidth: strokeWidth * (0.5 + point.pressure * 0.5),
            opacity: opacity * (0.7 + point.pressure * 0.3),
          };
        }
        return { strokeWidth, opacity };
      };

      const shapeElement = (() => {
        switch (tool) {
          case 'arrow':
            if (points.length < 2) {
              return null;
            }
            const [start, end] = points;

            // Calculate arrow head with dynamic sizing
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const arrowLength = 2 * (isSelected ? 1.2 : 1);
            const arrowAngle = Math.PI / 6;

            const arrowX1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
            const arrowY1 = end.y - arrowLength * Math.sin(angle - arrowAngle);
            const arrowX2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
            const arrowY2 = end.y - arrowLength * Math.sin(angle + arrowAngle);

            return (
              <g key={id} className={drawingTool === 'select' ? 'cursor-pointer' : ''}>
                {glowEffect && (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={color}
                    strokeWidth={strokeWidth * 2}
                    strokeLinecap="round"
                    opacity={0.3}
                    filter="blur(0.5px)"
                  />
                )}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  onClick={e => handleShapeClick(shape, e)}
                  style={{ transition: 'all 0.2s ease' }}
                />
                <path
                  d={`M ${end.x} ${end.y} L ${arrowX1} ${arrowY1} L ${arrowX2} ${arrowY2} Z`}
                  fill={color}
                  onClick={e => handleShapeClick(shape, e)}
                  style={{ transition: 'all 0.2s ease' }}
                />
              </g>
            );

          case 'line':
            if (points.length < 2) {
              return null;
            }
            const [lineStart, lineEnd] = points;
            return (
              <line
                key={id}
                x1={lineStart.x}
                y1={lineStart.y}
                x2={lineEnd.x}
                y2={lineEnd.y}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
                className={drawingTool === 'select' ? 'cursor-pointer' : ''}
                onClick={() => handleShapeClick(shape)}
              />
            );

          case 'zone':
            if (points.length < 2) {
              return null;
            }
            const [zoneStart, zoneEnd] = points;
            const x = Math.min(zoneStart.x, zoneEnd.x);
            const y = Math.min(zoneStart.y, zoneEnd.y);
            const width = Math.abs(zoneEnd.x - zoneStart.x);
            const height = Math.abs(zoneEnd.y - zoneStart.y);

            return (
              <rect
                key={id}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`${color}20`} // 20% opacity for fill
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
                className={drawingTool === 'select' ? 'cursor-pointer' : ''}
                onClick={() => handleShapeClick(shape)}
              />
            );

          case 'pen':
            if (points.length < 2) {
              return null;
            }

            // Use smooth path generation for better appearance
            const pathData =
              tool === 'pen' && points.length > 3
                ? generateSmoothPath(points as any)
                : `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

            return (
              <g key={id} className={drawingTool === 'select' ? 'cursor-pointer' : ''}>
                {glowEffect && (
                  <path
                    d={pathData}
                    stroke={color}
                    strokeWidth={strokeWidth * 2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.3}
                    filter="blur(0.5px)"
                  />
                )}
                <path
                  d={pathData}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  onClick={e => handleShapeClick(shape, e)}
                  style={{
                    transition: 'all 0.2s ease',
                    filter: isSelected ? 'drop-shadow(0 0 2px currentColor)' : 'none',
                  }}
                />
              </g>
            );

          case 'text':
            if (!text || points.length < 1) {
              return null;
            }
            const textInteractionClass = `pointer-events-none ${
              drawingTool === 'select' ? 'cursor-pointer' : ''
            }`.trim();
            return (
              <g key={id} className={textInteractionClass}>
                {glowEffect && (
                  <text
                    x={points[0].x}
                    y={points[0].y}
                    fill={color}
                    fontSize={isSelected ? '3' : '2.5'}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    opacity={0.3}
                    filter="blur(0.5px)"
                  >
                    {text}
                  </text>
                )}
                <text
                  x={points[0].x}
                  y={points[0].y}
                  fill={color}
                  fontSize={isSelected ? '3' : '2.5'}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  opacity={opacity}
                  onClick={e => handleShapeClick(shape, e)}
                  style={{
                    transition: 'all 0.2s ease',
                    filter: isSelected ? 'drop-shadow(0 0 1px currentColor)' : 'none',
                  }}
                >
                  {text}
                </text>
              </g>
            );

          default:
            return null;
        }
      })();

      if (!shapeElement) {
        return null;
      }

      return (
        <motion.g
          key={id}
          initial={isPreview ? { scale: 0.8, opacity: 0 } : false}
          animate={{
            scale: isSelected ? 1.05 : 1,
            opacity,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onMouseEnter={() => setHoveredShape(id)}
          onMouseLeave={() => setHoveredShape(null)}
        >
          {shapeElement}
        </motion.g>
      );
    },
    [drawingTool, handleShapeClick, selectedShapes, hoveredShape, generateSmoothPath]
  );

  // Enhanced cursor with visual feedback
  const getCursor = useCallback(() => {
    switch (drawingTool) {
      case 'select':
        return 'pointer';
      case 'pen':
        return 'crosshair';
      case 'text':
        return 'text';
      case 'arrow':
        return 'crosshair';
      case 'line':
        return 'crosshair';
      case 'zone':
        return 'crosshair';
      default:
        return 'crosshair';
    }
  }, [drawingTool]);

  // Keyboard shortcuts for enhanced productivity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedShapes.size > 0 && onDeleteDrawing) {
            selectedShapes.forEach(id => onDeleteDrawing(id));
            setSelectedShapes(new Set());
            e.preventDefault();
          }
          break;
        case 'Escape':
          setSelectedShapes(new Set());
          setTextInput(null);
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            setSelectedShapes(new Set(drawings.map(d => d.id)));
            e.preventDefault();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapes, onDeleteDrawing, drawings]);

  return (
    <>
      {/* Main SVG Drawing Canvas */}
      <svg
        ref={svgRef}
        className={`absolute inset-0 w-full h-full ${className}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          pointerEvents: disabled || textInput ? 'none' : 'auto',
          cursor: disabled ? 'default' : getCursor(),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Render all committed drawings */}
        <g className="drawings">{drawings.map(shape => renderShape(shape))}</g>

        {/* Render current drawing preview */}
        {currentShape && <g className="current-drawing">{renderShape(currentShape, true)}</g>}
      </svg>

      {/* Enhanced Text Input Overlay with Animation */}
      <AnimatePresence>
        {textInput && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute pointer-events-auto z-50"
            style={{
              left: `${textInput.position.x}%`,
              top: `${textInput.position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <motion.input
              type="text"
              value={textInput.value}
              onChange={e => setTextInput({ ...textInput, value: e.target.value })}
              onBlur={handleTextSubmit}
              onKeyDown={handleTextKeyDown}
              autoFocus
              whileFocus={{ scale: 1.05 }}
              className="
                px-3 py-2 text-sm font-medium text-center rounded-lg border-2 outline-none
                bg-slate-800/95 backdrop-blur-md text-white shadow-lg
                transition-all duration-200
              "
              style={{
                borderColor: drawingColor,
                color: drawingColor,
                minWidth: '120px',
                boxShadow: `0 0 0 1px ${drawingColor}20, 0 4px 12px rgba(0,0,0,0.3)`,
              }}
              placeholder="Enter text..."
            />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap">
              Press Enter to confirm, Esc to cancel
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Controls */}
      <AnimatePresence>
        {selectedShapes.size > 0 && drawingTool === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-slate-800/95 backdrop-blur-md rounded-lg px-4 py-2 border border-slate-600/50 shadow-lg">
              <span className="text-slate-300 text-sm">
                {selectedShapes.size} shape{selectedShapes.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  if (onDeleteDrawing) {
                    selectedShapes.forEach(id => onDeleteDrawing(id));
                    setSelectedShapes(new Set());
                  }
                }}
                className="px-2 py-1 bg-red-600/80 hover:bg-red-700 text-white text-xs rounded transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedShapes(new Set())}
                className="px-2 py-1 bg-slate-600/80 hover:bg-slate-700 text-white text-xs rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DrawingCanvas;
