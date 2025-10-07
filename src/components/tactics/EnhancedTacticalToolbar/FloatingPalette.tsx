/**
 * Floating Palette Component
 *
 * Draggable floating tool palette
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { FloatingPaletteProps } from '../../../types/toolbar';
import ToolButton from './ToolButton';

const FloatingPalette: React.FC<FloatingPaletteProps> = ({
  id: _id,
  title,
  tools,
  position,
  isVisible,
  isDraggable = true,
  activeTool,
  onToolSelect,
  onClose,
  className = '',
}) => {
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Calculate initial position based on position prop
  useEffect(() => {
    if (!paletteRef.current) {return;}

    const rect = paletteRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top-left':
        x = 20;
        y = 80;
        break;
      case 'top-right':
        x = viewportWidth - rect.width - 20;
        y = 80;
        break;
      case 'bottom-left':
        x = 20;
        y = viewportHeight - rect.height - 20;
        break;
      case 'bottom-right':
        x = viewportWidth - rect.width - 20;
        y = viewportHeight - rect.height - 20;
        break;
      case 'center':
        x = (viewportWidth - rect.width) / 2;
        y = (viewportHeight - rect.height) / 2;
        break;
    }

    setLocalPosition({ x, y });
  }, [position]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isDraggable) {return;}

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - localPosition.x,
      y: e.clientY - localPosition.y,
    };
  };

  // Handle drag
  useEffect(() => {
    if (!isDragging) {return;}

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as unknown as { clientX: number; clientY: number };
      setLocalPosition({
        x: mouseEvent.clientX - dragStartRef.current.x,
        y: mouseEvent.clientY - dragStartRef.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isVisible) {return null;}

  return (
    <motion.div
      ref={paletteRef}
      className={`floating-palette ${isDragging ? 'dragging' : ''} ${className}`}
      style={{
        position: 'fixed',
        left: localPosition.x,
        top: localPosition.y,
        zIndex: 1000,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {/* Palette Header */}
      <div
        className="palette-header"
        onMouseDown={handleDragStart}
        style={{ cursor: isDraggable ? 'move' : 'default' }}
      >
        <span className="palette-title">{title}</span>
        <button
          className="palette-close"
          onClick={onClose}
          aria-label="Close palette"
        >
          ✕
        </button>
      </div>

      {/* Palette Tools */}
      <div className="palette-tools">
        {tools.map(tool => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            isCompact={false}
            showLabel={true}
            showShortcut={true}
            onClick={() => onToolSelect(tool.id)}
          />
        ))}
      </div>

      <style>{`
        .floating-palette {
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          min-width: 250px;
          max-width: 400px;
        }

        .floating-palette.dragging {
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.7);
        }

        .palette-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(0, 128, 255, 0.1));
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          user-select: none;
        }

        .palette-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #00f5ff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .palette-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.25rem;
          font-size: 1rem;
          transition: color 0.2s;
        }

        .palette-close:hover {
          color: #fff;
        }

        .palette-tools {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
          padding: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .palette-tools::-webkit-scrollbar {
          width: 6px;
        }

        .palette-tools::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }

        .palette-tools::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
      `}</style>
    </motion.div>
  );
};

export default FloatingPalette;
