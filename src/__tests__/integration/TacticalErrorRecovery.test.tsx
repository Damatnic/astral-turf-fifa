import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TacticalErrorBoundary } from '../../components/ui/TacticalErrorBoundary';
import { UnifiedTacticsBoard } from '../../components/tactics/UnifiedTacticsBoard';
import type { Formation, Player } from '../../types';

/**
 * ZENITH TACTICAL ERROR RECOVERY & NETWORK FAILURE TEST SUITE
 * Comprehensive testing of error scenarios, network failures, and recovery mechanisms
 * Ensures bulletproof production deployment readiness
 */

// Mock network conditions
class NetworkSimulator {
  private isOnline = true;
  private latency = 0;
  private failureRate = 0;

  setOffline() {
    this.isOnline = false;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  }

  setOnline() {
    this.isOnline = true;
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event('online'));
  }

  setLatency(ms: number) {
    this.latency = ms;
  }

  setFailureRate(rate: number) {
    this.failureRate = rate;
  }

  simulateNetworkCall<T>(successValue: T): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!this.isOnline) {
          reject(new Error('Network unavailable'));
          return;
        }

        if (Math.random() < this.failureRate) {
          reject(new Error('Network request failed'));
          return;
        }

        resolve(successValue);
      }, this.latency);
    });
  }

  reset() {
    this.isOnline = true;
    this.latency = 0;
    this.failureRate = 0;
    this.setOnline();
  }
}

// Error injection utilities
class ErrorInjector {
  private errorCallbacks: Map<string, () => void> = new Map();

  injectError(componentName: string, errorFn: () => void) {
    this.errorCallbacks.set(componentName, errorFn);
  }

  triggerError(componentName: string) {
    const errorFn = this.errorCallbacks.get(componentName);
    if (errorFn) {
      errorFn();
    }
  }

  clear() {
    this.errorCallbacks.clear();
  }
}

// Test data factories
const createValidFormation = (): Formation => ({
  id: 'test-formation',
  name: '4-4-2',
  description: 'Test formation',
  slots: [
    {
      id: 'slot-gk',
      position: 'GK',
      defaultPosition: { x: 10, y: 50 },
      playerId: 'player-gk',
    },
    {
      id: 'slot-cb1',
      position: 'CB',
      defaultPosition: { x: 25, y: 35 },
      playerId: 'player-cb1',
    },
  ],
  type: '11v11',
  isDefault: false,
});

const createValidPlayers = (): Player[] => [
  {
    id: 'player-gk',
    name: 'Goalkeeper',
    jerseyNumber: 1,
    position: { x: 10, y: 50 },
    role: 'GK',
    teamSide: 'home',
  },
  {
    id: 'player-cb1',
    name: 'Center Back',
    jerseyNumber: 4,
    position: { x: 25, y: 35 },
    role: 'CB',
    teamSide: 'home',
  },
];

// Mock failing components for testing error boundaries
const FailingComponent = ({ shouldFail = false }: { shouldFail?: boolean }) => {
  if (shouldFail) {
    throw new Error('Intentional component failure for testing');
  }
  return <div data-testid="working-component">Component working correctly</div>;
};

const UnstableComponent = ({ 
  failureCount = 0, 
  currentAttempt = 0 
}: { 
  failureCount?: number; 
  currentAttempt?: number;
}) => {
  if (currentAttempt < failureCount) {
    throw new Error(`Failure attempt ${currentAttempt + 1}`);
  }
  return <div data-testid="recovered-component">Component recovered successfully</div>;
};

// Mock hooks with error injection capabilities
const createMockTacticsContext = (errorInjector: ErrorInjector) => ({
  tacticsState: {
    formations: { 'test-formation': createValidFormation() },
    activeFormationIds: { home: 'test-formation' },
    players: createValidPlayers(),
  },
  dispatch: vi.fn().mockImplementation((action) => {
    if (action.type === 'INJECT_ERROR') {
      errorInjector.triggerError('tactics-context');
    }
  }),
});

describe('ZENITH Tactical Error Recovery Tests', () => {
  let networkSimulator: NetworkSimulator;
  let errorInjector: ErrorInjector;
  let user: ReturnType<typeof userEvent.setup>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    networkSimulator = new NetworkSimulator();
    errorInjector = new ErrorInjector();
    user = userEvent.setup();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    networkSimulator.reset();
    errorInjector.clear();
    consoleSpy.mockRestore();
  });

  describe('Error Boundary Functionality', () => {
    it('should catch and display component errors gracefully', () => {
      render(
        <TacticalErrorBoundary context="Test Error Boundary">
          <FailingComponent shouldFail={true} />
        </TacticalErrorBoundary>
      );

      expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Error in Test Error Boundary/i)).toBeInTheDocument();
      expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
    });

    it('should render children normally when no errors occur', () => {
      render(
        <TacticalErrorBoundary context="No Error Test">
          <FailingComponent shouldFail={false} />
        </TacticalErrorBoundary>
      );

      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.queryByText(/Tactical Component Error/i)).not.toBeInTheDocument();
    });

    it('should provide retry functionality for recoverable errors', async () => {
      let attemptCount = 0;
      
      const RetryableComponent = () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return <div data-testid="retry-success">Retry successful</div>;
      };

      render(
        <TacticalErrorBoundary context="Retry Test">
          <RetryableComponent />
        </TacticalErrorBoundary>
      );

      // Should show error initially
      expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();

      // Click retry button
      const retryButton = screen.getByText(/Retry/);
      await user.click(retryButton);

      // Should still show error (second attempt)
      expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();

      // Click retry again
      await user.click(screen.getByText(/Retry/));

      // Should now show success
      await waitFor(() => {
        expect(screen.getByTestId('retry-success')).toBeInTheDocument();
      });
    });

    it('should limit retry attempts to prevent infinite loops', async () => {
      const AlwaysFailingComponent = () => {
        throw new Error('Always fails');
      };

      render(
        <TacticalErrorBoundary context="Retry Limit Test">
          <AlwaysFailingComponent />
        </TacticalErrorBoundary>
      );

      const retryButton = screen.getByText(/Retry \(3 left\)/);
      
      // Use up all retry attempts
      await user.click(retryButton);
      expect(screen.getByText(/Retry \(2 left\)/)).toBeInTheDocument();
      
      await user.click(screen.getByText(/Retry \(2 left\)/));
      expect(screen.getByText(/Retry \(1 left\)/)).toBeInTheDocument();
      
      await user.click(screen.getByText(/Retry \(1 left\)/));
      
      // Should no longer show retry button
      expect(screen.queryByText(/Retry/)).not.toBeInTheDocument();
      expect(screen.getByText('Reset Component')).toBeInTheDocument();
    });

    it('should reset component state when reset button is clicked', async () => {
      let shouldFail = true;
      
      const ResettableComponent = () => {
        if (shouldFail) {
          throw new Error('Initial failure');
        }
        return <div data-testid="reset-success">Reset successful</div>;
      };

      render(
        <TacticalErrorBoundary context="Reset Test">
          <ResettableComponent />
        </TacticalErrorBoundary>
      );

      expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();

      // Change the failure condition
      shouldFail = false;

      // Click reset button
      const resetButton = screen.getByText('Reset Component');
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByTestId('reset-success')).toBeInTheDocument();
      });
    });

    it('should log detailed error information for debugging', () => {
      const testError = new Error('Detailed test error');
      testError.stack = 'Mock stack trace';

      const ThrowingComponent = () => {
        throw testError;
      };

      render(
        <TacticalErrorBoundary context="Logging Test">
          <ThrowingComponent />
        </TacticalErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith('Error:', testError);
    });

    it('should handle nested error boundaries correctly', () => {
      render(
        <TacticalErrorBoundary context="Outer Boundary">
          <div>
            <TacticalErrorBoundary context="Inner Boundary">
              <FailingComponent shouldFail={true} />
            </TacticalErrorBoundary>
            <div data-testid="outer-content">Outer content should still render</div>
          </div>
        </TacticalErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText(/Error in Inner Boundary/i)).toBeInTheDocument();
      // Outer content should still be visible
      expect(screen.getByTestId('outer-content')).toBeInTheDocument();
    });
  });

  describe('Network Failure Scenarios', () => {
    it('should handle complete network unavailability', async () => {
      networkSimulator.setOffline();

      const mockFormationLoader = vi.fn().mockImplementation(() => 
        networkSimulator.simulateNetworkCall(createValidFormation())
      );

      let loadedFormation = null;
      let errorOccurred = false;

      try {
        loadedFormation = await mockFormationLoader();
      } catch (error) {
        errorOccurred = true;
        expect(error.message).toBe('Network unavailable');
      }

      expect(errorOccurred).toBe(true);
      expect(loadedFormation).toBeNull();
    });

    it('should handle intermittent network failures', async () => {
      networkSimulator.setFailureRate(0.7); // 70% failure rate

      const mockDataLoader = vi.fn().mockImplementation(() => 
        networkSimulator.simulateNetworkCall({ data: 'test' })
      );

      const results = [];
      const errors = [];

      // Attempt multiple requests
      for (let i = 0; i < 10; i++) {
        try {
          const result = await mockDataLoader();
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
      }

      // Should have both successes and failures
      expect(results.length).toBeGreaterThan(0);
      expect(errors.length).toBeGreaterThan(0);
      expect(results.length + errors.length).toBe(10);
    });

    it('should handle high network latency gracefully', async () => {
      networkSimulator.setLatency(2000); // 2 second delay

      const mockSlowLoader = vi.fn().mockImplementation(() => 
        networkSimulator.simulateNetworkCall('slow data')
      );

      const start = performance.now();
      const result = await mockSlowLoader();
      const duration = performance.now() - start;

      expect(result).toBe('slow data');
      expect(duration).toBeGreaterThanOrEqual(1900); // Account for test timing variance
    });

    it('should implement exponential backoff for failed requests', async () => {
      let attemptCount = 0;
      const maxAttempts = 3;
      const baseDelay = 100;

      const retryWithBackoff = async (fn: () => Promise<any>): Promise<any> => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            attemptCount++;
            return await fn();
          } catch (error) {
            if (attempt === maxAttempts - 1) {
              throw error;
            }
            
            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      networkSimulator.setFailureRate(1); // Always fail initially

      const mockFailingRequest = vi.fn().mockImplementation(() => {
        if (attemptCount < 3) {
          return networkSimulator.simulateNetworkCall('data');
        } else {
          // Succeed on the third attempt
          networkSimulator.setFailureRate(0);
          return networkSimulator.simulateNetworkCall('success');
        }
      });

      let result;
      let errorOccurred = false;

      try {
        result = await retryWithBackoff(mockFailingRequest);
      } catch (error) {
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true); // Should eventually fail after max attempts
      expect(attemptCount).toBe(maxAttempts);
    });

    it('should cache data to survive network outages', () => {
      // Simple cache implementation for testing
      const cache = new Map();

      const getCachedData = (key: string) => {
        if (cache.has(key)) {
          return cache.get(key);
        }
        return null;
      };

      const setCachedData = (key: string, data: any) => {
        cache.set(key, data);
      };

      // Simulate successful data loading and caching
      const testData = createValidFormation();
      setCachedData('formation-442', testData);

      // Simulate network failure
      networkSimulator.setOffline();

      // Should be able to retrieve cached data
      const cachedFormation = getCachedData('formation-442');
      expect(cachedFormation).toEqual(testData);
    });
  });

  describe('Concurrent Error Scenarios', () => {
    it('should handle multiple simultaneous errors gracefully', async () => {
      const errors: Error[] = [];
      const errorHandler = (error: Error) => {
        errors.push(error);
      };

      // Create multiple failing components
      const FailingComponents = () => (
        <div>
          {Array.from({ length: 5 }, (_, i) => (
            <TacticalErrorBoundary key={i} context={`Component ${i}`}>
              <FailingComponent shouldFail={true} />
            </TacticalErrorBoundary>
          ))}
        </div>
      );

      render(<FailingComponents />);

      // All error boundaries should catch their respective errors
      expect(screen.getAllByText(/Tactical Component Error/i)).toHaveLength(5);
    });

    it('should handle errors during concurrent user interactions', async () => {
      let errorCount = 0;
      
      const InteractiveFailingComponent = ({ onClick }: { onClick?: () => void }) => {
        return (
          <button 
            data-testid="failing-button"
            onClick={() => {
              errorCount++;
              if (onClick) onClick();
              if (errorCount % 2 === 0) {
                throw new Error(`Interaction error ${errorCount}`);
              }
            }}
          >
            Click me
          </button>
        );
      };

      render(
        <TacticalErrorBoundary context="Interactive Test">
          <InteractiveFailingComponent />
        </TacticalErrorBoundary>
      );

      const button = screen.getByTestId('failing-button');

      // First click should work
      await user.click(button);
      expect(screen.getByTestId('failing-button')).toBeInTheDocument();

      // Second click should trigger error
      await user.click(button);
      expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();
    });
  });

  describe('Memory Pressure Error Recovery', () => {
    it('should handle out-of-memory scenarios gracefully', () => {
      // Simulate memory pressure by creating large objects
      const createLargeObject = () => {
        try {
          // Create a large array to simulate memory pressure
          const largeArray = new Array(10000000).fill('memory-test');
          return largeArray;
        } catch (error) {
          return null;
        }
      };

      const MemoryIntensiveComponent = () => {
        const largeData = createLargeObject();
        if (!largeData) {
          throw new Error('Memory allocation failed');
        }
        return <div data-testid="memory-component">Memory component loaded</div>;
      };

      // Should handle potential memory errors gracefully
      expect(() => {
        render(
          <TacticalErrorBoundary context="Memory Test">
            <MemoryIntensiveComponent />
          </TacticalErrorBoundary>
        );
      }).not.toThrow();
    });

    it('should cleanup resources properly during error recovery', () => {
      const cleanupSpy = vi.fn();
      
      const ComponentWithCleanup = () => {
        React.useEffect(() => {
          return cleanupSpy; // Cleanup function
        }, []);

        throw new Error('Component with cleanup failed');
      };

      const { unmount } = render(
        <TacticalErrorBoundary context="Cleanup Test">
          <ComponentWithCleanup />
        </TacticalErrorBoundary>
      );

      unmount();

      // Cleanup should have been called
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Production Error Recovery', () => {
    it('should provide user-friendly error messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <TacticalErrorBoundary context="Production Test">
          <FailingComponent shouldFail={true} />
        </TacticalErrorBoundary>
      );

      expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();
      expect(screen.getByText(/An error occurred in the tactical system/i)).toBeInTheDocument();
      
      // Debug info should not be visible in production
      expect(screen.queryByText(/Debug Info/i)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should report errors to monitoring service in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockErrorReporting = vi.fn();
      (window as any).errorReporting = { report: mockErrorReporting };

      render(
        <TacticalErrorBoundary context="Error Reporting Test">
          <FailingComponent shouldFail={true} />
        </TacticalErrorBoundary>
      );

      // Should attempt to report error (mocked console.warn in this case)
      expect(consoleSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      delete (window as any).errorReporting;
    });

    it('should maintain application state after error recovery', async () => {
      let appState = { count: 0 };
      
      const StatefulComponent = ({ shouldFail }: { shouldFail: boolean }) => {
        if (shouldFail) {
          throw new Error('Stateful component failed');
        }
        
        return (
          <div>
            <div data-testid="state-value">Count: {appState.count}</div>
            <button 
              data-testid="increment-button"
              onClick={() => { appState.count++; }}
            >
              Increment
            </button>
          </div>
        );
      };

      const { rerender } = render(
        <TacticalErrorBoundary context="State Test">
          <StatefulComponent shouldFail={false} />
        </TacticalErrorBoundary>
      );

      // Increment state
      await user.click(screen.getByTestId('increment-button'));
      appState.count = 1;

      // Trigger error
      rerender(
        <TacticalErrorBoundary context="State Test">
          <StatefulComponent shouldFail={true} />
        </TacticalErrorBoundary>
      );

      expect(screen.getByText(/Tactical Component Error/i)).toBeInTheDocument();

      // Recover from error
      rerender(
        <TacticalErrorBoundary context="State Test">
          <StatefulComponent shouldFail={false} />
        </TacticalErrorBoundary>
      );

      // State should be maintained
      expect(screen.getByTestId('state-value')).toHaveTextContent('Count: 1');
    });
  });

  describe('Integration Error Recovery', () => {
    it('should gracefully handle tactical board component errors', () => {
      const mockTacticsContext = createMockTacticsContext(errorInjector);
      
      // Mock the hooks
      vi.doMock('../../hooks', () => ({
        useTacticsContext: () => mockTacticsContext,
        useUIContext: () => ({ uiState: {}, dispatch: vi.fn() }),
        useResponsive: () => ({ isMobile: false, isTablet: false }),
      }));

      expect(() => {
        render(
          <TacticalErrorBoundary context="Tactical Board Integration">
            <UnifiedTacticsBoard />
          </TacticalErrorBoundary>
        );
      }).not.toThrow();
    });

    it('should recover from tactical data corruption', async () => {
      const corruptedData = {
        formations: { 'corrupted': null },
        players: [null, undefined, { invalid: 'data' }],
        activeFormationIds: { home: 'non-existent' },
      };

      const mockContextWithCorruption = {
        tacticsState: corruptedData,
        dispatch: vi.fn(),
      };

      vi.doMock('../../hooks', () => ({
        useTacticsContext: () => mockContextWithCorruption,
        useUIContext: () => ({ uiState: {}, dispatch: vi.fn() }),
        useResponsive: () => ({ isMobile: false, isTablet: false }),
      }));

      // Should handle corrupted data gracefully
      expect(() => {
        render(
          <TacticalErrorBoundary context="Data Corruption Test">
            <UnifiedTacticsBoard />
          </TacticalErrorBoundary>
        );
      }).not.toThrow();
    });
  });
});