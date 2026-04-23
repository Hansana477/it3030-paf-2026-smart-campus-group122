import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
      if (user.role === 'STUDENT') return <Navigate to="/student-dashboard" replace />;
      if (user.role === 'TECHNICIAN') return <Navigate to="/technician-dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
