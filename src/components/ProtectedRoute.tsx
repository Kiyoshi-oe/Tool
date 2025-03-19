
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresLicense?: boolean;
  requiresAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresLicense = false,
  requiresAdmin = false
}) => {
  const { isAuthenticated, hasLicense, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresLicense && !hasLicense) {
    return <Navigate to="/account" replace />;
  }

  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
