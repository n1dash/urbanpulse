import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick credentials helper for tester convenience
  const MOCK_CREDENTIALS = [
    { label: 'Citizen', email: 'citizen@urbanpulse.gov', password: 'password123' },
    { label: 'Officer', email: 'officer@urbanpulse.gov', password: 'password123' },
    { label: 'Senior Officer', email: 'senior@urbanpulse.gov', password: 'password123' },
    { label: 'Admin', email: 'admin@urbanpulse.gov', password: 'password123' }
  ];

  const handleQuickSelect = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // Auth success is handled by redirect in AppRoutes/ProtectedRoutes
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">
      
      {/* Left Pane: Branding & Info */}
      <div className="md:w-1/2 bg-govdark-900 text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl" />

        <div className="space-y-4 relative z-10">
          <span className="px-3 py-1 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Government Tech Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Connecting citizens <br />
            with local <span className="text-brand-400">administration</span>.
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md">
            UrbanPulse helps you report civic issues like road damage, pipeline leaks, and electrical blackouts directly to responsible department officers.
          </p>
        </div>

        <div className="mt-12 md:mt-0 relative z-10 space-y-6">
          <div className="border-l-4 border-brand-500 pl-4 space-y-1">
            <h4 className="font-bold text-sm">Automated Severity Routing</h4>
            <p className="text-xs text-slate-400">Complaints are mathematically prioritized using priority routing, keeping urgent matters first.</p>
          </div>
          <div className="border-l-4 border-emerald-500 pl-4 space-y-1">
            <h4 className="font-bold text-sm">Transparency in Tracking</h4>
            <p className="text-xs text-slate-400">Upvote civic complaints raised by neighbors, monitor resolving progress, and view officer evidence photos.</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 relative z-10 mt-6">
          &copy; 2026 Department of Urban Planning & Municipal Corporation.
        </div>
      </div>

      {/* Right Pane: Login Form */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 bg-white p-8 border border-slate-100 rounded-3xl shadow-xl">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Access UrbanPulse Portal</h2>
            <p className="text-xs text-slate-500 font-medium">Log in to raise, assign, or resolve civic complaints.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@municipal.gov"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In Securely</span>
                </>
              )}
            </button>
          </form>

          {/* Tester Helper UI */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-600">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Developer Quick Links (Pre-fill Form)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_CREDENTIALS.map((cred) => (
                <button
                  key={cred.label}
                  onClick={() => handleQuickSelect(cred)}
                  className="p-2 border border-slate-200 hover:border-brand-500 hover:bg-brand-50/20 rounded-xl text-[10px] font-bold text-slate-600 hover:text-brand-700 transition"
                >
                  {cred.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            Don't have a citizen account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
