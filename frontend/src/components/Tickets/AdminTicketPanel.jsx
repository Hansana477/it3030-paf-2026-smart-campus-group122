import React, { useCallback, useEffect, useMemo, useState } from "react";
import { assignTicket, getTickets, updateTicketStatus } from "./TicketApi";

export default function AdminTicketPanel({ technicians = [] }) {
    const [tickets, setTickets] = useState([]);
    const [selectedTicketId, setSelectedTicketId] = useState("");
    const [technicianId, setTechnicianId] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [error, setError] = useState("");

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

    const handleAssign = async () => {
        if (!selectedTicket || !technicianId) return;
        try {
        setError("");
        await assignTicket(selectedTicket.id, technicianId);
        setTechnicianId("");
        await loadTickets();
        } catch (err) {
        setError(err.message || "Failed to assign ticket.");
        }
    };

    const handleReject = async () => {
        if (!selectedTicket || !rejectionReason.trim()) return;
        try {
        setError("");
        await updateTicketStatus(selectedTicket.id, {
            status: "REJECTED",
            rejectionReason,
        });
        setRejectionReason("");
        await loadTickets();
        } catch (err) {
        setError(err.message || "Failed to reject ticket.");
        }
    };

    return (
        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Maintenance requests</p>
            <h2 className="mt-4 text-3xl font-extrabold text-primary">All tickets</h2>

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
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Admin tools</p>
                <h2 className="mt-4 text-3xl font-extrabold text-primary">Assign or reject</h2>

                <p className="mt-4 text-slate-700"><strong>Reported by:</strong> {selectedTicket.createdByUserName}</p>
                <p className="mt-2 text-slate-700"><strong>Description:</strong> {selectedTicket.description}</p>
                <p className="mt-2 text-slate-700"><strong>Current technician:</strong> {selectedTicket.assignedToUserName || "Not assigned"}</p>

                <div className="mt-6 grid gap-3">
                <select
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                >
                    <option value="">Select technician</option>
                    {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                        {tech.fullName}
                    </option>
                    ))}
                </select>

                <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" onClick={handleAssign}>
                    Assign technician
                </button>

                <textarea
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                    rows={4}
                    placeholder="Rejection reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                />

                <button className="rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white" onClick={handleReject}>
                    Reject ticket
                </button>
                </div>
            </>
            )}
        </article>
        </section>
    );
}