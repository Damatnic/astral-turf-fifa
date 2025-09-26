import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { authService } from '../services/authService';
import { LoadingSpinner, ShieldCheck, UserXIcon as UserIcon, UsersIcon } from '../components/ui/icons';
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

const SoccerBallLogo: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <div 
    className="soccer-logo flex-shrink-0 mx-auto"
    style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      minWidth: `${size}px`,
      minHeight: `${size}px`,
      maxWidth: `${size}px`,
      maxHeight: `${size}px`
    }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="text-teal-400"
      fill="currentColor"
    >
      {/* Soccer Ball */}
      <circle cx="50" cy="50" r="45" fill="currentColor" stroke="none" />
      {/* Pentagon in center */}
      <path d="M50 25 L62 35 L58 50 L42 50 L38 35 Z" fill="white" />
      {/* Hexagons around pentagon */}
      <path d="M50 25 L38 35 L32 22 L44 12 L56 12 L62 22 Z" fill="white" />
      <path d="M62 35 L74 32 L80 45 L74 58 L62 55 L58 50 Z" fill="white" />
      <path d="M58 50 L62 65 L56 78 L44 78 L38 65 L42 50 Z" fill="white" />
      <path d="M38 35 L26 32 L20 45 L26 58 L38 55 L42 50 Z" fill="white" />
      <path d="M32 22 L20 25 L14 12 L26 2 L38 5 L38 18 Z" fill="white" />
      <path d="M68 22 L80 25 L86 12 L74 2 L62 5 L62 18 Z" fill="white" />
    </svg>
  </div>
);

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: 'coach@astralfc.com',
    password: 'password123',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch, authState } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Simple responsive detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

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

      if (user.role === 'family') {
        const associations = authService.getFamilyAssociations(user.id);
        dispatch({ type: 'LOAD_FAMILY_ASSOCIATIONS', payload: associations });
      }

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

    setTimeout(async () => {
      try {
        const user = await authService.login(selectedAccount.email, 'password123');
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className={`w-full max-w-md space-y-8 ${isMobile ? 'px-6' : 'px-8'}`}>
        {/* Header */}
        <div className="text-center">
          <SoccerBallLogo size={isMobile ? 64 : 80} />
          <h1 className={`mt-6 font-bold tracking-wider text-white ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
            Welcome Back
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Sign in to your Astral Turf account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-400' : 'border-white/20'
                }`}
                required
                disabled={isLoading}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-400' : 'border-white/20'
                }`}
                required
                disabled={isLoading}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Error Display */}
            {(errors.general || authState.error) && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{errors.general || authState.error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? <LoadingSpinner /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-transparent px-4 text-slate-400">
                Or try demo accounts
              </span>
            </div>
          </div>

          {/* Demo Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleRoleBasedLogin('coach')}
              disabled={isLoading}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-200 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5 mr-3" />
              Login as Coach
            </button>

            <button
              type="button"
              onClick={() => handleRoleBasedLogin('player')}
              disabled={isLoading}
              className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-200 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              <UserIcon className="w-5 h-5 mr-3" />
              Login as Player
            </button>

            <button
              type="button"
              onClick={() => handleRoleBasedLogin('family')}
              disabled={isLoading}
              className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              <UsersIcon className="w-5 h-5 mr-3" />
              Login as Family Member
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-teal-400 hover:text-teal-300 transition-colors">
              Sign up here
            </Link>
          </p>
          <p className="text-slate-500 text-sm">
            <Link to="/" className="hover:text-teal-300 transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;