import React, { useEffect, useState } from "react";
import "./Header.css";

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

function Header({ title, user, roleLabel, onLogout, onUserUpdated }) {
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
      [name]: value,
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
      const response = await fetch(`http://localhost:8080/users/${profileUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          email: profileUser.email,
          phone: profileForm.phone.trim(),
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
    } catch (changeError) {
      setPasswordError(changeError.message || "Something went wrong.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const profileSlug = (profileForm.fullName || profileUser.fullName || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";

  return (
    <>
      <header className="app-header">
        <div>
          <p className="app-header-badge">{roleLabel}</p>
          <h1 className="app-header-title">{title}</h1>
        </div>

        <div className="app-header-user">
          <p className="app-header-greeting">Hi, {profileUser.fullName || "User"}</p>
          <button type="button" className="app-header-profile-trigger" onClick={openProfile} aria-label="Open profile">
            <span>{getInitials(profileUser.fullName)}</span>
          </button>
          <button type="button" className="app-header-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {isProfileOpen ? (
        <div className="app-profile-backdrop" role="presentation">
          <section className="app-profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
            <div className="app-profile-hero">
              <button
                type="button"
                className="app-profile-close"
                onClick={() => setIsProfileOpen(false)}
                aria-label="Close profile"
              >
                x
              </button>
            </div>

            <div className="app-profile-summary">
              <div className="app-profile-avatar">{getInitials(profileUser.fullName)}</div>

              <div className="app-profile-identity">
                <div className="app-profile-heading-row">
                  <div>
                    <p className="app-header-badge">Profile</p>
                    <h2 id="profile-title">{profileUser.fullName || "User profile"}</h2>
                    <p className="app-profile-email">{profileUser.email}</p>
                  </div>

                  <button type="button" className="app-profile-chip">
                    {profileUser.role || "USER"}
                  </button>
                </div>

                <div className="app-profile-stats">
                  <div className="app-profile-stat">
                    <span>Joined</span>
                    <strong>{formatDate(profileUser.createdAt)}</strong>
                  </div>
                  <div className="app-profile-stat">
                    <span>Last login</span>
                    <strong>{formatDateTime(profileUser.lastLogin)}</strong>
                  </div>
                  <div className="app-profile-stat">
                    <span>Status</span>
                    <strong>{profileUser.active ? "Active" : "Inactive"}</strong>
                  </div>
                  <div className="app-profile-stat">
                    <span>Approval</span>
                    <strong>{profileUser.approved ? "Approved" : "Pending"}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="app-profile-grid">
              <form className="app-profile-section" onSubmit={handleSaveProfile}>
                <div className="app-profile-section-copy">
                  <h3>Public profile</h3>
                  <p>Update the details shown around your account.</p>
                </div>

                <label className="app-profile-field">
                  <span>Full name</span>
                  <input
                    type="text"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileChange}
                    required
                  />
                </label>

                <div className="app-profile-inline-fields">
                  <label className="app-profile-field">
                    <span>Email</span>
                    <input type="email" name="email" value={profileUser.email} readOnly />
                  </label>

                  <label className="app-profile-field">
                    <span>Profile slug</span>
                    <input type="text" value={profileSlug} readOnly />
                  </label>
                </div>

                <label className="app-profile-field">
                  <span>Phone</span>
                  <input
                    type="text"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="Add phone number"
                  />
                </label>

                {profileError ? <p className="app-profile-message app-profile-message-error">{profileError}</p> : null}
                {profileSuccess ? <p className="app-profile-message app-profile-message-success">{profileSuccess}</p> : null}

                <div className="app-profile-actions">
                  <button type="submit" className="app-header-button" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>

              <form className="app-profile-section" onSubmit={handleChangePassword}>
                <div className="app-profile-section-copy">
                  <h3>Security</h3>
                  <p>Change your password to keep your account secure.</p>
                </div>

                <label className="app-profile-field">
                  <span>Current password</span>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </label>

                <label className="app-profile-field">
                  <span>New password</span>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    minLength="6"
                    required
                  />
                </label>

                <label className="app-profile-field">
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    minLength="6"
                    required
                  />
                </label>

                {passwordError ? <p className="app-profile-message app-profile-message-error">{passwordError}</p> : null}
                {passwordSuccess ? <p className="app-profile-message app-profile-message-success">{passwordSuccess}</p> : null}

                <div className="app-profile-actions">
                  <button type="submit" className="app-header-button" disabled={isChangingPassword}>
                    {isChangingPassword ? "Updating..." : "Change password"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default Header;
