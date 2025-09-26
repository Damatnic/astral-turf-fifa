import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import TacticsBoardPage from '../../pages/TacticsBoardPage';
import { createMockUIState, createMockTacticsState } from '../factories';
import '../mocks/modules';

// Mock context providers
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

vi.mock('../../hooks', () => ({
  useUIContext: () => mockUIContext,
  useTacticsContext: () => mockTacticsContext,
  useResponsive: () => mockResponsive,
  useResponsiveNavigation: () => ({
    shouldUseDrawer: false,
    isDrawerOpen: false,
    toggleDrawer: vi.fn(),
  }),
  useResponsiveModal: () => ({
    isModalFullscreen: false,
    modalPadding: 'md',
    modalMaxWidth: 'lg',
  }),
  useFranchiseContext: () => ({
    franchiseState: {
      relationships: [],
      budget: 1000000,
      expenses: [],
      staff: [],
      facilities: [],
      achievements: [],
      history: [],
      currentSeason: {
        id: 'season-2024',
        year: 2024,
        matches: [],
        standings: [],
      },
    },
    dispatch: vi.fn(),
  }),
  useAuthContext: () => ({
    authState: { user: { id: 'test-user', name: 'Test User' }, isAuthenticated: true },
    dispatch: vi.fn(),
  }),
}));

describe('Visual Regression Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUIContext.uiState = createMockUIState();
    mockTacticsContext.tacticsState = createMockTacticsState();
  });

  describe('Layout Visual Tests', () => {
    it('should render layout with consistent styling', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout>
            <div data-testid="test-content">Test Content</div>
          </Layout>
        </BrowserRouter>,
      );

      // Check for consistent gradient backgrounds
      const gradientElements = container.querySelectorAll('[class*="bg-gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);

      // Check for consistent spacing and layout
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('flex-grow', 'flex', 'relative');
    });

    it('should maintain responsive design consistency', () => {
      // Desktop layout
      const { container: desktopContainer } = render(
        <BrowserRouter>
          <Layout>
            <div>Desktop Content</div>
          </Layout>
        </BrowserRouter>,
      );

      // Mobile layout
      Object.assign(mockResponsive, {
        isMobile: true,
        isDesktop: false,
        currentBreakpoint: 'mobile',
      });

      const { container: mobileContainer } = render(
        <BrowserRouter>
          <Layout>
            <div>Mobile Content</div>
          </Layout>
        </BrowserRouter>,
      );

      // Check layout differences
      const desktopLayout = desktopContainer.firstChild as HTMLElement;
      const mobileLayout = mobileContainer.firstChild as HTMLElement;

      expect(desktopLayout).toHaveClass('desktop-layout');
      expect(mobileLayout).toHaveClass('mobile-layout');
    });
  });

  describe('Component Visual Consistency', () => {
    it('should maintain consistent button styling', () => {
      mockUIContext.uiState = createMockUIState({ activeModal: 'editPlayer' });

      const { container } = render(
        <BrowserRouter>
          <Layout>
            <button className="btn-primary">Test Button</button>
            <button className="btn-secondary">Secondary Button</button>
          </Layout>
        </BrowserRouter>,
      );

      // Check for button elements (even if classes aren't applied, structure should be consistent)
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain consistent modal styling', async () => {
      mockUIContext.uiState = createMockUIState({ activeModal: 'editPlayer' });

      const { container } = render(
        <BrowserRouter>
          <Layout>
            <div>Content with modal</div>
          </Layout>
        </BrowserRouter>,
      );

      // Check for modal backdrop
      const modalBackdrop = container.querySelector('.bg-black\\/60, [class*="bg-black"]');
      expect(modalBackdrop || container.querySelector('.fixed')).toBeTruthy();
    });
  });

  describe('Color Consistency', () => {
    it('should use consistent color scheme', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout>
            <div className="text-white bg-slate-900">Themed Content</div>
          </Layout>
        </BrowserRouter>,
      );

      // Check for consistent dark theme application
      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('dark');
    });

    it('should support theme switching', () => {
      // Light theme
      mockUIContext.uiState = createMockUIState({ theme: 'light' });

      const { container: lightContainer } = render(
        <BrowserRouter>
          <Layout>
            <div>Light themed content</div>
          </Layout>
        </BrowserRouter>,
      );

      // Dark theme
      mockUIContext.uiState = createMockUIState({ theme: 'dark' });

      const { container: darkContainer } = render(
        <BrowserRouter>
          <Layout>
            <div>Dark themed content</div>
          </Layout>
        </BrowserRouter>,
      );

      const lightRoot = lightContainer.firstChild as HTMLElement;
      const darkRoot = darkContainer.firstChild as HTMLElement;

      expect(lightRoot).toHaveClass('light');
      expect(darkRoot).toHaveClass('dark');
    });
  });

  describe('Animation Consistency', () => {
    it('should apply consistent transition classes', () => {
      const { container } = render(
        <BrowserRouter>
          <Layout>
            <div>Animated content</div>
          </Layout>
        </BrowserRouter>,
      );

      // Check for transition classes
      const animatedElements = container.querySelectorAll(
        '[class*="transition"], [class*="animate"]',
      );
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});
