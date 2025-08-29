import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import { authService } from '../../services/authService';
import { LoadingSpinner, LogoIcon } from '../../components/ui/icons';

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
    role: 'coach'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch, authState } = useAuthContext();
  const navigate = useNavigate();

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
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleRoleChange = (role: 'coach' | 'player') => {
    setFormData(prev => ({
      ...prev,
      role
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
    <div className="h-screen w-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LogoIcon className="w-16 h-16 mx-auto text-teal-400" />
          <h1 className="text-3xl font-bold mt-2 tracking-wider text-white">
            Create Your Account
          </h1>
        </div>
        
        <div className="bg-slate-800/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                I am a...
              </label>
              <div className="flex rounded-md bg-slate-700 border border-slate-600 p-1">
                <button 
                  type="button" 
                  onClick={() => handleRoleChange('coach')} 
                  className={`w-1/2 py-2 text-sm font-semibold rounded transition-colors ${
                    formData.role === 'coach' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  disabled={isLoading}
                >
                  Coach
                </button>
                <button 
                  type="button" 
                  onClick={() => handleRoleChange('player')} 
                  className={`w-1/2 py-2 text-sm font-semibold rounded transition-colors ${
                    formData.role === 'player' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  disabled={isLoading}
                >
                  Player
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full mt-1 p-3 bg-slate-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.email ? 'border-red-500' : 'border-slate-600'
                }`}
                required
                disabled={isLoading}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full mt-1 p-3 bg-slate-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.password ? 'border-red-500' : 'border-slate-600'
                }`}
                required
                disabled={isLoading}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-400">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full mt-1 p-3 bg-slate-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-600'
                }`}
                required
                disabled={isLoading}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>
            
            {(errors.general || authState.error) && (
              <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-md">
                <p className="text-red-400 text-sm">{errors.general || authState.error}</p>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoadingSpinner /> : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300">
                Login
              </Link>
            </p>
            <p className="mt-1">
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