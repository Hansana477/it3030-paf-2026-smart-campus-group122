import React from "react";

const STATUS_STYLES = {
  OPEN: "bg-sky-100 text-sky-700 border border-sky-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border border-amber-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  CLOSED: "bg-slate-200 text-slate-700 border border-slate-300",
  REJECTED: "bg-rose-100 text-rose-700 border border-rose-200",
};

const PRIORITY_STYLES = {
  LOW: "bg-slate-100 text-slate-700 border border-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 border border-blue-200",
  HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
  CRITICAL: "bg-red-100 text-red-700 border border-red-200",
};

export function TicketStatusBadge({ value, type = "status" }) {
  const normalized = (value || "").toUpperCase();
  const styles =
    type === "priority"
      ? PRIORITY_STYLES[normalized] || "bg-slate-100 text-slate-700 border border-slate-200"
      : STATUS_STYLES[normalized] || "bg-slate-100 text-slate-700 border border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${styles}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

export default TicketStatusBadge;