import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Bell, LogOut } from "lucide-react";

const NOTIFICATION_API_BASE = "http://localhost:8082";

function getDashboardPath(user) {
  switch (user?.role) {
    case "ADMIN":
      return "/admin-dashboard";
    case "TECHNICIAN":
      return "/technician-dashboard";
    case "STUDENT":
      return "/student-dashboard";
    default:
      return "/login";
  }
}

function getResourcesPath() {
  return "/resources";
}

function readStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
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
  return phone ? `0${phone}` : "";
}

function createProfileForm(user) {
  return {
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: formatPhoneForInput(user?.phone ?? ""),
    role: user?.role ?? "",
    active: user?.active ?? true,
    approved: user?.approved ?? true,
    createdAt: user?.createdAt ?? null,
    lastLogin: user?.lastLogin ?? null,
  };
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

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function sortNotifications(notifications) {
  return [...notifications].sort((left, right) => {
    const leftTime = new Date(left?.createdAt ?? 0).getTime();
    const rightTime = new Date(right?.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });
}

const fieldClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const phonePattern = /^\d{9}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/;
const phoneHelpText = "Phone number must contain 9 digits after +94.";
const passwordHelpText =
  "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.";

function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const notificationPanelRef = useRef(null);
  const [user, setUser] = useState(() => readStoredUser());
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(() => createProfileForm(readStoredUser()));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const nextUser = readStoredUser();
    setUser(nextUser);
    setProfileForm(createProfileForm(nextUser));
  }, [location.pathname]);

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
    if (!user) {
      setNotifications([]);
      setIsNotificationsOpen(false);
      return;
    }

    loadNotifications({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
      const response = await fetch(`${NOTIFICATION_API_BASE}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to load notifications.");
      }

      setNotifications(Array.isArray(data) ? sortNotifications(data) : []);
    } catch (error) {
      if (!silent) {
        setNotificationError(error.message || "Something went wrong.");
      }
    } finally {
      if (!silent) {
        setIsLoadingNotifications(false);
      }
    }
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
      const response = await fetch(`${NOTIFICATION_API_BASE}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || data?.error || "Failed to mark notification as read.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      setNotificationError(error.message || "Something went wrong.");
    }
  };

  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${NOTIFICATION_API_BASE}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || data?.error || "Failed to mark notifications read.");
      }

      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch (error) {
      setNotificationError(error.message || "Something went wrong.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setNotifications([]);
    setIsNotificationsOpen(false);
    navigate("/login");
  };

  const openProfile = () => {
    setIsNotificationsOpen(false);
    setProfileForm(createProfileForm(user));
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

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: name === "phone" ? normalizePhoneInput(value) : value,
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

    if (!user?.id) {
      setProfileError("User details are not available.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setProfileError("Missing login token.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const trimmedPhone = profileForm.phone.trim();
      if (trimmedPhone && !phonePattern.test(trimmedPhone)) {
        throw new Error(phoneHelpText);
      }

      const response = await fetch(`${NOTIFICATION_API_BASE}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          email: user.email,
          phone: toStoredPhone(trimmedPhone),
          role: user.role,
          active: user.active,
          approved: user.approved,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to update profile.");
      }

      const updatedUser = {
        ...user,
        ...data,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileForm(createProfileForm(updatedUser));
      setProfileSuccess("Profile updated successfully.");
      await loadNotifications({ silent: true });
    } catch (error) {
      setProfileError(error.message || "Something went wrong.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!user?.id) {
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
      const response = await fetch(`${NOTIFICATION_API_BASE}/users/${user.id}/password`, {
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
        throw new Error(data?.message || data?.error || "Failed to change password.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess(data?.message || "Password changed successfully.");
      await loadNotifications({ silent: true });
    } catch (error) {
      setPasswordError(error.message || "Something went wrong.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
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
      const response = await fetch(`${NOTIFICATION_API_BASE}/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to delete account.");
      }

      setIsProfileOpen(false);
      handleLogout();
    } catch (error) {
      setProfileError(error.message || "Something went wrong.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const links = [
    { label: "Home", to: "/home" },
    { label: "About Us", to: "/about-us" },
    { label: "FAQ", to: "/faq" },
    { label: "Resources", to: getResourcesPath() },
  ];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 px-4 py-3 shadow-[0_12px_34px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-3 lg:grid-cols-[auto_1fr_auto]">
        <Link to="/home" className="inline-flex items-center gap-3 whitespace-nowrap text-lg font-extrabold text-primary">
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-primary">
            <img src="/favicon.ico" alt="" className="h-6 w-6" aria-hidden="true" />
          </span>
          UniNex
        </Link>

        <nav className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto lg:justify-center" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "border border-slate-200 bg-white text-primary hover:border-accent/50 hover:text-accent"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

          {user ? (
            <div className="flex flex-nowrap items-center gap-3 lg:justify-end">
              <div className="hidden rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm text-slate-500 sm:block">
                Hi, <span className="font-semibold text-primary">{user.fullName || "User"}</span>
              </div>

              <div className="relative" ref={notificationPanelRef}>
                <button
                  type="button"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-primary shadow-sm transition hover:border-accent hover:text-accent"
                  onClick={toggleNotifications}
                  aria-label="Open notifications"
                >
                  <Bell size={20} aria-hidden="true" />
                  {unreadCount ? (
                    <span className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-primary">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {isNotificationsOpen ? (
                  <div className="absolute right-0 top-14 z-[70] w-[min(92vw,24rem)] overflow-hidden rounded-[24px] border border-slate-200 bg-white/95 shadow-[0_26px_70px_rgba(15,23,42,0.16)] backdrop-blur">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Notifications</p>
                        <h3 className="mt-1 text-lg font-bold text-primary">Recent activity</h3>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-[0.14em] text-primary transition hover:text-accent disabled:opacity-40"
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

                    <div className="max-h-[24rem] overflow-y-auto p-4">
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
                        {notifications.slice(0, 8).map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                              notification.read
                                ? "border-slate-200 bg-slate-50/70"
                                : "border-accent/30 bg-accent/5 shadow-[0_14px_28px_rgba(6,182,212,0.08)] hover:border-accent/50"
                            }`}
                            onClick={() => {
                              if (!notification.read) {
                                markNotificationAsRead(notification.id);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-primary">{notification.title}</p>
                                <p className="mt-1 text-sm leading-6 text-slate-500">{notification.message}</p>
                              </div>
                              {!notification.read ? (
                                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-secondary" />
                              ) : null}
                            </div>
                            <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary via-accent to-secondary text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
                onClick={openProfile}
                aria-label="Open profile"
              >
                {getInitials(user.fullName)}
              </button>

              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={handleLogout}
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-nowrap items-center gap-2 lg:justify-end">
              <Link
                to="/login"
                className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-accent/50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Register
              </Link>
            </div>
          )}
      </div>
    </header>

      {isProfileOpen && user ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm" role="presentation">
          <section
            className="mx-auto flex w-full max-w-5xl flex-col rounded-[36px] border border-white/70 bg-white/95 shadow-[0_32px_90px_rgba(15,23,42,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-profile-title"
          >
            <div className="relative min-h-[140px] overflow-hidden rounded-t-[36px] bg-primary">
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

            <div className="max-h-[calc(100vh-48px)] overflow-y-auto px-6 pb-8 pt-6 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary via-accent to-secondary text-3xl font-bold text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
                    {getInitials(user.fullName)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Profile</p>
                    <h2 id="site-profile-title" className="mt-2 text-4xl font-extrabold text-primary">
                      {user.fullName || "User profile"}
                    </h2>
                    <p className="mt-2 text-base text-slate-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <span className="inline-flex self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary sm:self-auto">
                    {user.role || "USER"}
                  </span>
                  <Link
                    to={getDashboardPath(user)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Open dashboard
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <form className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]" onSubmit={handleSaveProfile}>
                  <h3 className="text-2xl font-bold text-primary">Public profile</h3>
                  <p className="mt-2 text-base text-slate-500">Update the details shown around your account.</p>

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

                  <label className="mt-5 grid gap-2">
                    <span className="text-sm font-semibold text-primary">Email</span>
                    <input type="email" value={user.email || ""} readOnly className={fieldClasses} />
                  </label>

                  <label className="mt-5 grid gap-2">
                    <span className="text-sm font-semibold text-primary">Phone</span>
                    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                      <span className="inline-flex items-center border-r border-slate-200 px-4 py-3.5 text-base font-semibold text-slate-500">
                        +94
                      </span>
                      <input
                        type="text"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        placeholder="7XXXXXXXX"
                        inputMode="numeric"
                        maxLength="9"
                        pattern={phonePattern.source}
                        className="w-full bg-transparent px-4 py-3.5 text-base text-primary outline-none"
                      />
                    </div>
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

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Saving..." : "Save profile"}
                    </button>
                  </div>
                </form>

                <form className="rounded-[30px] border border-slate-200 bg-slate-50/60 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]" onSubmit={handleChangePassword}>
                  <h3 className="text-2xl font-bold text-primary">Security</h3>
                  <p className="mt-2 text-base text-slate-500">Change your password to keep your account secure.</p>

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

export default SiteHeader;

