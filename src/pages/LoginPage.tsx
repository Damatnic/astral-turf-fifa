import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { useResponsive } from '../hooks';
import { authService } from '../services/authService';
import { LoadingSpinner, LogoIcon, ShieldCheck, UserXIcon as UserIcon, UsersIcon } from '../components/ui/icons';
import type { User, UserRole } from '../types';

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: 'coach@astralfc.com',
    password: 'password123',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { dispatch, authState } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile-First Responsive
  const responsive = useResponsive();
  const { isMobile, isTablet } = responsive;

  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => {
        document.body.classList.remove('auth-bg');
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = await authService.login(formData.email, formData.password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });

      // Load family associations if user is family member
      if (user.role === 'family') {
        const associations = authService.getFamilyAssociations(user.id);
        dispatch({ type: 'LOAD_FAMILY_ASSOCIATIONS', payload: associations });
      }

      // Navigate to the intended destination or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrors({ general: message });
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleBasedLogin = (role: UserRole) => {
    setIsLoading(true);
    setErrors({});

    // Demo accounts for each role
    const demoAccounts = {
      coach: { email: 'coach@astralfc.com', name: 'Coach Mike Anderson' },
      player: { email: 'player1@astralfc.com', name: 'Player Alex Hunter' },
      family: { email: 'linda.smith@astralfc.com', name: 'Family Linda Smith' },
    };

    const selectedAccount = demoAccounts[role];

    setFormData({
      email: selectedAccount.email,
      password: 'password123',
    });

    // Auto-login after brief delay
    setTimeout(async () => {
      try {
        const user = await authService.login(selectedAccount.email, 'password123');
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });

        // Load family associations if user is family member
        if (user.role === 'family') {
          const associations = authService.getFamilyAssociations(user.id);
          dispatch({ type: 'LOAD_FAMILY_ASSOCIATIONS', payload: associations });
        }

        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        setErrors({ general: message });
        dispatch({ type: 'LOGIN_FAILURE', payload: message });
      } finally {
        setIsLoading(false);
      }
    }, 800);
  };

  const handleAdminLogin = () => {
    handleRoleBasedLogin('coach');
  };

  return (
    <div className={`
      mobile-full-height mobile-safe-area w-screen 
      flex items-center justify-center
      ${isMobile ? 'mobile-p-3' : 'p-4'}
    `}>
      <div className={`
        w-full 
        ${isMobile ? 'max-w-sm' : 'max-w-md'}
      `}>
        {/* Mobile-Optimized Header */}
        <div className={`
          text-center 
          ${isMobile ? 'mb-6' : 'mb-8'}
        `}>
          <LogoIcon className={`mx-auto text-teal-400 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`} />
          <h1 className={`
            font-bold mt-2 tracking-wider text-white
            ${isMobile ? 'text-2xl' : 'text-3xl'}
          `}>
            Welcome Back
          </h1>
        </div>

        {/* Mobile-First Form Container */}
        <div className={`
          bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700/50
          ${isMobile ? 'mobile-p-3' : 'p-8'}
        `}>
          <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
            {/* Mobile-Optimized Email Field */}
            <div>
              <label htmlFor="email" className={`block font-medium text-slate-400 ${isMobile ? 'text-sm mb-2' : 'text-sm'}`}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`
                  input-mobile bg-slate-700 text-white focus:ring-2 focus:ring-teal-500
                  ${errors.email ? 'border-red-500' : 'border-slate-600'}
                  ${isMobile ? 'text-base' : 'text-sm'}
                `}
                required
                disabled={isLoading}
                placeholder={isMobile ? "Your email" : ""}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Mobile-Optimized Password Field */}
            <div>
              <label htmlFor="password" className={`block font-medium text-slate-400 ${isMobile ? 'text-sm mb-2' : 'text-sm'}`}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`
                  input-mobile bg-slate-700 text-white focus:ring-2 focus:ring-teal-500
                  ${errors.password ? 'border-red-500' : 'border-slate-600'}
                  ${isMobile ? 'text-base' : 'text-sm'}
                `}
                required
                disabled={isLoading}
                placeholder={isMobile ? "Your password" : ""}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Mobile-Optimized Error Display */}
            {(errors.general || authState.error) && (
              <div className={`bg-red-900/20 border border-red-500/20 rounded-md ${isMobile ? 'mobile-p-2' : 'p-3'}`}>
                <p className={`text-red-400 ${isMobile ? 'text-sm' : 'text-sm'}`}>{errors.general || authState.error}</p>
              </div>
            )}

            {/* Mobile-Friendly Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  btn-mobile w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700
                  text-white font-bold rounded-lg transition-colors
                  disabled:bg-slate-600 disabled:cursor-not-allowed
                  flex justify-center items-center
                  ${isMobile ? 'py-4 text-base' : 'py-3 px-4'}
                `}
              >
                {isLoading ? <LoadingSpinner /> : 'Login'}
              </button>
            </div>
          </form>

          {/* Mobile-Optimized Divider */}
          <div className={`relative ${isMobile ? 'my-4' : 'my-6'}`}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800 px-2 text-slate-500">
                {isMobile ? 'Demo accounts' : 'Or try demo accounts'}
              </span>
            </div>
          </div>

          {/* Mobile-First Demo Buttons */}
          <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
            <button
              type="button"
              onClick={() => handleRoleBasedLogin('coach')}
              disabled={isLoading}
              className={`
                btn-mobile w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                text-white font-bold rounded-lg transition-colors
                disabled:bg-slate-700 disabled:cursor-not-allowed
                flex justify-center items-center
                ${isMobile ? 'py-3 text-sm' : 'py-3 px-4'}
              `}
            >
              <ShieldCheck className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-5 h-5 mr-2'}`} />
              {isMobile ? 'Coach' : 'Login as Coach'}
            </button>

            <button
              type="button"
              onClick={() => handleRoleBasedLogin('player')}
              disabled={isLoading}
              className={`
                btn-mobile w-full bg-green-600 hover:bg-green-500 active:bg-green-700
                text-white font-bold rounded-lg transition-colors
                disabled:bg-slate-700 disabled:cursor-not-allowed
                flex justify-center items-center
                ${isMobile ? 'py-3 text-sm' : 'py-3 px-4'}
              `}
            >
              <UserIcon className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-5 h-5 mr-2'}`} />
              {isMobile ? 'Player' : 'Login as Player'}
            </button>

            <button
              type="button"
              onClick={() => handleRoleBasedLogin('family')}
              disabled={isLoading}
              className={`
                btn-mobile w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700
                text-white font-bold rounded-lg transition-colors
                disabled:bg-slate-700 disabled:cursor-not-allowed
                flex justify-center items-center
                ${isMobile ? 'py-3 text-sm' : 'py-3 px-4'}
              `}
            >
              <UsersIcon className={`${isMobile ? 'w-4 h-4 mr-2' : 'w-5 h-5 mr-2'}`} />
              {isMobile ? 'Family' : 'Login as Family Member'}
            </button>
          </div>

          {/* Mobile-Optimized Footer Links */}
          <div className={`text-center text-slate-400 ${isMobile ? 'mt-4 text-sm' : 'mt-6 text-sm'}`}>
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-teal-400 hover:text-teal-300">
                Sign up
              </Link>
            </p>
            <p className={`${isMobile ? 'mt-2' : 'mt-1'}`}>
              <Link to="/" className="hover:text-teal-300">
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;