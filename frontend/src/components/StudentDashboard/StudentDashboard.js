import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <Header
          title="Student Dashboard"
          roleLabel="Student Portal"
          userName={user?.fullName || "Student User"}
          onLogout={handleLogout}
        />
      </section>
    </main>
  );
}

export default StudentDashboard;
