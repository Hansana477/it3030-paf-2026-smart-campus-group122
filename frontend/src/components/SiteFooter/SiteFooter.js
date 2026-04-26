import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Headphones,
  Mail,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const quickLinks = [
  { label: "Home", to: "/home" },
  { label: "About Us", to: "/about-us" },
  { label: "FAQ", to: "/faq" },
  { label: "Resources", to: "/resources" },
];

const portals = [
  { label: "Student Portal", to: "/student-dashboard", icon: CalendarCheck },
  { label: "Technician Desk", to: "/technician-dashboard", icon: Wrench },
  { label: "Admin Console", to: "/admin-dashboard", icon: ShieldCheck },
];

const contactItems = [
  { label: "Campus Operations", value: "UniNex Help Desk", icon: Building2 },
  { label: "Email", value: "support@uninex.lk", icon: Mail },
  { label: "Location", value: "Colombo, Sri Lanka", icon: MapPin },
];

function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-white/60 bg-primary text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr_0.9fr]">
          <section>
            <Link to="/home" className="inline-flex items-center gap-3 text-xl font-extrabold text-white">
              <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(6,182,212,0.2)]">
                <img src="/favicon.ico" alt="" className="h-7 w-7" aria-hidden="true" />
              </span>
              UniNex
            </Link>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              A connected workspace for bookings, service tickets, approvals, and daily campus operations.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["3", "Role portals"],
                ["24/7", "Service tracking"],
                ["1", "Campus hub"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <strong className="block text-2xl font-extrabold text-white">{value}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <nav aria-label="Footer navigation">
            <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-accent">Explore</h2>
            <div className="mt-5 grid gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="group inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-accent/50 hover:bg-accent/10 hover:text-white"
                >
                  {link.label}
                  <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </nav>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-accent">Portals</h2>
            <div className="mt-5 grid gap-3">
              {portals.map((portal) => {
                const Icon = portal.icon;

                return (
                  <Link
                    key={portal.label}
                    to={portal.to}
                    className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-secondary/50 hover:bg-secondary/10 hover:text-white"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-secondary">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    {portal.label}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-9 grid gap-4 border-t border-white/10 pt-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 md:grid-cols-3">
            {contactItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/faq"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-500"
          >
            <Headphones size={18} aria-hidden="true" />
            Get help
          </Link>
        </div>

        <div className="mt-7 flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {currentYear} UniNex. All rights reserved.</p>
          <p>Built for students, technicians, and administrators.</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;

