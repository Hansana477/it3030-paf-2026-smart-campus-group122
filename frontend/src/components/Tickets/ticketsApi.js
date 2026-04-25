const API_BASE_URL = "http://localhost:8082";

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders(isJson = true) {
  const token = getToken();
  return {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      data?.["error Message"] ||
      fallbackMessage ||
      "Request failed."
    );
  }

  return data;
}

export async function fetchTickets(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.append(key, value);
    }
  });

  const queryString = params.toString();
  const url = `${API_BASE_URL}/tickets${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  return parseResponse(response, "Failed to load tickets.");
}

export async function fetchTicketById(ticketId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
    headers: getAuthHeaders(),
  });

  return parseResponse(response, "Failed to load ticket details.");
}

export async function createTicket(payload, images = []) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  images.forEach((image) => formData.append("images", image));

  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: formData,
  });

  return parseResponse(response, "Failed to create ticket.");
}

export async function assignTicket(ticketId, technicianId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ technicianId }),
  });

  return parseResponse(response, "Failed to assign ticket.");
}

export async function updateTicketStatus(ticketId, payload) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response, "Failed to update ticket status.");
}

export async function confirmTicketResolution(ticketId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/confirm-resolution`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return parseResponse(response, "Failed to confirm resolution.");
}

export async function reopenTicket(ticketId, reason) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/reopen`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  return parseResponse(response, "Failed to reopen ticket.");
}

export async function addComment(ticketId, message) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });

  return parseResponse(response, "Failed to add comment.");
}

export async function updateComment(ticketId, commentId, message) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });

  return parseResponse(response, "Failed to update comment.");
}

export async function deleteComment(ticketId, commentId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments/${commentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return parseResponse(response, "Failed to delete comment.");
}

export async function fetchResources() {
  const response = await fetch(`${API_BASE_URL}/resources?status=ACTIVE`, {
    headers: getAuthHeaders(),
  });

  return parseResponse(response, "Failed to load resources.");
}

export async function fetchApprovedTechnicians() {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response, "Failed to load users.");
  return Array.isArray(data)
    ? data.filter((user) => user.role === "TECHNICIAN" && user.approved && user.active)
    : [];
}
