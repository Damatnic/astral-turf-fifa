import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import type { DrawingShape, Position } from '../../types';

interface AdvancedVectorDrawingCanvasProps {
  fieldRef: React.RefObject<HTMLDivElement>;
}

interface VectorShape extends DrawingShape {
  strokeWidth?: number;
  opacity?: number;
  dashArray?: string;
  gradient?: {
    start: string;
    end: string;
    direction: 'horizontal' | 'vertical' | 'radial';
  };
  shadow?: {
    blur: number;
    color: string;
    offset: Position;
  };
  layer?: number;
}

interface DrawingState {
  isDrawing: boolean;
  currentDrawing: VectorShape | null;
  selectedShapeId: string | null;
  hoveredShapeId: string | null;
  drawingMode: 'create' | 'edit' | 'select';
  snapToGrid: boolean;
  snapToPlayers: boolean;
  layers: { [key: number]: boolean }; // layer visibility
}

// Shape manipulation handles
const SelectionHandles: React.FC<{
  shape: VectorShape;
  onUpdate: (shape: VectorShape) => void;
  onDelete: () => void;
}> = React.memo(({ shape, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<'move' | 'resize' | null>(null);

  if (!shape.points || shape.points.length === 0) return null;

  const firstPoint = shape.points[0];
  const lastPoint = shape.points[shape.points.length - 1];

  const handleMouseDown = useCallback((e: React.MouseEvent, handleType: 'move' | 'resize') => {
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handleType);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  const handles = useMemo(() => {
    const result = [];

    // Move handle (center)
    if (shape.tool === 'zone' && shape.points.length >= 2) {
      const centerX = (firstPoint.x + lastPoint.x) / 2;
      const centerY = (firstPoint.y + lastPoint.y) / 2;
      
      result.push(
        <circle
          key="move-handle"
          cx={centerX}
          cy={centerY}
          r="1.5"
          fill="rgba(59, 130, 246, 0.8)"
          stroke="white"
          strokeWidth="0.3"
          className="cursor-move"
          onMouseDown={e => handleMouseDown(e, 'move')}
        />
      );
    }

    // Resize handles for zones and arrows
    if (shape.tool === 'zone' || shape.tool === 'arrow') {
      shape.points.forEach((point, index) => {
        result.push(
          <rect
            key={`resize-handle-${index}`}
            x={point.x - 1}
            y={point.y - 1}
            width="2"
            height="2"
            fill="rgba(59, 130, 246, 0.8)"
            stroke="white"
            strokeWidth="0.2"
            className="cursor-pointer"
            onMouseDown={e => handleMouseDown(e, 'resize')}
          />
        );
      });
    }

    // Delete button
    result.push(
      <g key="delete-button" transform={`translate(${firstPoint.x + 3}, ${firstPoint.y - 3})`}>
        <circle
          cx="0"
          cy="0"
          r="1.5"
          fill="rgba(239, 68, 68, 0.9)"
          stroke="white"
          strokeWidth="0.2"
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
        <path
          d="M -0.8 -0.8 L 0.8 0.8 M 0.8 -0.8 L -0.8 0.8"
          stroke="white"
          strokeWidth="0.3"
          className="pointer-events-none"
        />
      </g>
    );

    return result;
  }, [shape, firstPoint, lastPoint, handleMouseDown, onDelete]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragHandle === 'move') {
        // Move entire shape
        const deltaX = e.movementX * 0.1; // Scale movement
        const deltaY = e.movementY * 0.1;
        
        const updatedPoints = shape.points.map(point => ({
          x: Math.max(0, Math.min(100, point.x + deltaX)),
          y: Math.max(0, Math.min(100, point.y + deltaY)),
        }));

        onUpdate({ ...shape, points: updatedPoints });
      }
    };

    const handleMouseUpGlobal = () => {
      setIsDragging(false);
      setDragHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUpGlobal);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [isDragging, dragHandle, shape, onUpdate]);

  return <g className="selection-handles">{handles}</g>;
});

// Advanced shape renderer with vector graphics
const VectorShapeRenderer: React.FC<{
  shape: VectorShape;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onUpdate: (shape: VectorShape) => void;
  onDelete: () => void;
}> = React.memo(({ shape, isSelected, isHovered, onSelect, onUpdate, onDelete }) => {
  if (!shape || !shape.points || shape.points.length === 0) return null;

  const { id, tool, color = '#ffffff', points, strokeWidth = 0.5, opacity = 1, dashArray, gradient, shadow } = shape;

  // Generate unique IDs for gradients and filters
  const gradientId = `gradient-${id}`;
  const shadowId = `shadow-${id}`;

  const renderDefs = () => (
    <defs>
      {/* Gradient definition */}
      {gradient && (
        gradient.direction === 'radial' ? (
          <radialGradient id={gradientId}>
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </radialGradient>
        ) : (
          <linearGradient
            id={gradientId}
            x1={gradient.direction === 'horizontal' ? '0%' : '50%'}
            y1={gradient.direction === 'vertical' ? '0%' : '50%'}
            x2={gradient.direction === 'horizontal' ? '100%' : '50%'}
            y2={gradient.direction === 'vertical' ? '100%' : '50%'}
          >
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </linearGradient>
        )
      )}

      {/* Shadow filter */}
      {shadow && (
        <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx={shadow.offset.x}
            dy={shadow.offset.y}
            stdDeviation={shadow.blur}
            floodColor={shadow.color}
            floodOpacity="0.6"
          />
        </filter>
      )}
    </defs>
  );

  const getStroke = () => {
    if (gradient) return `url(#${gradientId})`;
    return color;
  };

  const getFill = () => {
    if (tool === 'zone') {
      if (gradient) return `url(#${gradientId})`;
      return `${color}33`; // 20% opacity
    }
    return 'none';
  };

  const commonProps = {
    stroke: getStroke(),
    strokeWidth: strokeWidth * (isHovered ? 1.5 : 1),
    opacity: opacity * (isSelected ? 1 : 0.8),
    fill: getFill(),
    strokeDasharray: dashArray,
    filter: shadow ? `url(#${shadowId})` : undefined,
    className: `vector-shape cursor-pointer transition-all duration-200 ${
      isHovered ? 'hover:stroke-opacity-100' : ''
    }`,
    onClick: onSelect,
    onMouseEnter: () => {},
    onMouseLeave: () => {},
  };

  const renderShape = () => {
    switch (tool) {
      case 'arrow': {
        if (points.length < 2) return null;
        const start = points[0];
        const end = points[points.length - 1];
        
        return (
          <g>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              {...commonProps}
              markerEnd={`url(#arrowhead-${color.replace('#', '')})`}
            />
            {/* Arrow shaft enhancement */}
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={color}
              strokeWidth={strokeWidth * 2}
              opacity={0.3}
              className="pointer-events-none"
            />
          </g>
        );
      }

      case 'zone': {
        if (points.length < 2) return null;
        const start = points[0];
        const end = points[points.length - 1];
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(start.x - end.x);
        const height = Math.abs(start.y - end.y);
        
        return (
          <g>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              {...commonProps}
              rx={strokeWidth}
              ry={strokeWidth}
            />
            {/* Corner indicators */}
            {isSelected && (
              <>
                <circle cx={x} cy={y} r="0.5" fill={color} opacity="0.7" />
                <circle cx={x + width} cy={y} r="0.5" fill={color} opacity="0.7" />
                <circle cx={x} cy={y + height} r="0.5" fill={color} opacity="0.7" />
                <circle cx={x + width} cy={y + height} r="0.5" fill={color} opacity="0.7" />
              </>
            )}
          </g>
        );
      }

      case 'pen': {
        if (points.length < 2) return null;
        
        // Validate first point before accessing properties
        if (!points[0] || typeof points[0].x !== 'number' || typeof points[0].y !== 'number') {
          return null;
        }
        
        // Create smooth curve using quadratic bezier
        let pathData = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length - 1; i++) {
          const current = points[i];
          const next = points[i + 1];
          
          // Validate current and next points before accessing properties
          if (!current || !next || 
              typeof current.x !== 'number' || typeof current.y !== 'number' ||
              typeof next.x !== 'number' || typeof next.y !== 'number') {
            continue;
          }
          
          const controlX = (current.x + next.x) / 2;
          const controlY = (current.y + next.y) / 2;
          
          pathData += ` Q ${current.x} ${current.y} ${controlX} ${controlY}`;
        }
        
        if (points.length > 1) {
          const lastPoint = points[points.length - 1];
          if (lastPoint && typeof lastPoint.x === 'number' && typeof lastPoint.y === 'number') {
            pathData += ` L ${lastPoint.x} ${lastPoint.y}`;
          }
        }
        
        return (
          <g>
            <path
              d={pathData}
              {...commonProps}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Glow effect for pen strokes */}
            <path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth * 3}
              opacity={0.2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
          </g>
        );
      }

      case 'text': {
        if (!shape.text || points.length < 1) return null;
        const point = points[0];
        
        return (
          <g>
            {/* Text background */}
            <rect
              x={point.x - shape.text.length * 1.2}
              y={point.y - 2}
              width={shape.text.length * 2.4}
              height={4}
              fill="rgba(0, 0, 0, 0.7)"
              rx="0.5"
              className="pointer-events-none"
            />
            <text
              x={point.x}
              y={point.y}
              {...commonProps}
              fill={getStroke()}
              fontSize={strokeWidth * 4}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Inter, sans-serif"
            >
              {shape.text}
            </text>
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <g className={`vector-shape-container layer-${shape.layer || 0}`}>
      {renderDefs()}
      {renderShape()}
      {isSelected && (
        <SelectionHandles
          shape={shape}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </g>
  );
});

const AdvancedVectorDrawingCanvas: React.FC<AdvancedVectorDrawingCanvasProps> = ({ fieldRef }) => {
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { drawingTool, drawingColor, isPresentationMode } = uiState;
  const { drawings } = tacticsState;

  const canvasRef = useRef<SVGSVGElement>(null);
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentDrawing: null,
    selectedShapeId: null,
    hoveredShapeId: null,
    drawingMode: 'create',
    snapToGrid: false,
    snapToPlayers: false,
    layers: { 0: true, 1: true, 2: true },
  });

  const [textInput, setTextInput] = useState<{
    position: Position;
    value: string;
  } | null>(null);

  // Enhanced coordinate conversion with field boundaries
  const getFieldCoordinates = useCallback((e: React.MouseEvent<SVGSVGElement>): Position | null => {
    if (!fieldRef?.current || !canvasRef.current) return null;

    const svg = canvasRef.current;
    const fieldRect = fieldRef.current.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    // Calculate relative position within the field
    const relativeX = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
    const relativeY = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, relativeX)),
      y: Math.max(0, Math.min(100, relativeY)),
    };
  }, [fieldRef]);

  // Grid snapping functionality
  const snapToGrid = useCallback((position: Position): Position => {
    if (!drawingState.snapToGrid) return position;

    const gridSize = 5; // 5% grid
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  }, [drawingState.snapToGrid]);

  // Enhanced drawing handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingTool === 'select' || e.button !== 0 || isPresentationMode) return;

    const startPoint = getFieldCoordinates(e);
    if (!startPoint) return;

    const snappedPoint = snapToGrid(startPoint);

    if (drawingTool === 'text') {
      setTextInput({ position: snappedPoint, value: '' });
      return;
    }

    setDrawingState(prev => ({ ...prev, isDrawing: true }));

    const newDrawing: VectorShape = {
      id: `vector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool: drawingTool || 'pen',
      color: drawingColor || '#ffffff',
      points: [snappedPoint],
      strokeWidth: drawingTool === 'pen' ? 0.5 : 0.8,
      opacity: 1,
      layer: 0,
      shadow: drawingTool === 'zone' ? {
        blur: 2,
        color: drawingColor || '#ffffff',
        offset: { x: 1, y: 1 }
      } : undefined,
    };

    setDrawingState(prev => ({ ...prev, currentDrawing: newDrawing }));
  }, [drawingTool, drawingColor, isPresentationMode, getFieldCoordinates, snapToGrid]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingState.isDrawing || !drawingState.currentDrawing) return;

    const currentPoint = getFieldCoordinates(e);
    if (!currentPoint) return;

    const snappedPoint = snapToGrid(currentPoint);

    setDrawingState(prev => {
      if (!prev.currentDrawing) return prev;

      const updatedPoints = [...prev.currentDrawing.points];

      if (drawingTool === 'arrow' || drawingTool === 'zone') {
        updatedPoints[1] = snappedPoint;
      } else if (drawingTool === 'pen') {
        // Add smoothing for pen tool
        const lastPoint = updatedPoints[updatedPoints.length - 1];
        const distance = Math.sqrt(
          Math.pow(snappedPoint.x - lastPoint.x, 2) + 
          Math.pow(snappedPoint.y - lastPoint.y, 2)
        );
        
        // Only add point if it's far enough for smooth drawing
        if (distance > 1) {
          updatedPoints.push(snappedPoint);
        }
      }

      return {
        ...prev,
        currentDrawing: { ...prev.currentDrawing, points: updatedPoints },
      };
    });
  }, [drawingState.isDrawing, drawingState.currentDrawing, getFieldCoordinates, snapToGrid, drawingTool]);

  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !drawingState.currentDrawing) return;

    const points = drawingState.currentDrawing.points;
    const shouldSave = 
      points.length > 1 || 
      (drawingTool === 'pen' && points.length > 1) ||
      (drawingTool === 'text' && drawingState.currentDrawing.text);

    if (shouldSave) {
      tacticsDispatch({ 
        type: 'ADD_DRAWING', 
        payload: drawingState.currentDrawing 
      });
    }

    setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      currentDrawing: null,
    }));
  }, [drawingState.isDrawing, drawingState.currentDrawing, drawingTool, tacticsDispatch]);

  // Text input handlers
  const finalizeText = useCallback(() => {
    if (!textInput?.value.trim()) {
      setTextInput(null);
      return;
    }

    const textShape: VectorShape = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tool: 'text',
      color: drawingColor || '#ffffff',
      points: [textInput.position],
      text: textInput.value.trim(),
      strokeWidth: 1,
      opacity: 1,
      layer: 1,
    };

    tacticsDispatch({ type: 'ADD_DRAWING', payload: textShape });
    setTextInput(null);
  }, [textInput, drawingColor, tacticsDispatch]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finalizeText();
    } else if (e.key === 'Escape') {
      setTextInput(null);
    }
  }, [finalizeText]);

  // Shape selection and manipulation
  const handleShapeSelect = useCallback((shapeId: string) => {
    setDrawingState(prev => ({
      ...prev,
      selectedShapeId: prev.selectedShapeId === shapeId ? null : shapeId,
      drawingMode: 'select',
    }));
  }, []);

  const handleShapeUpdate = useCallback((updatedShape: VectorShape) => {
    tacticsDispatch({
      type: 'UPDATE_DRAWING',
      payload: updatedShape,
    });
  }, [tacticsDispatch]);

  const handleShapeDelete = useCallback((shapeId: string) => {
    tacticsDispatch({
      type: 'DELETE_DRAWING',
      payload: shapeId,
    });
    setDrawingState(prev => ({ ...prev, selectedShapeId: null }));
  }, [tacticsDispatch]);

  // Render all arrow markers
  const uniqueColors = useMemo(() => [
    ...new Set([
      ...(drawings || []).map(d => d.color).filter(Boolean),
      drawingColor || '#ffffff'
    ])
  ], [drawings, drawingColor]);

  const eventHandlers = drawingTool !== 'select' && !textInput ? {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
  } : {};

  return (
    <>
      <svg
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          pointerEvents: drawingTool === 'select' || !!textInput ? 'auto' : 'auto',
          zIndex: 15 
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        {...eventHandlers}
      >
        <defs>
          {/* Enhanced arrow markers */}
          {uniqueColors.map(color => {
            const safeColor = color || '#ffffff';
            return (
              <marker
                key={`arrowhead-${safeColor.replace('#', '')}`}
                id={`arrowhead-${safeColor.replace('#', '')}`}
                viewBox="0 0 12 12"
                refX="10"
                refY="6"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
                markerUnits="strokeWidth"
              >
                <path
                  d="M 1 1 L 10 6 L 1 11 L 4 6 Z"
                  fill={safeColor}
                  stroke={safeColor}
                  strokeWidth="0.5"
                />
              </marker>
            );
          })}

          {/* Grid pattern */}
          {drawingState.snapToGrid && (
            <pattern
              id="grid-pattern"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2.5" cy="2.5" r="0.1" fill="rgba(255,255,255,0.3)" />
            </pattern>
          )}
        </defs>

        {/* Grid overlay */}
        {drawingState.snapToGrid && (
          <rect
            width="100"
            height="100"
            fill="url(#grid-pattern)"
            className="pointer-events-none"
            opacity="0.5"
          />
        )}

        {/* Render all drawings by layer */}
        {Object.keys(drawingState.layers)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(layerNum => {
            const layer = parseInt(layerNum);
            if (!drawingState.layers[layer]) return null;

            return (
              <g key={`layer-${layer}`} className={`drawing-layer-${layer}`}>
                {(drawings || [])
                  .filter(shape => (shape.layer || 0) === layer)
                  .map(shape => (
                    <VectorShapeRenderer
                      key={shape.id}
                      shape={shape}
                      isSelected={drawingState.selectedShapeId === shape.id}
                      isHovered={drawingState.hoveredShapeId === shape.id}
                      onSelect={() => handleShapeSelect(shape.id)}
                      onUpdate={handleShapeUpdate}
                      onDelete={() => handleShapeDelete(shape.id)}
                    />
                  ))}
              </g>
            );
          })}

        {/* Current drawing preview */}
        {drawingState.currentDrawing && (
          <VectorShapeRenderer
            shape={drawingState.currentDrawing}
            isSelected={false}
            isHovered={false}
            onSelect={() => {}}
            onUpdate={() => {}}
            onDelete={() => {}}
          />
        )}
      </svg>

      {/* Text input overlay */}
      {textInput && (
        <div
          className="absolute z-50 pointer-events-auto"
          style={{
            left: `${textInput.position.x}%`,
            top: `${textInput.position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <input
            type="text"
            value={textInput.value}
            onChange={e => setTextInput({ ...textInput, value: e.target.value })}
            onBlur={finalizeText}
            onKeyDown={handleTextKeyDown}
            autoFocus
            className="px-3 py-2 rounded-lg border-2 outline-none text-center font-medium backdrop-blur-md"
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderColor: drawingColor || '#ffffff',
              color: drawingColor || '#ffffff',
              minWidth: '120px',
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px ${drawingColor}44`,
            }}
            placeholder="Enter text..."
          />
        </div>
      )}

      {/* Layer controls */}
      <div className="absolute top-4 right-4 z-30 bg-gray-900/80 backdrop-blur-md rounded-lg p-2 border border-white/20">
        <div className="text-xs text-white/70 mb-2 font-medium">Layers</div>
        {Object.keys(drawingState.layers).map(layerNum => {
          const layer = parseInt(layerNum);
          return (
            <label key={layer} className="flex items-center space-x-2 mb-1">
              <input
                type="checkbox"
                checked={drawingState.layers[layer]}
                onChange={(e) => setDrawingState(prev => ({
                  ...prev,
                  layers: { ...prev.layers, [layer]: e.target.checked }
                }))}
                className="w-3 h-3"
              />
              <span className="text-xs text-white/80">Layer {layer}</span>
            </label>
          );
        })}
        
        <div className="border-t border-white/20 mt-2 pt-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={drawingState.snapToGrid}
              onChange={(e) => setDrawingState(prev => ({ ...prev, snapToGrid: e.target.checked }))}
              className="w-3 h-3"
            />
            <span className="text-xs text-white/80">Snap to Grid</span>
          </label>
        </div>
      </div>
    </>
  );
};

export default React.memo(AdvancedVectorDrawingCanvas);