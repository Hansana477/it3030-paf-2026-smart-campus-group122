import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";
import AdminTicketPanel from "../Tickets/AdminTicketPanel";

const adminInputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const phonePattern = /^\d{9}$/;
const phoneHelpText = "Phone number must contain 9 digits after +94.";

function formatPhoneForInput(phone) {
  if (!phone) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  if (digits.length === 11 && digits.startsWith("94")) {
    return digits.slice(2);
  }

  return digits.slice(0, 9);
}

function normalizePhoneInput(value) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("94")) {
    return digits.slice(2, 11);
  }

  if (digits.startsWith("0")) {
    return digits.slice(1, 10);
  }

  return digits.slice(0, 9);
}

function toStoredPhone(phone) {
  if (!phone) {
    return "";
  }

  return `0${phone}`;
}

const roleFilterOptions = [
  { value: "ALL", label: "All users" },
  { value: "STUDENT", label: "Students" },
  { value: "TECHNICIAN", label: "Technicians" },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(user);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeApprovalId, setActiveApprovalId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleOwnAccountDeleted = () => {
    handleLogout();
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) {
        setError("Missing login token.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [usersResponse, pendingResponse] = await Promise.all([
          fetch("http://localhost:8082/users", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:8082/users/pending-technicians", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const usersData = await usersResponse.json().catch(() => []);
        const pendingData = await pendingResponse.json().catch(() => []);

        if (!usersResponse.ok) {
          const message = usersData?.message || usersData?.error || "Failed to load users.";
          throw new Error(message);
        }

        if (!pendingResponse.ok) {
          const message = pendingData?.message || pendingData?.error || "Failed to load pending technicians.";
          throw new Error(message);
        }

        setAllUsers(Array.isArray(usersData) ? usersData : []);
        setPendingTechnicians(Array.isArray(pendingData) ? pendingData : []);
      } catch (loadError) {
        setError(loadError.message || "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [token]);

  const approveTechnician = async (userId) => {
    if (!token) {
      setError("Missing login token.");
      return;
    }

    setActiveApprovalId(userId);
    setError("");

    try {
      const response = await fetch(`http://localhost:8082/users/${userId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to approve technician.";
        throw new Error(message);
      }

      setPendingTechnicians((current) => current.filter((technician) => technician.id !== userId));
      setAllUsers((current) =>
        current.map((existingUser) =>
          existingUser.id === userId
            ? {
                ...existingUser,
                ...data,
              }
            : existingUser
        )
      );
    } catch (approveError) {
      setError(approveError.message || "Something went wrong.");
    } finally {
      setActiveApprovalId(null);
    }
  };

  const openEditModal = (listedUser) => {
    setEditingUser(listedUser);
    setEditForm({
      fullName: listedUser.fullName ?? "",
      email: listedUser.email ?? "",
      phone: formatPhoneForInput(listedUser.phone ?? ""),
      role: listedUser.role ?? "STUDENT",
      active: Boolean(listedUser.active),
      approved: Boolean(listedUser.approved),
    });
    setEditError("");
    setEditSuccess("");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm(null);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((current) => {
      const nextForm = {
        ...current,
        [name]: type === "checkbox"
          ? checked
          : name === "phone"
            ? normalizePhoneInput(value)
            : value,
      };

      if (name === "role" && value !== "TECHNICIAN") {
        nextForm.approved = true;
      }

      return nextForm;
    });
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();

    if (!editingUser || !editForm || !token) {
      setEditError("User details are not available.");
      return;
    }

    setIsSavingUser(true);
    setEditError("");
    setEditSuccess("");

    try {
      const trimmedPhone = editForm.phone.trim();
      if (trimmedPhone && !phonePattern.test(trimmedPhone)) {
        throw new Error(phoneHelpText);
      }

      const response = await fetch(`http://localhost:8082/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim(),
          phone: toStoredPhone(trimmedPhone),
          role: editForm.role,
          active: editForm.active,
          approved: editForm.role === "TECHNICIAN" ? editForm.approved : true,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to update user.";
        throw new Error(message);
      }

      setAllUsers((current) =>
        current.map((existingUser) =>
          existingUser.id === data.id
            ? {
                ...existingUser,
                ...data,
              }
            : existingUser
        )
      );
      setPendingTechnicians((current) => {
        const nextPending = current.filter((technician) => technician.id !== data.id);
        if (data.role === "TECHNICIAN" && !data.approved) {
          nextPending.push(data);
        }
        return nextPending;
      });
      if (currentUser?.id === data.id) {
        setCurrentUser((current) => ({
          ...current,
          ...data,
        }));
        localStorage.setItem("user", JSON.stringify({
          ...JSON.parse(localStorage.getItem("user") || "{}"),
          ...data,
        }));
      }
      setEditSuccess("User updated successfully.");
    } catch (saveError) {
      setEditError(saveError.message || "Something went wrong.");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (listedUser) => {
    if (!token) {
      setError("Missing login token.");
      return;
    }

    const confirmed = window.confirm(`Delete ${listedUser.fullName}'s account? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingUserId(listedUser.id);
    setError("");

    try {
      const response = await fetch(`http://localhost:8082/users/${listedUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to delete user.";
        throw new Error(message);
      }

      setAllUsers((current) => current.filter((existingUser) => existingUser.id !== listedUser.id));
      setPendingTechnicians((current) => current.filter((technician) => technician.id !== listedUser.id));

      if (editingUser?.id === listedUser.id) {
        closeEditModal();
      }

      if (currentUser?.id === listedUser.id) {
        handleLogout();
      }
    } catch (deleteError) {
      setError(deleteError.message || "Something went wrong.");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDownloadReport = () => {
    const reportRows = filteredUsers.map((listedUser) => ({
      Name: listedUser.fullName ?? "",
      Email: listedUser.email ?? "",
      Role: listedUser.role ?? "",
      Phone: listedUser.phone ?? "",
      Status: listedUser.active ? "Active" : "Inactive",
      Approval: listedUser.approved ? "Approved" : "Pending",
      "Created At": listedUser.createdAt ?? "",
      "Last Login": listedUser.lastLogin ?? "",
    }));

    if (!reportRows.length) {
      setError("There are no users in the selected filter to download.");
      return;
    }

    const headers = Object.keys(reportRows[0]);
    const csvContent = [
      headers.join(","),
      ...reportRows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replace(/"/g, "\"\"")}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const reportLabel = selectedRoleFilter === "ALL"
      ? "all-users"
      : `${selectedRoleFilter.toLowerCase()}-report`;

    link.href = downloadUrl;
    link.setAttribute("download", `${reportLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const totalUsers = allUsers.length;
  const studentCount = allUsers.filter((existingUser) => existingUser.role === "STUDENT").length;
  const technicianCount = allUsers.filter((existingUser) => existingUser.role === "TECHNICIAN").length;
  const adminCount = allUsers.filter((existingUser) => existingUser.role === "ADMIN").length;
  const activeUserCount = allUsers.filter((existingUser) => existingUser.active).length;
  const filteredUsers = allUsers.filter((existingUser) =>
    selectedRoleFilter === "ALL" ? true : existingUser.role === selectedRoleFilter
  );
  const selectedFilterLabel = roleFilterOptions.find((option) => option.value === selectedRoleFilter)?.label ?? "All users";

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header
          title="Admin Dashboard"
          roleLabel="Admin Portal"
          user={currentUser}
          onUserUpdated={setCurrentUser}
          onDeleteAccount={handleOwnAccountDeleted}
          onLogout={handleLogout}
        />

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Approval Center</p>
            <h2 className="mt-4 text-3xl font-extrabold text-primary">Technician Approval Queue</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              Review new technician registrations and approve only the users who should access the maintenance workspace.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Pending</p>
                <p className="mt-2 text-3xl font-extrabold text-primary">{pendingTechnicians.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Access rule</p>
                <p className="mt-2 text-lg font-bold text-primary">Admin approval required</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-400">Review goal</p>
                <p className="mt-2 text-lg font-bold text-primary">Fast and safe onboarding</p>
              </div>
            </div>

            {error ? (
              <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            {isLoading ? (
              <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Loading pending technicians...
              </p>
            ) : null}

            {!isLoading && !pendingTechnicians.length ? (
              <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                No pending technicians right now.
              </p>
            ) : null}

            <div className="mt-6 grid gap-4">
              {pendingTechnicians.map((technician) => (
                <article
                  key={technician.id}
                  className="flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-primary">{technician.fullName}</h3>
                    <p className="text-sm text-slate-500">{technician.email}</p>
                    <p className="text-sm text-slate-500">{technician.phone || "No phone provided"}</p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl bg-secondary px-5 py-3.5 text-sm font-semibold text-primary transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
                    onClick={() => approveTechnician(technician.id)}
                    disabled={activeApprovalId === technician.id}
                  >
                    {activeApprovalId === technician.id ? "Approving..." : "Approve"}
                  </button>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-primary/10 bg-primary p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">User Counts</p>
            <h3 className="mt-4 text-3xl font-extrabold">System overview at a glance</h3>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Total users</p>
                <p className="mt-3 text-4xl font-extrabold text-white">{totalUsers}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Students</p>
                  <p className="mt-3 text-3xl font-bold text-white">{studentCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Technicians</p>
                  <p className="mt-3 text-3xl font-bold text-white">{technicianCount}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Admins</p>
                  <p className="mt-3 text-3xl font-bold text-white">{adminCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Active users</p>
                  <p className="mt-3 text-3xl font-bold text-white">{activeUserCount}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Pending technicians</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {pendingTechnicians.length} technician account(s) are still waiting for admin approval.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin-resource-management")}
                className="inline-flex items-center justify-center rounded-2xl bg-secondary px-5 py-3.5 text-sm font-semibold text-primary transition hover:bg-emerald-300"
              >
                Manage Catalogue
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin-booking-management")}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Review Booking Requests
              </button>
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">User Directory</p>
              <h2 className="mt-3 text-3xl font-extrabold text-primary">All registered users</h2>
              <p className="mt-2 text-base leading-7 text-slate-500">
                Filter students and technicians quickly, then download the relevant report as a CSV file.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm text-slate-500">
                Showing:
                {" "}
                <span className="font-semibold text-primary">{filteredUsers.length}</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={handleDownloadReport}
              >
                Download {selectedFilterLabel} report
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {roleFilterOptions.map((option) => {
              const isActive = option.value === selectedRoleFilter;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-primary text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                      : "border border-slate-200 bg-white text-primary hover:border-accent"
                  }`}
                  onClick={() => setSelectedRoleFilter(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 overflow-x-auto rounded-[24px] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 bg-white">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-sm font-semibold text-slate-500">
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Approval</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredUsers.map((listedUser) => (
                  <tr key={listedUser.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-primary">{listedUser.fullName}</div>
                    </td>
                    <td className="px-4 py-4">{listedUser.email}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                        {listedUser.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">{listedUser.phone || "Not provided"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                          listedUser.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {listedUser.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                          listedUser.approved
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {listedUser.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary transition hover:border-accent"
                          onClick={() => openEditModal(listedUser)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
                          onClick={() => handleDeleteUser(listedUser)}
                          disabled={deletingUserId === listedUser.id}
                        >
                          {deletingUserId === listedUser.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && !filteredUsers.length ? (
            <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No users found for the selected filter.
            </p>
          ) : null}
        </section>

        {editingUser && editForm ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm" role="presentation">
            <section
              className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-user-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">User Management</p>
                  <h2 id="edit-user-title" className="mt-3 text-3xl font-extrabold text-primary">
                    Edit user
                  </h2>
                  <p className="mt-2 text-base leading-7 text-slate-500">
                    Update user details, role, access status, and approval state.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-primary transition hover:border-slate-300"
                  onClick={closeEditModal}
                  aria-label="Close edit user dialog"
                >
                  x
                </button>
              </div>

              <form className="mt-6 grid gap-5" onSubmit={handleSaveUser}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-primary">Full name</span>
                    <input
                      type="text"
                      name="fullName"
                      value={editForm.fullName}
                      onChange={handleEditFormChange}
                      className={adminInputClasses}
                      required
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-primary">Email</span>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditFormChange}
                      className={adminInputClasses}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-primary">Phone</span>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                      <span className="inline-flex items-center border-r border-slate-200 px-4 py-3 text-base font-semibold text-slate-500">
                        +94
                      </span>
                      <input
                        type="text"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditFormChange}
                        inputMode="numeric"
                        maxLength="9"
                        pattern={phonePattern.source}
                        placeholder="7XXXXXXXX"
                        className="w-full bg-transparent px-4 py-3 text-base text-primary outline-none"
                      />
                    </div>
                    <p className="text-sm leading-6 text-slate-500">{phoneHelpText}</p>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-primary">Role</span>
                    <select
                      name="role"
                      value={editForm.role}
                      onChange={handleEditFormChange}
                      className={adminInputClasses}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TECHNICIAN">Technician</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <input
                      type="checkbox"
                      name="active"
                      checked={editForm.active}
                      onChange={handleEditFormChange}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                    />
                    <span className="text-sm font-semibold text-primary">Active account</span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <input
                      type="checkbox"
                      name="approved"
                      checked={editForm.role === "TECHNICIAN" ? editForm.approved : true}
                      onChange={handleEditFormChange}
                      disabled={editForm.role !== "TECHNICIAN"}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent disabled:opacity-50"
                    />
                    <span className="text-sm font-semibold text-primary">
                      {editForm.role === "TECHNICIAN" ? "Technician approved" : "Approval not required"}
                    </span>
                  </label>
                </div>

                {editError ? (
                  <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {editError}
                  </p>
                ) : null}
                {editSuccess ? (
                  <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {editSuccess}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
                    onClick={() => handleDeleteUser(editingUser)}
                    disabled={deletingUserId === editingUser.id}
                  >
                    {deletingUserId === editingUser.id ? "Deleting..." : "Delete user"}
                  </button>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-primary transition hover:border-slate-300"
                      onClick={closeEditModal}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                      disabled={isSavingUser}
                    >
                      {isSavingUser ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        ) : null}

        <AdminTicketPanel
          technicians={allUsers.filter((user) => user.role === "TECHNICIAN" && user.approved)}
        />

      </section>
    </main>
  );
}

export default AdminDashboard;
