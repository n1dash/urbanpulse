import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User, Menu, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Status Updated', message: 'Pothole complaint UP-1001 marked "In Progress"', time: '2 hours ago' },
    { id: 2, title: 'New Upvote', message: 'Your complaint on Water Leakage got 10 upvotes', time: '1 day ago' },
    { id: 3, title: 'System Alert', message: 'Escalation time threshold reduced for Ward 5', time: '3 days ago' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = (role) => {
    const map = {
      'Citizen': 'bg-teal-50 text-teal-700 border-teal-200',
      'Officer': 'bg-amber-50 text-amber-700 border-amber-200',
      'Senior Officer': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Admin': 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return map[role] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <nav className="h-16 border-b border-slate-100 bg-white sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
      {/* Left: Brand & Mobile Sidebar Toggle */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-md shadow-brand-100 relative overflow-hidden group">
            <Shield className="w-5 h-5 text-white" />
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight">UrbanPulse</span>
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest leading-none">Civic Connect</span>
          </div>
        </Link>
      </div>

      {/* Right: Notification & Profile */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-fade">
                <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm">Notifications</span>
                  <span className="text-[10px] text-brand-600 font-bold hover:underline cursor-pointer">Mark all read</span>
                </div>
                <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-slate-50 transition cursor-pointer text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-700">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                      </div>
                      <p className="text-slate-500 mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2.5 p-1 px-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-left"
            >
              <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-sm">
                {user.name[0]}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 border rounded-full font-bold mt-0.5 self-start ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-50 text-xs sm:hidden">
                  <div className="font-semibold text-slate-800">{user.name}</div>
                  <div className="text-slate-400 truncate">{user.email}</div>
                </div>
                <div className="p-1">
                  <div className="text-[10px] text-slate-400 font-bold px-3 py-1 uppercase tracking-wider">Session</div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition text-left font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
