import React, { useEffect, useEffectEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../../assets/images/login.jpg";

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

const initialLoginOtpForm = {
  email: "",
  code: "",
};

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/;
const passwordHelpText =
  "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.";

function getGoogleState() {
  window.smartCampusGoogleSignIn = window.smartCampusGoogleSignIn || {
    initializedClientId: "",
    credentialHandler: null,
  };

  return window.smartCampusGoogleSignIn;
}

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
  const [showLoginOtp, setShowLoginOtp] = useState(false);
  const [loginOtpForm, setLoginOtpForm] = useState(initialLoginOtpForm);
  const [loginOtpDestination, setLoginOtpDestination] = useState("");
  const [loginOtpError, setLoginOtpError] = useState("");
  const [loginOtpSuccess, setLoginOtpSuccess] = useState("");
  const [isLoginOtpSubmitting, setIsLoginOtpSubmitting] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("request");
  const [forgotPasswordForm, setForgotPasswordForm] = useState(initialForgotPasswordForm);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);

  const completeGoogleLogin = async (credential, role = null) => {
    const response = await fetch("http://localhost:8082/users/google", {
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
        const googleState = getGoogleState();
        googleState.credentialHandler = handleGoogleCredentialResponse;

        if (googleState.initializedClientId !== GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (credentialResponse) => {
              getGoogleState().credentialHandler?.(credentialResponse);
            },
            ux_mode: "popup",
          });
          googleState.initializedClientId = GOOGLE_CLIENT_ID;
        }

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

  const resetLoginOtpState = (email = "") => {
    setLoginOtpForm({
      ...initialLoginOtpForm,
      email,
    });
    setLoginOtpError("");
    setLoginOtpSuccess("");
  };

  const handleLoginOtpChange = (event) => {
    const { name, value } = event.target;
    setLoginOtpForm((current) => ({
      ...current,
      [name]: name === "code" ? value.replace(/\D/g, "").slice(0, 6) : value,
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
      const response = await fetch("http://localhost:8082/users/login", {
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

      if (data?.requiresOtp) {
        setShowLoginOtp(true);
        setLoginOtpDestination(data?.otpDestination || "your email address");
        resetLoginOtpState(formData.email.trim());
        setLoginOtpSuccess(data?.message || "A first-time login verification code has been sent to your email.");
        return;
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

  const handleVerifyLoginOtp = async (event) => {
    event.preventDefault();
    setIsLoginOtpSubmitting(true);
    setLoginOtpError("");
    setLoginOtpSuccess("");

    try {
      const response = await fetch("http://localhost:8082/users/verify-login-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginOtpForm.email.trim(),
          code: loginOtpForm.code.trim(),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.["error Message"] ||
          "Failed to verify login code.";
        throw new Error(message);
      }

      saveAuthenticatedUser(data);
      setShowLoginOtp(false);
      setSuccessMessage("Verification successful. Redirecting to your dashboard...");
      setFormData(initialForm);
      setLoginOtpDestination("");
      resetLoginOtpState("");
      redirectToDashboard(data?.role, navigate, setError);
    } catch (submitError) {
      setLoginOtpError(submitError.message || "Something went wrong.");
    } finally {
      setIsLoginOtpSubmitting(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (!formData.email.trim() || !formData.password) {
      setLoginOtpError("Enter your email and password again to resend the verification code.");
      return;
    }

    setIsLoginOtpSubmitting(true);
    setLoginOtpError("");
    setLoginOtpSuccess("");

    try {
      const response = await fetch("http://localhost:8082/users/login", {
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
          "Failed to resend verification code.";
        throw new Error(message);
      }

      if (!data?.requiresOtp) {
        throw new Error("This account does not require email verification.");
      }

      setLoginOtpForm((current) => ({
        ...current,
        email: formData.email.trim(),
        code: "",
      }));
      setLoginOtpDestination(data?.otpDestination || "your email address");
      setLoginOtpSuccess(data?.message || "A new verification code has been sent.");
    } catch (submitError) {
      setLoginOtpError(submitError.message || "Something went wrong.");
    } finally {
      setIsLoginOtpSubmitting(false);
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
      const response = await fetch("http://localhost:8082/users/forgot-password", {
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
      const response = await fetch("http://localhost:8082/users/reset-password", {
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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-0 z-0">
        <img src={loginImage} alt="Background" className="h-full w-full object-cover blur-md brightness-50" />
      </div>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 rounded-[32px] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.20)] sm:p-6 lg:grid-cols-2 lg:p-8">
        {/* Left Side: Image with overlaid text */}
        <div className="relative hidden overflow-hidden rounded-[24px] lg:block">
          <img src={loginImage} alt="Login Background" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-wider">Selected Works</span>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <Link to="/register" className="hover:text-slate-200">Sign Up</Link>
                <Link to="/register" className="rounded-full border border-white/50 px-5 py-2 transition hover:bg-white/10">Join Us</Link>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-slate-300">
                  <div className="flex h-full w-full items-center justify-center bg-accent text-lg font-bold text-white">S</div>
                </div>
                <div>
                  <p className="text-base font-bold leading-none">UniNex</p>
                  <p className="mt-1 text-sm text-slate-200">Portal Access</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/10">
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/10">
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <section className="relative flex flex-col px-4 py-6 sm:px-10 sm:py-8 lg:px-12 lg:py-10">
          {/* Top Bar: Logo */}
          <div className="flex items-center justify-between">
            <p className="text-xl font-black tracking-tight text-slate-900">SMARTCAMPUS</p>
          </div>

          <div className="my-auto pt-10 pb-8 text-center sm:pt-16 sm:pb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Hi User</h1>
            <p className="mt-3 text-sm font-medium text-slate-500">Welcome to SMARTCAMPUS</p>

            <form className="mx-auto mt-10 w-full max-w-sm grid gap-4 text-left" onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                required
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                required
              />

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-xs font-semibold text-accent transition hover:text-cyan-600"
                  onClick={() => {
                    resetForgotPasswordState(formData.email.trim());
                    setShowForgotPassword(true);
                  }}
                >
                  Forgot password ?
                </button>
              </div>

              {error ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              ) : null}
              {successMessage ? (
                <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-medium text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div id="google-signin-button" className="flex justify-center [&>div]:!w-full [&_iframe]:!w-full" />
                </div>
                {isGoogleSubmitting ? (
                  <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Completing Google sign-in...
                  </p>
                ) : null}
                {googleSetupError ? (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {googleSetupError}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-secondary px-4 py-3.5 text-sm font-semibold text-primary transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="mt-8 text-xs font-medium text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-accent hover:text-cyan-600">
                Sign up
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
              <button className="transition hover:text-slate-600"><span className="sr-only">Facebook</span><div className="h-4 w-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">f</div></button>
              <button className="transition hover:text-slate-600"><span className="sr-only">Twitter</span><div className="h-4 w-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">t</div></button>
              <button className="transition hover:text-slate-600"><span className="sr-only">LinkedIn</span><div className="h-4 w-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">in</div></button>
              <button className="transition hover:text-slate-600"><span className="sr-only">Instagram</span><div className="h-4 w-4 rounded-[4px] border border-current flex items-center justify-center text-[10px] font-bold">IG</div></button>
            </div>
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

      {showLoginOtp ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-primary/20 px-4 py-6 backdrop-blur-sm" role="presentation">
          <section
            className="mx-auto w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-otp-title"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Login Verification</p>
            <h2 id="login-otp-title" className="mt-4 text-3xl font-extrabold text-primary">Enter your first-time email OTP</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              We sent a 6-digit verification code to {loginOtpDestination || "your email address"} to confirm your first login. Enter it below to finish signing in.
            </p>

            <form className="mt-6 grid gap-5" onSubmit={handleVerifyLoginOtp}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Email</span>
                <input
                  type="email"
                  name="email"
                  value={loginOtpForm.email}
                  onChange={handleLoginOtpChange}
                  className={inputClasses}
                  required
                />
                <p className="text-sm leading-6 text-slate-500">
                  We use your email here to identify the account and deliver the OTP.
                </p>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Verification code</span>
                <input
                  type="text"
                  name="code"
                  value={loginOtpForm.code}
                  onChange={handleLoginOtpChange}
                  placeholder="Enter 6-digit code"
                  inputMode="numeric"
                  maxLength="6"
                  className={inputClasses}
                  required
                />
              </label>

              {loginOtpError ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginOtpError}
                </p>
              ) : null}
              {loginOtpSuccess ? (
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {loginOtpSuccess}
                </p>
              ) : null}

              <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-primary transition hover:border-slate-300"
                  onClick={() => {
                    setShowLoginOtp(false);
                    setLoginOtpDestination("");
                    resetLoginOtpState(formData.email.trim());
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-primary transition hover:border-slate-300 disabled:cursor-wait disabled:opacity-70"
                  onClick={handleResendLoginOtp}
                  disabled={isLoginOtpSubmitting}
                >
                  Resend code
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                  disabled={isLoginOtpSubmitting}
                >
                  {isLoginOtpSubmitting ? "Verifying..." : "Verify and login"}
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

