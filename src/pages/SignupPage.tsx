import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { useResponsive } from '../hooks';
import { authService } from '../services/authService';
import { LoadingSpinner, LogoIcon } from '../components/ui/icons';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'coach' | 'player';
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'coach',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch, authState } = useAuthContext();
  const navigate = useNavigate();

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

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  const handleRoleChange = (role: 'coach' | 'player') => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = await authService.signup(formData.email, formData.password, formData.role);
      dispatch({ type: 'SIGNUP_SUCCESS', payload: user });
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrors({ general: message });
      dispatch({ type: 'SIGNUP_FAILURE', payload: message });
    } finally {
      setIsLoading(false);
    }
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
          <LogoIcon className={`
            mx-auto text-teal-400
            ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}
          `} />
          <h1 className={`
            font-bold mt-2 tracking-wider text-white
            ${isMobile ? 'text-2xl' : 'text-3xl'}
          `}>
            {isMobile ? 'Create Account' : 'Create Your Account'}
          </h1>
        </div>

        {/* Mobile-First Form Container */}
        <div className={`
          bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-700/50
          ${isMobile ? 'mobile-p-3' : 'p-8'}
        `}>
          <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
            {/* Mobile-Optimized Role Selection */}
            <div>
              <label className={`block font-medium text-slate-400 ${isMobile ? 'text-sm mb-2' : 'text-sm mb-2'}`}>
                I am a...
              </label>
              <div className={`flex rounded-lg bg-slate-700 border border-slate-600 ${isMobile ? 'p-1' : 'p-1'}`}>
                <button
                  type="button"
                  onClick={() => handleRoleChange('coach')}
                  className={`
                    w-1/2 font-semibold rounded transition-colors
                    ${isMobile ? 'py-3 text-sm' : 'py-2 text-sm'}
                    ${formData.role === 'coach'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:text-white active:bg-slate-600'
                    }
                  `}
                  disabled={isLoading}
                >
                  Coach
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('player')}
                  className={`
                    w-1/2 font-semibold rounded transition-colors
                    ${isMobile ? 'py-3 text-sm' : 'py-2 text-sm'}
                    ${formData.role === 'player'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:text-white active:bg-slate-600'
                    }
                  `}
                  disabled={isLoading}
                >
                  Player
                </button>
              </div>
            </div>

            {/* Mobile-Optimized Form Fields */}
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
                placeholder={isMobile ? "Your email" : "Enter your email"}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

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
                placeholder={isMobile ? "Your password" : "Enter your password"}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block font-medium text-slate-400 ${isMobile ? 'text-sm mb-2' : 'text-sm'}`}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`
                  input-mobile bg-slate-700 text-white focus:ring-2 focus:ring-teal-500
                  ${errors.confirmPassword ? 'border-red-500' : 'border-slate-600'}
                  ${isMobile ? 'text-base' : 'text-sm'}
                `}
                required
                disabled={isLoading}
                placeholder={isMobile ? "Confirm password" : "Confirm your password"}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
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
                {isLoading ? <LoadingSpinner /> : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* Mobile-Optimized Footer Links */}
          <div className={`text-center text-slate-400 ${isMobile ? 'mt-4 text-sm' : 'mt-6 text-sm'}`}>
            <p>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300">
                Login
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

export default SignupPage;