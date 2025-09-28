import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, generateCompleteTacticalSetup } from '../utils/enhanced-mock-generators';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';

/**
 * VISUAL REGRESSION TESTING SUITE
 * 
 * Comprehensive visual testing covering:
 * - Component snapshots
 * - Layout consistency
 * - Theme variations
 * - Responsive breakpoints
 * - Animation states
 * - Error states
 * - Interactive states
 * - Cross-browser compatibility
 */

// Mock html-to-image for snapshot generation
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mocked-image-data'),
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mocked-image-data'),
  toSvg: vi.fn().mockResolvedValue('<svg>mocked-svg</svg>'),
  toCanvas: vi.fn().mockResolvedValue(document.createElement('canvas')),
}));

// Mock canvas context for rendering
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  textAlign: 'start',
  textBaseline: 'alphabetic',
  font: '10px sans-serif',
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
};

describe('📸 Visual Regression Tests', () => {
  let tacticalSetup: ReturnType<typeof generateCompleteTacticalSetup>;

  beforeEach(() => {
    tacticalSetup = generateCompleteTacticalSetup('4-4-2', 'medium');

    // Mock canvas for visual rendering
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext);
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');

    // Mock getBoundingClientRect for layout calculations
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1200,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 1200,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    }));

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🎯 Component Snapshots', () => {
    it('should match empty tactical board snapshot', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Wait for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('empty-tactical-board.html');
    });

    it('should match tactical board with formation snapshot', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players,
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
          activeFormationIds: { home: tacticalSetup.formation.id, away: '' },
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-with-formation.html');
    });

    it('should match tactical board with drawings snapshot', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players,
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
          drawings: [
            {
              id: 'arrow-1',
              tool: 'arrow' as const,
              color: '#ff0000',
              points: [{ x: 100, y: 200 }, { x: 300, y: 400 }],
              timestamp: Date.now(),
            },
            {
              id: 'zone-1',
              tool: 'zone' as const,
              color: '#00ff00',
              points: [
                { x: 200, y: 200 },
                { x: 400, y: 200 },
                { x: 400, y: 400 },
                { x: 200, y: 400 },
              ],
              timestamp: Date.now(),
            },
          ],
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-with-drawings.html');
    });

    it('should match fullscreen mode snapshot', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Mock fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: container.firstChild,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-fullscreen.html');
    });
  });

  describe('🎨 Theme Variations', () => {
    it('should match dark theme snapshot', async () => {
      const initialState = {
        ui: {
          theme: 'dark' as const,
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-dark-theme.html');
    });

    it('should match light theme snapshot', async () => {
      const initialState = {
        ui: {
          theme: 'light' as const,
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-light-theme.html');
    });

    it('should match high contrast mode snapshot', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-high-contrast.html');
    });

    it('should match custom team colors snapshot', async () => {
      const initialState = {
        ui: {
          teamKits: {
            home: { primaryColor: '#ff0000', secondaryColor: '#ffffff', pattern: 'solid' as const },
            away: { primaryColor: '#0000ff', secondaryColor: '#ffffff', pattern: 'stripes' as const },
          },
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-custom-colors.html');
    });
  });

  describe('📱 Responsive Breakpoints', () => {
    it('should match mobile viewport snapshot', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 375,
        height: 667,
        top: 0,
        left: 0,
        bottom: 667,
        right: 375,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-mobile.html');
    });

    it('should match tablet viewport snapshot', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 768,
        height: 1024,
        top: 0,
        left: 0,
        bottom: 1024,
        right: 768,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-tablet.html');
    });

    it('should match desktop viewport snapshot', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      });

      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 1920,
        height: 1080,
        top: 0,
        left: 0,
        bottom: 1080,
        right: 1920,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-desktop.html');
    });
  });

  describe('🎬 Animation States', () => {
    it('should match animation timeline snapshot', async () => {
      const initialState = {
        ui: {
          activePlaybookItemId: 'test-play',
          activeStepIndex: 0,
          isAnimating: true,
        },
        tactics: {
          playbook: {
            'test-play': {
              id: 'test-play',
              name: 'Test Play',
              category: 'General' as const,
              formationId: 'test-formation',
              steps: [
                {
                  id: 'step-1',
                  playerPositions: {},
                  drawings: [],
                },
              ],
            },
          },
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-animation-timeline.html');
    });

    it('should match presentation mode snapshot', async () => {
      const initialState = {
        ui: {
          isPresentationMode: true,
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-presentation-mode.html');
    });

    it('should match reduced motion snapshot', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-reduced-motion.html');
    });
  });

  describe('⚠️ Error and Loading States', () => {
    it('should match loading state snapshot', async () => {
      const initialState = {
        ui: {
          isLoadingAI: true,
          isSimulatingMatch: true,
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-loading-state.html');
    });

    it('should match error state snapshot', async () => {
      const initialState = {
        ui: {
          notifications: [
            {
              id: 'error-1',
              message: 'Failed to load formation',
              type: 'error' as const,
            },
          ],
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-error-state.html');
    });

    it('should match empty state snapshot', async () => {
      const initialState = {
        tactics: {
          players: [],
          formations: {},
          activeFormationIds: { home: '', away: '' },
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-empty-state.html');
    });
  });

  describe('🖱️ Interactive States', () => {
    it('should match player selected state snapshot', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players,
          formations: { [tacticalSetup.formation.id]: tacticalSetup.formation },
        },
        ui: {
          selectedPlayerId: tacticalSetup.players[0]?.id,
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-player-selected.html');
    });

    it('should match drawing mode active snapshot', async () => {
      const initialState = {
        ui: {
          drawingTool: 'arrow' as const,
          drawingColor: '#ff0000',
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-drawing-mode.html');
    });

    it('should match chemistry visualization snapshot', async () => {
      const initialState = {
        tactics: {
          players: tacticalSetup.players,
          chemistry: {
            [tacticalSetup.players[0]?.id]: {
              [tacticalSetup.players[1]?.id]: 85,
              [tacticalSetup.players[2]?.id]: 72,
            },
          },
        },
        ui: {
          // Assume chemistry is being shown
        },
      };

      const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-chemistry-visualization.html');
    });
  });

  describe('🌐 Cross-Browser Compatibility', () => {
    it('should match Safari-specific rendering', async () => {
      // Mock Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      });

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-safari.html');
    });

    it('should match Firefox-specific rendering', async () => {
      // Mock Firefox user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
      });

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-firefox.html');
    });

    it('should match Chrome-specific rendering', async () => {
      // Mock Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(container.firstChild).toMatchSnapshot('tactical-board-chrome.html');
    });
  });

  describe('🔧 Configuration Variants', () => {
    it('should match different formation types', async () => {
      const formations = ['4-4-2', '4-3-3', '3-5-2'] as const;
      
      for (const formationType of formations) {
        const setup = generateCompleteTacticalSetup(formationType, 'medium');
        const initialState = {
          tactics: {
            players: setup.players,
            formations: { [setup.formation.id]: setup.formation },
            activeFormationIds: { home: setup.formation.id, away: '' },
          },
        };

        const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
        
        await waitFor(() => {
          expect(screen.getByRole('application')).toBeInTheDocument();
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(container.firstChild).toMatchSnapshot(`tactical-board-${formationType}.html`);
      }
    });

    it('should match different player quality levels', async () => {
      const qualityLevels = ['low', 'medium', 'high'] as const;
      
      for (const quality of qualityLevels) {
        const setup = generateCompleteTacticalSetup('4-4-2', quality);
        const initialState = {
          tactics: {
            players: setup.players,
            formations: { [setup.formation.id]: setup.formation },
            activeFormationIds: { home: setup.formation.id, away: '' },
          },
        };

        const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState });
        
        await waitFor(() => {
          expect(screen.getByRole('application')).toBeInTheDocument();
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(container.firstChild).toMatchSnapshot(`tactical-board-quality-${quality}.html`);
      }
    });
  });

  describe('📊 Snapshot Management', () => {
    it('should generate baseline snapshots for comparison', async () => {
      const testCases = [
        { name: 'empty-board', state: {} },
        { name: 'basic-formation', state: { tactics: { players: tacticalSetup.players.slice(0, 11) } } },
        { name: 'with-drawings', state: { tactics: { drawings: [{ id: '1', tool: 'arrow' as const, color: '#ff0000', points: [], timestamp: Date.now() }] } } },
      ];

      for (const testCase of testCases) {
        const { container } = renderWithProviders(<UnifiedTacticsBoard />, { initialState: testCase.state });
        
        await waitFor(() => {
          expect(screen.getByRole('application')).toBeInTheDocument();
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        // Generate and store baseline
        expect(container.firstChild).toMatchSnapshot(`baseline-${testCase.name}.html`);
      }
    });

    it('should detect visual regressions in critical components', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      // Focus on critical visual elements
      const field = screen.getByTestId('modern-field');
      const toolbar = screen.getByTestId('unified-floating-toolbar');
      
      expect(field).toMatchSnapshot('critical-field-component.html');
      expect(toolbar).toMatchSnapshot('critical-toolbar-component.html');
    });

    it('should validate snapshot metadata and quality', async () => {
      const { container } = renderWithProviders(<UnifiedTacticsBoard />);
      
      await waitFor(() => {
        expect(screen.getByRole('application')).toBeInTheDocument();
      });

      const snapshot = container.innerHTML;
      
      // Validate snapshot quality
      expect(snapshot.length).toBeGreaterThan(1000); // Should have substantial content
      expect(snapshot).toContain('data-testid'); // Should contain test identifiers
      expect(snapshot).not.toContain('undefined'); // Should not have undefined values
      expect(snapshot).not.toContain('null'); // Should not have null values
      
      // Validate critical elements are present
      expect(snapshot).toContain('modern-field');
      expect(snapshot).toContain('unified-floating-toolbar');
      expect(snapshot).toContain('role="application"');
    });
  });
});