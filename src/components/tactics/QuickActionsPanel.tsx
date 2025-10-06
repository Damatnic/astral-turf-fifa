import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  Undo,
  Redo,
  RotateCcw,
  Play,
  Pause,
  Square,
  Zap,
  Settings,
  HelpCircle,
  Info,
} from 'lucide-react';

interface AISuggestion {
  id?: string;
  type?: string;
  message: string;
  action?: string;
}

type SimulationAction = 'start' | 'pause' | 'resume' | 'stop';

interface QuickActionsPanelProps {
  onSave?: () => Promise<void> | void;
  onExport?: (format: 'json' | 'csv' | 'xml') => Promise<void> | void;
  onImport?: (file?: unknown) => Promise<void> | void;
  onShare?: (mode?: 'link' | 'image' | 'email') => Promise<void> | void;
  onCopy?: () => Promise<void> | void;
  onUndo?: () => Promise<void> | void;
  onRedo?: () => Promise<void> | void;
  onReset?: () => Promise<void> | void;
  onSimulate?: (action: SimulationAction) => Promise<void> | void;
  onAIAssist?: (action?: string, id?: string) => Promise<void> | void;
  onSettings?: () => Promise<void> | void;
  onHelp?: () => Promise<void> | void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSimulating?: boolean;
  isPaused?: boolean;
  simulationProgress?: number;
  isSaving?: boolean;
  isAIProcessing?: boolean;
  aiSuggestions?: AISuggestion[];
  hasError?: boolean;
  className?: string;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

interface RetryState {
  label: string;
  action: () => Promise<void> | void;
}

type ActionButtonElement = globalThis.HTMLButtonElement;

interface ActionButtonProps {
  label: string;
  ariaLabel: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  showLabel: boolean;
  className?: string;
  buttonRef?: (el: ActionButtonElement | null) => void;
  title?: string;
  type?: 'button' | 'submit';
  children?: React.ReactNode;
  ariaBusy?: boolean;
}

const BaseActionButton = React.forwardRef<ActionButtonElement, ActionButtonProps>(
  (
    {
      label,
      ariaLabel,
      icon,
      onClick,
      disabled,
      active,
      showLabel,
      className = '',
      title,
      type = 'button',
      children,
      ariaBusy,
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={ariaLabel}
  aria-pressed={active ?? undefined}
        aria-busy={ariaBusy ? 'true' : undefined}
        title={title || label}
        className={`focus-visible flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          disabled
            ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
            : active
              ? 'bg-blue-600/80 text-white shadow-lg shadow-blue-500/25'
              : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 hover:text-white'
        } ${className}`.trim()}
      >
        {icon && <span className="flex items-center" aria-hidden="true">{icon}</span>}
        {showLabel && <span>{label}</span>}
        {children}
      </button>
    );
  },
);
BaseActionButton.displayName = 'BaseActionButton';

const QuickActionsPanelComponent: React.FC<QuickActionsPanelProps> = ({
  onSave,
  onExport,
  onImport,
  onShare,
  onCopy,
  onUndo,
  onRedo,
  onReset,
  onSimulate,
  onAIAssist,
  onSettings,
  onHelp,
  canUndo = false,
  canRedo = false,
  isSimulating = false,
  isPaused = false,
  simulationProgress,
  isSaving = false,
  isAIProcessing = false,
  aiSuggestions = [],
  hasError = false,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<ActionButtonElement[]>([]);
  buttonsRef.current = [];

  const memoizedButtonRef = useRef<React.MemoExoticComponent<React.ForwardRefExoticComponent<ActionButtonProps & React.RefAttributes<ActionButtonElement>>>>();
  if (!memoizedButtonRef.current) {
    memoizedButtonRef.current = React.memo(BaseActionButton);
  }
  const ActionButton = memoizedButtonRef.current;

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [retry, setRetry] = useState<RetryState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 1024),
  );

  const saveThrottleRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (saveThrottleRef.current) {
        window.clearTimeout(saveThrottleRef.current);
      }
    };
  }, []);

  const isMobile = viewportWidth <= 640;
  const isCompact = viewportWidth <= 480;
  const needsOverflow = viewportWidth <= 320;

  const registerButton = (el: ActionButtonElement | null) => {
    if (el && !buttonsRef.current.includes(el)) {
      buttonsRef.current.push(el);
    }
  };

  const focusNextButton = useCallback(
    (direction: 'next' | 'prev') => {
  const active = document.activeElement as ActionButtonElement | null;
      const currentIndex = buttonsRef.current.findIndex(button => button === active);
      if (currentIndex === -1 || buttonsRef.current.length === 0) {
        return;
      }

      const delta = direction === 'next' ? 1 : -1;
      const nextIndex = (currentIndex + delta + buttonsRef.current.length) % buttonsRef.current.length;
      buttonsRef.current[nextIndex]?.focus();
    },
    [],
  );

  const focusEdgeButton = useCallback((edge: 'start' | 'end') => {
    if (buttonsRef.current.length === 0) {
      return;
    }
    const targetIndex = edge === 'start' ? 0 : buttonsRef.current.length - 1;
    buttonsRef.current[targetIndex]?.focus();
  }, []);

  const showSuccess = useCallback((message: string) => {
    setToast({ type: 'success', message });
    setRetry(null);
  }, []);

  const showError = useCallback((message: string, retryState?: RetryState) => {
    setToast({ type: 'error', message });
    if (retryState) {
      setRetry(retryState);
    }
  }, []);

  const executeAction = useCallback(
    async (action: (() => Promise<void> | void) | undefined, options: { successMessage?: string; errorMessage?: string; retryLabel?: string; retryAction?: () => Promise<void> | void } = {}) => {
      if (!action) {
        return;
      }

      try {
        const result = action();
        if (result instanceof Promise) {
          await result;
        }
        if (options.successMessage) {
          showSuccess(options.successMessage);
        }
      } catch (error) {
        showError(
          options.errorMessage || (error instanceof Error ? error.message : 'Action failed'),
          options.retryLabel && options.retryAction
            ? { label: options.retryLabel, action: options.retryAction }
      : undefined,
        );
      }
    },
    [showError, showSuccess],
  );

  const handleSave = useCallback(() => {
    if (saveThrottleRef.current || hasError || isSaving) {
      return;
    }

    executeAction(onSave, {
      successMessage: 'Formation saved successfully',
      errorMessage: 'Save failed',
    });

    saveThrottleRef.current = window.setTimeout(() => {
      saveThrottleRef.current = null;
    }, 300);
  }, [executeAction, hasError, isSaving, onSave]);

  const handleExport = useCallback(
    async (format: 'json' | 'csv' | 'xml') => {
      await executeAction(
        () => onExport?.(format),
        {
          successMessage: `Exported formation as ${format.toUpperCase()}`,
          errorMessage: 'Export failed',
          retryLabel: 'Retry Export',
          retryAction: () => handleExport(format),
        },
      );
      setShowExportMenu(false);
    },
    [executeAction, onExport],
  );

  const handleCopy = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText('Formation copied to clipboard');
      }
      await executeAction(onCopy, { successMessage: 'Formation copied to clipboard' });
    } catch {
      showError('Copy failed');
    }
  }, [executeAction, onCopy, showError]);

  const handleShareOption = useCallback(
    (mode: 'link' | 'image' | 'email') => {
      executeAction(() => onShare?.(mode), {
        successMessage: `Shared formation via ${mode}`,
        errorMessage: 'Share failed',
      });
      setShowShareMenu(false);
    },
    [executeAction, onShare],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === 'z') {
          event.preventDefault();
          executeAction(onUndo);
          return;
        }
        if (key === 'y') {
          event.preventDefault();
          executeAction(onRedo);
          return;
        }
        if (key === 's') {
          event.preventDefault();
          handleSave();
          return;
        }
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          focusNextButton('next');
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          focusNextButton('prev');
          break;
        case 'Home':
          event.preventDefault();
          focusEdgeButton('start');
          break;
        case 'End':
          event.preventDefault();
          focusEdgeButton('end');
          break;
        default:
          break;
      }
    },
    [executeAction, focusEdgeButton, focusNextButton, handleSave, onRedo, onUndo],
  );

  const handlePanelFocus = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (event.target === panelRef.current) {
        buttonsRef.current[0]?.focus();
      }
    },
    [],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const file = event.dataTransfer?.files?.[0];
      if (file) {
        executeAction(() => onImport?.(file));
      }
    },
    [executeAction, onImport],
  );

  const toolbarClasses = useMemo(() => {
    return [
      'focus:outline-none',
      'focus-visible:ring-2 focus-visible:ring-blue-400',
      'bg-slate-900/90 border border-slate-700/50 rounded-2xl p-4 shadow-2xl',
      'flex flex-col gap-3',
      isMobile ? 'mobile-layout' : '',
      isDragOver ? 'ring-2 ring-blue-400' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');
  }, [className, isDragOver, isMobile]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div
        ref={panelRef}
        data-testid="quick-actions-panel"
        role="toolbar"
        aria-label="Quick actions toolbar"
        tabIndex={0}
        className={toolbarClasses}
        onKeyDown={handleKeyDown}
        onFocus={handlePanelFocus}
        onDragEnter={event => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={event => {
          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className={`flex flex-wrap items-center gap-3 ${isCompact ? 'compact-view' : ''}`}>
          <ActionButton
            ref={registerButton}
            label={isSaving ? 'Saving…' : 'Save Formation'}
            ariaLabel={isSaving ? 'Saving' : 'Save formation'}
            icon={<Save data-testid="save-icon" className="w-4 h-4" />}
            onClick={handleSave}
            disabled={hasError || isSaving}
            showLabel={!isCompact}
            className={isSaving ? 'animate-pulse' : ''}
            ariaBusy={isSaving}
          >
            {isSaving && <div data-testid="loading-spinner" className="h-4 w-4 animate-spin border-2 border-blue-300 border-t-transparent rounded-full" />}
          </ActionButton>

          <ActionButton
            ref={registerButton}
            label="Export Formation"
            ariaLabel="Export formation"
            icon={<Download data-testid="download-icon" className="w-4 h-4" />}
            onClick={() => {
              if (hasError) {
                return;
              }
              setShowExportMenu(prev => !prev);
            }}
            disabled={hasError}
            showLabel={!isCompact}
          />

          <ActionButton
            ref={registerButton}
            label="Import Formation"
            ariaLabel="Import formation"
            icon={<Upload data-testid="upload-icon" className="w-4 h-4" />}
            onClick={() => executeAction(onImport)}
            disabled={hasError}
            showLabel={!isCompact}
          />

          <ActionButton
            ref={registerButton}
            label="Share Formation"
            ariaLabel="Share formation"
            icon={<Share2 data-testid="share-icon" className="w-4 h-4" />}
            onClick={() => {
              if (hasError) {
                return;
              }
              executeAction(onShare);
              setShowShareMenu(prev => !prev);
            }}
            disabled={hasError}
            showLabel={!isCompact}
          />

          <ActionButton
            ref={registerButton}
            label="Copy Formation"
            ariaLabel="Copy formation"
            icon={<Copy data-testid="copy-icon" className="w-4 h-4" />}
            onClick={handleCopy}
            disabled={hasError}
            showLabel={!isCompact}
          />

          <ActionButton
            ref={registerButton}
            label="Undo"
            ariaLabel="Undo"
            icon={<Undo data-testid="undo-icon" className="w-4 h-4" />}
            onClick={() => executeAction(onUndo)}
            disabled={!canUndo}
            showLabel={!isCompact}
          />

          <ActionButton
            ref={registerButton}
            label="Redo"
            ariaLabel="Redo"
            icon={<Redo data-testid="redo-icon" className="w-4 h-4" />}
            onClick={() => executeAction(onRedo)}
            disabled={!canRedo}
            showLabel={!isCompact}
          />

          <ActionButton
            ref={registerButton}
            label="Reset Formation"
            ariaLabel="Reset formation"
            icon={<RotateCcw data-testid="reset-icon" className="w-4 h-4" />}
            onClick={() => setShowResetConfirm(true)}
            disabled={hasError}
            showLabel={!isCompact}
          />

          {!isSimulating && (
            <ActionButton
              ref={registerButton}
              label="Simulate Match"
              ariaLabel="Simulate match"
              icon={<Play data-testid="play-icon" className="w-4 h-4" />}
              onClick={() => executeAction(() => onSimulate?.('start'))}
              disabled={hasError}
              showLabel={!isCompact}
            />
          )}

          {isSimulating && (
            <>
              <ActionButton
                ref={registerButton}
                label={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
                ariaLabel={isPaused ? 'Resume simulation' : 'Pause simulation'}
                icon={
                  isPaused ? (
                    <Play data-testid="play-icon" className="w-4 h-4" />
                  ) : (
                    <Pause data-testid="pause-icon" className="w-4 h-4" />
                  )
                }
                onClick={() => executeAction(() => onSimulate?.(isPaused ? 'resume' : 'pause'))}
                showLabel={!isCompact}
              />

              <ActionButton
                ref={registerButton}
                label="Stop Simulation"
                ariaLabel="Stop simulation"
                icon={<Square data-testid="stop-icon" className="w-4 h-4" />}
                onClick={() => executeAction(() => onSimulate?.('stop'))}
                showLabel={!isCompact}
              />
            </>
          )}

          <ActionButton
            ref={registerButton}
            label="AI Assistant"
            ariaLabel="AI assistant"
            icon={<Zap data-testid="ai-icon" className="w-4 h-4" />}
            onClick={() => executeAction(onAIAssist)}
            disabled={false}
            active={isAIProcessing}
            showLabel={!isCompact}
            className={isAIProcessing ? 'animate-pulse' : ''}
          >
            {isAIProcessing && <span className="text-xs text-slate-300">AI thinking…</span>}
          </ActionButton>

          <ActionButton
            ref={registerButton}
            label="Settings"
            ariaLabel="Settings"
            icon={<Settings data-testid="settings-icon" className="w-4 h-4" />}
            onClick={() => executeAction(onSettings)}
            showLabel={!isCompact}
          />

          <ActionButton
            ref={registerButton}
            label="Help"
            ariaLabel="Help"
            icon={<HelpCircle data-testid="help-icon" className="w-4 h-4" />}
            onClick={() => {
              executeAction(onHelp);
              setShowHelp(true);
            }}
            showLabel={!isCompact}
          />

          {needsOverflow && (
            <ActionButton
              ref={registerButton}
              label="More Actions"
              ariaLabel="More actions"
              icon={<Info className="w-4 h-4" />}
              onClick={() => setShowShareMenu(prev => !prev)}
              showLabel={!isCompact}
            />
          )}
        </div>

        <AnimatePresence>
          {showExportMenu && !hasError && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="w-56 rounded-lg border border-slate-700/50 bg-slate-900/95 p-2 shadow-xl"
            >
              {(['json', 'csv', 'xml'] as const).map(format => (
                <button
                  key={format}
                  role="menuitem"
                  onClick={() => handleExport(format)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showShareMenu && !hasError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-wrap gap-2 rounded-lg border border-slate-700/50 bg-slate-900/95 p-3 shadow-xl"
            >
              <ActionButton
                label="Share Link"
                ariaLabel="Share link"
                icon={<Share2 className="w-4 h-4" />}
                onClick={() => handleShareOption('link')}
                showLabel
              />
              <ActionButton
                label="Share Image"
                ariaLabel="Share image"
                icon={<Share2 className="w-4 h-4" />}
                onClick={() => handleShareOption('image')}
                showLabel
              />
              <ActionButton
                label="Share via Email"
                ariaLabel="Share via email"
                icon={<Share2 className="w-4 h-4" />}
                onClick={() => handleShareOption('email')}
                showLabel
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-slate-700/50 bg-slate-900/95 p-4 shadow-2xl"
            >
              <p className="text-sm text-slate-200">Are you sure you want to reset the formation?</p>
              <div className="mt-3 flex gap-2">
                <ActionButton
                  label="Confirm Reset"
                  ariaLabel="Confirm reset"
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={() => {
                    executeAction(onReset, { successMessage: 'Formation reset' });
                    setShowResetConfirm(false);
                  }}
                  showLabel
                />
                <ActionButton
                  label="Cancel"
                  ariaLabel="Cancel reset"
                  icon={<Square className="w-4 h-4" />}
                  onClick={() => setShowResetConfirm(false)}
                  showLabel
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="rounded-xl border border-slate-700/50 bg-slate-900/95 p-4 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-slate-100">Keyboard Shortcuts</h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <kbd className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-slate-100">Ctrl+S</kbd>
                  <span>Save Formation</span>
                </li>
                <li className="flex items-center gap-2">
                  <kbd className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-slate-100">Ctrl+Z</kbd>
                  <span>Undo</span>
                </li>
                <li className="flex items-center gap-2">
                  <kbd className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-slate-100">Ctrl+Y</kbd>
                  <span>Redo</span>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {isSimulating && typeof simulationProgress === 'number' && (
          <div className="mt-2 w-full">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>Simulation Progress</span>
              <span>{simulationProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800" aria-hidden="true">
              <div
                data-testid="progress-bar"
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min(100, Math.max(0, simulationProgress))}%` }}
              />
            </div>
          </div>
        )}

        {aiSuggestions.length > 0 && (
          <div
            data-testid="ai-suggestions"
            className="grid w-full gap-2 rounded-xl border border-slate-700/40 bg-slate-900/80 p-3"
          >
            <h4 className="text-sm font-semibold text-slate-100">AI Suggestions</h4>
            {aiSuggestions.map(suggestion => (
              <div
                key={suggestion.id ?? suggestion.message}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800/60 p-2"
              >
                <span className="text-xs text-slate-200">{suggestion.message}</span>
                {suggestion.action && (
                  <ActionButton
                    label="Apply suggestion"
                    ariaLabel="Apply suggestion"
                    icon={<Zap className="w-3 h-3" />}
                    onClick={() => executeAction(() => onAIAssist?.(suggestion.action, suggestion.id))}
                    showLabel
                    className="!px-2 !py-1 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div
            role="status"
            className={`rounded-md px-3 py-2 text-sm ${
              toast.type === 'error' ? 'bg-red-900/40 text-red-200' : 'bg-emerald-900/40 text-emerald-200'
            }`}
          >
            {toast.message}
          </div>
        )}

        {retry && (
          <button
            type="button"
            onClick={() => executeAction(retry.action)}
            className="text-sm font-medium text-blue-300 underline"
            aria-label={retry.label}
          >
            {retry.label}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const QuickActionsPanel = QuickActionsPanelComponent;

export { QuickActionsPanel };
export default QuickActionsPanel;
