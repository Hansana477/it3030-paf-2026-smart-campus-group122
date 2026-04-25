import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, PlusCircle, X } from "lucide-react";
import { createTicket, fetchResources } from "./ticketsApi";
import TicketImageUploader from "./TicketImageUploader";

const CATEGORY_OPTIONS = [
  "ELECTRICAL",
  "NETWORK",
  "PROJECTOR",
  "COMPUTER",
  "FURNITURE",
  "AIR_CONDITIONING",
  "PLUMBING",
  "CLEANING",
  "OTHER",
];

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function createInitialForm(user) {
  return {
    resourceId: "",
    category: "OTHER",
    description: "",
    priority: "MEDIUM",
    preferredContactName: user?.fullName || "",
    preferredContactEmail: user?.email || "",
    preferredContactPhone: user?.phone || "",
  };
}

function TicketFormModal({ open, onClose, currentUser, onTicketCreated }) {
  const [resources, setResources] = useState([]);
  const [formData, setFormData] = useState(() => createInitialForm(currentUser));
  const [images, setImages] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData(createInitialForm(currentUser));
    setImages([]);
    setError("");
    setIsLoadingResources(true);

    fetchResources()
      .then((data) => {
        setResources(Array.isArray(data) ? data : []);
      })
      .catch((loadError) => {
        setError(loadError.message || "Failed to load resources.");
      })
      .finally(() => {
        setIsLoadingResources(false);
      });
  }, [open, currentUser]);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === formData.resourceId) || null,
    [resources, formData.resourceId]
  );

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    if (selectedResource.type === "EQUIPMENT" && formData.category === "OTHER") {
      setFormData((current) => ({
        ...current,
        category: "PROJECTOR",
      }));
    }
  }, [selectedResource, formData.category]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.resourceId) {
      setError("Please select a resource.");
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      return;
    }

    if (!formData.preferredContactEmail.trim() && !formData.preferredContactPhone.trim()) {
      setError("Please provide at least one contact detail.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createTicket({
        ...formData,
        description: formData.description.trim(),
        preferredContactName: formData.preferredContactName.trim(),
        preferredContactEmail: formData.preferredContactEmail.trim(),
        preferredContactPhone: formData.preferredContactPhone.trim(),
      }, images);

      onTicketCreated(created);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/60 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">Maintenance Request</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">Create Incident Ticket</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-5 flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-primary">Resource</label>
              <select
                name="resourceId"
                value={formData.resourceId}
                onChange={handleChange}
                disabled={isLoadingResources}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              >
                <option value="">Select resource</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} — {resource.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">Resource Information</label>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {selectedResource ? (
                  <>
                    <p className="font-semibold text-primary">{selectedResource.name}</p>
                    <p className="mt-1">{selectedResource.location}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                      {selectedResource.type}
                    </p>
                  </>
                ) : (
                  <p>Select a resource to see details.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-primary">Issue Description</label>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue clearly. Example: Projector in Lab 301 shows a blue screen and does not detect HDMI input."
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-primary">Contact Name</label>
              <input
                name="preferredContactName"
                value={formData.preferredContactName}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">Contact Email</label>
              <input
                name="preferredContactEmail"
                value={formData.preferredContactEmail}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">Contact Phone</label>
              <input
                name="preferredContactPhone"
                value={formData.preferredContactPhone}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </div>
          </div>

          <TicketImageUploader
            value={images}
            onChange={setImages}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingResources}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TicketFormModal;
