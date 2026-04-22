import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";

function StudentDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const [currentUser, setCurrentUser] = useState(user);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleOwnAccountDeleted = () => {
    handleLogout();
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header
          title="Student Dashboard"
          roleLabel="Student Portal"
          user={currentUser}
          onUserUpdated={setCurrentUser}
          onDeleteAccount={handleOwnAccountDeleted}
          onLogout={handleLogout}
        />

        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Welcome</p>
            <h2 className="mt-4 text-4xl font-extrabold text-primary">Student workspace</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Your account is ready. This dashboard now follows the new Smart Campus theme and is prepared for student-facing features.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Role</p>
                <p className="mt-2 text-2xl font-extrabold text-primary">Student</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Email rule</p>
                <p className="mt-2 text-lg font-bold text-primary">@my.sliit.lk</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Status</p>
                <p className="mt-2 text-lg font-bold text-primary">{currentUser?.active ? "Active" : "Inactive"}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-accent/20 bg-accent/5 p-6">
              <h3 className="text-2xl font-bold text-primary">Profile-ready interface</h3>
              <p className="mt-3 text-base leading-7 text-slate-500">
                Use the profile icon in the header to update your personal details and change your password without leaving the dashboard.
              </p>
              <button
                type="button"
                onClick={() => navigate("/student-resource-view")}
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Make Booking
              </button>
            </div>
          </article>

          <article className="rounded-[30px] border border-primary/10 bg-primary p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Student Access</p>
            <h3 className="mt-4 text-3xl font-extrabold">Campus identity rules stay enforced</h3>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Validated signup</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Student registration only accepts institutional emails using the
                  {" "}
                  <span className="font-semibold text-secondary">@my.sliit.lk</span>
                  {" "}
                  domain.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Clean theme</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  The frontend now uses one Tailwind-based visual system across auth screens, headers, and dashboards.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Next step</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  This page is ready for student-specific modules like requests, issue tracking, or service history.
                </p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

export default StudentDashboard;
