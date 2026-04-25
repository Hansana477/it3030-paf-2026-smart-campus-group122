import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CalendarCheck, Headphones, ShieldCheck, Wrench } from "lucide-react";

function getDashboardPath(user) {
  switch (user?.role) {
    case "ADMIN":
      return "/admin-dashboard";
    case "TECHNICIAN":
      return "/technician-dashboard";
    case "STUDENT":
      return "/student-dashboard";
    default:
      return "/login";
  }
}

function Home() {
  const storedUser = localStorage.getItem("user");
  let user = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      user = null;
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[34px] border border-white/10 bg-primary p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Smart Campus</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-tight text-white sm:text-6xl">
            A clearer way to manage campus services
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Book resources, track service tickets, manage approvals, and keep campus operations connected from one secure workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                to={getDashboardPath(user)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                Go to dashboard
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </article>

        <aside className="grid gap-5">
          {[
            {
              title: "Resource booking",
              text: "Find available rooms, labs, study areas, and equipment with booking tools for students.",
              icon: CalendarCheck,
            },
            {
              title: "Maintenance support",
              text: "Create and track incident tickets with technician assignment and progress updates.",
              icon: Wrench,
            },
            {
              title: "Admin oversight",
              text: "Approve users, manage resources, and keep booking activity organized.",
              icon: ShieldCheck,
            },
            {
              title: "Campus help",
              text: "Access FAQs, resources, and service information from the same header.",
              icon: Headphones,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-[28px] border border-white/10 bg-primary p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
              </article>
            );
          })}
        </aside>
      </section>

      <section className="mx-auto mt-6 flex w-full max-w-7xl flex-col gap-4 rounded-[30px] border border-primary/10 bg-primary p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent">
            <Building2 size={24} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-extrabold">Built for daily campus work</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">Students, technicians, and admins each get the right workspace.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
