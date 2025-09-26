import React, { useState, type MouseEvent as ReactMouseEvent, type KeyboardEvent } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import type { DrawingShape } from '../../types';

interface DrawingCanvasProps {
  fieldRef: React.RefObject<HTMLDivElement>;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ fieldRef }) => {
  const { uiState, dispatch: uiDispatch } = useUIContext();
  const { tacticsState, dispatch: tacticsDispatch } = useTacticsContext();
  const { drawingTool, drawingColor, isPresentationMode } = uiState;
  const { drawings } = tacticsState;

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingShape | null>(null);
  const [textInput, setTextInput] = useState<{
    position: { x: number; y: number };
    value: string;
  } | null>(null);

  const getPointerPosition = (e: ReactMouseEvent): { x: number; y: number } | null => {
    if (!fieldRef?.current) {
      return null;
    }
    const fieldRect = fieldRef.current.getBoundingClientRect();
    if (!fieldRect) {
      return null;
    }
    return {
      x: ((e.clientX - fieldRect.left) / fieldRect.width) * 100,
      y: ((e.clientY - fieldRect.top) / fieldRect.height) * 100,
    };
  };

  const getSvgPointerPosition = (
    e: ReactMouseEvent<SVGSVGElement>,
  ): { x: number; y: number } | null => {
    const svg = e.currentTarget;
    if (!svg) {
      return getPointerPosition(e);
    }
    const CTM = svg.getScreenCTM();
    if (!CTM) {
      return getPointerPosition(e);
    } // Fallback
    const pt = svg.createSVGPoint();
    if (!pt) {
      return getPointerPosition(e);
    }
    pt.x = e.clientX;
    pt.y = e.clientY;
    const inverse = CTM.inverse();
    if (!inverse) {
      return getPointerPosition(e);
    }
    const transformedPt = pt.matrixTransform(inverse);
    if (!transformedPt) {
      return getPointerPosition(e);
    }
    const { x, y } = transformedPt;
    return { x, y };
  };

  const handleMouseDown = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (drawingTool === 'select' || e?.button !== 0 || isPresentationMode) {
      return;
    }

    const startPoint = getSvgPointerPosition(e);
    if (!startPoint) {
      return;
    }

    if (drawingTool === 'text') {
      const htmlPos = getPointerPosition(e);
      if (htmlPos) {
        setTextInput({ position: htmlPos, value: '' });
      }
      return;
    }

    setIsDrawing(true);
    const newDrawing: DrawingShape = {
      id: `drawing-${Date.now()}`,
      tool: drawingTool ?? 'pen',
      color: drawingColor ?? '#ffffff',
      points: [startPoint],
    };
    setCurrentDrawing(newDrawing);
  };

  const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentDrawing) {
      return;
    }

    const currentPoint = getSvgPointerPosition(e);
    if (!currentPoint) {
      return;
    }

    const updatedPoints = [...(currentDrawing?.points ?? [])];
    if (drawingTool === 'arrow' || drawingTool === 'zone' || drawingTool === 'line') {
      updatedPoints[1] = currentPoint;
    } else if (drawingTool === 'pen') {
      updatedPoints.push(currentPoint);
    }

    setCurrentDrawing({ ...currentDrawing, points: updatedPoints });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentDrawing) {
      return;
    }

    setIsDrawing(false);
    const points = currentDrawing?.points ?? [];
    if (points.length > 1 || (drawingTool === 'pen' && points.length > 1)) {
      tacticsDispatch({ type: 'ADD_DRAWING', payload: currentDrawing });
    }
    setCurrentDrawing(null);
  };

  const finalizeText = () => {
    if (textInput?.value?.trim() !== '') {
      // Text position is already in percentage coordinates
      const svgPos = {
        x: textInput?.position?.x ?? 0,
        y: textInput?.position?.y ?? 0,
      };

      if (svgPos && typeof svgPos.x === 'number' && typeof svgPos.y === 'number') {
        const newDrawing: DrawingShape = {
          id: `drawing-${Date.now()}`,
          tool: 'text',
          color: drawingColor ?? '#ffffff',
          points: [svgPos],
          text: textInput?.value?.trim() || '',
        };
        tacticsDispatch({ type: 'ADD_DRAWING', payload: newDrawing });
      }
    }
    setTextInput(null);
  };

  const handleTextInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e?.key === 'Enter') {
      e.preventDefault();
      finalizeText();
    } else if (e?.key === 'Escape') {
      setTextInput(null);
    }
  };

  const renderShape = (shape: DrawingShape) => {
    if (!shape) {
      return null;
    }
    const { id, tool, color, points = [], text } = shape;
    const strokeWidth = 0.5;

    switch (tool) {
      case 'arrow': {
        if (points.length < 2 || !points[0] || !points[1]) {
          return null;
        }
        const p0 = points[0];
        const p1 = points[1];
        return (
          <line
            key={id}
            x1={p0.x}
            y1={p0.y}
            x2={p1.x}
            y2={p1.y}
            stroke={color ?? '#ffffff'}
            strokeWidth={strokeWidth}
            markerEnd={`url(#arrowhead-${(color ?? '#ffffff').replace('#', '')})`}
          />
        );
      }
      case 'line': {
        if (points.length < 2 || !points[0] || !points[1]) {
          return null;
        }
        const p0 = points[0];
        const p1 = points[1];
        return (
          <line
            key={id}
            x1={p0.x}
            y1={p0.y}
            x2={p1.x}
            y2={p1.y}
            stroke={color ?? '#ffffff'}
            strokeWidth={strokeWidth}
          />
        );
      }
      case 'zone': {
        if (points.length < 2 || !points[0] || !points[1]) {
          return null;
        }
        const p0 = points[0];
        const p1 = points[1];
        const x = Math.min(p0.x, p1.x);
        const y = Math.min(p0.y, p1.y);
        const width = Math.abs(p0.x - p1.x);
        const height = Math.abs(p0.y - p1.y);
        return (
          <rect
            key={id}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={`${color ?? '#ffffff'}33`}
            stroke={color ?? '#ffffff'}
            strokeWidth={strokeWidth / 2}
          />
        );
      }
      case 'pen':
        if (points.length < 2) {
          return null;
        }
        const pathData =
          'M ' +
          points
            .filter(p => p)
            .map(p => `${p!.x} ${p!.y}`)
            .join(' L ');
        return (
          <path
            key={id}
            d={pathData}
            stroke={color ?? '#ffffff'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'text':
        if (!text || points.length < 1 || !points[0]) {
          return null;
        }
        return (
          <text
            key={id}
            x={points[0]!.x}
            y={points[0]!.y}
            fill={color ?? '#ffffff'}
            fontSize="2.5"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none"
          >
            {text}
          </text>
        );
      default:
        return null;
    }
  };

  const uniqueColors = [
    ...new Set(
      (drawings ?? [])
        .map(d => d?.color)
        .filter(Boolean)
        .concat(drawingColor ?? '#ffffff'),
    ),
  ];
  const eventsToHandle =
    drawingTool !== 'select' && !textInput
      ? {
          onMouseDown: handleMouseDown,
          onMouseMove: handleMouseMove,
          onMouseUp: handleMouseUp,
          onMouseLeave: handleMouseUp,
        }
      : {};

  return (
    <>
      <svg
        className="absolute top-0 left-0 w-full h-full"
        style={{ pointerEvents: drawingTool === 'select' || !!textInput ? 'none' : 'auto' }}
        {...eventsToHandle}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {uniqueColors.map(color => {
            const safeColor = color ?? '#ffffff';
            return (
              <marker
                key={`arrowhead-${safeColor.replace('#', '')}`}
                id={`arrowhead-${safeColor.replace('#', '')}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={safeColor} />
              </marker>
            );
          })}
        </defs>

        <g>{(drawings ?? []).map(shape => renderShape(shape))}</g>

        {currentDrawing && renderShape(currentDrawing)}
      </svg>
      {textInput && (
        <div
          style={{
            position: 'absolute',
            left: `${textInput?.position?.x ?? 0}%`,
            top: `${textInput?.position?.y ?? 0}%`,
            transform: `translate(-50%, -50%)`,
            pointerEvents: 'auto',
            zIndex: 100,
          }}
        >
          <input
            type="text"
            value={textInput?.value ?? ''}
            onChange={e => setTextInput({ ...textInput, value: e?.target?.value ?? '' })}
            onBlur={finalizeText}
            onKeyDown={handleTextInputKeyDown}
            autoFocus
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: `2px solid ${drawingColor ?? '#ffffff'}`,
              color: drawingColor ?? '#ffffff',
              padding: '4px 8px',
              borderRadius: '6px',
              outline: 'none',
              textAlign: 'center',
              width: `${Math.max(100, (textInput?.value?.length ?? 0) * 10)}px`,
            }}
          />
        </div>
      )}
    </>
  );
};

export default DrawingCanvas;
