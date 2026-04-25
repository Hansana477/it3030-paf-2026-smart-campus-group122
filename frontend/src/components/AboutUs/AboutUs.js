import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  GraduationCap,
  Headphones,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

const audienceCards = [
  {
    title: "Students",
    description: "Access campus resources, raise service requests, and follow updates from one place.",
    icon: GraduationCap,
  },
  {
    title: "Technicians",
    description: "Review assigned work, track request progress, and keep maintenance activity organized.",
    icon: Wrench,
  },
  {
    title: "Administrators",
    description: "Manage users, resources, and booking activity with role-aware controls.",
    icon: ShieldCheck,
  },
];

const highlights = [
  {
    label: "Role-based access",
    value: "3 portals",
    icon: Users,
  },
  {
    label: "Campus operations",
    value: "Connected",
    icon: Building2,
  },
  {
    label: "Service tracking",
    value: "Organized",
    icon: CalendarCheck,
  },
];

function AboutUs() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <nav className="flex flex-col gap-4 rounded-[30px] border border-white/70 bg-white/85 px-5 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <Link to="/login" className="inline-flex items-center gap-3 text-lg font-extrabold text-primary">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            Smart Campus
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-accent/50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Register
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="overflow-hidden rounded-[30px] border border-white/70 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="relative min-h-[520px] overflow-hidden bg-primary px-6 py-10 text-white sm:px-10 sm:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.28),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(6,182,212,0.24),transparent_30%)]" />
              <div className="relative z-10 flex min-h-[440px] flex-col">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent">About Us</p>
                <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] sm:text-6xl">
                  Building a smarter campus experience
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                  Smart Campus brings students, technicians, and administrators into one digital workspace for campus services, resource management, and day-to-day operations.
                </p>

                <div className="mt-auto grid gap-4 pt-10 sm:grid-cols-3">
                  {highlights.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                        <Icon className="text-accent" size={24} aria-hidden="true" />
                        <strong className="mt-4 block text-2xl font-extrabold">{item.value}</strong>
                        <span className="mt-1 block text-sm text-slate-200">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>

          <aside className="grid gap-6">
            <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Headphones size={28} aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-primary">Our mission</h2>
              <p className="mt-4 text-base leading-7 text-slate-500">
                We simplify campus service coordination by making requests, approvals, resource details, and user access easier to manage through one secure platform.
              </p>
            </section>

            <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
              <h2 className="text-3xl font-extrabold text-primary">Why it matters</h2>
              <p className="mt-4 text-base leading-7 text-slate-500">
                Campus teams need fast communication and dependable records. Smart Campus keeps each role focused on the work that matters most, while giving admins clearer oversight.
              </p>
            </section>
          </aside>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {audienceCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Icon size={28} aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-2xl font-extrabold text-primary">{card.title}</h3>
                <p className="mt-3 text-base leading-7 text-slate-500">{card.description}</p>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}

export default AboutUs;
