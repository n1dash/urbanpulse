import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const Login = () => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(formData.username, formData.password);
      if (user.role === 'Citizen') navigate('/citizen/dashboard');
      else if (user.role === 'Officer') navigate('/officer/dashboard');
      else if (user.role === 'Senior Officer') navigate('/senior-officer/dashboard');
      else if (user.role === 'Admin') navigate('/admin/dashboard');
      else navigate('/public-complaints');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleName) => {
    let username = '';
    switch(roleName) {
      case 'Citizen': username = 'citizen_user'; break;
      case 'Officer': username = 'officer_dept'; break;
      case 'Senior Officer': username = 'senior_dept'; break;
      case 'Admin': username = 'admin_system'; break;
    }
    setFormData({
      username: username,
      password: 'password123'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative clean ambient background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 z-0" />
      
      <Navbar showMenuButton={false} />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="bg-accent-500 p-3 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-accent-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome to UrbanPulse
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
          Smart City Service Gateway
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10 animate-fade-in">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Display Errors */}
            {(error || authError) && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-semibold text-rose-600">
                {error || authError}
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">
                Username or Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4.5 w-4.5 stroke-[2.5]" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5 stroke-[2.5]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 bg-accent-600 hover:bg-accent-700 disabled:bg-accent-500/50 text-white font-bold text-sm rounded-xl shadow-md shadow-accent-600/10 active:scale-[0.98] focus:outline-none transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4.5 w-4.5 mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4.5 w-4.5 mr-2 stroke-[2.5]" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Fill Panel */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Testing Credentials (Click to Auto-fill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
              <button 
                type="button"
                onClick={() => handleQuickFill('Citizen')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-center transition-colors active:scale-95"
              >
                Citizen User
              </button>
              <button 
                type="button"
                onClick={() => handleQuickFill('Officer')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-center transition-colors active:scale-95"
              >
                Dept Officer
              </button>
              <button 
                type="button"
                onClick={() => handleQuickFill('Senior Officer')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-center transition-colors active:scale-95"
              >
                Senior Officer
              </button>
              <button 
                type="button"
                onClick={() => handleQuickFill('Admin')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-center transition-colors active:scale-95"
              >
                Admin System
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center text-xs font-bold text-slate-450 border-t border-slate-100 pt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-600 hover:text-accent-700 hover:underline">
              Create an account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
