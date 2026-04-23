import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  addComment,
  createTicket,
  deleteComment,
  getTickets,
  reopenTicket,
  updateComment,
} from "./TicketApi";

const categories = [
  "ELECTRICAL",
  "NETWORK",
  "PROJECTOR",
  "AIR_CONDITIONING",
  "PLUMBING",
  "FURNITURE",
  "CLEANING",
  "OTHER",
];

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function StudentTicketPanel() {
    const [tickets, setTickets] = useState([]);
    const [selectedTicketId, setSelectedTicketId] = useState("");
    const [commentText, setCommentText] = useState("");
    const [reopenReason, setReopenReason] = useState("");
    const [images, setImages] = useState([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        resourceId: "",
        resourceName: "",
        location: "",
        category: "OTHER",
        description: "",
        priority: "MEDIUM",
        preferredContact: "",
    });

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

    const handleCreate = async (event) => {
        event.preventDefault();
        try {
        setError("");
        setSuccess("");
        if (images.length > 3) {
            throw new Error("You can upload up to 3 images only.");
        }
        await createTicket(form, images);
        setSuccess("Ticket created successfully.");
        setForm({
            resourceId: "",
            resourceName: "",
            location: "",
            category: "OTHER",
            description: "",
            priority: "MEDIUM",
            preferredContact: "",
        });
        setImages([]);
        await loadTickets();
        } catch (err) {
        setError(err.message || "Failed to create ticket.");
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
        setError("");
        await updateComment(selectedTicket.id, comment.id, next);
        await loadTickets();
        } catch (err) {
        setError(err.message || "Failed to update comment.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
        setError("");
        await deleteComment(selectedTicket.id, commentId);
        await loadTickets();
        } catch (err) {
        setError(err.message || "Failed to delete comment.");
        }
    };

    const handleReopen = async () => {
        if (!selectedTicket || !reopenReason.trim()) return;
        try {
        setError("");
        await reopenTicket(selectedTicket.id, reopenReason);
        setReopenReason("");
        await loadTickets();
        } catch (err) {
        setError(err.message || "Failed to reopen ticket.");
        }
    };

    return (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Module C</p>
            <h2 className="mt-4 text-3xl font-extrabold text-primary">Create maintenance ticket</h2>

            {error ? <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
            <input
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                placeholder="Resource ID (optional)"
                value={form.resourceId}
                onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
            />
            <input
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                placeholder="Resource name"
                value={form.resourceName}
                onChange={(e) => setForm({ ...form, resourceName: e.target.value })}
            />
            <input
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
            />
            <input
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                placeholder="Preferred contact"
                value={form.preferredContact}
                onChange={(e) => setForm({ ...form, preferredContact: e.target.value })}
                required
            />
            <select
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
                {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
                ))}
            </select>
            <select
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
                {priorities.map((item) => (
                <option key={item} value={item}>{item}</option>
                ))}
            </select>

            <textarea
                className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                rows={4}
                placeholder="Describe the issue"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
            />

            <input
                className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 3))}
            />

            <button
                type="submit"
                className="sm:col-span-2 rounded-2xl bg-accent px-5 py-3 font-semibold text-white"
            >
                Submit ticket
            </button>
            </form>
        </article>

        <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
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

            {selectedTicket ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-xl font-bold text-primary">Selected ticket</h3>
                <p className="mt-3 text-slate-700"><strong>Description:</strong> {selectedTicket.description}</p>
                <p className="mt-2 text-slate-700"><strong>Assigned technician:</strong> {selectedTicket.assignedToUserName || "Not assigned"}</p>
                <p className="mt-2 text-slate-700"><strong>Due date:</strong> {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleString() : "N/A"}</p>
                <p className="mt-2 text-slate-700"><strong>Resolution notes:</strong> {selectedTicket.resolutionNotes || "Not available"}</p>
                <p className="mt-2 text-slate-700"><strong>Rejection reason:</strong> {selectedTicket.rejectionReason || "Not available"}</p>
                <p className="mt-2 text-slate-700"><strong>Reopen reason:</strong> {selectedTicket.reopenReason || "Not available"}</p>

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
                <h4 className="text-lg font-bold text-primary">Comments</h4>
                <div className="mt-3 grid gap-3">
                    {(selectedTicket.comments || []).map((comment) => (
                    <div key={comment.id} className="rounded-2xl bg-white px-4 py-3">
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
            </div>
            ) : null}
        </article>
        </section>
    );
}