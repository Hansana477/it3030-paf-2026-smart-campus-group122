import React, { useEffect, useState } from "react";

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

function createInitialProfile(user) {
  return {
    id: user?.id ?? null,
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

const fieldClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const phonePattern = /^\d{9}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/;
const phoneHelpText = "Phone number must contain 9 digits after +94.";
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

  useEffect(() => {
    const nextProfile = createInitialProfile(user);
    setProfileUser(nextProfile);
    setProfileForm(nextProfile);
  }, [user]);

  const openProfile = () => {
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

      const response = await fetch(`http://localhost:8082/users/${profileUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          email: profileUser.email,
          phone: toStoredPhone(trimmedPhone),
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
      const response = await fetch(`http://localhost:8082/users/${profileUser.id}/password`, {
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
      const response = await fetch(`http://localhost:8082/users/${profileUser.id}`, {
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

  return (
    <>
      <header className="flex flex-col gap-5 rounded-[30px] border border-white/70 bg-white/85 px-5 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
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
