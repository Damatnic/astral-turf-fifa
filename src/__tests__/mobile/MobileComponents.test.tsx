/**
 * Mobile Components Testing Suite
 * Tests mobile-optimized components for touch interactions and responsive behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../context/ThemeContext';
import MobilePlayerToken from '../../components/mobile/MobilePlayerToken';
import MobileTacticalField from '../../components/mobile/MobileTacticalField';
import MobileNavigation, { defaultNavigationItems } from '../../components/mobile/MobileNavigation';

// Mock utilities
vi.mock('../../utils/mobileOptimizations', () => ({
  useMobileCapabilities: () => ({
    isMobile: true,
    isTablet: false,
    isIOS: true,
    isAndroid: false,
    supportsTouchEvents: true,
    hasHapticFeedback: true,
    devicePixelRatio: 3,
    orientation: 'portrait',
  }),
  useTouchGestures: vi.fn(),
  useMobileViewport: () => ({
    width: 375,
    height: 812,
    safeAreaTop: 44,
    safeAreaBottom: 34,
    safeAreaLeft: 0,
    safeAreaRight: 0,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: () => 0,
  PanInfo: {},
}));

const mockPlayer = {
  id: 'player-1',
  name: 'John Doe',
  position: 'ST' as const,
  jerseyNumber: 9,
  rating: 85,
  nationality: 'England',
  age: 25,
  isInjured: false,
  morale: 90,
  fitness: 85,
  attributes: {
    pace: 80,
    shooting: 85,
    passing: 70,
    defending: 40,
    physicality: 75,
    mentality: 80,
  },
};

const mockFormation = {
  id: 'formation-1',
  name: '4-3-3',
  playerPositions: {
    'player-1': { x: 100, y: 100 },
  },
  description: 'Test formation',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const mockFieldBounds = {
  width: 800,
  height: 520,
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  bottom: 520,
  right: 800,
  toJSON: () => ({}),
} as DOMRect;

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MobilePlayerToken Component', () => {
  const defaultProps = {
    player: mockPlayer,
    position: { x: 100, y: 100 },
    isSelected: false,
    isDragging: false,
    onSelect: vi.fn(),
    onMove: vi.fn(),
    onLongPress: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    fieldBounds: mockFieldBounds,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render player token with correct information', () => {
    renderWithTheme(<MobilePlayerToken {...defaultProps} />);

    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByLabelText(/John Doe.*ST.*85 rating/)).toBeInTheDocument();
  });

  it('should apply correct position colors based on player role', () => {
    const { rerender } = renderWithTheme(<MobilePlayerToken {...defaultProps} />);
    
    // Striker should have red background
    expect(screen.getByRole('button')).toHaveClass('bg-red-500');

    // Defender should have blue background
    const defender = { ...mockPlayer, position: 'CB' as const };
    rerender(
      <ThemeProvider>
        <MobilePlayerToken {...defaultProps} player={defender} />
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toHaveClass('bg-blue-500');
  });

  it('should show selection indicator when selected', () => {
    renderWithTheme(<MobilePlayerToken {...defaultProps} isSelected={true} />);
    
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('should show conflict indicator when conflicted', () => {
    renderWithTheme(<MobilePlayerToken {...defaultProps} isConflicted={true} />);
    
    // Should have conflict indicator (red dot)
    const conflictIndicator = document.querySelector('.bg-red-500.rounded-full');
    expect(conflictIndicator).toBeInTheDocument();
  });

  it('should call onSelect when tapped', async () => {
    const onSelect = vi.fn();
    renderWithTheme(<MobilePlayerToken {...defaultProps} onSelect={onSelect} />);

    const playerToken = screen.getByRole('button');
    await userEvent.click(playerToken);

    expect(onSelect).toHaveBeenCalledWith(mockPlayer, expect.any(Object));
  });

  it('should handle touch gestures correctly', () => {
    const touchCallbacks = {
      onTap: vi.fn(),
      onLongPress: vi.fn(),
      onDrag: vi.fn(),
    };

    const mockUseTouchGestures = vi.mocked(require('../../utils/mobileOptimizations').useTouchGestures);
    mockUseTouchGestures.mockImplementation((ref, callbacks) => {
      Object.assign(touchCallbacks, callbacks);
    });

    renderWithTheme(<MobilePlayerToken {...defaultProps} />);

    // Simulate touch gestures
    touchCallbacks.onTap(new TouchEvent('touchend'), { x: 100, y: 100 });
    expect(defaultProps.onSelect).toHaveBeenCalled();

    touchCallbacks.onLongPress(new TouchEvent('touchstart'), { x: 100, y: 100 });
    expect(defaultProps.onLongPress).toHaveBeenCalled();
  });

  it('should show stats overlay on mobile when enabled', () => {
    renderWithTheme(
      <MobilePlayerToken {...defaultProps} isSelected={true} showStats={true} />
    );

    expect(screen.getByText(/John Doe • 85/)).toBeInTheDocument();
  });

  it('should apply minimum touch target size on mobile', () => {
    renderWithTheme(<MobilePlayerToken {...defaultProps} />);
    
    const tokenElement = screen.getByRole('button').firstChild as HTMLElement;
    const computedStyle = window.getComputedStyle(tokenElement);
    
    // Should have minimum 44px touch target
    expect(parseInt(computedStyle.minWidth)).toBeGreaterThanOrEqual(44);
    expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(44);
  });
});

describe('MobileTacticalField Component', () => {
  const defaultProps = {
    players: [mockPlayer],
    onPlayerSelect: vi.fn(),
    onPlayerMove: vi.fn(),
    onPlayerLongPress: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render tactical field with proper dimensions', () => {
    renderWithTheme(<MobileTacticalField {...defaultProps} />);

    const fieldElement = document.querySelector('.bg-green-600');
    expect(fieldElement).toBeInTheDocument();
  });

  it('should render players on the field', () => {
    renderWithTheme(
      <MobileTacticalField {...defaultProps} formation={mockFormation} />
    );

    expect(screen.getByLabelText(/John Doe.*ST.*85 rating/)).toBeInTheDocument();
  });

  it('should show grid overlay when enabled', () => {
    renderWithTheme(
      <MobileTacticalField {...defaultProps} showGrid={true} />
    );

    const gridSvg = document.querySelector('svg');
    expect(gridSvg).toBeInTheDocument();
  });

  it('should show tactical zones when enabled', () => {
    renderWithTheme(
      <MobileTacticalField {...defaultProps} showZones={true} />
    );

    // Should have zone rectangles
    const zones = document.querySelectorAll('rect[fill*="rgba"]');
    expect(zones.length).toBeGreaterThan(0);
  });

  it('should handle pan and zoom gestures', () => {
    const touchCallbacks = {
      onPinch: vi.fn(),
      onSwipe: vi.fn(),
    };

    const mockUseTouchGestures = vi.mocked(require('../../utils/mobileOptimizations').useTouchGestures);
    mockUseTouchGestures.mockImplementation((ref, callbacks) => {
      Object.assign(touchCallbacks, callbacks);
    });

    renderWithTheme(<MobileTacticalField {...defaultProps} />);

    // Simulate pinch gesture
    touchCallbacks.onPinch(new TouchEvent('touchmove'), 1.5);
    
    // Simulate swipe gesture
    touchCallbacks.onSwipe(new TouchEvent('touchend'), 'left', 2.0);
  });

  it('should show mobile control buttons', () => {
    renderWithTheme(<MobileTacticalField {...defaultProps} />);

    // Should have mobile control buttons (reset, zoom in, zoom out)
    const controlButtons = document.querySelectorAll('button');
    expect(controlButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('should adapt to safe area insets', () => {
    renderWithTheme(<MobileTacticalField {...defaultProps} />);

    const container = document.querySelector('[style*="padding"]');
    expect(container).toBeInTheDocument();
  });
});

describe('MobileNavigation Component', () => {
  const defaultProps = {
    items: defaultNavigationItems,
    onNavigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render mobile header with menu button', () => {
    renderWithTheme(<MobileNavigation {...defaultProps} />);

    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    expect(screen.getByText('Astral Turf')).toBeInTheDocument();
  });

  it('should toggle menu on button click', async () => {
    renderWithTheme(<MobileNavigation {...defaultProps} />);

    const menuButton = screen.getByLabelText('Open menu');
    await userEvent.click(menuButton);

    // Menu should be open
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('should render navigation items in menu', async () => {
    renderWithTheme(<MobileNavigation {...defaultProps} />);

    const menuButton = screen.getByLabelText('Open menu');
    await userEvent.click(menuButton);

    // Should show navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tactics')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should handle navigation item selection', async () => {
    const onNavigate = vi.fn();
    renderWithTheme(<MobileNavigation {...defaultProps} onNavigate={onNavigate} />);

    const menuButton = screen.getByLabelText('Open menu');
    await userEvent.click(menuButton);

    const dashboardItem = screen.getByText('Dashboard');
    await userEvent.click(dashboardItem);

    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'home', label: 'Dashboard' })
    );
  });

  it('should show submenu for items with children', async () => {
    renderWithTheme(<MobileNavigation {...defaultProps} />);

    const menuButton = screen.getByLabelText('Open menu');
    await userEvent.click(menuButton);

    const tacticsItem = screen.getByText('Tactics');
    await userEvent.click(tacticsItem);

    // Should show submenu items
    expect(screen.getByText('Tactical Board')).toBeInTheDocument();
    expect(screen.getByText('Formations')).toBeInTheDocument();
  });

  it('should show search bar when enabled', async () => {
    renderWithTheme(<MobileNavigation {...defaultProps} showSearch={true} />);

    const searchButton = screen.getByLabelText('Search');
    await userEvent.click(searchButton);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should show notification and user profile buttons', () => {
    renderWithTheme(
      <MobileNavigation 
        {...defaultProps} 
        showNotifications={true} 
        showUserProfile={true} 
      />
    );

    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });

  it('should adapt header height for safe area', () => {
    renderWithTheme(<MobileNavigation {...defaultProps} />);

    const header = document.querySelector('header');
    expect(header).toHaveStyle('height: 92px'); // 48px + 44px safe area top
  });

  it('should show badge on navigation items', async () => {
    renderWithTheme(<MobileNavigation {...defaultProps} />);

    const menuButton = screen.getByLabelText('Open menu');
    await userEvent.click(menuButton);

    // Analytics item should have badge
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-500');
  });

  it('should handle swipe gestures for menu', () => {
    const touchCallbacks = {
      onSwipe: vi.fn(),
    };

    const mockUseTouchGestures = vi.mocked(require('../../utils/mobileOptimizations').useTouchGestures);
    mockUseTouchGestures.mockImplementation((ref, callbacks) => {
      Object.assign(touchCallbacks, callbacks);
    });

    renderWithTheme(<MobileNavigation {...defaultProps} />);

    // Simulate right swipe to open menu
    touchCallbacks.onSwipe(new TouchEvent('touchend'), 'right', 1.5);
  });

  it('should maintain minimum touch target sizes', async () => {
    renderWithTheme(<MobileNavigation {...defaultProps} />);

    const menuButton = screen.getByLabelText('Open menu');
    await userEvent.click(menuButton);

    const navItems = screen.getAllByRole('menuitem');
    
    navItems.forEach(item => {
      const computedStyle = window.getComputedStyle(item);
      expect(parseInt(computedStyle.minHeight)).toBeGreaterThanOrEqual(48);
    });
  });
});

describe('Mobile Component Integration', () => {
  it('should work together in a complete mobile interface', async () => {
    const IntegratedComponent = () => (
      <ThemeProvider>
        <div>
          <MobileNavigation 
            items={defaultNavigationItems}
            onNavigate={vi.fn()}
          />
          <MobileTacticalField
            players={[mockPlayer]}
            formation={mockFormation}
            onPlayerSelect={vi.fn()}
            onPlayerMove={vi.fn()}
            onPlayerLongPress={vi.fn()}
          />
        </div>
      </ThemeProvider>
    );

    render(<IntegratedComponent />);

    // Should render both navigation and field
    expect(screen.getByText('Astral Turf')).toBeInTheDocument();
    expect(screen.getByLabelText(/John Doe.*ST.*85 rating/)).toBeInTheDocument();

    // Should handle interactions without conflicts
    const menuButton = screen.getByLabelText('Open menu');
    await userEvent.click(menuButton);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should handle performance optimization correctly', () => {
    const performanceProps = {
      players: Array.from({ length: 50 }, (_, i) => ({
        ...mockPlayer,
        id: `player-${i}`,
        name: `Player ${i}`,
      })),
      onPlayerSelect: vi.fn(),
      onPlayerMove: vi.fn(),
      onPlayerLongPress: vi.fn(),
    };

    renderWithTheme(<MobileTacticalField {...performanceProps} />);

    // Should render without performance issues
    expect(screen.getAllByRole('button').length).toBeGreaterThan(10);
  });
});

export {};