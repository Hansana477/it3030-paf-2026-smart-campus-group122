const API_BASE_URL = "http://localhost:8082";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(isJson = true) {
  return {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  };
}

async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || data?.["error Message"] || fallbackMessage
    );
  }
  return data;
}

export async function getTickets() {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    headers: authHeaders(false),
  });
  return parseResponse(response, "Failed to load tickets.");
}

export async function createTicket(ticket, images = []) {
  const formData = new FormData();
  formData.append(
    "ticket",
    new Blob([JSON.stringify(ticket)], { type: "application/json" })
  );

  images.forEach((image) => formData.append("images", image));

  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: formData,
  });

  return parseResponse(response, "Failed to create ticket.");
}

export async function assignTicket(ticketId, technicianId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ technicianId }),
  });
  return parseResponse(response, "Failed to assign ticket.");
}

export async function updateTicketStatus(ticketId, payload) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(response, "Failed to update ticket status.");
}

export async function reopenTicket(ticketId, reopenReason) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/reopen`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ reopenReason }),
  });
  return parseResponse(response, "Failed to reopen ticket.");
}

export async function addComment(ticketId, commentText) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ commentText }),
  });
  return parseResponse(response, "Failed to add comment.");
}

export async function updateComment(ticketId, commentId, commentText) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ commentText }),
  });
  return parseResponse(response, "Failed to update comment.");
}

export async function deleteComment(ticketId, commentId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(false),
  });
  return parseResponse(response, "Failed to delete comment.");
}