import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
      if (user.role === 'STUDENT') return <Navigate to="/student-dashboard" replace />;
      if (user.role === 'TECHNICIAN') return <Navigate to="/technician-dashboard" replace />;
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  return children;
};

export default PublicRoute;
