import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import CitizenDashboard from '../pages/CitizenDashboard';
import RaiseComplaint from '../pages/RaiseComplaint';
import ComplaintDetails from '../pages/ComplaintDetails';
import OfficerDashboard from '../pages/OfficerDashboard';
import SeniorOfficerDashboard from '../pages/SeniorOfficerDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import PublicComplaints from '../pages/PublicComplaints';

// Import Shared Components
import Loading from '../components/Loading';

// Helper to determine home dashboard based on role
export const getDefaultDashboard = (role) => {
  switch (role) {
    case 'Citizen':
      return '/citizen/dashboard';
    case 'Officer':
      return '/officer/dashboard';
    case 'Senior Officer':
      return '/senior-officer/dashboard';
    case 'Admin':
      return '/admin/dashboard';
    default:
      return '/public-complaints';
  }
};

// Route wrapper for authenticated users
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-primary-50">
        <Loading size="lg" message="Verifying authentication status..." />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If authenticated but role not allowed, redirect to their default home
    return <Navigate to={getDefaultDashboard(user?.role)} replace />;
  }

  return children;
};

// Route wrapper for guests (e.g. login/register)
const GuestRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-primary-50">
        <Loading size="lg" />
      </div>
    );
  }

  if (token && user) {
    return <Navigate to={getDefaultDashboard(user.role)} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Guest/Auth routes */}
      <Route 
        path="/login" 
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } 
      />

      {/* Public routes */}
      <Route path="/public-complaints" element={<PublicComplaints />} />

      {/* Citizen routes */}
      <Route 
        path="/citizen/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['Citizen']}>
            <CitizenDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/citizen/raise" 
        element={
          <ProtectedRoute allowedRoles={['Citizen']}>
            <RaiseComplaint />
          </ProtectedRoute>
        } 
      />

      {/* Shared detail view for authenticated users */}
      <Route 
        path="/complaints/:id" 
        element={
          <ProtectedRoute allowedRoles={['Citizen', 'Officer', 'Senior Officer', 'Admin']}>
            <ComplaintDetails />
          </ProtectedRoute>
        } 
      />

      {/* Officer routes */}
      <Route 
        path="/officer/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['Officer']}>
            <OfficerDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Senior Officer routes */}
      <Route 
        path="/senior-officer/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['Senior Officer']}>
            <SeniorOfficerDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Admin routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Fallback routing */}
      <Route 
        path="*" 
        element={
          user ? (
            <Navigate to={getDefaultDashboard(user.role)} replace />
          ) : (
            <Navigate to="/public-complaints" replace />
          )
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
