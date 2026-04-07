import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import "./TechnicianDashboard.css";

function TechnicianDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <main className="tech-dashboard-page">
      <section className="tech-dashboard-shell">
        <Header
          title="Technician Dashboard"
          roleLabel="Technician Portal"
          userName={user?.fullName || "Technician User"}
          onLogout={handleLogout}
        />
      </section>
    </main>
  );
}

export default TechnicianDashboard;
