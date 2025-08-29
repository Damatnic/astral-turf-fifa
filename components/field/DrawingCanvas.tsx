
import React, { useState, MouseEvent as ReactMouseEvent, KeyboardEvent } from 'react';
import { useTacticsContext, useUIContext } from '../../hooks';
import { DrawingShape } from '../../types';

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
    const [textInput, setTextInput] = useState<{ position: { x: number; y: number }, value: string } | null>(null);

    const getPointerPosition = (e: ReactMouseEvent): { x: number, y: number } | null => {
        if (!fieldRef.current) return null;
        const fieldRect = fieldRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - fieldRect.left) / fieldRect.width) * 100,
            y: ((e.clientY - fieldRect.top) / fieldRect.height) * 100,
        };
    };
    
    const getSvgPointerPosition = (e: ReactMouseEvent<SVGSVGElement>): { x: number, y: number } | null => {
        const svg = e.currentTarget;
        const CTM = svg.getScreenCTM();
        if (!CTM) return getPointerPosition(e); // Fallback
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const { x, y } = pt.matrixTransform(CTM.inverse());
        return { x, y };
    };

    const handleMouseDown = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (drawingTool === 'select' || e.button !== 0 || isPresentationMode) return;
        
        const startPoint = getSvgPointerPosition(e);
        if (!startPoint) return;

        if (drawingTool === 'text') {
            const htmlPos = getPointerPosition(e);
            if(htmlPos) setTextInput({ position: htmlPos, value: '' });
            return;
        }

        setIsDrawing(true);
        const newDrawing: DrawingShape = {
            id: `drawing-${Date.now()}`,
            tool: drawingTool,
            color: drawingColor,
            points: [startPoint],
        };
        setCurrentDrawing(newDrawing);
    };

    const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
        if (!isDrawing || !currentDrawing) return;
        
        const currentPoint = getSvgPointerPosition(e);
        if (!currentPoint) return;

        let updatedPoints = [...currentDrawing.points];
        if (drawingTool === 'arrow' || drawingTool === 'zone' || drawingTool === 'line') {
            updatedPoints[1] = currentPoint;
        } else if (drawingTool === 'pen') {
            updatedPoints.push(currentPoint);
        }
        
        setCurrentDrawing({ ...currentDrawing, points: updatedPoints });
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentDrawing) return;

        setIsDrawing(false);
        if (currentDrawing.points.length > 1 || (drawingTool === 'pen' && currentDrawing.points.length > 1)) {
           tacticsDispatch({ type: 'ADD_DRAWING', payload: currentDrawing });
        }
        setCurrentDrawing(null);
    };
    
    const finalizeText = () => {
        if (textInput && textInput.value.trim() !== '') {
            // Text position is already in percentage coordinates
            const svgPos = {
                x: textInput.position.x,
                y: textInput.position.y
            };

            if (svgPos) {
                 const newDrawing: DrawingShape = {
                    id: `drawing-${Date.now()}`,
                    tool: 'text',
                    color: drawingColor,
                    points: [svgPos],
                    text: textInput.value.trim(),
                };
                tacticsDispatch({ type: 'ADD_DRAWING', payload: newDrawing });
            }
        }
        setTextInput(null);
    };

    const handleTextInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finalizeText();
        } else if (e.key === 'Escape') {
            setTextInput(null);
        }
    };

    const renderShape = (shape: DrawingShape) => {
        const { id, tool, color, points, text } = shape;
        const strokeWidth = 0.5;
        
        switch (tool) {
            case 'arrow':
                if (points.length < 2) return null;
                return <line key={id} x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke={color} strokeWidth={strokeWidth} markerEnd={`url(#arrowhead-${color.replace('#','')})`} />;
            case 'line':
                 if (points.length < 2) return null;
                return <line key={id} x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke={color} strokeWidth={strokeWidth} />;
            case 'zone':
                if (points.length < 2) return null;
                const x = Math.min(points[0].x, points[1].x);
                const y = Math.min(points[0].y, points[1].y);
                const width = Math.abs(points[0].x - points[1].x);
                const height = Math.abs(points[0].y - points[1].y);
                return <rect key={id} x={x} y={y} width={width} height={height} fill={`${color}33`} stroke={color} strokeWidth={strokeWidth/2} />;
            case 'pen':
                if (points.length < 2) return null;
                const pathData = "M " + points.map(p => `${p.x} ${p.y}`).join(" L ");
                return <path key={id} d={pathData} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
            case 'text':
                if (!text || points.length < 1) return null;
                return (
                    <text
                        key={id}
                        x={points[0].x}
                        y={points[0].y}
                        fill={color}
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
    
    const uniqueColors = [...new Set(drawings.map(d => d.color).concat(drawingColor))];
    const eventsToHandle = drawingTool !== 'select' && !textInput ? {
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
    } : {};


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
              {uniqueColors.map(color => (
                <marker key={`arrowhead-${color.replace('#','')}`} id={`arrowhead-${color.replace('#','')}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                </marker>
              ))}
            </defs>
            
            <g>
                {drawings.map(shape => renderShape(shape))}
            </g>
            
            {currentDrawing && renderShape(currentDrawing)}
        </svg>
        {textInput && (
            <div 
                style={{
                    position: 'absolute',
                    left: `${textInput.position.x}%`,
                    top: `${textInput.position.y}%`,
                    transform: `translate(-50%, -50%)`,
                    pointerEvents: 'auto',
                    zIndex: 100,
                }}
            >
                <input
                    type="text"
                    value={textInput.value}
                    onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                    onBlur={finalizeText}
                    onKeyDown={handleTextInputKeyDown}
                    autoFocus
                    style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: `2px solid ${drawingColor}`,
                        color: drawingColor,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        outline: 'none',
                        textAlign: 'center',
                        width: `${Math.max(100, textInput.value.length * 10)}px`
                    }}
                />
            </div>
        )}
        </>
    );
};

export default DrawingCanvas;
