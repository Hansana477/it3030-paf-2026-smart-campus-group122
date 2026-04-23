import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import { createTicket } from "./TicketApi";

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

function StudentCreateTicketPage() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const [currentUser, setCurrentUser] = useState(user);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    resourceName: "",
    location: "",
    category: "OTHER",
    description: "",
    priority: "MEDIUM",
    preferredContact: "",
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleOwnAccountDeleted = () => {
    handleLogout();
  };

  const handleSubmit = async (event) => {
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
        resourceName: "",
        location: "",
        category: "OTHER",
        description: "",
        priority: "MEDIUM",
        preferredContact: "",
      });
      setImages([]);
    } catch (err) {
      setError(err.message || "Failed to create ticket.");
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Header
          title="Create Maintenance Ticket"
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
            onClick={() => navigate("/student-track-tickets")}
            className="rounded-2xl bg-primary px-4 py-2 font-semibold text-white"
          >
            Track My Tickets
          </button>
        </div>

        <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Module C</p>
          <h2 className="mt-4 text-3xl font-extrabold text-primary">Create maintenance ticket</h2>
          <p className="mt-3 text-slate-500">
            Report an issue for a campus resource or location with priority, description, preferred contact, and image evidence.
          </p>

          {error ? <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
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

            <input
              className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
              placeholder="Preferred contact"
              value={form.preferredContact}
              onChange={(e) => setForm({ ...form, preferredContact: e.target.value })}
              required
            />

            <textarea
              className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
              rows={5}
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
              Submit Ticket
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}

export default StudentCreateTicketPage;