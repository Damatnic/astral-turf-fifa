import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from 'vitest';
import { renderWithProviders, testUtils, mockCanvas } from '../../utils/test-helpers';
import { generateFormation, generatePlayer, createTestDataSet } from '../../utils/mock-generators';
import { QuickActionsPanel } from '../../../components/tactics/QuickActionsPanel';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Save: () => <div data-testid="save-icon">Save</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Share2: () => <div data-testid="share-icon">Share2</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  Undo: () => <div data-testid="undo-icon">Undo</div>,
  Redo: () => <div data-testid="redo-icon">Redo</div>,
  RotateCcw: () => <div data-testid="reset-icon">RotateCcw</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  Square: () => <div data-testid="stop-icon">Square</div>,
  Zap: () => <div data-testid="ai-icon">Zap</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  HelpCircle: () => <div data-testid="help-icon">HelpCircle</div>,
}));

describe('QuickActionsPanel', () => {
  let mockProps: any;
  let user: ReturnType<typeof userEvent.setup>;
  let clipboardWriteSpy: MockInstance;

  beforeEach(() => {
    // Setup component props
    mockProps = {
      onSave: vi.fn(),
      onLoad: vi.fn(),
      onExport: vi.fn(),
      onImport: vi.fn(),
      onShare: vi.fn(),
      onCopy: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onReset: vi.fn(),
      onSimulate: vi.fn(),
      onAIAssist: vi.fn(),
      onSettings: vi.fn(),
      onHelp: vi.fn(),
      canUndo: true,
      canRedo: false,
      isSimulating: false,
      isSaving: false,
      className: '',
    };

    // Setup user event
    user = userEvent.setup();

    // Setup canvas mock
    mockCanvas();

    // Mock clipboard API using spies to avoid redefining navigator.clipboard
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API is required for QuickActionsPanel tests');
    }

    clipboardWriteSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    vi.spyOn(navigator.clipboard, 'readText').mockResolvedValue('mock clipboard content');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all action buttons', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const panel = screen.getByTestId('quick-actions-panel');
      expect(panel).toBeInTheDocument();

      // Check main action buttons
      expect(screen.getByRole('button', { name: /save formation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export formation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import formation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share formation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy formation/i })).toBeInTheDocument();
    });

    it('should show edit actions section', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset formation/i })).toBeInTheDocument();
    });

    it('should show simulation controls', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      expect(screen.getByRole('button', { name: /simulate match/i })).toBeInTheDocument();
    });

    it('should show AI and utility actions', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      expect(screen.getByRole('button', { name: /ai assistant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-actions-panel';
      renderWithProviders(<QuickActionsPanel {...mockProps} className={customClass} />);

      const panel = screen.getByTestId('quick-actions-panel');
      expect(panel).toHaveClass(customClass);
    });
  });

  describe('File Operations', () => {
    it('should handle save action', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const saveButton = screen.getByRole('button', { name: /save formation/i });
      await user.click(saveButton);

      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('should show saving state', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} isSaving={true} />);

      const saveButton = screen.getByRole('button', { name: /saving/i });
      expect(saveButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle export action with format selection', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const exportButton = screen.getByRole('button', { name: /export formation/i });
      await user.click(exportButton);

      // Should show format selection menu
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /json/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /csv/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /xml/i })).toBeInTheDocument();

      // Select JSON format
      const jsonOption = screen.getByRole('menuitem', { name: /json/i });
      await user.click(jsonOption);

      expect(mockProps.onExport).toHaveBeenCalledWith('json');
    });

    it('should handle import action with file selection', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const importButton = screen.getByRole('button', { name: /import formation/i });
      await user.click(importButton);

      // Should trigger file input
      expect(mockProps.onImport).toHaveBeenCalledTimes(1);
    });

    it('should handle file drag and drop import', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const panel = screen.getByTestId('quick-actions-panel');

  const file = new window.File(['{"formation": "test"}'], 'formation.json', {
        type: 'application/json',
      });

      fireEvent.dragEnter(panel);
      fireEvent.dragOver(panel);
      fireEvent.drop(panel, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(mockProps.onImport).toHaveBeenCalledWith(file);
    });
  });

  describe('Sharing and Collaboration', () => {
    it('should handle share action', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const shareButton = screen.getByRole('button', { name: /share formation/i });
      await user.click(shareButton);

      expect(mockProps.onShare).toHaveBeenCalledTimes(1);
    });

    it('should handle copy action', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const copyButton = screen.getByRole('button', { name: /copy formation/i });
      await user.click(copyButton);

      expect(mockProps.onCopy).toHaveBeenCalledTimes(1);
    });

    it('should show success notification after copy', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const copyButton = screen.getByRole('button', { name: /copy formation/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/formation copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('should handle share with different platforms', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const shareButton = screen.getByRole('button', { name: /share formation/i });
      await user.click(shareButton);

      // Should show sharing options
      expect(screen.getByRole('button', { name: /share link/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share image/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share via email/i })).toBeInTheDocument();

      // Select share link
      const shareLinkOption = screen.getByRole('button', { name: /share link/i });
      await user.click(shareLinkOption);

      expect(mockProps.onShare).toHaveBeenCalledWith('link');
    });
  });

  describe('Edit Operations', () => {
    it('should handle undo action when available', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} canUndo={true} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();

      await user.click(undoButton);
      expect(mockProps.onUndo).toHaveBeenCalledTimes(1);
    });

    it('should disable undo when not available', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} canUndo={false} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toBeDisabled();
    });

    it('should handle redo action when available', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} canRedo={true} />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).not.toBeDisabled();

      await user.click(redoButton);
      expect(mockProps.onRedo).toHaveBeenCalledTimes(1);
    });

    it('should disable redo when not available', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} canRedo={false} />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toBeDisabled();
    });

    it('should handle reset action with confirmation', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const resetButton = screen.getByRole('button', { name: /reset formation/i });
      await user.click(resetButton);

      // Should show confirmation dialog
      expect(screen.getByText(/are you sure you want to reset/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm reset/i });
      await user.click(confirmButton);

      expect(mockProps.onReset).toHaveBeenCalledTimes(1);
    });

    it('should support keyboard shortcuts for edit operations', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const panel = screen.getByTestId('quick-actions-panel');
      panel.focus();

      // Test Ctrl+Z for undo
      await user.keyboard('{Control>}z{/Control}');
      expect(mockProps.onUndo).toHaveBeenCalledTimes(1);

      // Test Ctrl+Y for redo
      await user.keyboard('{Control>}y{/Control}');
      expect(mockProps.onRedo).toHaveBeenCalledTimes(1);

      // Test Ctrl+S for save
      await user.keyboard('{Control>}s{/Control}');
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Simulation Controls', () => {
    it('should handle simulate action', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const simulateButton = screen.getByRole('button', { name: /simulate match/i });
      await user.click(simulateButton);

      expect(mockProps.onSimulate).toHaveBeenCalledTimes(1);
    });

    it('should show simulation controls when simulating', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} isSimulating={true} />);

      expect(screen.getByRole('button', { name: /pause simulation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop simulation/i })).toBeInTheDocument();
    });

    it('should handle pause/resume simulation', async () => {
      const { rerender } = renderWithProviders(
        <QuickActionsPanel {...mockProps} isSimulating={true} />,
      );

      const pauseButton = screen.getByRole('button', { name: /pause simulation/i });
      await user.click(pauseButton);

      expect(mockProps.onSimulate).toHaveBeenCalledWith('pause');

      // Test resume
      rerender(<QuickActionsPanel {...mockProps} isSimulating={true} isPaused={true} />);

      const resumeButton = screen.getByRole('button', { name: /resume simulation/i });
      await user.click(resumeButton);

      expect(mockProps.onSimulate).toHaveBeenCalledWith('resume');
    });

    it('should show simulation progress', () => {
      renderWithProviders(
        <QuickActionsPanel {...mockProps} isSimulating={true} simulationProgress={45} />,
      );

      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });
  });

  describe('AI Assistant Integration', () => {
    it('should handle AI assist action', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const aiButton = screen.getByRole('button', { name: /ai assistant/i });
      await user.click(aiButton);

      expect(mockProps.onAIAssist).toHaveBeenCalledTimes(1);
    });

    it('should show AI suggestions when available', () => {
      const aiSuggestions = [
        { type: 'formation', message: 'Try a more defensive setup' },
        { type: 'player', message: 'Consider swapping wingers' },
      ];

      renderWithProviders(
        <QuickActionsPanel {...mockProps} aiSuggestions={aiSuggestions} />,
      );

      expect(screen.getByTestId('ai-suggestions')).toBeInTheDocument();
      expect(screen.getByText('Try a more defensive setup')).toBeInTheDocument();
      expect(screen.getByText('Consider swapping wingers')).toBeInTheDocument();
    });

    it('should handle AI suggestion actions', async () => {
      const aiSuggestions = [
        { id: 'suggestion-1', type: 'formation', message: 'Try 4-3-3', action: 'apply' },
      ];

      renderWithProviders(
        <QuickActionsPanel {...mockProps} aiSuggestions={aiSuggestions} />,
      );

      const applyButton = screen.getByRole('button', { name: /apply suggestion/i });
      await user.click(applyButton);

      expect(mockProps.onAIAssist).toHaveBeenCalledWith('apply', 'suggestion-1');
    });

    it('should show AI loading state', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} isAIProcessing={true} />);

      const aiButton = screen.getByRole('button', { name: /ai assistant/i });
      expect(aiButton).toHaveClass('animate-pulse');
      expect(screen.getByText(/ai thinking/i)).toBeInTheDocument();
    });
  });

  describe('Settings and Help', () => {
    it('should handle settings action', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      expect(mockProps.onSettings).toHaveBeenCalledTimes(1);
    });

    it('should handle help action', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const helpButton = screen.getByRole('button', { name: /help/i });
      await user.click(helpButton);

      expect(mockProps.onHelp).toHaveBeenCalledTimes(1);
    });

    it('should show keyboard shortcuts help', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const helpButton = screen.getByRole('button', { name: /help/i });
      await user.click(helpButton);

      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
      expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Z')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Y')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const panel = screen.getByTestId('quick-actions-panel');
      expect(panel).toHaveClass('mobile-layout');
    });

    it('should show compact view on smaller screens', () => {
      // Mock small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      // Icons only, no text labels
      expect(screen.queryByText(/save formation/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    });

    it('should show overflow menu when actions dont fit', () => {
      // Mock narrow viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      expect(screen.getByRole('button', { name: /more actions/i })).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should render within performance threshold', async () => {
      const renderTime = await testUtils.measureRenderTime(() => {
        renderWithProviders(<QuickActionsPanel {...mockProps} />);
      });

      expect(renderTime).toBeLessThan(75); // 75ms threshold
    });

    it('should debounce rapid action calls', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const saveButton = screen.getByRole('button', { name: /save formation/i });

      // Rapid clicks
      await user.click(saveButton);
      await user.click(saveButton);
      await user.click(saveButton);

      // Should only be called once due to debouncing
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('should memoize action buttons', () => {
      const memoSpy = vi.spyOn(React, 'memo');

      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      expect(memoSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const panel = screen.getByTestId('quick-actions-panel');
      expect(panel).toHaveAttribute('role', 'toolbar');
      expect(panel).toHaveAttribute('aria-label', 'Quick actions toolbar');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const firstButton = screen.getByRole('button', { name: /save formation/i });
      firstButton.focus();

      // Tab through buttons
      await user.tab();
      expect(screen.getByRole('button', { name: /export formation/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /import formation/i })).toHaveFocus();
    });

    it('should announce action states to screen readers', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} isSaving={true} />);

      const saveButton = screen.getByRole('button', { name: /saving/i });
      expect(saveButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have proper focus indicators', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const saveButton = screen.getByRole('button', { name: /save formation/i });
      saveButton.focus();

      expect(saveButton).toHaveClass('focus-visible');
    });

    it('should support screen reader shortcuts', async () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const panel = screen.getByTestId('quick-actions-panel');
      panel.focus();

      // Test screen reader navigation
      await user.keyboard('[ArrowRight]');
      expect(screen.getByRole('button', { name: /export formation/i })).toHaveFocus();

      await user.keyboard('[Home]');
      expect(screen.getByRole('button', { name: /save formation/i })).toHaveFocus();

      await user.keyboard('[End]');
      expect(screen.getByRole('button', { name: /help/i })).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle action errors gracefully', async () => {
      const errorProps = {
        ...mockProps,
        onSave: vi.fn().mockRejectedValue(new Error('Save failed')),
      };

      renderWithProviders(<QuickActionsPanel {...errorProps} />);

      const saveButton = screen.getByRole('button', { name: /save formation/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/save failed/i)).toBeInTheDocument();
      });
    });

    it('should show retry option on failures', async () => {
      const errorProps = {
        ...mockProps,
        onExport: vi.fn().mockRejectedValue(new Error('Export failed')),
      };

      renderWithProviders(<QuickActionsPanel {...errorProps} />);

      const exportButton = screen.getByRole('button', { name: /export formation/i });
      await user.click(exportButton);

      // Select format
      const jsonOption = screen.getByRole('menuitem', { name: /json/i });
      await user.click(jsonOption);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry export/i })).toBeInTheDocument();
      });
    });

    it('should handle clipboard errors', async () => {
      clipboardWriteSpy.mockRejectedValueOnce(new Error('Clipboard error'));

      renderWithProviders(<QuickActionsPanel {...mockProps} />);

      const copyButton = screen.getByRole('button', { name: /copy formation/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copy failed/i)).toBeInTheDocument();
      });
    });

    it('should disable actions when in error state', () => {
      renderWithProviders(<QuickActionsPanel {...mockProps} hasError={true} />);

      const saveButton = screen.getByRole('button', { name: /save formation/i });
      expect(saveButton).toBeDisabled();
    });
  });
});