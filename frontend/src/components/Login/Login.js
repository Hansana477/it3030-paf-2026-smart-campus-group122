import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const initialForm = {
  email: "",
  password: "",
};

function redirectToDashboard(role, navigate, setError) {
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

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      if (data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
      }

      setSuccessMessage("Login successful. Redirecting to your dashboard...");
      setFormData(initialForm);
      redirectToDashboard(data?.role, navigate, setError);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
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
      </section>
    </main>
  );
}

export default Login;
