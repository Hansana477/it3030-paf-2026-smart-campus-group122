import React, { useEffect, useEffectEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const initialForm = {
  email: "",
  password: "",
};

const initialGoogleSignup = {
  credential: "",
  email: "",
  fullName: "",
};

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function redirectToDashboard(role, navigate, setError) {
  if (role === "ADMIN") {
    navigate("/admin-dashboard");
    return;
  }

  if (role === "STUDENT") {
    navigate("/student-dashboard");
    return;
  }

  if (role === "TECHNICIAN") {
    navigate("/technician-dashboard");
    return;
  }

  setError("Login succeeded, but the user role is not supported.");
}

function saveAuthenticatedUser(data) {
  if (!data?.token) {
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data));
}

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [googleSetupError, setGoogleSetupError] = useState("");
  const [googleSignupData, setGoogleSignupData] = useState(initialGoogleSignup);
  const [selectedGoogleRole, setSelectedGoogleRole] = useState("STUDENT");
  const [showRolePicker, setShowRolePicker] = useState(false);

  const completeGoogleLogin = async (credential, role = null) => {
    const response = await fetch("http://localhost:8080/users/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential,
        role,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        data?.["error Message"] ||
        "Google sign-in failed.";
      throw new Error(message);
    }

    return data;
  };

  const handleGoogleCredentialResponse = useEffectEvent(async (response) => {
    setError("");
    setSuccessMessage("");
    setGoogleSetupError("");
    setIsGoogleSubmitting(true);

    try {
      const data = await completeGoogleLogin(response.credential);

      if (data?.requiresRoleSelection) {
        setGoogleSignupData({
          credential: response.credential,
          email: data.email ?? "",
          fullName: data.fullName ?? "",
        });
        setSelectedGoogleRole("STUDENT");
        setShowRolePicker(true);
        return;
      }

      saveAuthenticatedUser(data);
      setSuccessMessage("Google sign-in successful. Redirecting to your dashboard...");
      redirectToDashboard(data?.role, navigate, setError);
    } catch (submitError) {
      setError(submitError.message || "Google sign-in failed.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      redirectToDashboard(user.role, navigate, setError);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleSetupError("Google sign-in is not configured yet.");
      return;
    }

    let isCancelled = false;

    loadGoogleScript()
      .then(() => {
        if (isCancelled || !window.google?.accounts?.id) {
          return;
        }

        const buttonContainer = document.getElementById("google-signin-button");
        if (!buttonContainer) {
          return;
        }

        buttonContainer.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: 360,
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setGoogleSetupError("Google sign-in could not be loaded.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [handleGoogleCredentialResponse]);

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
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8080/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.["error Message"] ||
          "Login failed.";
        throw new Error(message);
      }

      saveAuthenticatedUser(data);

      setSuccessMessage("Login successful. Redirecting to your dashboard...");
      setFormData(initialForm);
      redirectToDashboard(data?.role, navigate, setError);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRoleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsGoogleSubmitting(true);

    try {
      const data = await completeGoogleLogin(googleSignupData.credential, selectedGoogleRole);
      saveAuthenticatedUser(data);
      setShowRolePicker(false);
      setGoogleSignupData(initialGoogleSignup);
      setSuccessMessage("Google sign-in successful. Redirecting to your dashboard...");
      redirectToDashboard(data?.role, navigate, setError);
    } catch (submitError) {
      setError(submitError.message || "Google sign-in failed.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-copy">
          <p className="login-eyebrow">Smart Campus</p>
          <h1>Sign In</h1>
          <p className="login-subtitle">
            Enter your email and password. The system will detect your role and send you to the correct dashboard.
          </p>
          <p className="login-subtitle">
            You can also continue with Google. New Google users will choose Student or Technician after account selection.
          </p>
          <p className="login-switch-text">
            Need an account? <Link to="/register" className="login-switch-link">Create one</Link>
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </label>

          {error ? <p className="login-message login-message-error">{error}</p> : null}
          {successMessage ? <p className="login-message login-message-success">{successMessage}</p> : null}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="login-divider" aria-hidden="true">
          <span>or</span>
        </div>

        <div className="google-signin-section">
          <div id="google-signin-button" className="google-signin-button" />
          {isGoogleSubmitting ? (
            <p className="login-message login-message-success">Completing Google sign-in...</p>
          ) : null}
          {googleSetupError ? (
            <p className="login-message login-message-error">{googleSetupError}</p>
          ) : null}
        </div>
      </section>

      {showRolePicker ? (
        <div className="login-modal-backdrop" role="presentation">
          <section className="login-role-modal" role="dialog" aria-modal="true" aria-labelledby="google-role-title">
            <p className="login-eyebrow">Google Sign-In</p>
            <h2 id="google-role-title">Choose your role</h2>
            <p className="login-subtitle">
              {googleSignupData.fullName || "This Google account"} will finish sign-in as either a student or a technician.
            </p>
            <p className="login-role-email">{googleSignupData.email}</p>

            <form className="login-role-form" onSubmit={handleGoogleRoleSubmit}>
              <label className="login-role-option">
                <input
                  type="radio"
                  name="googleRole"
                  value="STUDENT"
                  checked={selectedGoogleRole === "STUDENT"}
                  onChange={(event) => setSelectedGoogleRole(event.target.value)}
                />
                <span>
                  <strong>Student</strong>
                  <small>Go straight into the student dashboard after sign-in.</small>
                </span>
              </label>

              <label className="login-role-option">
                <input
                  type="radio"
                  name="googleRole"
                  value="TECHNICIAN"
                  checked={selectedGoogleRole === "TECHNICIAN"}
                  onChange={(event) => setSelectedGoogleRole(event.target.value)}
                />
                <span>
                  <strong>Technician</strong>
                  <small>Your account will wait for admin approval before full technician access.</small>
                </span>
              </label>

              <div className="login-role-actions">
                <button
                  type="button"
                  className="login-button login-button-secondary"
                  onClick={() => {
                    setShowRolePicker(false);
                    setGoogleSignupData(initialGoogleSignup);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="login-button" disabled={isGoogleSubmitting}>
                  {isGoogleSubmitting ? "Finishing..." : "Continue"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default Login;
