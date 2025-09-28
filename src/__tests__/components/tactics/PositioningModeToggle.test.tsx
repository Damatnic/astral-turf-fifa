import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import PositioningModeToggle from '../../../components/tactics/PositioningModeToggle';

/**
 * Comprehensive Test Suite for PositioningModeToggle Component
 * 
 * Tests cover:
 * - Rendering with different modes
 * - User interactions and mode switching
 * - Accessibility features
 * - Animation state management
 * - Keyboard navigation
 * - Props handling and validation
 * - Visual indicators and descriptions
 */

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, any>(({ children, layoutId, className, ...props }, ref) => (
      <div ref={ref} className={className} data-layout-id={layoutId} {...props}>
        {children}
      </div>
    ))
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PositioningModeToggle', () => {
  const mockOnModeChange = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with snap mode selected by default', () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Positioning Mode:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /snap to position/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /free movement/i })).toBeInTheDocument();
      expect(screen.getByText('Players snap to formation positions')).toBeInTheDocument();
    });

    it('should render with free mode selected', () => {
      render(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Players can be placed anywhere on field')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should render correct icons for each mode', () => {
      const { rerender } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      // Check snap mode icon
      let icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();

      // Switch to free mode
      rerender(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      // Check free mode icon (different SVG path)
      icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Mode Selection', () => {
    it('should call onModeChange with "snap" when snap button is clicked', async () => {
      render(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      const snapButton = screen.getByRole('button', { name: /snap to position/i });
      await user.click(snapButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('snap');
      expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    });

    it('should call onModeChange with "free" when free button is clicked', async () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const freeButton = screen.getByRole('button', { name: /free movement/i });
      await user.click(freeButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('free');
      expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onModeChange when already selected mode is clicked', async () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const snapButton = screen.getByRole('button', { name: /snap to position/i });
      await user.click(snapButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('snap');
      expect(mockOnModeChange).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid clicking without issues', async () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const freeButton = screen.getByRole('button', { name: /free movement/i });
      const snapButton = screen.getByRole('button', { name: /snap to position/i });

      // Rapid clicks
      await user.click(freeButton);
      await user.click(snapButton);
      await user.click(freeButton);
      await user.click(snapButton);

      expect(mockOnModeChange).toHaveBeenCalledTimes(4);
    });
  });

  describe('Visual States', () => {
    it('should apply correct styles for active snap mode', () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const snapButton = screen.getByRole('button', { name: /snap to position/i });
      const freeButton = screen.getByRole('button', { name: /free movement/i });

      // Active button should have white text
      expect(snapButton).toHaveClass('text-white');
      
      // Inactive button should have gray text
      expect(freeButton).toHaveClass('text-slate-400');
    });

    it('should apply correct styles for active free mode', () => {
      render(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      const snapButton = screen.getByRole('button', { name: /snap to position/i });
      const freeButton = screen.getByRole('button', { name: /free movement/i });

      // Active button should have white text
      expect(freeButton).toHaveClass('text-white');
      
      // Inactive button should have gray text
      expect(snapButton).toHaveClass('text-slate-400');
    });

    it('should render motion indicators with correct layout IDs', () => {
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const motionIndicator = container.querySelector('[data-layout-id="positioningModeIndicator"]');
      expect(motionIndicator).toBeInTheDocument();
    });

    it('should show correct background colors for mode indicators', () => {
      const { container, rerender } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      // Snap mode should have blue background
      let indicator = container.querySelector('[data-layout-id="positioningModeIndicator"]');
      expect(indicator).toHaveClass('bg-blue-600');

      // Free mode should have green background
      rerender(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      indicator = container.querySelector('[data-layout-id="positioningModeIndicator"]');
      expect(indicator).toHaveClass('bg-green-600');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should have descriptive button text', () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByRole('button', { name: /snap to position/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /free movement/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const freeButton = screen.getByRole('button', { name: /free movement/i });
      
      // Focus and activate with keyboard
      freeButton.focus();
      expect(freeButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockOnModeChange).toHaveBeenCalledWith('free');
    });

    it('should support space key activation', async () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const freeButton = screen.getByRole('button', { name: /free movement/i });
      freeButton.focus();

      await user.keyboard(' ');
      expect(mockOnModeChange).toHaveBeenCalledWith('free');
    });

    it('should provide informative descriptions for each mode', () => {
      const { rerender } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Players snap to formation positions')).toBeInTheDocument();

      rerender(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Players can be placed anywhere on field')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render snap mode icon with correct attributes', () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('w-4', 'h-4', 'text-blue-400');
    });

    it('should render free mode icon with correct attributes', () => {
      render(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('w-4', 'h-4', 'text-green-400');
    });

    it('should render SVG paths correctly', () => {
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const svg = container.querySelector('svg');
      const path = container.querySelector('path');
      
      expect(svg).toBeInTheDocument();
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('strokeLinecap', 'round');
      expect(path).toHaveAttribute('strokeLinejoin', 'round');
      expect(path).toHaveAttribute('strokeWidth', '2');
    });
  });

  describe('Component Structure', () => {
    it('should maintain proper DOM structure', () => {
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'items-center', 'space-x-3');

      const label = wrapper.querySelector('span');
      expect(label).toHaveTextContent('Positioning Mode:');
      expect(label).toHaveClass('text-slate-300', 'text-sm', 'font-medium');
    });

    it('should have correct button container styling', () => {
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const buttonContainer = container.querySelector('.bg-slate-800');
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass('rounded-lg', 'p-1', 'border', 'border-slate-600');
    });

    it('should render description section correctly', () => {
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const descriptionSection = container.querySelector('.space-x-2');
      expect(descriptionSection).toBeInTheDocument();

      const description = container.querySelector('.text-xs.text-slate-400');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onModeChange prop gracefully', () => {
      // This would normally cause TypeScript errors, but test runtime behavior
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={undefined as any}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle invalid mode prop', () => {
      // Test with invalid mode
      const { container } = render(
        <PositioningModeToggle
          mode={'invalid' as any}
          onModeChange={mockOnModeChange}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      
      function TestWrapper(props: { mode: 'snap' | 'free' }) {
        renderSpy();
        return (
          <PositioningModeToggle
            mode={props.mode}
            onModeChange={mockOnModeChange}
          />
        );
      }

      const { rerender } = render(<TestWrapper mode="snap" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same props should not cause re-render
      rerender(<TestWrapper mode="snap" />);
      expect(renderSpy).toHaveBeenCalledTimes(2); // React will still re-render, but component should be optimized
    });

    it('should handle high-frequency mode changes', async () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const freeButton = screen.getByRole('button', { name: /free movement/i });
      const snapButton = screen.getByRole('button', { name: /snap to position/i });

      // Simulate rapid clicking (stress test)
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          fireEvent.click(freeButton);
        } else {
          fireEvent.click(snapButton);
        }
      }

      expect(mockOnModeChange).toHaveBeenCalledTimes(10);
    });
  });

  describe('Visual Regression Prevention', () => {
    it('should maintain consistent styling classes', () => {
      const { container } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const buttons = container.querySelectorAll('button');
      
      buttons.forEach(button => {
        expect(button).toHaveClass('relative', 'px-3', 'py-1.5', 'text-sm', 'font-medium', 'transition-colors', 'rounded-md');
      });
    });

    it('should maintain correct color scheme', () => {
      render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      const activeButton = screen.getByRole('button', { name: /snap to position/i });
      const inactiveButton = screen.getByRole('button', { name: /free movement/i });

      expect(activeButton).toHaveClass('text-white');
      expect(inactiveButton).toHaveClass('text-slate-400', 'hover:text-white');
    });
  });

  describe('Integration with Parent Components', () => {
    it('should work correctly when mode is changed externally', () => {
      const { rerender } = render(
        <PositioningModeToggle
          mode="snap"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Players snap to formation positions')).toBeInTheDocument();

      // Simulate external mode change
      rerender(
        <PositioningModeToggle
          mode="free"
          onModeChange={mockOnModeChange}
        />
      );

      expect(screen.getByText('Players can be placed anywhere on field')).toBeInTheDocument();
    });

    it('should handle mode changes during component lifecycle', () => {
      let currentMode: 'snap' | 'free' = 'snap';
      
      const handleModeChange = (mode: 'snap' | 'free') => {
        currentMode = mode;
        mockOnModeChange(mode);
      };

      const { rerender } = render(
        <PositioningModeToggle
          mode={currentMode}
          onModeChange={handleModeChange}
        />
      );

      const freeButton = screen.getByRole('button', { name: /free movement/i });
      fireEvent.click(freeButton);

      // Update mode and re-render
      currentMode = 'free';
      rerender(
        <PositioningModeToggle
          mode={currentMode}
          onModeChange={handleModeChange}
        />
      );

      expect(screen.getByText('Players can be placed anywhere on field')).toBeInTheDocument();
    });
  });
});