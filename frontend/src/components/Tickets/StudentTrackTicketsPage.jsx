import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import {
  addComment,
  deleteComment,
  getTickets,
  reopenTicket,
  updateComment,
} from "./TicketApi";

function StudentTrackTicketsPage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const [currentUser, setCurrentUser] = useState(user);
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleOwnAccountDeleted = () => {
    handleLogout();
  };

  const loadTickets = useCallback(async () => {
    try {
      setError("");
      const data = await getTickets();
      setTickets(Array.isArray(data) ? data : []);
      setSelectedTicketId((current) => {
        if (current && data?.some((ticket) => ticket.id === current)) {
          return current;
        }
        return data?.length ? data[0].id : "";
      });
    } catch (err) {
      setError(err.message || "Failed to load tickets.");
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        statusFilter === "ALL" ? true : ticket.status === statusFilter
      ),
    [tickets, statusFilter]
  );

  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;
    try {
      await addComment(selectedTicket.id, commentText);
      setCommentText("");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to add comment.");
    }
  };

  const handleEditComment = async (comment) => {
    const next = window.prompt("Edit comment", comment.commentText);
    if (!next || !next.trim()) return;
    try {
      await updateComment(selectedTicket.id, comment.id, next);
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to update comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(selectedTicket.id, commentId);
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to delete comment.");
    }
  };

  const handleReopen = async () => {
    if (!selectedTicket || !reopenReason.trim()) return;
    try {
      await reopenTicket(selectedTicket.id, reopenReason);
      setReopenReason("");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to reopen ticket.");
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header
          title="Track My Tickets"
          roleLabel="Student Portal"
          user={currentUser}
          onUserUpdated={setCurrentUser}
          onDeleteAccount={handleOwnAccountDeleted}
          onLogout={handleLogout}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/student-dashboard")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold text-primary"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/student-create-ticket")}
            className="rounded-2xl bg-accent px-4 py-2 font-semibold text-white"
          >
            Create Ticket
          </button>
        </div>

        {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">My tickets</p>
                <h2 className="mt-3 text-3xl font-extrabold text-primary">Track requests</h2>
              </div>

              <select
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED", "REOPENED"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid gap-3">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`rounded-2xl border px-4 py-4 text-left ${selectedTicketId === ticket.id ? "border-accent bg-accent/5" : "border-slate-200 bg-slate-50/70"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-primary">Ticket #{ticket.id.slice(-6)}</strong>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold">{ticket.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{ticket.category} • {ticket.priority}</p>
                  <p className="text-sm text-slate-500">{ticket.location}</p>
                  {ticket.overdue ? <p className="mt-2 text-sm font-semibold text-red-600">Overdue</p> : null}
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            {!selectedTicket ? (
              <p className="text-slate-500">Select a ticket to view details.</p>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Ticket details</p>
                <h2 className="mt-3 text-3xl font-extrabold text-primary">Request progress</h2>

                <p className="mt-4 text-slate-700"><strong>Description:</strong> {selectedTicket.description}</p>
                <p className="mt-2 text-slate-700"><strong>Assigned technician:</strong> {selectedTicket.assignedToUserName || "Not assigned"}</p>
                <p className="mt-2 text-slate-700"><strong>Due date:</strong> {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleString() : "N/A"}</p>
                <p className="mt-2 text-slate-700"><strong>Resolution notes:</strong> {selectedTicket.resolutionNotes || "Not available"}</p>
                <p className="mt-2 text-slate-700"><strong>Rejection reason:</strong> {selectedTicket.rejectionReason || "Not available"}</p>

                {!!selectedTicket.attachments?.length && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {selectedTicket.attachments.map((attachment) => (
                      <img
                        key={attachment.id}
                        src={attachment.fileUrl}
                        alt={attachment.originalFileName}
                        className="h-28 w-40 rounded-2xl border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-bold text-primary">Comments</h3>

                  <div className="mt-3 grid gap-3">
                    {(selectedTicket.comments || []).map((comment) => (
                      <div key={comment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-slate-700">{comment.commentText}</p>
                        <p className="mt-1 text-xs text-slate-500">By {comment.authorName}</p>
                        <div className="mt-2 flex gap-2">
                          <button className="rounded-xl bg-slate-200 px-3 py-1 text-sm" onClick={() => handleEditComment(comment)}>Edit</button>
                          <button className="rounded-xl bg-red-100 px-3 py-1 text-sm text-red-700" onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <textarea
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      rows={3}
                      placeholder="Add comment"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button className="rounded-2xl bg-primary px-4 py-3 font-semibold text-white" onClick={handleAddComment}>
                      Add comment
                    </button>
                  </div>

                  {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && (
                    <div className="mt-5 flex flex-col gap-3">
                      <textarea
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        rows={3}
                        placeholder="Reason for reopening"
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                      />
                      <button className="rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white" onClick={handleReopen}>
                        Reopen ticket
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}

export default StudentTrackTicketsPage;