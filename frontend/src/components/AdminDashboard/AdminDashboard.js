import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(user);
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeApprovalId, setActiveApprovalId] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const loadPendingTechnicians = async () => {
      if (!token) {
        setError("Missing login token.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("http://localhost:8080/users/pending-technicians", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => []);
        if (!response.ok) {
          const message = data?.message || data?.error || "Failed to load pending technicians.";
          throw new Error(message);
        }

        setPendingTechnicians(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setError(loadError.message || "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingTechnicians();
  }, [token]);

  const approveTechnician = async (userId) => {
    if (!token) {
      setError("Missing login token.");
      return;
    }

    setActiveApprovalId(userId);
    setError("");

    try {
      const response = await fetch(`http://localhost:8080/users/${userId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to approve technician.";
        throw new Error(message);
      }

      setPendingTechnicians((current) => current.filter((technician) => technician.id !== userId));
    } catch (approveError) {
      setError(approveError.message || "Something went wrong.");
    } finally {
      setActiveApprovalId(null);
    }
  };

  return (
    <main className="admin-dashboard-page">
      <section className="admin-dashboard-shell">
        <Header
          title="Admin Dashboard"
          roleLabel="Admin Portal"
          user={currentUser}
          onUserUpdated={setCurrentUser}
          onLogout={handleLogout}
        />

        <section className="admin-panel">
          <div className="admin-panel-copy">
            <h2>Technician Approval Queue</h2>
            <p>Approve registered technicians before they can access their full dashboard features.</p>
          </div>

          {error ? <p className="admin-message admin-message-error">{error}</p> : null}

          {isLoading ? <p className="admin-message">Loading pending technicians...</p> : null}

          {!isLoading && !pendingTechnicians.length ? (
            <p className="admin-message admin-message-success">No pending technicians right now.</p>
          ) : null}

          <div className="admin-list">
            {pendingTechnicians.map((technician) => (
              <article key={technician.id} className="admin-list-item">
                <div>
                  <h3>{technician.fullName}</h3>
                  <p>{technician.email}</p>
                  <p>{technician.phone || "No phone provided"}</p>
                </div>

                <button
                  type="button"
                  className="admin-approve-button"
                  onClick={() => approveTechnician(technician.id)}
                  disabled={activeApprovalId === technician.id}
                >
                  {activeApprovalId === technician.id ? "Approving..." : "Approve"}
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default AdminDashboard;
