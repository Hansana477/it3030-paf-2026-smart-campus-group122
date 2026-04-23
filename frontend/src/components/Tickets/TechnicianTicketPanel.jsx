import React, { useEffect, useMemo, useState } from "react";
import { addComment, deleteComment, getTickets, updateComment, updateTicketStatus } from "./TicketApi";

export default function TechnicianTicketPanel() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [error, setError] = useState("");

  const loadTickets = async () => {
    try {
      setError("");
      const data = await getTickets();
      setTickets(Array.isArray(data) ? data : []);
      if (!selectedTicketId && data?.length) {
        setSelectedTicketId(data[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load tickets.");
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const handleStatusSave = async () => {
    if (!selectedTicket) return;
    try {
      setError("");
      await updateTicketStatus(selectedTicket.id, { status, resolutionNotes });
      setResolutionNotes("");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to update status.");
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;
    try {
      setError("");
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

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Assigned tickets</p>
        <h2 className="mt-4 text-3xl font-extrabold text-primary">Technician work queue</h2>

        {error ? <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-5 grid gap-3">
          {tickets.map((ticket) => (
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
            </button>
          ))}
        </div>
      </article>

      <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        {!selectedTicket ? (
          <p className="text-slate-500">Select a ticket to continue.</p>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Ticket details</p>
            <h2 className="mt-4 text-3xl font-extrabold text-primary">Issue workflow</h2>

            <p className="mt-4 text-slate-700"><strong>Description:</strong> {selectedTicket.description}</p>
            <p className="mt-2 text-slate-700"><strong>Reported by:</strong> {selectedTicket.createdByUserName}</p>
            <p className="mt-2 text-slate-700"><strong>Preferred contact:</strong> {selectedTicket.preferredContact}</p>

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

            <div className="mt-6 grid gap-3">
              <select
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {["IN_PROGRESS", "RESOLVED", "CLOSED"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <textarea
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                rows={4}
                placeholder="Resolution notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />

              <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" onClick={handleStatusSave}>
                Update status
              </button>
            </div>

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
                  placeholder="Write a comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button className="rounded-2xl bg-primary px-4 py-3 font-semibold text-white" onClick={handleAddComment}>
                  Add comment
                </button>
              </div>
            </div>
          </>
        )}
      </article>
    </section>
  );
}