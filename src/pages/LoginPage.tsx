import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import { authService } from '../../services/authService';
import { LoadingSpinner, LogoIcon, ShieldCheck } from '../../components/ui/icons';
import { User } from '../../types';

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
    password: 'password123'
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
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrors({ general: message });
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdminLogin = () => {
    setIsLoading(true);
    setErrors({});
    
    const adminUser: User = { 
      id: 'admin_user', 
      email: 'admin@astralfc.com', 
      role: 'coach' 
    };
    
    setTimeout(() => {
      dispatch({ type: 'LOGIN_SUCCESS', payload: adminUser });
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <LogoIcon className="w-16 h-16 mx-auto text-teal-400" />
          <h1 className="text-3xl font-bold mt-2 tracking-wider text-white">
            Welcome Back
          </h1>
        </div>
        
        <div className="bg-slate-800/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
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
                {isLoading ? <LoadingSpinner /> : 'Login'}
              </button>
            </div>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800 px-2 text-slate-500">Or</span>
            </div>
          </div>
            
          <div>
            <button
              type="button"
              onClick={handleAdminLogin}
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-md transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              Continue as Admin
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-teal-400 hover:text-teal-300">
                Sign up
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

export default LoginPage;