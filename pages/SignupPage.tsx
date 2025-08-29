import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { authService } from '../services/authService';
import { LoadingSpinner, LogoIcon } from '../components/ui/icons';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'coach' | 'player'>('coach');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch, authState } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('auth-bg');
    return () => {
        document.body.classList.remove('auth-bg');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await authService.signup(email, password, role);
      dispatch({ type: 'SIGNUP_SUCCESS', payload: user });
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch({ type: 'SIGNUP_FAILURE', payload: message });
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
              <label className="block text-sm font-medium text-slate-400">I am a...</label>
              <div className="mt-1 flex rounded-md bg-slate-700 border border-slate-600 p-1">
                <button type="button" onClick={() => setRole('coach')} className={`w-1/2 py-2 text-sm font-semibold rounded ${role === 'coach' ? 'bg-teal-600 text-white' : 'text-slate-300'}`}>Coach</button>
                <button type="button" onClick={() => setRole('player')} className={`w-1/2 py-2 text-sm font-semibold rounded ${role === 'player' ? 'bg-teal-600 text-white' : 'text-slate-300'}`}>Player</button>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-400">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-400">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            {authState.error && <p className="text-red-400 text-sm">{authState.error}</p>}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-md transition-colors disabled:bg-slate-600"
              >
                {isLoading ? <LoadingSpinner /> : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>Already have an account? <Link to="/login" className="font-semibold text-teal-400 hover:text-teal-300">Login</Link></p>
             <p className="mt-1"><Link to="/" className="hover:text-teal-300">Back to Home</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
