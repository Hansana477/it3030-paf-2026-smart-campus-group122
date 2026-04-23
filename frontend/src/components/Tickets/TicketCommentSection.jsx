import React, { useMemo, useState } from "react";
import { MessageSquare, Pencil, Send, Trash2, X } from "lucide-react";
import { addComment, deleteComment, updateComment } from "./ticketsApi";

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

function TicketCommentSection({ ticket, currentUser, onTicketUpdated, allowComments = true }) {
  const [newComment, setNewComment] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const comments = useMemo(
    () => [...(ticket?.comments || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [ticket]
  );

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!newComment.trim()) {
      setError("Comment message is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const updatedTicket = await addComment(ticket.id, newComment.trim());
      onTicketUpdated(updatedTicket);
      setNewComment("");
    } catch (submitError) {
      setError(submitError.message || "Failed to add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (comment) => {
    setEditCommentId(comment.id);
    setEditMessage(comment.message || "");
    setError("");
  };

  const cancelEditing = () => {
    setEditCommentId(null);
    setEditMessage("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editMessage.trim()) {
      setError("Comment message is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const updatedTicket = await updateComment(ticket.id, commentId, editMessage.trim());
      onTicketUpdated(updatedTicket);
      cancelEditing();
    } catch (submitError) {
      setError(submitError.message || "Failed to update comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = window.confirm("Are you sure you want to delete this comment?");
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await deleteComment(ticket.id, commentId);
      const filteredComments = (ticket.comments || []).filter((comment) => comment.id !== commentId);
      onTicketUpdated({
        ...ticket,
        comments: filteredComments,
      });
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDeleteComment = (comment) =>
    currentUser?.role === "ADMIN" || currentUser?.id === comment.authorUserId;

  const canEditComment = (comment) => currentUser?.id === comment.authorUserId;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-extrabold text-primary">Comments</h3>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {allowComments ? (
        <form onSubmit={handleAddComment} className="mt-4">
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            rows={3}
            placeholder="Add a comment..."
            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 space-y-4">
        {!comments.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No comments yet.
          </div>
        ) : null}

        {comments.map((comment) => (
          <article key={comment.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary">{comment.authorName || "Unknown user"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                  {comment.authorRole || "USER"} • {formatDateTime(comment.createdAt)}
                  {comment.edited ? " • Edited" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canEditComment(comment) && editCommentId !== comment.id ? (
                  <button
                    type="button"
                    onClick={() => startEditing(comment)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                ) : null}

                {canDeleteComment(comment) ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>

            {editCommentId === comment.id ? (
              <div className="mt-3">
                <textarea
                  rows={3}
                  value={editMessage}
                  onChange={(event) => setEditMessage(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(comment.id)}
                    className="rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{comment.message}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default TicketCommentSection;