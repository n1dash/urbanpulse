import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map, 
  Users, 
  Building2, 
  UserSquare2, 
  HelpCircle,
  FileText
} from 'lucide-react';

export const Sidebar = ({ isOpen }) => {
  const { user } = useAuth();
  
  if (!user) return null;

  // Configuration for role-specific links
  const getNavLinks = (role) => {
    switch (role) {
      case 'Citizen':
        return [
          { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { to: '/raise-complaint', label: 'Raise Complaint', icon: PlusCircle },
          { to: '/public-feed', label: 'Public Complaints', icon: Map }
        ];
      case 'Officer':
        return [
          { to: '/dashboard', label: 'Assigned Issues', icon: LayoutDashboard },
          { to: '/public-feed', label: 'Public Map', icon: Map }
        ];
      case 'Senior Officer':
        return [
          { to: '/dashboard', label: 'Department Overview', icon: LayoutDashboard },
          { to: '/public-feed', label: 'Public Map', icon: Map }
        ];
      case 'Admin':
        return [
          { to: '/dashboard', label: 'System Overview', icon: LayoutDashboard },
          { to: '/admin/departments', label: 'Departments', icon: Building2 },
          { to: '/admin/officers', label: 'Officers', icon: UserSquare2 },
          { to: '/admin/users', label: 'All Users', icon: Users },
          { to: '/public-feed', label: 'Public Map', icon: Map }
        ];
      default:
        return [{ to: '/public-feed', label: 'Public Map', icon: Map }];
    }
  };

  const navLinks = getNavLinks(user.role);

  return (
    <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-govdark-900 text-white w-64 z-30 transition-all duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } border-r border-govdark-850 flex flex-col justify-between shrink-0`}>
      
      {/* Top Menu Links */}
      <div className="p-4 py-6 space-y-1.5 flex-1">
        <div className="text-[10px] text-govdark-400 font-bold px-3 py-1 uppercase tracking-wider mb-2">
          Navigation
        </div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `
                flex items-center space-x-3.5 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-150
                ${isActive 
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-900/30' 
                  : 'text-govdark-300 hover:text-white hover:bg-govdark-800'
                }
              `}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Department Brand */}
      <div className="p-4 border-t border-govdark-800 bg-govdark-950">
        <div className="flex items-center space-x-3 text-xs text-govdark-400">
          <FileText className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-bold">v1.0.0 (Beta)</span>
            <span className="text-[10px]">Portal Administration</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
