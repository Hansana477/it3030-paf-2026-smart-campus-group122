import React from "react";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <article className="rounded-[30px] border border-white/10 bg-primary p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Welcome</p>
            <h2 className="mt-4 text-4xl font-extrabold text-white">Student workspace</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Your account is ready. This dashboard now follows the new UniNex theme and is prepared for student-facing features.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/student-create-ticket")}
                className="rounded-2xl bg-accent px-6 py-3 font-semibold text-white shadow-sm"
              >
                Create Maintenance Ticket
              </button>

              <button
                onClick={() => navigate("/student-track-tickets")}
                className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-white/15"
              >
                Track My Tickets
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-slate-300">Role</p>
                <p className="mt-2 text-2xl font-extrabold text-white">Student</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-slate-300">Email rule</p>
                <p className="mt-2 text-lg font-bold text-white">@my.sliit.lk</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-slate-300">Status</p>
                <p className="mt-2 text-lg font-bold text-white">{user?.active ? "Active" : "Inactive"}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/10 p-6">
              <h3 className="text-2xl font-bold text-white">Booking Actions</h3>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/student-resource-view")}
                  className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  Make Booking
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/student-my-bookings")}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  My Booking
                </button>
              </div>
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

