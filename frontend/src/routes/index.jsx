import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import CitizenDashboard from '../pages/CitizenDashboard';
import RaiseComplaint from '../pages/RaiseComplaint';
import ComplaintDetails from '../pages/ComplaintDetails';
import OfficerDashboard from '../pages/OfficerDashboard';
import SeniorOfficerDashboard from '../pages/SeniorOfficerDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import PublicComplaints from '../pages/PublicComplaints';

// Loading helper
import { Loading } from '../components/Loading';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loading size="lg" text="Authenticating user session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Wrapper (Redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loading size="lg" text="Restoring session..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Dispatcher Component that redirects `/dashboard` to the appropriate dashboard page
const DashboardDispatcher = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Citizen':
      return <CitizenDashboard />;
    case 'Officer':
      return <OfficerDashboard />;
    case 'Senior Officer':
      return <SeniorOfficerDashboard />;
    case 'Admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/public-feed" replace />;
  }
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/public-feed" element={<PublicComplaints />} />

      {/* Unified Dashboards Route */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardDispatcher />
          </ProtectedRoute>
        } 
      />

      {/* Complaint Detail Route (Available to all logged-in roles) */}
      <Route 
        path="/complaints/:id" 
        element={
          <ProtectedRoute>
            <ComplaintDetails />
          </ProtectedRoute>
        } 
      />

      {/* Citizen Specific Route */}
      <Route 
        path="/raise-complaint" 
        element={
          <ProtectedRoute allowedRoles={['Citizen']}>
            <RaiseComplaint />
          </ProtectedRoute>
        } 
      />

      {/* Admin Specific Routes */}
      <Route 
        path="/admin/departments" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/officers" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Fallback routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
