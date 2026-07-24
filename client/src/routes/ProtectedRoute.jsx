// =============================================================================
// ProtectedRoute.jsx — Role-Based Access Control Route Wrapper
// =============================================================================
// This component protects routes from unauthenticated or unauthorized access.
// Parameters:
//   - allowedRoles (Array, optional): Roles permitted to access this route.
//     Example: [ROLES.ADMIN, ROLES.WARD_ADMIN]
//   - children (React Node, optional): Child routes/components to render.
// =============================================================================

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  // Read authentication state from AuthContext
  const { user, isAuthenticated, isLoading } = useAuth();

  // Step 1: If session is still loading from localStorage, display loading indicator
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: '#475569'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #0284c7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <p>Verifying session...</p>
        </div>
      </div>
    );
  }

  // Step 2: If user is not logged in, redirect to Staff Portal Login page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Step 3: If allowedRoles is specified, check if logged-in user has permission
  if (allowedRoles.length > 0) {
    const hasRolePermission = allowedRoles.includes(user.role);

    if (!hasRolePermission) {
      // User is logged in, but their role is not authorized for this route
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Step 4: User is authenticated and authorized — render protected route content
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
