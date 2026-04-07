import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import "./TechnicianDashboard.css";

function TechnicianDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(user);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const loadTechnician = async () => {
      if (!user?.id || !token) {
        return;
      }

      try {
        const response = await fetch(`http://localhost:8080/users/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const message = data?.message || data?.error || "Failed to load technician status.";
          throw new Error(message);
        }

        setCurrentUser(data);
        localStorage.setItem("user", JSON.stringify({
          ...JSON.parse(localStorage.getItem("user") || "{}"),
          ...data,
        }));
      } catch (loadError) {
        setError(loadError.message || "Something went wrong.");
      }
    };

    loadTechnician();
  }, [token, user?.id]);

  return (
    <main className="tech-dashboard-page">
      <section className="tech-dashboard-shell">
        <Header
          title="Technician Dashboard"
          roleLabel="Technician Portal"
          user={currentUser}
          onUserUpdated={setCurrentUser}
          onLogout={handleLogout}
        />

        <section className="tech-status-panel">
          {error ? <p className="tech-status-message tech-status-error">{error}</p> : null}

          {!currentUser?.approved ? (
            <div className="tech-status-card tech-status-pending">
              <h2>Pending Approval</h2>
              <p>
                Your technician account has been created successfully. Please wait until an admin approves
                your account before starting technician work.
              </p>
            </div>
          ) : (
            <div className="tech-status-card tech-status-approved">
              <h2>Verified</h2>
              <p>
                Your technician account has been approved by admin. You can now continue with your
                technician tasks and dashboard features.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default TechnicianDashboard;
