import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Header/Header";

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
          fetch("http://localhost:8080/users", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:8080/users/pending-technicians", {
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
      const response = await fetch(`http://localhost:8080/users/${userId}/approve`, {
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

  const totalUsers = allUsers.length;
  const studentCount = allUsers.filter((existingUser) => existingUser.role === "STUDENT").length;
  const technicianCount = allUsers.filter((existingUser) => existingUser.role === "TECHNICIAN").length;
  const adminCount = allUsers.filter((existingUser) => existingUser.role === "ADMIN").length;
  const activeUserCount = allUsers.filter((existingUser) => existingUser.active).length;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header
          title="Admin Dashboard"
          roleLabel="Admin Portal"
          user={currentUser}
          onUserUpdated={setCurrentUser}
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
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">User Directory</p>
              <h2 className="mt-3 text-3xl font-extrabold text-primary">All registered users</h2>
              <p className="mt-2 text-base leading-7 text-slate-500">
                View the full system user list with role, status, approval state, and contact details.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm text-slate-500">
              Total records:
              {" "}
              <span className="font-semibold text-primary">{totalUsers}</span>
            </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {allUsers.map((listedUser) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && !allUsers.length ? (
            <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No users found in the system yet.
            </p>
          ) : null}
        </section>
      </section>
    </main>
  );
}

export default AdminDashboard;
