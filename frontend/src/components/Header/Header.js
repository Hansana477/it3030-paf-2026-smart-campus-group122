import React, { useEffect, useRef, useState } from "react";

function createInitialProfile(user) {
  return {
    id: user?.id ?? null,
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "",
    active: user?.active ?? true,
    approved: user?.approved ?? true,
    createdAt: user?.createdAt ?? null,
    lastLogin: user?.lastLogin ?? null,
  };
}

function getInitials(name) {
  if (!name) {
    return "U";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "U";
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatDate(value) {
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
  }).format(date);
}

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

function formatNotificationTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffInMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffInMinutes <= 1) {
    return "Just now";
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  return formatDateTime(value);
}

function formatNotificationType(type) {
  switch (type) {
    case "PASSWORD_CHANGED":
      return "Password Change";
    case "ACCOUNT_DETAILS_UPDATED":
      return "Account Details";
    case "TECHNICIAN_APPROVED":
      return "Approval";
    case "TECHNICIAN_PENDING":
      return "Admin Review";
    default:
      return "Update";
  }
}

const fieldClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const phonePattern = /^\d{10}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/;
const phoneHelpText = "Phone number must contain exactly 10 digits.";
const passwordHelpText =
  "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.";

function Header({ title, user, roleLabel, onLogout, onUserUpdated, onDeleteAccount }) {
  const [profileUser, setProfileUser] = useState(createInitialProfile(user));
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(createInitialProfile(user));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const notificationPanelRef = useRef(null);

  useEffect(() => {
    const nextProfile = createInitialProfile(user);
    setProfileUser(nextProfile);
    setProfileForm(nextProfile);
  }, [user]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!profileUser.id) {
      return undefined;
    }

    loadNotifications({ silent: true });
    const intervalId = window.setInterval(() => {
      loadNotifications({ silent: true });
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [profileUser.id]);

  const loadNotifications = async ({ silent = false } = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    if (!silent) {
      setIsLoadingNotifications(true);
    }
    setNotificationError("");

    try {
      const response = await fetch("http://localhost:8080/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => []);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to load notifications.";
        throw new Error(message);
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (loadError) {
      if (!silent) {
        setNotificationError(loadError.message || "Something went wrong.");
      }
    } finally {
      if (!silent) {
        setIsLoadingNotifications(false);
      }
    }
  };

  const openProfile = () => {
    setIsNotificationsOpen(false);
    setProfileForm(createInitialProfile(profileUser));
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setProfileError("");
    setProfileSuccess("");
    setPasswordError("");
    setPasswordSuccess("");
    setIsProfileOpen(true);
  };

  const toggleNotifications = async () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);
    if (nextOpen) {
      await loadNotifications();
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message || data?.error || "Failed to mark notification as read.";
        throw new Error(message);
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    } catch (markError) {
      setNotificationError(markError.message || "Something went wrong.");
    }
  };

  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/notifications/read-all", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = data?.message || data?.error || "Failed to mark all notifications as read.";
        throw new Error(message);
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (markError) {
      setNotificationError(markError.message || "Something went wrong.");
    }
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!profileUser.id) {
      setProfileError("User details are not available.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setProfileError("Missing login token.");
      return;
    }

    setIsSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const trimmedPhone = profileForm.phone.trim();
      if (trimmedPhone && !phonePattern.test(trimmedPhone)) {
        throw new Error(phoneHelpText);
      }

      const response = await fetch(`http://localhost:8080/users/${profileUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          email: profileUser.email,
          phone: trimmedPhone,
          role: profileUser.role,
          active: profileUser.active,
          approved: profileUser.approved,
          createdAt: profileUser.createdAt,
          lastLogin: profileUser.lastLogin,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to update profile.";
        throw new Error(message);
      }

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = {
        ...storedUser,
        ...data,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileUser(createInitialProfile(updatedUser));
      setProfileForm(createInitialProfile(updatedUser));
      setProfileSuccess("Profile updated successfully.");
      onUserUpdated?.(updatedUser);
      await loadNotifications({ silent: true });
    } catch (saveError) {
      setProfileError(saveError.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!profileUser.id) {
      setPasswordError("User details are not available.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (!passwordPattern.test(passwordForm.newPassword)) {
      setPasswordError(passwordHelpText);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setPasswordError("Missing login token.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await fetch(`http://localhost:8080/users/${profileUser.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to change password.";
        throw new Error(message);
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess(data?.message || "Password changed successfully.");
      await loadNotifications({ silent: true });
    } catch (changeError) {
      setPasswordError(changeError.message || "Something went wrong.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profileUser.id) {
      setProfileError("User details are not available.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setProfileError("Missing login token.");
      return;
    }

    setIsDeletingAccount(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch(`http://localhost:8080/users/${profileUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = data?.message || data?.error || "Failed to delete account.";
        throw new Error(message);
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsProfileOpen(false);
      if (onDeleteAccount) {
        onDeleteAccount(profileUser);
      } else {
        onLogout?.();
      }
    } catch (deleteError) {
      setProfileError(deleteError.message || "Something went wrong.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const profileSlug = (profileForm.fullName || profileUser.fullName || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <>
      <header className="relative z-30 flex flex-col gap-5 rounded-[30px] border border-white/70 bg-white/85 px-5 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">{roleLabel}</p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-[2.2rem]">{title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="hidden rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm text-slate-500 sm:block">
            Hi,
            {" "}
            <span className="font-semibold text-primary">{profileUser.fullName || "User"}</span>
          </div>
          <div className="relative" ref={notificationPanelRef}>
            <button
              type="button"
              className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-primary shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-accent"
              onClick={toggleNotifications}
              aria-label="Open notifications"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
              {unreadCount ? (
                <span className="absolute right-1.5 top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-primary">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {isNotificationsOpen ? (
              <div className="fixed right-4 top-24 z-[70] w-[min(92vw,24rem)] overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-[0_26px_70px_rgba(15,23,42,0.16)] backdrop-blur sm:right-6 lg:right-8">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Notifications</p>
                    <h3 className="mt-1 text-lg font-bold text-primary">Recent activity</h3>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:text-accent"
                    onClick={markAllNotificationsAsRead}
                    disabled={!unreadCount}
                  >
                    Mark all read
                  </button>
                </div>

                {notificationError ? (
                  <p className="mx-4 mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {notificationError}
                  </p>
                ) : null}

                <div className="max-h-[26rem] overflow-y-auto p-4">
                  {isLoadingNotifications ? (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Loading notifications...
                    </p>
                  ) : null}

                  {!isLoadingNotifications && !notifications.length ? (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No notifications yet.
                    </p>
                  ) : null}

                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          notification.read
                            ? "border-slate-200 bg-slate-50/70"
                            : "border-accent/30 bg-accent/5 shadow-[0_14px_28px_rgba(6,182,212,0.08)]"
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markNotificationAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {formatNotificationType(notification.type)}
                            </span>
                            <p className="text-sm font-bold text-primary">{notification.title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{notification.message}</p>
                          </div>
                          {!notification.read ? (
                            <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-secondary" />
                          ) : null}
                        </div>
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary via-accent to-secondary text-lg font-bold text-white shadow-[0_16px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5"
            onClick={openProfile}
            aria-label="Open profile"
          >
            <span>{getInitials(profileUser.fullName)}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {isProfileOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm" role="presentation">
          <section
            className="mx-auto flex w-full max-w-5xl flex-col rounded-[36px] border border-white/70 bg-white/95 shadow-[0_32px_90px_rgba(15,23,42,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
          >
            <div className="relative min-h-[160px] overflow-hidden rounded-t-[36px] bg-primary">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.32),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.22),transparent_28%)]" />
              <button
                type="button"
                className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg font-semibold text-white transition hover:bg-white/20"
                onClick={() => setIsProfileOpen(false)}
                aria-label="Close profile"
              >
                x
              </button>
            </div>

            <div className="max-h-[calc(100vh-48px)] overflow-y-auto px-6 pb-8 pt-6 sm:px-8 sm:pt-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="inline-flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary via-accent to-secondary text-4xl font-bold text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
                    {getInitials(profileUser.fullName)}
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Profile</p>
                    <h2 id="profile-title" className="mt-2 text-4xl font-extrabold text-primary">
                      {profileUser.fullName || "User profile"}
                    </h2>
                    <p className="mt-2 text-base text-slate-500">{profileUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary"
                >
                  {profileUser.role || "USER"}
                </button>
              </div>

              <div className="mt-8 grid gap-4 border-y border-slate-200 py-6 text-left sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <span className="text-sm text-slate-400">Joined</span>
                  <strong className="mt-2 block text-xl text-primary">{formatDate(profileUser.createdAt)}</strong>
                </div>
                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <span className="text-sm text-slate-400">Last login</span>
                  <strong className="mt-2 block text-xl text-primary">{formatDateTime(profileUser.lastLogin)}</strong>
                </div>
                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <span className="text-sm text-slate-400">Status</span>
                  <strong className="mt-2 block text-xl text-primary">{profileUser.active ? "Active" : "Inactive"}</strong>
                </div>
                <div className="rounded-2xl bg-slate-50/70 p-4">
                  <span className="text-sm text-slate-400">Approval</span>
                  <strong className="mt-2 block text-xl text-primary">{profileUser.approved ? "Approved" : "Pending"}</strong>
                </div>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <form className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]" onSubmit={handleSaveProfile}>
                  <div>
                    <h3 className="text-2xl font-bold text-primary">Public profile</h3>
                    <p className="mt-2 text-base text-slate-500">Update the details shown around your account.</p>
                  </div>

                  <label className="mt-6 grid gap-2">
                    <span className="text-sm font-semibold text-primary">Full name</span>
                    <input
                      type="text"
                      name="fullName"
                      value={profileForm.fullName}
                      onChange={handleProfileChange}
                      className={fieldClasses}
                      required
                    />
                  </label>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-primary">Email</span>
                      <input type="email" name="email" value={profileUser.email} readOnly className={fieldClasses} />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-primary">Profile slug</span>
                      <input type="text" value={profileSlug} readOnly className={fieldClasses} />
                    </label>
                  </div>

                  <label className="mt-5 grid gap-2">
                    <span className="text-sm font-semibold text-primary">Phone</span>
                    <input
                      type="text"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      placeholder="Add phone number"
                      inputMode="numeric"
                      maxLength="10"
                      pattern={phonePattern.source}
                      className={fieldClasses}
                    />
                    <p className="text-sm leading-6 text-slate-500">{phoneHelpText}</p>
                  </label>

                  {profileError ? (
                    <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {profileError}
                    </p>
                  ) : null}
                  {profileSuccess ? (
                    <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {profileSuccess}
                    </p>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete my account"}
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save profile"}
                    </button>
                  </div>
                </form>

                <form className="rounded-[30px] border border-slate-200 bg-slate-50/60 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]" onSubmit={handleChangePassword}>
                  <div>
                    <h3 className="text-2xl font-bold text-primary">Security</h3>
                    <p className="mt-2 text-base text-slate-500">Change your password to keep your account secure.</p>
                  </div>

                  <label className="mt-6 grid gap-2">
                    <span className="text-sm font-semibold text-primary">Current password</span>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className={fieldClasses}
                      required
                    />
                  </label>

                  <label className="mt-5 grid gap-2">
                    <span className="text-sm font-semibold text-primary">New password</span>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      minLength="6"
                      pattern={passwordPattern.source}
                      className={fieldClasses}
                      required
                    />
                    <p className="text-sm leading-6 text-slate-500">{passwordHelpText}</p>
                  </label>

                  <label className="mt-5 grid gap-2">
                    <span className="text-sm font-semibold text-primary">Confirm new password</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      minLength="6"
                      className={fieldClasses}
                      required
                    />
                  </label>

                  {passwordError ? (
                    <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {passwordError}
                    </p>
                  ) : null}
                  {passwordSuccess ? (
                    <p className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {passwordSuccess}
                    </p>
                  ) : null}

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? "Updating..." : "Change password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default Header;
