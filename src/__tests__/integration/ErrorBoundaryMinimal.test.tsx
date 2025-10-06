import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TacticalErrorBoundary } from '../../components/ui/TacticalErrorBoundary';

describe('Minimal Error Boundary Test', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress all console output for cleaner test results
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should show retry button with correct text', () => {
    const FailingComp = () => {
      throw new Error('Test error');
    };

    const { container } = render(
      <TacticalErrorBoundary context="Test">
        <FailingComp />
      </TacticalErrorBoundary>,
    );

    // Debug: Log the entire HTML
    console.log('=== RENDERED HTML ===');
    console.log(container.innerHTML);
    console.log('=== END HTML ===');

    // Check error is displayed
    expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();

    // Check retry button exists by role (text is split across nodes: "Retry (", "3", " left)")
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    
    // Verify retry button text contains expected parts
    expect(retryButton.textContent).toContain('Retry');
    expect(retryButton.textContent).toContain('left');
  });
});
