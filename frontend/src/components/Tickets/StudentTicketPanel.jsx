import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketFormModal from "./TicketFormModal";
import TicketDetailsModal from "./TicketDetailsModal";
import TicketActionDialog from "./TicketActionDialog";
import { confirmTicketResolution, fetchTicketById, fetchTickets, reopenTicket } from "./ticketsApi";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const PRIORITY_OPTIONS = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

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

function StudentTicketPanel({ openCreateModalByDefault = false }) {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(openCreateModalByDefault);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const loadTickets = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }
    setPanelError("");

    try {
      const data = await fetchTickets({
        status: statusFilter === "ALL" ? "" : statusFilter,
        priority: priorityFilter === "ALL" ? "" : priorityFilter,
        search: searchTerm,
      });
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      setPanelError(error.message || "Failed to load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadTickets();
  };

  const openDetails = async (ticketId) => {
    try {
      const fullTicket = await fetchTicketById(ticketId);
      setSelectedTicket(fullTicket);
      setShowDetails(true);
    } catch (error) {
      setPanelError(error.message || "Failed to load ticket details.");
    }
  };

  const handleTicketCreated = (createdTicket) => {
    setTickets((current) => [createdTicket, ...current]);
  };

  const handleTicketUpdated = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
    setTickets((current) =>
      current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket))
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets(false);
  };

  const handleReopen = async () => {
    if (!selectedTicket) {
      return;
    }
    setActionError("");
    setShowReopenDialog(true);
  };

  const submitReopen = async (reason) => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setActionError("Reopen reason is required.");
      return;
    }

    setIsActionSubmitting(true);
    setActionError("");

    try {
      const updated = await reopenTicket(selectedTicket.id, trimmedReason);
      handleTicketUpdated(updated);
      setShowReopenDialog(false);
    } catch (error) {
      setActionError(error.message || "Failed to reopen ticket.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleCloseResolvedTicket = async () => {
    if (!selectedTicket) {
      return;
    }

    try {
      const updated = await confirmTicketResolution(selectedTicket.id);
      handleTicketUpdated(updated);
    } catch (error) {
      setPanelError(error.message || "Failed to close ticket.");
    }
  };

  const summary = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "OPEN").length,
    inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
    resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
  };

  return (
    <>
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="bg-slate-950 px-6 py-12 text-white sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Maintenance & Incident Ticketing
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                Report issues for campus resources, upload evidence images, track technician progress, and communicate through comments.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/student-dashboard")}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                ← Back to Dashboard
              </button>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4" />
                Create Ticket
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm text-slate-400">Total Tickets</p>
              <p className="mt-2 text-3xl font-extrabold text-primary">{summary.total}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-sky-50 p-5">
              <p className="text-sm text-sky-600">Open</p>
              <p className="mt-2 text-3xl font-extrabold text-sky-700">{summary.open}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-amber-50 p-5">
              <p className="text-sm text-amber-600">In Progress</p>
              <p className="mt-2 text-3xl font-extrabold text-amber-700">{summary.inProgress}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-5">
              <p className="text-sm text-emerald-600">Resolved</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-700">{summary.resolved}</p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-primary">My Tickets</h3>

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </button>
            </div>

            {panelError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {panelError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by ticket number, resource, category..."
                  className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </form>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All Statuses" : option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "All Priorities" : option}
                  </option>
                ))}
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
                  No tickets found for the selected filters.
                </div>
              ) : null}

              {!loading &&
                filteredTickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            <Ticket className="h-3.5 w-3.5" />
                            {ticket.ticketNumber}
                          </div>
                          <TicketStatusBadge value={ticket.status} />
                          <TicketStatusBadge value={ticket.priority} type="priority" />
                        </div>

                        <h4 className="mt-4 text-lg font-extrabold text-primary">{ticket.resourceName}</h4>
                        <p className="mt-1 text-sm text-slate-500">{ticket.location}</p>
                        <p className="mt-3 text-sm font-semibold text-slate-700">{ticket.category}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">{ticket.description}</p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Updated {formatDateTime(ticket.updatedAt)}
                        </p>
                        <button
                          type="button"
                          onClick={() => openDetails(ticket.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </section>

      <TicketFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        currentUser={currentUser}
        onTicketCreated={handleTicketCreated}
      />

      <TicketDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        ticket={selectedTicket}
        currentUser={currentUser}
        onTicketUpdated={handleTicketUpdated}
        rightPanel={
          selectedTicket ? (
            <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-lg font-extrabold text-primary">Student Actions</h3>
              <div className="mt-4 grid gap-3">
                {["RESOLVED", "CLOSED", "REJECTED"].includes(selectedTicket.status) ? (
                  <button
                    type="button"
                    onClick={handleReopen}
                    className="rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-white"
                  >
                    Reopen Ticket
                  </button>
                ) : null}

                {selectedTicket.status === "RESOLVED" ? (
                  <button
                    type="button"
                    onClick={handleCloseResolvedTicket}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
                  >
                    Confirm Fix & Close
                  </button>
                ) : null}
              </div>
            </section>
          ) : null
        }
      />

      <TicketActionDialog
        open={showReopenDialog}
        title="Reopen Ticket"
        description="Explain why this issue still needs attention so the support team has the right context."
        submitLabel="Submit Reopen Reason"
        placeholder="Describe why the issue is not fully resolved..."
        error={actionError}
        isSubmitting={isActionSubmitting}
        onClose={() => {
          if (!isActionSubmitting) {
            setShowReopenDialog(false);
            setActionError("");
          }
        }}
        onSubmit={submitReopen}
      />
    </>
  );
}

export default StudentTicketPanel;
