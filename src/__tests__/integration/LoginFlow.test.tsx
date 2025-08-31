import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { renderWithProviders, mockAuthService } from '../utils/test-utils';
import { createMockUser } from '../factories';
import '../mocks/modules';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: mockAuthService,
}));

// Mock navigation
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/login', search: '', hash: '', state: null, key: 'default' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock responsive hooks
vi.mock('../../hooks', async () => {
  const actual = await vi.importActual('../../hooks');
  return {
    ...actual,
    useResponsive: () => ({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      currentBreakpoint: 'desktop',
      screenSize: { width: 1920, height: 1080 },
    }),
  };
});

describe('Login Integration Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.login.mockClear();
    mockNavigate.mockClear();

    // Mock document.body.classList methods
    document.body.classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
      replace: vi.fn(),
    } as any;
  });

  describe('Login Form Rendering', () => {
    it('should render login form with all required elements', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should have pre-filled demo credentials', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email/i }) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(emailInput.value).toBe('coach@astralfc.com');
      expect(passwordInput.value).toBe('password123');
    });

    it('should render role selection options', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByText(/coach/i)).toBeInTheDocument();
      expect(screen.getByText(/player/i)).toBeInTheDocument();
      expect(screen.getByText(/family/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is invalid/i)).toBeInTheDocument();
      });
    });

    it('should require email field', async () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.clear(emailInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should require password field', async () => {
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.clear(passwordInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum password length', async () => {
      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.clear(passwordInput);
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = createMockUser({
        email: 'coach@astralfc.com',
        role: 'coach',
      });

      mockAuthService.login.mockResolvedValue(mockUser);

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith(
          'coach@astralfc.com',
          'password123',
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/tactics-board');
      });
    });

    it('should show loading state during authentication', async () => {
      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockAuthService.login.mockReturnValue(loginPromise);

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolveLogin!(createMockUser());

      await waitFor(() => {
        expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
      });
    });

    it('should handle login errors gracefully', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Form should be re-enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('should handle network errors', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Role-based Authentication', () => {
    it('should handle coach login and redirect appropriately', async () => {
      const mockCoach = createMockUser({
        email: 'coach@astralfc.com',
        role: 'coach',
      });

      mockAuthService.login.mockResolvedValue(mockCoach);

      renderWithProviders(<LoginPage />);

      // Select coach role (if role selection is implemented)
      const coachOption = screen.getByText(/coach/i);
      await user.click(coachOption);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/tactics-board');
      });
    });

    it('should handle player login and redirect appropriately', async () => {
      const mockPlayer = createMockUser({
        email: 'player@astralfc.com',
        role: 'player',
      });

      mockAuthService.login.mockResolvedValue(mockPlayer);

      renderWithProviders(<LoginPage />);

      // Change email to player email
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      await user.clear(emailInput);
      await user.type(emailInput, 'player@astralfc.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Players should be redirected to their dashboard
        expect(mockNavigate).toHaveBeenCalledWith('/tactics-board');
      });
    });

    it('should handle family member login', async () => {
      const mockFamilyMember = createMockUser({
        email: 'family@astralfc.com',
        role: 'family',
        playerIds: ['player1'],
      });

      mockAuthService.login.mockResolvedValue(mockFamilyMember);

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      await user.clear(emailInput);
      await user.type(emailInput, 'family@astralfc.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/tactics-board');
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should handle form submission with Enter key', async () => {
      const mockUser = createMockUser();
      mockAuthService.login.mockResolvedValue(mockUser);

      renderWithProviders(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '{enter}');

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalled();
      });
    });

    it('should clear errors when user starts typing', async () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger validation error
      await user.clear(emailInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing to clear error
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should handle keyboard navigation', async () => {
      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab navigation should work
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after failed login', async () => {
      mockAuthService.login
        .mockRejectedValueOnce(new Error('Invalid credentials'))
        .mockResolvedValueOnce(createMockUser());

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First attempt fails
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Second attempt succeeds
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/tactics-board');
      });
    });

    it('should clear previous errors on new submission', async () => {
      mockAuthService.login
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'));

      renderWithProviders(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument();
      });

      // Second error should replace first
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/second error/i)).toBeInTheDocument();
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
      });
    });
  });
});