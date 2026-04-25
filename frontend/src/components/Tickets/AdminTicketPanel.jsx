import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketDetailsModal from "./TicketDetailsModal";
import TicketActionDialog from "./TicketActionDialog";
import {
  assignTicket,
  fetchApprovedTechnicians,
  fetchTicketById,
  fetchTickets,
  reopenTicket,
  updateTicketStatus,
} from "./ticketsApi";

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

function AdminTicketPanel({ technicians = [] }) {
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const [tickets, setTickets] = useState([]);
  const [approvedTechnicians, setApprovedTechnicians] = useState(technicians);
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [actionDialogType, setActionDialogType] = useState("");
  const [actionError, setActionError] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setPanelError("");

    try {
      const [ticketData, technicianData] = await Promise.all([
        fetchTickets({
          status: statusFilter === "ALL" ? "" : statusFilter,
          search: searchTerm,
        }),
        fetchApprovedTechnicians(),
      ]);

      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setApprovedTechnicians(Array.isArray(technicianData) ? technicianData : []);
    } catch (error) {
      setPanelError(error.message || "Failed to load admin ticket data.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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
        ticket.createdByUserName,
        ticket.assignedTechnicianName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [tickets, searchTerm]);

  const openDetails = async (ticketId) => {
    try {
      const fullTicket = await fetchTicketById(ticketId);
      setSelectedTicket(fullTicket);
      setSelectedTechnicianId(fullTicket.assignedTechnicianId || "");
      setShowDetails(true);
    } catch (error) {
      setPanelError(error.message || "Failed to load ticket details.");
    }
  };

  const handleTicketUpdated = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
    setSelectedTechnicianId(updatedTicket.assignedTechnicianId || "");
    setTickets((current) =>
      current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket))
    );
  };

  const handleAssign = async () => {
    if (!selectedTicket || !selectedTechnicianId) {
      return;
    }

    try {
      const updated = await assignTicket(selectedTicket.id, selectedTechnicianId);
      handleTicketUpdated(updated);
    } catch (error) {
      setPanelError(error.message || "Failed to assign ticket.");
    }
  };

  const handleReject = async () => {
    if (!selectedTicket) {
      return;
    }
    setActionError("");
    setActionDialogType("reject");
  };

  const handleClose = async () => {
    if (!selectedTicket) {
      return;
    }

    try {
      const updated = await updateTicketStatus(selectedTicket.id, {
        status: "CLOSED",
      });
      handleTicketUpdated(updated);
    } catch (error) {
      setPanelError(error.message || "Failed to close ticket.");
    }
  };

  const handleReopen = async () => {
    if (!selectedTicket) {
      return;
    }
    setActionError("");
    setActionDialogType("reopen");
  };

  const submitActionDialog = async (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setActionError(
        actionDialogType === "reject" ? "Rejection reason is required." : "Reopen reason is required."
      );
      return;
    }

    setIsActionSubmitting(true);
    setActionError("");

    try {
      const updated = actionDialogType === "reject"
        ? await updateTicketStatus(selectedTicket.id, {
            status: "REJECTED",
            rejectionReason: trimmedValue,
          })
        : await reopenTicket(selectedTicket.id, trimmedValue);

      handleTicketUpdated(updated);
      setActionDialogType("");
    } catch (error) {
      setActionError(
        error.message || (actionDialogType === "reject" ? "Failed to reject ticket." : "Failed to reopen ticket.")
      );
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const technicianWorkload = approvedTechnicians.map((technician) => ({
    id: technician.id,
    fullName: technician.fullName,
    count: tickets.filter(
      (ticket) =>
        ticket.assignedTechnicianId === technician.id &&
        ["OPEN", "IN_PROGRESS", "RESOLVED"].includes(ticket.status)
    ).length,
  }));

  const summary = {
    all: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "OPEN").length,
    resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    rejected: tickets.filter((ticket) => ticket.status === "REJECTED").length,
  };

  const handleDownloadTicketReport = () => {
    const reportRows = filteredTickets.map((ticket) => ({
      "Ticket Number": ticket.ticketNumber ?? "",
      Resource: ticket.resourceName ?? "",
      Location: ticket.location ?? "",
      Category: ticket.category ?? "",
      Priority: ticket.priority ?? "",
      Status: ticket.status ?? "",
      "Reported By": ticket.createdByUserName ?? "",
      "Reporter Email": ticket.createdByUserEmail ?? "",
      "Assigned Technician": ticket.assignedTechnicianName ?? "Not assigned",
      "Created At": ticket.createdAt ?? "",
      "Updated At": ticket.updatedAt ?? "",
      "Resolved At": ticket.resolvedAt ?? "",
      "Closed At": ticket.closedAt ?? "",
      "Reopened Count": ticket.reopenedCount ?? 0,
      Description: ticket.description ?? "",
      "Resolution Notes": ticket.resolutionNotes ?? "",
      "Rejection Reason": ticket.rejectionReason ?? "",
    }));

    if (!reportRows.length) {
      setPanelError("There are no tickets in the selected filter to download.");
      return;
    }

    const headers = Object.keys(reportRows[0]);

    const csvContent = [
      headers.join(","),
      ...reportRows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const reportLabel =
      statusFilter === "ALL"
        ? "all-ticket-report"
        : `${statusFilter.toLowerCase()}-ticket-report`;

    link.href = downloadUrl;
    link.setAttribute("download", `${reportLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <>
      <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">SERVICE DESK</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">Admin Ticket Control Center</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
            Monitor all maintenance incidents, assign technicians, reject invalid requests, close resolved work, and review comment activity.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm text-slate-400">All Tickets</p>
            <p className="mt-2 text-3xl font-extrabold text-primary">{summary.all}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-sky-50 p-5">
            <p className="text-sm text-sky-600">Open</p>
            <p className="mt-2 text-3xl font-extrabold text-sky-700">{summary.open}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-600">Resolved</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">{summary.resolved}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-rose-50 p-5">
            <p className="text-sm text-rose-600">Rejected</p>
            <p className="mt-2 text-3xl font-extrabold text-rose-700">{summary.rejected}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-extrabold text-primary">All Incident Tickets</h3>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTicketReport}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </button>

                <button
                  type="button"
                  onClick={loadAll}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>

            {panelError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {panelError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.7fr]">
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
                <option value="CLOSED">CLOSED</option>
                <option value="REJECTED">REJECTED</option>
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
                  No tickets found.
                </div>
              ) : null}

              {!loading &&
                filteredTickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            <Shield className="h-3.5 w-3.5" />
                            {ticket.ticketNumber}
                          </div>
                          <TicketStatusBadge value={ticket.status} />
                          <TicketStatusBadge value={ticket.priority} type="priority" />
                        </div>

                        <h4 className="mt-4 text-lg font-extrabold text-primary">{ticket.resourceName}</h4>
                        <p className="mt-1 text-sm text-slate-500">{ticket.location}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          Reported by <span className="font-semibold text-primary">{ticket.createdByUserName}</span>
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Assigned to <span className="font-semibold text-primary">{ticket.assignedTechnicianName || "No technician yet"}</span>
                        </p>
                        <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                          Updated {formatDateTime(ticket.updatedAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openDetails(ticket.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </div>

          <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-extrabold text-primary">Technician Workload</h3>
            </div>

            <div className="mt-5 space-y-3">
              {!technicianWorkload.length ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  No approved technicians found.
                </div>
              ) : null}

              {technicianWorkload.map((technician) => (
                <div key={technician.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-primary">{technician.fullName}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Active assignments</p>
                    </div>
                    <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                      {technician.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
              <h3 className="text-lg font-extrabold text-primary">Admin Actions</h3>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-bold text-primary">Assign Technician</label>
                <select
                  value={selectedTechnicianId}
                  onChange={(event) => setSelectedTechnicianId(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                >
                  <option value="">Select technician</option>
                  {approvedTechnicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.fullName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={!selectedTechnicianId}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserCheck className="h-4 w-4" />
                  Assign Ticket
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {selectedTicket.status === "RESOLVED" ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Close Ticket
                  </button>
                ) : null}

                {["OPEN", "IN_PROGRESS"].includes(selectedTicket.status) ? (
                  <button
                    type="button"
                    onClick={handleReject}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
                  >
                    Reject Ticket
                  </button>
                ) : null}

                {["CLOSED", "REJECTED", "RESOLVED"].includes(selectedTicket.status) ? (
                  <button
                    type="button"
                    onClick={handleReopen}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    Reopen Ticket
                  </button>
                ) : null}
              </div>
            </section>
          ) : null
        }
      />

      <TicketActionDialog
        open={Boolean(actionDialogType)}
        title={actionDialogType === "reject" ? "Reject Ticket" : "Reopen Ticket"}
        description={
          actionDialogType === "reject"
            ? "Explain clearly why this request is being rejected so the student understands the decision."
            : "Explain why this ticket should be reopened so the next assignee has the right context."
        }
        submitLabel={actionDialogType === "reject" ? "Submit Rejection" : "Submit Reopen Reason"}
        placeholder={
          actionDialogType === "reject"
            ? "Enter the rejection reason..."
            : "Describe why this ticket needs to be reopened..."
        }
        error={actionError}
        isSubmitting={isActionSubmitting}
        onClose={() => {
          if (!isActionSubmitting) {
            setActionDialogType("");
            setActionError("");
          }
        }}
        onSubmit={submitActionDialog}
      />
    </>
  );
}

export default AdminTicketPanel;
