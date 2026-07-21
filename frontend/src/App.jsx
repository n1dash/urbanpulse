import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-accent-200 selection:text-accent-950">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
