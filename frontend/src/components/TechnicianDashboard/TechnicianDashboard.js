import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";

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

  const handleOwnAccountDeleted = () => {
    handleLogout();
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
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header
          title="Technician Dashboard"
          roleLabel="Technician Portal"
          user={currentUser}
          onUserUpdated={setCurrentUser}
          onDeleteAccount={handleOwnAccountDeleted}
          onLogout={handleLogout}
        />

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Technician Status</p>
            <h2 className="mt-4 text-4xl font-extrabold text-primary">Account readiness</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              This area reflects your approval state and keeps your profile tools available from the header at any time.
            </p>

            {error ? (
              <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            {!currentUser?.approved ? (
              <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-6">
                <h3 className="text-3xl font-extrabold text-primary">Pending Approval</h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Your technician account has been created successfully. Please wait until an admin approves
                  your account before starting technician work.
                </p>
              </div>
            ) : (
              <div className="mt-8 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="text-3xl font-extrabold text-primary">Verified</h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Your technician account has been approved by admin. You can now continue with your
                  technician tasks and dashboard features.
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Role</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">Technician</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Approval</p>
                <p className="mt-2 text-lg font-bold text-primary">{currentUser?.approved ? "Approved" : "Pending"}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Account</p>
                <p className="mt-2 text-lg font-bold text-primary">{currentUser?.active ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-primary/10 bg-primary p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Portal Guide</p>
            <h3 className="mt-4 text-3xl font-extrabold">What this state means</h3>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Before approval</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Your registration is stored successfully, but admin approval is still required before technician work begins.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">After approval</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Once approved, this dashboard is ready to host maintenance queues, service actions, and technician tools.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Profile tools</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Use the header profile modal to edit your details or change your password without leaving this page.
                </p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

export default TechnicianDashboard;
