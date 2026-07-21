import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, Globe, Bell } from 'lucide-react';

const Navbar = ({ onToggleSidebar, showMenuButton = true }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Senior Officer': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Officer': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-accent-50 text-accent-700 border-accent-150';
    }
  };

  // Mock Notifications for high fidelity experience
  const mockNotifications = [
    { id: 1, text: 'New complaint "Water Leakage" verified in Sector 2.', time: '5 mins ago' },
    { id: 2, text: 'Road damage assignment updated to "In Progress".', time: '1 hour ago' },
    { id: 3, text: 'Senior Officer reviewed your electrical report.', time: '4 hours ago' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 text-slate-800 z-40 px-4 md:px-6 flex items-center justify-between shadow-sm select-none">
      {/* Brand & Left Controls */}
      <div className="flex items-center space-x-3">
        {isAuthenticated && showMenuButton && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors focus:outline-none md:hidden border border-slate-100"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        
        <Link to="/" className="flex items-center space-x-2">
          {/* Modern SVG Logo */}
          <div className="bg-accent-500 p-2 rounded-xl text-white flex items-center justify-center shadow-sm shadow-accent-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <span className="font-extrabold text-md tracking-tight text-slate-900">
            Urban<span className="text-accent-600">Pulse</span>
          </span>
        </Link>

        {/* Civic Tagline */}
        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/65">
          Smart City Portal
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3.5">
        {/* Public Explorer Link */}
        <Link
          to="/public-complaints"
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all border border-slate-100"
        >
          <Globe className="h-4 w-4 text-slate-450" />
          <span className="hidden sm:inline">Public Map</span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center space-x-2.5 relative">
            {/* Bell Notification dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setDropdownOpen(false);
                }}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-100 rounded-lg transition-colors relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-500" />
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-3 z-50 animate-fade-in">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800">Notifications</span>
                      <span className="text-[10px] text-accent-600 font-bold hover:underline cursor-pointer">Mark all read</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {mockNotifications.map((notif) => (
                        <div key={notif.id} className="px-4 py-2.5 hover:bg-slate-50 transition-colors">
                          <p className="text-[11px] font-medium text-slate-650 leading-relaxed">{notif.text}</p>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 block">{notif.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="h-7 w-7 rounded-lg bg-accent-100 text-accent-700 font-extrabold text-xs flex items-center justify-center border border-accent-200 uppercase">
                  {user?.username?.substring(0, 1) || 'U'}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none text-left">
                  <span className="text-xs font-bold text-slate-800">{user?.username}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wide">{user?.role}</span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fade-in">
                    {/* Header info */}
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Profile</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-0.5 truncate">{user?.username}</p>
                      <p className="text-[10px] text-slate-550 truncate">{user?.email}</p>
                      <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getRoleBadgeColor(user?.role)}`}>
                        {user?.role}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-100 px-3 py-2 rounded-lg transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-sm shadow-accent-500/20 active:scale-95 border border-accent-600"
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
