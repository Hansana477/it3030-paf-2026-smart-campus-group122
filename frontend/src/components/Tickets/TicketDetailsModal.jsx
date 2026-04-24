import React, { useMemo, useState } from "react";
import { CalendarClock, MapPin, ShieldAlert, UserCog, X } from "lucide-react";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketCommentSection from "./TicketCommentSection";

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function TicketDetailsModal({
  ticket,
  currentUser,
  open,
  onClose,
  onTicketUpdated,
  rightPanel = null,
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = useMemo(() => ticket?.attachmentUrls || [], [ticket]);

  if (!open || !ticket) {
    return null;
  }

  const activityLogs = [...(ticket.activityLogs || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-7xl rounded-[32px] border border-white/60 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">Ticket Details</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">{ticket.ticketNumber}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <TicketStatusBadge value={ticket.status} />
              <TicketStatusBadge value={ticket.priority} type="priority" />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {ticket.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-extrabold text-primary">Issue Summary</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Resource</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary">{ticket.resourceName || "Not available"}</p>
                  <p className="mt-1 text-sm text-slate-500">{ticket.location || "Not available"}</p>
                  <p className="mt-1 text-xs text-slate-400">{ticket.resourceType || "Unknown type"}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarClock className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Timing</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Created: {formatDateTime(ticket.createdAt)}</p>
                  <p className="mt-1 text-sm text-slate-600">Updated: {formatDateTime(ticket.updatedAt)}</p>
                  <p className="mt-1 text-sm text-slate-600">Assigned: {formatDateTime(ticket.assignedAt)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Description</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{ticket.description}</p>
              </div>

              {ticket.resolutionNotes ? (
                <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Resolution Notes</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-800">{ticket.resolutionNotes}</p>
                </div>
              ) : null}

              {ticket.rejectionReason ? (
                <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Rejection Reason</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-rose-800">{ticket.rejectionReason}</p>
                </div>
              ) : null}

              {ticket.reopenReason ? (
                <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Reopen Reason</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-sky-800">{ticket.reopenReason}</p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-extrabold text-primary">Attachments</h3>

              {!images.length ? (
                <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  No evidence images attached.
                </div>
              ) : (
                <>
                  <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                    <img
                      src={images[selectedImageIndex]}
                      alt="Ticket evidence"
                      className="h-[320px] w-full object-cover"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`overflow-hidden rounded-3xl border ${
                          selectedImageIndex === index
                            ? "border-accent ring-2 ring-accent/20"
                            : "border-slate-200"
                        }`}
                      >
                        <img src={image} alt={`Evidence ${index + 1}`} className="h-24 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>

            <TicketCommentSection
              ticket={ticket}
              currentUser={currentUser}
              onTicketUpdated={onTicketUpdated}
            />
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-extrabold text-primary">People</h3>

              <div className="mt-4 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Reported By</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary">{ticket.createdByUserName || "Unknown"}</p>
                  <p className="mt-1 text-sm text-slate-600">{ticket.createdByUserEmail || "No email"}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <UserCog className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">Assigned Technician</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-primary">
                    {ticket.assignedTechnicianName || "Not assigned yet"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Assigned at: {formatDateTime(ticket.assignedAt)}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Preferred Contact</p>
                  <p className="mt-2 text-sm text-slate-700">{ticket.preferredContactName || "Not available"}</p>
                  <p className="mt-1 text-sm text-slate-600">{ticket.preferredContactEmail || "No email"}</p>
                  <p className="mt-1 text-sm text-slate-600">{ticket.preferredContactPhone || "No phone"}</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Reopen Count</p>
                  <p className="mt-2 text-lg font-extrabold text-primary">{ticket.reopenedCount || 0}</p>
                  {(ticket.reopenedCount || 0) > 1 ? (
                    <p className="mt-1 text-xs font-semibold text-rose-600">Recurring issue detected</p>
                  ) : null}
                </div>
              </div>
            </section>

            {rightPanel}

            <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-extrabold text-primary">Activity Timeline</h3>

              <div className="mt-4 space-y-4">
                {!activityLogs.length ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    No activity recorded yet.
                  </div>
                ) : null}

                {activityLogs.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-primary">{item.actionType?.replaceAll("_", " ")}</p>
                      <span className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                      {item.performedByName || "Unknown"} • {item.performedByRole || "USER"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailsModal;
