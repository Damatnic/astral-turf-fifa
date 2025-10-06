import React, {
  useRef,
  useEffect,
  useState,
  KeyboardEvent,
  FocusEvent,
  ReactNode,
  createContext,
  useContext,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

// Accessibility Context for managing focus and announcements
interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (element: HTMLElement) => void;
  trapFocus: (container: HTMLElement) => () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcementQueue, setAnnouncementQueue] = useState<
    Array<{ message: string; priority: 'polite' | 'assertive' }>
  >([]);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncementQueue(prev => [...prev, { message, priority }]);

    // Clear the message after a short delay to reset screen reader state
    setTimeout(() => {
      setAnnouncementQueue(prev => prev.slice(1));
    }, 1000);
  };

  const focusElement = (element: HTMLElement) => {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey as any);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey as any);
    };
  };

  return (
    <AccessibilityContext.Provider value={{ announceToScreenReader, focusElement, trapFocus }}>
      {children}

      {/* Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only">
        {announcementQueue
          .filter(item => item.priority === 'polite')
          .map((item, index) => (
            <div key={`polite-${index}`}>{item.message}</div>
          ))}
      </div>

      <div aria-live="assertive" className="sr-only">
        {announcementQueue
          .filter(item => item.priority === 'assertive')
          .map((item, index) => (
            <div key={`assertive-${index}`}>{item.message}</div>
          ))}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Skip Link Component
interface SkipLinkProps {
  targetId: string;
  children: ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children }) => {
  const { theme, tokens } = useTheme();

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.a
      href={`#${targetId}`}
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
      style={{
        backgroundColor: theme.colors.accent.primary,
        color: theme.colors.text.inverse,
        padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
        borderRadius: tokens.borderRadius.md,
        textDecoration: 'none',
        fontSize: tokens.typography.fontSizes.sm,
        fontWeight: tokens.typography.fontWeights.medium,
        zIndex: tokens.zIndex.skipLink,
      }}
      whileFocus={{
        scale: 1.05,
        boxShadow: `0 0 0 3px ${theme.colors.accent.primary}40`,
      }}
    >
      {children}
    </motion.a>
  );
};

// Focus Trap Component
interface FocusTrapProps {
  children: ReactNode;
  active: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active,
  restoreFocus = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const { trapFocus } = useAccessibility();

  useEffect(() => {
    if (!active || !containerRef.current) {
      return;
    }

    // Store the currently focused element
    if (restoreFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }

    // Set up focus trap
    const cleanup = trapFocus(containerRef.current);

    return () => {
      cleanup();

      // Restore focus when trap is deactivated
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [active, trapFocus, restoreFocus]);

  return (
    <div ref={containerRef} className={className} tabIndex={-1}>
      {children}
    </div>
  );
};

// Accessible Modal Component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnEscape = true,
  closeOnOverlayClick = true,
}) => {
  const { theme, tokens } = useTheme();
  const { announceToScreenReader } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '500px' },
    lg: { maxWidth: '700px' },
    xl: { maxWidth: '900px' },
  };

  useEffect(() => {
    if (isOpen) {
      announceToScreenReader(`Modal opened: ${title}`, 'assertive');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announceToScreenReader]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        announceToScreenReader('Modal closed', 'assertive');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown as any);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [isOpen, closeOnEscape, onClose, announceToScreenReader]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
      announceToScreenReader('Modal closed', 'assertive');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            style={{ zIndex: tokens.zIndex.overlay }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: tokens.zIndex.modal }}
          >
            <FocusTrap active={isOpen}>
              <motion.div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby={description ? 'modal-description' : undefined}
                className="w-full max-h-full overflow-auto"
                style={{
                  ...sizeClasses[size],
                  backgroundColor: theme.colors.background.primary,
                  borderRadius: tokens.borderRadius['2xl'],
                  boxShadow: tokens.shadows['2xl'],
                  border: `1px solid ${theme.colors.border.primary}`,
                  padding: tokens.spacing[6],
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      color: theme.colors.text.secondary,
                    }}
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

                {description && (
                  <p
                    id="modal-description"
                    className="text-sm mb-4"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {description}
                  </p>
                )}

                {/* Content */}
                <div>{children}</div>
              </motion.div>
            </FocusTrap>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Accessible Button with enhanced keyboard navigation
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { theme, tokens } = useTheme();
  const { announceToScreenReader } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      return;
    }

    announceToScreenReader(
      `Button activated: ${typeof children === 'string' ? children : 'Button'}`
    );
    props.onClick?.(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
    props.onKeyDown?.(e as any);
  };

  const sizeStyles = {
    sm: {
      padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
      fontSize: tokens.typography.fontSizes.sm,
    },
    md: {
      padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
      fontSize: tokens.typography.fontSizes.base,
    },
    lg: {
      padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
      fontSize: tokens.typography.fontSizes.lg,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.accent.primary,
      color: theme.colors.text.inverse,
      border: 'none',
    },
    secondary: {
      backgroundColor: theme.colors.background.secondary,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.primary}`,
    },
    danger: {
      backgroundColor: theme.colors.status.error,
      color: theme.colors.text.inverse,
      border: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.text.secondary,
      border: 'none',
    },
  };

  return (
    <motion.button
      {...(props as any)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={`relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
      style={
        {
          ...sizeStyles[size],
          ...variantStyles[variant],
          borderRadius: tokens.borderRadius.lg,
          fontWeight: tokens.typography.fontWeights.medium,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: tokens.spacing[2],
          transition: `all ${tokens.transitions.normal} ease-in-out`,
        } as any
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
    >
      {loading ? (
        <>
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="sr-only">Loading</span>
        </>
      ) : (
        <>
          {icon && <span aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}

      {/* Focus indicator */}
      {isFocused && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: tokens.borderRadius.lg,
            boxShadow: `0 0 0 3px ${theme.colors.accent.primary}40`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.button>
  );
};

// Accessible Form Field with error handling
interface AccessibleFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  help?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  label,
  children,
  error,
  help,
  required = false,
  className = '',
}) => {
  const { theme, tokens } = useTheme();
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = help ? `${fieldId}-help` : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium"
        style={{ color: theme.colors.text.primary }}
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>

      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [errorId, helpId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : 'false',
          required,
        })}
      </div>

      {help && (
        <p id={helpId} className="text-sm" style={{ color: theme.colors.text.secondary }}>
          {help}
        </p>
      )}

      {error && (
        <motion.p
          id={errorId}
          role="alert"
          className="text-sm"
          style={{ color: theme.colors.status.error }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

// Accessible Progress Bar
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showPercentage?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color,
  size = 'md',
}) => {
  const { theme, tokens } = useTheme();
  const percentage = Math.round((value / max) * 100);

  const sizeStyles = {
    sm: { height: '4px' },
    md: { height: '8px' },
    lg: { height: '12px' },
  };

  const progressColor = color || theme.colors.accent.primary;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
            {percentage}%
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={`${label}: ${percentage}% complete`}
        className="w-full overflow-hidden"
        style={{
          ...sizeStyles[size],
          backgroundColor: theme.colors.background.tertiary,
          borderRadius: tokens.borderRadius.full,
        }}
      >
        <motion.div
          className="h-full"
          style={{
            backgroundColor: progressColor,
            borderRadius: tokens.borderRadius.full,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default {
  AccessibilityProvider,
  useAccessibility,
  SkipLink,
  FocusTrap,
  AccessibleModal,
  AccessibleButton,
  AccessibleField,
  AccessibleProgress,
};
