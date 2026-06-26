import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, Lock, AlertTriangle } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, loading, authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Show session expired messages if redirected
  useEffect(() => {
    if (searchParams.get('session_expired')) {
      setLocalError('Your session has expired. Please login again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password.');
      setIsSubmitting(false);
      return;
    }

    const success = await login(username, password);
    setIsSubmitting(false);

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center p-4 relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-950/40 border border-orange-500/20 text-4xl mb-4">
            🧱
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight font-display">
            KARTIK PAVER INDUSTRIES
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-widest">
            Enterprise Resource Planning (ERP)
          </p>
        </div>

        {/* Errors Block */}
        {(localError || authError) && (
          <div className="mb-6 p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-start space-x-3 text-red-200">
            <AlertTriangle className="flex-shrink-0 text-red-500 mt-0.5" size={18} />
            <span className="text-xs leading-relaxed">{localError || authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. kartikpaver"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-slate-600"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Access Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Reminder (Helpful for owner) */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-500">
            For local setup use: <strong className="text-slate-400">kartikpaver</strong> / <strong className="text-slate-400">admin123</strong>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
