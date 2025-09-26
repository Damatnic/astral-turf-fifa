import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock navigation context for tests
const MockRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Mock TacticsContext
export const mockTacticsContext = {
  tacticsState: {
    players: [
      {
        id: '1',
        name: 'Test Player 1',
        position: 'CF',
        currentPotential: 85,
        age: 25
      },
      {
        id: '2', 
        name: 'Test Player 2',
        position: 'CM',
        currentPotential: 78,
        age: 23
      }
    ],
    formations: {
      'test-formation': {
        id: 'test-formation',
        name: '4-3-3',
        positions: {
          '1': { x: 50, y: 80 },
          '2': { x: 50, y: 50 }
        }
      }
    },
    activeFormationIds: {
      home: 'test-formation'
    }
  },
  dispatch: vi.fn()
};

// Mock UIContext
export const mockUIContext = {
  uiState: {
    isPresentationMode: false,
    theme: 'dark'
  },
  dispatch: vi.fn()
};

// Mock useResponsive hook
export const mockUseResponsive = {
  isMobile: false,
  isTablet: false,
  isDesktop: true
};

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <MockRouter>{children}</MockRouter>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
export { customRender as render };