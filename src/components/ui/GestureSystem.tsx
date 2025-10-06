import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { motion, PanInfo, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

// Gesture detection utilities
export interface GestureEvent {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress' | 'drag';
  direction?: 'up' | 'down' | 'left' | 'right';
  velocity?: number;
  distance?: number;
  scale?: number;
  center?: { x: number; y: number };
}

export interface SwipeGestureConfig {
  threshold?: number;
  velocityThreshold?: number;
  onSwipe?: (event: GestureEvent) => void;
}

export interface PinchGestureConfig {
  minScale?: number;
  maxScale?: number;
  onPinch?: (event: GestureEvent) => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
}

export interface DragGestureConfig {
  constraints?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  elastic?: boolean;
  onDrag?: (event: GestureEvent) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

// Swipe Gesture Component
interface SwipeAreaProps {
  children: ReactNode;
  config: SwipeGestureConfig;
  className?: string;
  disabled?: boolean;
}

export const SwipeArea: React.FC<SwipeAreaProps> = ({
  children,
  config,
  className = '',
  disabled = false,
}) => {
  const { threshold = 100, velocityThreshold = 500, onSwipe } = config;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !onSwipe) {
      return;
    }

    const { offset, velocity } = info;
    const distance = Math.sqrt(offset.x ** 2 + offset.y ** 2);
    const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

    if (distance > threshold || velocityMagnitude > velocityThreshold) {
      let direction: 'up' | 'down' | 'left' | 'right' = 'right';

      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        direction = offset.x > 0 ? 'right' : 'left';
      } else {
        direction = offset.y > 0 ? 'down' : 'up';
      }

      onSwipe({
        type: 'swipe',
        direction,
        velocity: velocityMagnitude,
        distance,
      });
    }
  };

  return (
    <motion.div
      className={className}
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
    >
      {children}
    </motion.div>
  );
};

// Draggable Component
interface DraggableProps {
  children: ReactNode;
  config: DragGestureConfig;
  className?: string;
  disabled?: boolean;
}

export const Draggable: React.FC<DraggableProps> = ({
  children,
  config,
  className = '',
  disabled = false,
}) => {
  const { constraints, elastic = true, onDrag, onDragStart, onDragEnd } = config;
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStart?.();
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (onDrag) {
      onDrag({
        type: 'drag',
        distance: Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2),
        velocity: Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2),
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  return (
    <motion.div
      className={`${className} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      drag={!disabled}
      dragControls={dragControls}
      dragConstraints={constraints}
      dragElastic={elastic ? 0.2 : 0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{
        scale: 1.05,
        zIndex: 1000,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
      }}
    >
      {children}
    </motion.div>
  );
};

// Pinch-to-Zoom Component
interface PinchZoomProps {
  children: ReactNode;
  config: PinchGestureConfig;
  className?: string;
  disabled?: boolean;
}

export const PinchZoom: React.FC<PinchZoomProps> = ({
  children,
  config,
  className = '',
  disabled = false,
}) => {
  const { minScale = 0.5, maxScale = 3, onPinch, onPinchStart, onPinchEnd } = config;
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || !containerRef.current) {
      return;
    }

    const element = containerRef.current;
    let initialDistance = 0;
    let initialScale = 1;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        setIsPinching(true);
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = scale;
        onPinchStart?.();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleChange = currentDistance / initialDistance;
        const newScale = Math.max(minScale, Math.min(maxScale, initialScale * scaleChange));

        setScale(newScale);

        if (onPinch) {
          onPinch({
            type: 'pinch',
            scale: newScale,
            center: {
              x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
              y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
            },
          });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && isPinching) {
        setIsPinching(false);
        onPinchEnd?.();
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, scale, isPinching, minScale, maxScale, onPinch, onPinchStart, onPinchEnd]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        touchAction: disabled ? 'auto' : 'none',
        userSelect: 'none',
      }}
    >
      <motion.div style={{ scale }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        {children}
      </motion.div>
    </div>
  );
};

// Long Press Component
interface LongPressProps {
  children: ReactNode;
  onLongPress: (event: GestureEvent) => void;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export const LongPress: React.FC<LongPressProps> = ({
  children,
  onLongPress,
  delay = 500,
  className = '',
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = () => {
    if (disabled) {
      return;
    }

    setIsPressed(true);
    setHasTriggered(false);

    timeoutRef.current = setTimeout(() => {
      if (!hasTriggered) {
        setHasTriggered(true);
        onLongPress({ type: 'longpress' });
      }
    }, delay);
  };

  const endPress = () => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className={className}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      animate={{
        scale: isPressed ? 0.95 : 1,
        opacity: hasTriggered ? 0.8 : 1,
      }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

// Multi-touch Gesture Area
interface MultiTouchAreaProps {
  children: ReactNode;
  onGesture: (event: GestureEvent) => void;
  className?: string;
  disabled?: boolean;
}

export const MultiTouchArea: React.FC<MultiTouchAreaProps> = ({
  children,
  onGesture,
  className = '',
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touches, setTouches] = useState<Touch[]>([]);

  useEffect(() => {
    if (disabled || !containerRef.current) {
      return;
    }

    const element = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      setTouches(Array.from(e.touches));

      if (e.touches.length === 1) {
        // Single tap detection will be handled by timeout
        setTimeout(() => {
          if (touches.length === 0) {
            onGesture({ type: 'tap' });
          }
        }, 200);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      setTouches(Array.from(e.touches));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setTouches(Array.from(e.touches));
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, onGesture, touches.length]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ touchAction: disabled ? 'auto' : 'manipulation' }}
    >
      {children}
    </div>
  );
};

// Sortable List Component with Drag and Drop
interface SortableItem {
  id: string;
  content: ReactNode;
}

interface SortableListProps {
  items: SortableItem[];
  onReorder: (newOrder: SortableItem[]) => void;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
}

export const SortableList: React.FC<SortableListProps> = ({
  items,
  onReorder,
  className = '',
  itemClassName = '',
  disabled = false,
}) => {
  const { theme, tokens } = useTheme();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [reorderedItems, setReorderedItems] = useState(items);

  useEffect(() => {
    setReorderedItems(items);
  }, [items]);

  const handleDragStart = (itemId: string) => {
    if (disabled) {
      return;
    }
    setDraggedItem(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    onReorder(reorderedItems);
  };

  const handleDragOver = (overId: string) => {
    if (disabled || !draggedItem || draggedItem === overId) {
      return;
    }

    const draggedIndex = reorderedItems.findIndex(item => item.id === draggedItem);
    const overIndex = reorderedItems.findIndex(item => item.id === overId);

    if (draggedIndex !== -1 && overIndex !== -1) {
      const newItems = [...reorderedItems];
      const [draggedItemData] = newItems.splice(draggedIndex, 1);
      newItems.splice(overIndex, 0, draggedItemData);
      setReorderedItems(newItems);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {reorderedItems.map(item => (
        <motion.div
          key={item.id}
          className={`${itemClassName} relative`}
          style={{
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[3],
            cursor: disabled ? 'default' : 'grab',
          }}
          layout
          drag={!disabled ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={() => handleDragOver(item.id)}
          whileDrag={{
            scale: 1.02,
            zIndex: 1000,
            boxShadow: tokens.shadows.lg,
            backgroundColor: theme.colors.background.primary,
          }}
          animate={{
            opacity: draggedItem === item.id ? 0.8 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          {item.content}

          {/* Drag indicator */}
          {!disabled && (
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              style={{ color: theme.colors.text.tertiary }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5z" />
                <path d="M14 15h-4v3H7l5 5 5-5h-3v-3z" />
              </svg>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Gesture Hook for custom implementations
export const useGesture = () => {
  const [gestureState, setGestureState] = useState<{
    isGesturing: boolean;
    gestureType: string | null;
    gestureData: Record<string, any> | null;
  }>({
    isGesturing: false,
    gestureType: null,
    gestureData: null,
  });

  const startGesture = (type: string, data: Record<string, any> = {}) => {
    setGestureState({
      isGesturing: true,
      gestureType: type,
      gestureData: data,
    });
  };

  const endGesture = () => {
    setGestureState({
      isGesturing: false,
      gestureType: null,
      gestureData: null,
    });
  };

  const updateGesture = (data: Record<string, any>) => {
    setGestureState(prev => ({
      ...prev,
      gestureData: { ...prev.gestureData, ...data },
    }));
  };

  return {
    gestureState,
    startGesture,
    endGesture,
    updateGesture,
  };
};

export default {
  SwipeArea,
  Draggable,
  PinchZoom,
  LongPress,
  MultiTouchArea,
  SortableList,
  useGesture,
};
