import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppRoutes from './routes';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// App shell layout selector based on auth state
const AppShell = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If user is not authenticated (guests, logging in, or registering)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1">
          <AppRoutes />
        </div>
      </div>
    );
  }

  // If user is authenticated, render the full admin dashboard layout
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} />
        
        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          />
        )}

        {/* Primary Content Viewport */}
        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
