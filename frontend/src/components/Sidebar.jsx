import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map, 
  Users, 
  Building2, 
  CheckSquare, 
  HelpCircle,
  FolderOpen
} from 'lucide-react';

const Sidebar = ({ isOpen, onCloseSideBar }) => {
  const { user } = useAuth();
  const role = user?.role;

  // Define links based on user role
  const getNavLinks = () => {
    switch (role) {
      case 'Citizen':
        return [
          {
            to: '/citizen/dashboard',
            label: 'My Dashboard',
            icon: <LayoutDashboard className="h-4 w-4 stroke-[2]" />
          },
          {
            to: '/citizen/raise',
            label: 'Report Civic Issue',
            icon: <PlusCircle className="h-4 w-4 stroke-[2]" />
          },
          {
            to: '/public-complaints',
            label: 'Public Map View',
            icon: <Map className="h-4 w-4 stroke-[2]" />
          }
        ];
      case 'Officer':
        return [
          {
            to: '/officer/dashboard',
            label: 'My Assignments',
            icon: <CheckSquare className="h-4 w-4 stroke-[2]" />
          },
          {
            to: '/public-complaints',
            label: 'Public Map View',
            icon: <Map className="h-4 w-4 stroke-[2]" />
          }
        ];
      case 'Senior Officer':
        return [
          {
            to: '/senior-officer/dashboard',
            label: 'Department Dashboard',
            icon: <FolderOpen className="h-4 w-4 stroke-[2]" />
          },
          {
            to: '/public-complaints',
            label: 'Public Map View',
            icon: <Map className="h-4 w-4 stroke-[2]" />
          }
        ];
      case 'Admin':
        return [
          {
            to: '/admin/dashboard',
            label: 'System Administration',
            icon: <Users className="h-4 w-4 stroke-[2]" />
          },
          {
            to: '/public-complaints',
            label: 'Public Map View',
            icon: <Map className="h-4 w-4 stroke-[2]" />
          }
        ];
      default:
        return [
          {
            to: '/public-complaints',
            label: 'Public Map View',
            icon: <Map className="h-4 w-4 stroke-[2]" />
          }
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseSideBar}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-30 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-30 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-5 select-none">
          {/* Navigation Links */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">
                Main Menu
              </p>
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onCloseSideBar}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-accent-50 text-accent-700 border-accent-100/50 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                      }`
                    }
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Quick Informational Panel for GovTech */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-start space-x-2.5 text-slate-500">
                <HelpCircle className="h-4.5 w-4.5 text-accent-500 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col leading-snug">
                  <span className="text-[11px] font-bold text-slate-800">Support Center</span>
                  <span className="text-[10px] text-slate-400 mt-1 leading-normal">Need assistance? File a report or contact smart city helpline at 112.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer User Display */}
          <div className="border-t border-slate-100 pt-4 mb-2.5">
            <div className="flex items-center space-x-3 px-2">
              <div className="h-8.5 w-8.5 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200 uppercase shadow-sm">
                {user?.username?.substring(0, 1) || 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-extrabold text-slate-900 leading-tight truncate">{user?.username || 'Guest Citizen'}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user?.role || 'Guest'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
