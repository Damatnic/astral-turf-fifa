import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createMockUIState, createMockTacticsState } from '../factories';
import '../mocks/modules'; // Import module mocks

// Mock the lazy-loaded components
vi.mock('../../components/popups/PlayerEditPopup', () => ({
  default: () => <div data-testid="player-edit-popup">Player Edit Popup</div>,
}));

vi.mock('../../components/popups/AIChatPopup', () => ({
  default: () => <div data-testid="ai-chat-popup">AI Chat Popup</div>,
}));

vi.mock('../../components/ui/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../components/ui/NotificationContainer', () => ({
  default: () => <div data-testid="notification-container">Notifications</div>,
}));

vi.mock('../../components/export/PrintableLineup', () => ({
  default: vi.fn().forwardRef((props, ref) => (
    <div data-testid="printable-lineup" ref={ref}>Printable Lineup</div>
  )),
}));

// Mock hooks
const mockUIContext = {
  uiState: createMockUIState(),
  dispatch: vi.fn(),
};

const mockTacticsContext = {
  tacticsState: createMockTacticsState(),
  dispatch: vi.fn(),
};

const mockResponsive = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  currentBreakpoint: 'desktop' as const,
  screenSize: { width: 1920, height: 1080 },
};

const mockResponsiveModal = {
  shouldUseFullScreenModal: false,
  modalSize: 'medium' as const,
};

vi.mock('../../hooks', () => ({
  useUIContext: () => mockUIContext,
  useTacticsContext: () => mockTacticsContext,
  useResponsive: () => mockResponsive,
  useResponsiveModal: () => mockResponsiveModal,
}));

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock states
    mockUIContext.uiState = createMockUIState();
    mockTacticsContext.tacticsState = createMockTacticsState();
    Object.assign(mockResponsive, {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      currentBreakpoint: 'desktop',
    });
  });

  it('should render basic layout structure', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      </BrowserRouter>,
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('notification-container')).toBeInTheDocument();
  });

  it('should apply correct theme classes', () => {
    mockUIContext.uiState = createMockUIState({ theme: 'light' });

    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv).toHaveClass('light');
  });

  it('should apply dark theme classes by default', () => {
    mockUIContext.uiState = createMockUIState({ theme: 'dark' });

    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv).toHaveClass('dark');
  });

  it('should apply mobile layout classes on mobile devices', () => {
    Object.assign(mockResponsive, {
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      currentBreakpoint: 'mobile',
    });

    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv).toHaveClass('mobile-layout');
  });

  it('should apply tablet layout classes on tablet devices', () => {
    Object.assign(mockResponsive, {
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      currentBreakpoint: 'tablet',
    });

    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv).toHaveClass('tablet-layout');
  });

  it('should hide header in presentation mode', () => {
    mockUIContext.uiState = createMockUIState({ isPresentationMode: true });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
  });

  it('should show header when not in presentation mode', () => {
    mockUIContext.uiState = createMockUIState({ isPresentationMode: false });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should render modal when activeModal is set', async () => {
    mockUIContext.uiState = createMockUIState({ activeModal: 'editPlayer' });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    // Wait for Suspense to resolve
    await waitFor(() => {
      expect(screen.getByTestId('player-edit-popup')).toBeInTheDocument();
    });
  });

  it('should render AI chat modal', async () => {
    mockUIContext.uiState = createMockUIState({ activeModal: 'chat' });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-popup')).toBeInTheDocument();
    });
  });

  it('should not render modal when activeModal is null', () => {
    mockUIContext.uiState = createMockUIState({ activeModal: null });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    expect(screen.queryByTestId('player-edit-popup')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-chat-popup')).not.toBeInTheDocument();
  });

  it('should show loading indicator while modal is loading', async () => {
    mockUIContext.uiState = createMockUIState({ activeModal: 'editPlayer' });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    // Initially should show loading
    const loadingSpinner = screen.getByRole('generic', { hidden: true });
    expect(loadingSpinner).toHaveClass('animate-spin');
  });

  it('should render printable lineup when exporting', () => {
    mockUIContext.uiState = createMockUIState({ isExportingLineup: true });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    expect(screen.getByTestId('printable-lineup')).toBeInTheDocument();
  });

  it('should not render printable lineup when not exporting', () => {
    mockUIContext.uiState = createMockUIState({ isExportingLineup: false });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    expect(screen.queryByTestId('printable-lineup')).not.toBeInTheDocument();
  });

  it('should handle keyboard shortcuts for drawing tools', () => {
    mockUIContext.uiState = createMockUIState({ isPresentationMode: false });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    // Simulate pressing 'v' for select tool
    fireEvent.keyDown(document, { key: 'v', ctrlKey: false });
    expect(mockUIContext.dispatch).toHaveBeenCalledWith({
      type: 'SET_DRAWING_TOOL',
      payload: 'select',
    });

    // Simulate pressing 'a' for arrow tool
    fireEvent.keyDown(document, { key: 'a', ctrlKey: false });
    expect(mockUIContext.dispatch).toHaveBeenCalledWith({
      type: 'SET_DRAWING_TOOL',
      payload: 'arrow',
    });
  });

  it('should handle soft reset keyboard shortcut', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    // Simulate pressing Ctrl+R
    fireEvent.keyDown(document, { key: 'r', ctrlKey: true });
    expect(mockUIContext.dispatch).toHaveBeenCalledWith({
      type: 'SOFT_RESET_APP',
    });
  });

  it('should ignore keyboard shortcuts when input is focused', () => {
    render(
      <BrowserRouter>
        <Layout>
          <input data-testid="test-input" />
        </Layout>
      </BrowserRouter>,
    );

    const input = screen.getByTestId('test-input');
    input.focus();

    // Simulate pressing 'v' while input is focused
    fireEvent.keyDown(input, { key: 'v', target: input });

    // Should not dispatch drawing tool action
    expect(mockUIContext.dispatch).not.toHaveBeenCalledWith({
      type: 'SET_DRAWING_TOOL',
      payload: 'select',
    });
  });

  it('should ignore drawing shortcuts in presentation mode', () => {
    mockUIContext.uiState = createMockUIState({ isPresentationMode: true });

    render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    fireEvent.keyDown(document, { key: 'v', ctrlKey: false });

    expect(mockUIContext.dispatch).not.toHaveBeenCalledWith({
      type: 'SET_DRAWING_TOOL',
      payload: 'select',
    });
  });

  it('should apply mobile-specific classes and structure', () => {
    Object.assign(mockResponsive, {
      isMobile: true,
      currentBreakpoint: 'mobile',
    });

    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv).toHaveClass('mobile-full-height', 'mobile-safe-area');

    const main = layoutDiv.querySelector('main');
    expect(main).toHaveClass('flex-col');
  });

  it('should apply desktop layout structure', () => {
    Object.assign(mockResponsive, {
      isMobile: false,
      isDesktop: true,
      currentBreakpoint: 'desktop',
    });

    const { container } = render(
      <BrowserRouter>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>,
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('flex-row');
  });
});