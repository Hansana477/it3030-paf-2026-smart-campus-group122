import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Register from "./components/Register/Register";
import Login from "./components/Login/Login";
import Home from "./components/Home/Home";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import TechnicianDashboard from "./components/TechnicianDashboard/TechnicianDashboard";
import AdminResorceManagement from "./components/AdminDashboard/AdminResourceManagement";
import AdminBookingManagement from "./components/AdminDashboard/AdminBookingManagement";

import StudentResourceView from "./components/StudentDashboard/StudentResourceView";
import StudentMyBookings from "./components/StudentDashboard/StudentMyBookings";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentCreateTicketPage from "./components/Tickets/StudentCreateTicketPage";
import StudentTrackTicketsPage from "./components/Tickets/StudentTrackTicketsPage";
import AboutUs from "./components/AboutUs/AboutUs";
import FAQ from "./components/FAQ/FAQ";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import SiteFooter from "./components/SiteFooter/SiteFooter";


function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/technician-dashboard" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><TechnicianDashboard /></ProtectedRoute>} />
        <Route path="/admin-resource-management" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminResorceManagement /></ProtectedRoute>} />
        <Route path="/admin-booking-management" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBookingManagement /></ProtectedRoute>} />
        <Route path="/resources" element={<StudentResourceView />} />
        <Route path="/student-resource-view" element={<StudentResourceView />} />
        <Route path="/student-my-bookings" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentMyBookings /></ProtectedRoute>} />
        <Route path="/student-create-ticket" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentCreateTicketPage /></ProtectedRoute>} />
        <Route path="/student-track-tickets" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentTrackTicketsPage /></ProtectedRoute>} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <SiteFooter />
    </BrowserRouter>
  );
}

export default App;
