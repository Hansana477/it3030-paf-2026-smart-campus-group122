import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketDetailsModal from "./TicketDetailsModal";
import TicketActionDialog from "./TicketActionDialog";
import { assignTicket, fetchTicketById, fetchTickets, updateTicketStatus } from "./ticketsApi";

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

function TechnicianTicketPanel() {
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [panelError, setPanelError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    setPanelError("");

    try {
      const data = await fetchTickets({
        status: statusFilter === "ALL" ? "" : statusFilter,
        search: searchTerm,
      });
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      setPanelError(error.message || "Failed to load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredTickets = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return tickets;
    }

    return tickets.filter((ticket) =>
      [
        ticket.ticketNumber,
        ticket.resourceName,
        ticket.location,
        ticket.category,
        ticket.description,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [tickets, searchTerm]);

  const openDetails = async (ticketId) => {
    try {
      const fullTicket = await fetchTicketById(ticketId);
      setSelectedTicket(fullTicket);
      setShowDetails(true);
    } catch (error) {
      setPanelError(error.message || "Failed to load ticket details.");
    }
  };

  const handleTicketUpdated = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
    setTickets((current) =>
      current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket))
    );
  };

  const handleClaimTicket = async (ticket) => {
    try {
      const updated = await assignTicket(ticket.id, currentUser.id);
      handleTicketUpdated(updated);
      setTickets((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (error) {
      setPanelError(error.message || "Failed to claim ticket.");
    }
  };

  const handleStartWork = async () => {
    if (!selectedTicket) {
      return;
    }

    try {
      const updated = await updateTicketStatus(selectedTicket.id, {
        status: "IN_PROGRESS",
      });
      handleTicketUpdated(updated);
    } catch (error) {
      setPanelError(error.message || "Failed to update status.");
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) {
      return;
    }
    setActionError("");
    setShowResolveDialog(true);
  };

  const submitResolution = async (resolutionNotes) => {
    const trimmedNotes = resolutionNotes.trim();
    if (!trimmedNotes) {
      setActionError("Resolution notes are required.");
      return;
    }

    setIsActionSubmitting(true);
    setActionError("");

    try {
      const updated = await updateTicketStatus(selectedTicket.id, {
        status: "RESOLVED",
        resolutionNotes: trimmedNotes,
      });
      handleTicketUpdated(updated);
      setShowResolveDialog(false);
    } catch (error) {
      setActionError(error.message || "Failed to resolve ticket.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const summary = {
    visible: tickets.length,
    assignedToMe: tickets.filter((ticket) => ticket.assignedTechnicianId === currentUser?.id).length,
    openQueue: tickets.filter((ticket) => ticket.status === "OPEN" && !ticket.assignedTechnicianId).length,
    inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
  };

  return (
    <>
      <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <div>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">Technician Ticket Workspace</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
            View assigned incidents, claim unassigned open work, update progress, add resolution notes, and communicate with users.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm text-slate-400">Visible Tickets</p>
            <p className="mt-2 text-3xl font-extrabold text-primary">{summary.visible}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-blue-50 p-5">
            <p className="text-sm text-blue-600">Assigned To Me</p>
            <p className="mt-2 text-3xl font-extrabold text-blue-700">{summary.assignedToMe}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-sky-50 p-5">
            <p className="text-sm text-sky-600">Open Queue</p>
            <p className="mt-2 text-3xl font-extrabold text-sky-700">{summary.openQueue}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-600">In Progress</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-700">{summary.inProgress}</p>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-primary">Technician Ticket Queue</h3>

            <button
              type="button"
              onClick={loadTickets}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {panelError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {panelError}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tickets..."
                className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-14 text-slate-500">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading tickets...</span>
                </div>
              </div>
            ) : null}

            {!loading && !filteredTickets.length ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center text-sm text-slate-500">
                No technician-visible tickets found.
              </div>
            ) : null}

            {!loading &&
              filteredTickets.map((ticket) => {
                const assignedToMe = ticket.assignedTechnicianId === currentUser?.id;
                const claimable = ticket.status === "OPEN" && !ticket.assignedTechnicianId;

                return (
                  <article key={ticket.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            <ClipboardList className="h-3.5 w-3.5" />
                            {ticket.ticketNumber}
                          </div>
                          <TicketStatusBadge value={ticket.status} />
                          <TicketStatusBadge value={ticket.priority} type="priority" />
                        </div>

                        <h4 className="mt-4 text-lg font-extrabold text-primary">{ticket.resourceName}</h4>
                        <p className="mt-1 text-sm text-slate-500">{ticket.location}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">{ticket.category}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">{ticket.description}</p>
                        <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                          Updated {formatDateTime(ticket.updatedAt)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(ticket.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        {claimable ? (
                          <button
                            type="button"
                            onClick={() => handleClaimTicket(ticket)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white"
                          >
                            <Wrench className="h-4 w-4" />
                            Claim
                          </button>
                        ) : null}

                        {assignedToMe ? (
                          <span className="rounded-2xl bg-blue-50 px-4 py-2 text-center text-xs font-bold text-blue-700">
                            Assigned to you
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </section>

      <TicketDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        ticket={selectedTicket}
        currentUser={currentUser}
        onTicketUpdated={handleTicketUpdated}
        rightPanel={
          selectedTicket ? (
            <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-extrabold text-primary">Technician Actions</h3>

              <div className="mt-4 grid gap-3">
                {selectedTicket.status === "OPEN" &&
                selectedTicket.assignedTechnicianId === currentUser?.id ? (
                  <button
                    type="button"
                    onClick={handleStartWork}
                    className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white"
                  >
                    Start Work
                  </button>
                ) : null}

                {selectedTicket.status === "IN_PROGRESS" &&
                selectedTicket.assignedTechnicianId === currentUser?.id ? (
                  <button
                    type="button"
                    onClick={handleResolve}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Resolved
                  </button>
                ) : null}
              </div>
            </section>
          ) : null
        }
      />

      <TicketActionDialog
        open={showResolveDialog}
        title="Resolution Notes"
        description="Document what was fixed so the student and admin can verify the outcome."
        submitLabel="Mark Resolved"
        placeholder="Describe the fix you completed..."
        error={actionError}
        isSubmitting={isActionSubmitting}
        onClose={() => {
          if (!isActionSubmitting) {
            setShowResolveDialog(false);
            setActionError("");
          }
        }}
        onSubmit={submitResolution}
      />
    </>
  );
}

export default TechnicianTicketPanel;
