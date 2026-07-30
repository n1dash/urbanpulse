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

  const getRoleTheme = (role) => {
      const normalizedRole = (role || "GUEST").toUpperCase();

      switch (normalizedRole) {
      case "GUEST":
      case 'ADMIN':
        return {
          activeMenu: 'bg-purple-50/90 text-purple-900 border-purple-200/80 shadow-sm font-bold',
          hoverMenu: 'hover:text-purple-900 hover:bg-purple-50/60',
          supportCardBg: 'bg-gradient-to-b from-purple-50/60 to-indigo-50/30 border-purple-200/70',
          supportIcon: 'text-purple-600',
          quickTipTitle: 'text-purple-800',
          footerAvatar: 'bg-purple-100 text-purple-700 border-purple-200',
          roleBadgeText: 'text-purple-600',
        };
      case 'SENIOR_OFFICER':
        return {
          activeMenu: 'bg-blue-50/90 text-blue-900 border-blue-200/80 shadow-sm font-bold',
          hoverMenu: 'hover:text-blue-900 hover:bg-blue-50/60',
          supportCardBg: 'bg-gradient-to-b from-blue-50/60 to-indigo-50/30 border-blue-200/70',
          supportIcon: 'text-blue-600',
          quickTipTitle: 'text-blue-800',
          footerAvatar: 'bg-blue-100 text-blue-700 border-blue-200',
          roleBadgeText: 'text-blue-600',
        };
      case 'OFFICER':
        return {
          activeMenu: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 shadow-sm font-bold',
          hoverMenu: 'hover:text-emerald-900 hover:bg-emerald-50/60',
          supportCardBg: 'bg-gradient-to-b from-emerald-50/60 to-teal-50/30 border-emerald-200/70',
          supportIcon: 'text-emerald-600',
          quickTipTitle: 'text-emerald-800',
          footerAvatar: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          roleBadgeText: 'text-emerald-600',
        };
      case 'CITIZEN':
      default:
        return {
          activeMenu: 'bg-amber-50/90 text-amber-900 border-amber-200/80 shadow-sm font-bold',
          hoverMenu: 'hover:text-amber-900 hover:bg-amber-50/60',
          supportCardBg: 'bg-gradient-to-b from-amber-50/60 to-orange-50/30 border-amber-200/70',
          supportIcon: 'text-amber-600',
          quickTipTitle: 'text-amber-800',
          footerAvatar: 'bg-amber-100 text-amber-800 border-amber-200',
          roleBadgeText: 'text-amber-600',
        };
    }
  };

  const theme = getRoleTheme(role);

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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80 z-30 transition-transform duration-300 ease-in-out md:translate-x-0 shadow-sm ${
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
                          ? theme.activeMenu
                          : `text-slate-600 ${theme.hoverMenu} border-transparent`
                      }`
                    }
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Citizen Support Center */}
            <div className={`p-4 border rounded-2xl shadow-sm transition-all ${theme.supportCardBg}`}>
              <div className="flex items-start space-x-2.5">
                <HelpCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${theme.supportIcon}`} />

                <div className="flex-1">
                  <h3 className="text-[11px] font-bold text-slate-800">
                    Citizen Support Panel 
                  </h3>

                  <div className="mt-3 space-y-2 text-[10px] text-slate-600">
                    <div className="flex justify-between">
                      <span>◆ Road Department</span>
                      <span className="font-semibold">+91********08</span>
                    </div>

                    <div className="flex justify-between">
                      <span>◆ Electricity Department</span>
                      <span className="font-semibold">+91********17</span>
                    </div>

                    <div className="flex justify-between">
                      <span>◆ Water Department</span>
                      <span className="font-semibold">+91********25</span>
                    </div>

                    <div className="flex justify-between">
                      <span>◆ Sanitation Department</span>
                      <span className="font-semibold">+91********42</span>
                    </div>

                    <div className="flex justify-between">
                      <span>◆ Parks Department</span>
                      <span className="font-semibold">+91********63</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 my-3"></div>

                  <p className={`text-[10px] font-bold ${theme.quickTipTitle}`}>
                    💡 Quick Tip
                  </p>

                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Before filing a new complaint, check <strong>Community Complaints</strong>.
                    If the issue already exists, upvote it instead of creating a duplicate report.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer User Display */}
          <div className="border-t border-slate-100 pt-4 mb-2.5">
            <div className="flex items-center space-x-3 px-2 py-1 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className={`h-8.5 w-8.5 rounded-xl ${theme.footerAvatar} flex items-center justify-center font-extrabold text-xs border uppercase shadow-sm`}>
                {user?.username?.substring(0, 1) || 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-extrabold text-slate-900 leading-tight truncate">{user?.username || 'Guest Citizen'}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${theme.roleBadgeText}`}>{user?.role || 'Guest'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
