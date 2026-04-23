import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import TechnicianDashboard from "./components/TechnicianDashboard/TechnicianDashboard";
import AdminResorceManagement from "./components/AdminDashboard/AdminResourceManagement";
import AdminBookingManagement from "./components/AdminDashboard/AdminBookingManagement";
import StudentResourceView from "./components/StudentDashboard/StudentResourceView";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/technician-dashboard" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><TechnicianDashboard /></ProtectedRoute>} />
        <Route path="/admin-resource-management" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminResorceManagement /></ProtectedRoute>} />
        <Route path="/admin-booking-management" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBookingManagement /></ProtectedRoute>} />
        <Route path="/student-resource-view" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentResourceView /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
