import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import TechnicianDashboard from "./components/TechnicianDashboard/TechnicianDashboard";
import AdminResourceManagement from "./components/AdminDashboard/AdminResourceManagement";
import AdminBookingManagement from "./components/AdminDashboard/AdminBookingManagement";

import StudentResourceView from "./components/StudentDashboard/StudentResourceView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
        <Route path="/admin-resource-management" element={<AdminResourceManagement />} />
        <Route path="/admin-booking-management" element={<AdminBookingManagement />} />
        <Route path="/student-resource-view" element={<StudentResourceView />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
