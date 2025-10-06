import React, { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../utils/cn';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscapeKey?: boolean;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const dialogSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

const dialogPositions = {
  center: 'items-center justify-center',
  top: 'items-start justify-center pt-16',
  bottom: 'items-end justify-center pb-16',
};

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
};

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      children,
      className,
      size = 'md',
      position = 'center',
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscapeKey = true,
      ...props
    },
    ref
  ) => {
    const context = React.useContext(DialogContext);
    const [mounted, setMounted] = useState(false);

    if (!context) {
      throw new Error('DialogContent must be used within a Dialog');
    }

    const { open, onOpenChange } = context;

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (!open) {
        return;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscapeKey) {
          onOpenChange(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }, [open, onOpenChange, closeOnEscapeKey]);

    if (!mounted || !open) {
      return null;
    }

    const handleOverlayClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget && closeOnOverlayClick) {
        onOpenChange(false);
      }
    };

    return createPortal(
      <div
        className={cn('fixed inset-0 z-50 flex', dialogPositions[position])}
        onClick={handleOverlayClick}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          aria-hidden="true"
        />

        {/* Dialog */}
        <div
          ref={ref}
          className={cn(
            'relative w-full bg-secondary-800 rounded-xl shadow-2xl border border-secondary-700/50',
            'animate-scale-in-center',
            'mx-4 my-8',
            dialogSizes[size],
            position === 'center' && 'max-h-[calc(100vh-4rem)]',
            className
          )}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                'absolute top-4 right-4 z-10',
                'w-8 h-8 rounded-full bg-secondary-700/50 hover:bg-secondary-600/50',
                'flex items-center justify-center',
                'text-secondary-400 hover:text-white',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
              )}
              aria-label="Close dialog"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {children}
        </div>
      </div>,
      document.body
    );
  }
);

DialogContent.displayName = 'DialogContent';

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)} {...props}>
      {children}
    </div>
  )
);

DialogHeader.displayName = 'DialogHeader';

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-2 overflow-y-auto', className)} {...props}>
      {children}
    </div>
  )
);

DialogBody.displayName = 'DialogBody';

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    >
      {children}
    </h2>
  )
);

DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-secondary-400', className)} {...props}>
    {children}
  </p>
));

DialogDescription.displayName = 'DialogDescription';
