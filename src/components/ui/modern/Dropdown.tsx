import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';

export interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right';
  offset?: number;
  closeOnSelect?: boolean;
  disabled?: boolean;
}

export interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}

export interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  destructive?: boolean;
  selected?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shortcut?: string;
}

const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  closeOnSelect: boolean;
  triggerRef: React.RefObject<HTMLElement>;
} | null>(null);

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  trigger,
  open: controlledOpen,
  onOpenChange,
  closeOnSelect = true,
  disabled = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleTriggerClick = () => {
    if (!disabled) {
      setOpen(!open);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node) && open) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, closeOnSelect, triggerRef }}>
      <div className="relative inline-block">
        <div
          ref={triggerRef as any}
          onClick={handleTriggerClick}
          className={cn('cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}
        >
          {trigger}
        </div>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  ({ children, className, align = 'start', sideOffset = 4, alignOffset = 0, ...props }, ref) => {
    const context = React.useContext(DropdownContext);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const contentRef = useRef<HTMLDivElement>(null);

    if (!context) {
      throw new Error('DropdownContent must be used within a Dropdown');
    }

    const { open, triggerRef } = context;

    useEffect(() => {
      if (!open || !triggerRef.current || !contentRef.current) {
        return;
      }

      const updatePosition = () => {
        const triggerRect = triggerRef.current!.getBoundingClientRect();
        const contentRect = contentRef.current!.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top = triggerRect.bottom + sideOffset;
        let left = triggerRect.left + alignOffset;

        // Adjust horizontal position based on align prop
        if (align === 'center') {
          left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        } else if (align === 'end') {
          left = triggerRect.right - contentRect.width;
        }

        // Check if dropdown would go off screen vertically
        if (top + contentRect.height > viewportHeight) {
          top = triggerRect.top - contentRect.height - sideOffset;
        }

        // Check if dropdown would go off screen horizontally
        if (left + contentRect.width > viewportWidth) {
          left = viewportWidth - contentRect.width - 8;
        }
        if (left < 8) {
          left = 8;
        }

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }, [open, align, sideOffset, alignOffset]);

    if (!open) {
      return null;
    }

    return createPortal(
      <div
        ref={node => {
          (contentRef as any).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as any).current = node;
          }
        }}
        className={cn(
          'fixed z-50 min-w-[8rem] rounded-md border border-slate-600',
          'bg-slate-800 shadow-2xl',
          'p-1 animate-fade-in-scale origin-top-left',
          className,
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        {...props}
      >
        {children}
      </div>,
      document.body,
    );
  },
);

DropdownContent.displayName = 'DropdownContent';

export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps>(
  (
    {
      children,
      className,
      disabled = false,
      destructive = false,
      selected = false,
      leftIcon,
      rightIcon,
      shortcut,
      onClick,
      ...props
    },
    ref,
  ) => {
    const context = React.useContext(DropdownContext);

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }

      onClick?.(event);

      if (context?.closeOnSelect) {
        context.setOpen(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm',
          'transition-colors duration-150',
          'focus:outline-none focus:bg-slate-700',
          !disabled && !destructive && 'hover:bg-slate-700 text-white',
          !disabled && destructive && 'hover:bg-red-900 text-red-400 hover:text-red-300',
          selected && 'bg-blue-900 text-blue-400',
          disabled && 'cursor-not-allowed opacity-50 text-slate-500',
          className,
        )}
        onClick={handleClick}
        role="menuitem"
        aria-disabled={disabled}
        {...props}
      >
        {leftIcon && (
          <span className="mr-2 flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        <span className="flex-1 truncate">{children}</span>

        {shortcut && (
          <span className="ml-auto pl-2 text-xs text-secondary-400 tracking-wider">{shortcut}</span>
        )}

        {rightIcon && (
          <span className="ml-2 flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </div>
    );
  },
);

DropdownItem.displayName = 'DropdownItem';

export const DropdownSeparator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('my-1 h-px bg-slate-600', className)}
      role="separator"
      {...props}
    />
  ),
);

DropdownSeparator.displayName = 'DropdownSeparator';

export const DropdownLabel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

DropdownLabel.displayName = 'DropdownLabel';
