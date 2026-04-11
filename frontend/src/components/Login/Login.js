import React, { useEffect, useEffectEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const initialForm = {
  email: "",
  password: "",
};

const initialGoogleSignup = {
  credential: "",
  email: "",
  fullName: "",
};

const initialForgotPasswordForm = {
  email: "",
  code: "",
  newPassword: "",
  confirmPassword: "",
};

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/;
const passwordHelpText =
  "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("request");
  const [forgotPasswordForm, setForgotPasswordForm] = useState(initialForgotPasswordForm);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);

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

  const resetForgotPasswordState = (email = "") => {
    setForgotPasswordForm({
      ...initialForgotPasswordForm,
      email,
    });
    setForgotPasswordStep("request");
    setForgotPasswordError("");
    setForgotPasswordSuccess("");
  };

  const handleForgotPasswordChange = (event) => {
    const { name, value } = event.target;
    setForgotPasswordForm((current) => ({
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

  const handleForgotPasswordRequest = async (event) => {
    event.preventDefault();
    setIsForgotPasswordSubmitting(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    try {
      const response = await fetch("http://localhost:8080/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordForm.email.trim(),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.["error Message"] ||
          "Failed to send reset code.";
        throw new Error(message);
      }

      setForgotPasswordStep("reset");
      setForgotPasswordSuccess(data?.message || "Reset code sent. Check your email.");
    } catch (submitError) {
      setForgotPasswordError(submitError.message || "Something went wrong.");
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleForgotPasswordReset = async (event) => {
    event.preventDefault();
    setIsForgotPasswordSubmitting(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
      setForgotPasswordError("New password and confirm password do not match.");
      setIsForgotPasswordSubmitting(false);
      return;
    }

    if (!passwordPattern.test(forgotPasswordForm.newPassword)) {
      setForgotPasswordError(passwordHelpText);
      setIsForgotPasswordSubmitting(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordForm.email.trim(),
          code: forgotPasswordForm.code.trim(),
          newPassword: forgotPasswordForm.newPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.["error Message"] ||
          "Failed to reset password.";
        throw new Error(message);
      }

      setShowForgotPassword(false);
      setSuccessMessage(data?.message || "Password reset successful. Please sign in.");
      setFormData((current) => ({
        ...current,
        email: forgotPasswordForm.email.trim(),
      }));
      resetForgotPasswordState(forgotPasswordForm.email.trim());
    } catch (submitError) {
      setForgotPasswordError(submitError.message || "Something went wrong.");
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden overflow-hidden rounded-[32px] border border-white/60 bg-primary shadow-[0_24px_70px_rgba(15,23,42,0.16)] lg:block">
          <div className="relative flex h-full min-h-[760px] flex-col overflow-hidden px-10 py-12 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.22),transparent_28%)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent">Smart Campus</p>
                <h1 className="mt-6 max-w-md text-5xl font-extrabold leading-[1.05]">Sign In</h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
                  Use your Smart Campus account to access the correct workspace with one clean login flow.
                </p>
              </div>

              <div className="mt-10 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Role-aware access</p>
                  <p className="mt-3 text-base leading-7 text-slate-100">
                    Email and password sign-in automatically routes users to the correct dashboard after authentication.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Google onboarding</p>
                  <p className="mt-3 text-base leading-7 text-slate-100">
                    New Google users will choose either
                    {" "}
                    <span className="font-semibold text-secondary">Student</span>
                    {" "}
                    or
                    {" "}
                    <span className="font-semibold text-accent">Technician</span>
                    {" "}
                    before their account is created.
                  </p>
                </div>
              </div>

              <div className="mt-auto rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">New here?</p>
                <p className="mt-3 text-base text-slate-200">
                  Create a new account if you do not have campus access yet.
                </p>
                <Link
                  to="/register"
                  className="mt-5 inline-flex items-center rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-emerald-300"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent lg:hidden">Smart Campus</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary">Sign In</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              Enter your email and password. The system will detect your role and send you to the correct dashboard.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
              You can also continue with Google. New Google users will choose Student or Technician after account selection.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Need an account?
              {" "}
              <Link to="/register" className="font-semibold text-accent transition hover:text-primary">
                Create one
              </Link>
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-primary">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={inputClasses}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-primary">Password</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className={inputClasses}
                required
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-semibold text-accent transition hover:text-primary"
                onClick={() => {
                  resetForgotPasswordState(formData.email.trim());
                  setShowForgotPassword(true);
                }}
              >
                Forgot password?
              </button>
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
              <div id="google-signin-button" className="flex justify-center" />
            </div>
            {isGoogleSubmitting ? (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Completing Google sign-in...
              </p>
            ) : null}
            {googleSetupError ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {googleSetupError}
              </p>
            ) : null}
          </div>
        </section>
      </section>

      {showRolePicker ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm" role="presentation">
          <section
            className="mx-auto w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-role-title"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Google Sign-In</p>
            <h2 id="google-role-title" className="mt-4 text-3xl font-extrabold text-primary">Choose your role</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              {googleSignupData.fullName || "This Google account"} will finish sign-in as either a student or a technician.
            </p>
            <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-primary">
              {googleSignupData.email}
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleGoogleRoleSubmit}>
              <label
                className={`flex cursor-pointer gap-4 rounded-[24px] border p-5 transition ${
                  selectedGoogleRole === "STUDENT"
                    ? "border-secondary bg-secondary/10 shadow-[0_18px_30px_rgba(34,197,94,0.16)]"
                    : "border-slate-200 bg-slate-50/70 hover:border-accent/40"
                }`}
              >
                <input
                  type="radio"
                  name="googleRole"
                  value="STUDENT"
                  checked={selectedGoogleRole === "STUDENT"}
                  onChange={(event) => setSelectedGoogleRole(event.target.value)}
                  className="mt-1 h-4 w-4 border-slate-300 text-secondary focus:ring-secondary"
                />
                <span className="grid gap-1">
                  <strong className="text-lg text-primary">Student</strong>
                  <small className="text-sm leading-6 text-slate-500">Go straight into the student dashboard after sign-in.</small>
                </span>
              </label>

              <label
                className={`flex cursor-pointer gap-4 rounded-[24px] border p-5 transition ${
                  selectedGoogleRole === "TECHNICIAN"
                    ? "border-accent bg-accent/10 shadow-[0_18px_30px_rgba(6,182,212,0.16)]"
                    : "border-slate-200 bg-slate-50/70 hover:border-accent/40"
                }`}
              >
                <input
                  type="radio"
                  name="googleRole"
                  value="TECHNICIAN"
                  checked={selectedGoogleRole === "TECHNICIAN"}
                  onChange={(event) => setSelectedGoogleRole(event.target.value)}
                  className="mt-1 h-4 w-4 border-slate-300 text-accent focus:ring-accent"
                />
                <span className="grid gap-1">
                  <strong className="text-lg text-primary">Technician</strong>
                  <small className="text-sm leading-6 text-slate-500">Your account will wait for admin approval before full technician access.</small>
                </span>
              </label>

              <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-primary transition hover:border-slate-300"
                  onClick={() => {
                    setShowRolePicker(false);
                    setGoogleSignupData(initialGoogleSignup);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                  disabled={isGoogleSubmitting}
                >
                  {isGoogleSubmitting ? "Finishing..." : "Continue"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {showForgotPassword ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm" role="presentation">
          <section
            className="mx-auto w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Account Recovery</p>
            <h2 id="forgot-password-title" className="mt-4 text-3xl font-extrabold text-primary">
              {forgotPasswordStep === "request" ? "Forgot password" : "Reset your password"}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              {forgotPasswordStep === "request"
                ? "Enter your email address and we will send a reset code to your inbox."
                : "Enter the reset code from your email and choose a new password."}
            </p>

            <form
              className="mt-6 grid gap-5"
              onSubmit={forgotPasswordStep === "request" ? handleForgotPasswordRequest : handleForgotPasswordReset}
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Email</span>
                <input
                  type="email"
                  name="email"
                  value={forgotPasswordForm.email}
                  onChange={handleForgotPasswordChange}
                  className={inputClasses}
                  required
                />
              </label>

              {forgotPasswordStep === "reset" ? (
                <>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-primary">Reset code</span>
                    <input
                      type="text"
                      name="code"
                      value={forgotPasswordForm.code}
                      onChange={handleForgotPasswordChange}
                      placeholder="Enter the code from your email"
                      className={inputClasses}
                      required
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-primary">New password</span>
                    <input
                      type="password"
                      name="newPassword"
                      value={forgotPasswordForm.newPassword}
                      onChange={handleForgotPasswordChange}
                      minLength="6"
                      pattern={passwordPattern.source}
                      className={inputClasses}
                      required
                    />
                    <p className="text-sm leading-6 text-slate-500">{passwordHelpText}</p>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-primary">Confirm new password</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={forgotPasswordForm.confirmPassword}
                      onChange={handleForgotPasswordChange}
                      minLength="6"
                      className={inputClasses}
                      required
                    />
                  </label>
                </>
              ) : null}

              {forgotPasswordError ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {forgotPasswordError}
                </p>
              ) : null}
              {forgotPasswordSuccess ? (
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {forgotPasswordSuccess}
                </p>
              ) : null}

              <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {forgotPasswordStep === "reset" ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-primary transition hover:border-slate-300"
                    onClick={() => {
                      setForgotPasswordStep("request");
                      setForgotPasswordError("");
                      setForgotPasswordSuccess("");
                    }}
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-primary transition hover:border-slate-300"
                  onClick={() => {
                    setShowForgotPassword(false);
                    resetForgotPasswordState(formData.email.trim());
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                  disabled={isForgotPasswordSubmitting}
                >
                  {isForgotPasswordSubmitting
                    ? forgotPasswordStep === "request"
                      ? "Sending..."
                      : "Resetting..."
                    : forgotPasswordStep === "request"
                      ? "Send reset code"
                      : "Reset password"}
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
