import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  offset?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  trigger = 'hover',
  delay = 500,
  offset = 8,
  disabled = false,
  className,
  contentClassName,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled || !content) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(
      () => {
        setIsVisible(true);
      },
      trigger === 'hover' ? delay : 0
    );
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + offset;
        break;
    }

    // Boundary checks and adjustments
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    if (top < 8) {
      top = 8;
    } else if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, placement, offset]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowClasses = () => {
    const arrowBase = 'absolute w-2 h-2 bg-secondary-900 border border-secondary-700/50 rotate-45';

    switch (placement) {
      case 'top':
        return `${arrowBase} bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0`;
      case 'bottom':
        return `${arrowBase} top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0`;
      case 'left':
        return `${arrowBase} right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0`;
      case 'right':
        return `${arrowBase} left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0`;
      default:
        return arrowBase;
    }
  };

  const getAnimationClasses = () => {
    switch (placement) {
      case 'top':
        return 'animate-slide-in-from-bottom';
      case 'bottom':
        return 'animate-slide-in-from-top';
      case 'left':
        return 'animate-slide-in-from-right';
      case 'right':
        return 'animate-slide-in-from-left';
      default:
        return 'animate-fade-in-scale';
    }
  };

  const handleTriggerEvents = () => {
    const events: any = {};

    if (trigger === 'hover') {
      events.onMouseEnter = showTooltip;
      events.onMouseLeave = hideTooltip;
    } else if (trigger === 'click') {
      events.onClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        isVisible ? hideTooltip() : showTooltip();
      };
    } else if (trigger === 'focus') {
      events.onFocus = showTooltip;
      events.onBlur = hideTooltip;
    }

    return events;
  };

  useEffect(() => {
    if (trigger === 'click' && isVisible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          tooltipRef.current &&
          !tooltipRef.current.contains(event.target as Node)
        ) {
          hideTooltip();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [trigger, isVisible]);

  return (
    <>
      <div ref={triggerRef} className={cn('inline-block', className)} {...handleTriggerEvents()}>
        {children}
      </div>

      {isVisible &&
        content &&
        createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              'fixed z-[1070] px-3 py-2 text-sm text-white',
              'bg-secondary-900 border border-secondary-700/50 rounded-lg shadow-xl',
              'max-w-xs break-words',
              getAnimationClasses(),
              contentClassName
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
            role="tooltip"
          >
            {content}
            <div className={getArrowClasses()} />
          </div>,
          document.body
        )}
    </>
  );
};
