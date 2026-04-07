import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STUDENT",
  phone: "",
};

const roleOptions = [
  {
    value: "STUDENT",
    title: "Student Register",
    description: "Create an account for students to access campus services and requests.",
  },
  {
    value: "TECHNICIAN",
    title: "Technician Register",
    description: "Create an account for technicians to manage maintenance and issue handling.",
  },
];

function Register() {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedRole = roleOptions.find((option) => option.value === formData.role) || roleOptions[0];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData((current) => ({
      ...current,
      role,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8080/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          phone: formData.phone.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          data?.["error Message"] ||
          "Registration failed.";
        throw new Error(message);
      }

      setSuccessMessage(`User registered successfully with ID ${data.id}.`);
      setFormData(initialForm);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-card">
        <div className="register-copy">
          <p className="register-eyebrow">Smart Campus</p>
          <h1>{selectedRole.title}</h1>
          <p className="register-subtitle">
            Select one role, complete the account details, and submit the registration to the backend.
          </p>
          <p className="register-switch-text">
            Already have an account? <Link to="/login" className="register-switch-link">Sign in</Link>
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-role-grid" aria-label="Select account role">
            {roleOptions.map((option) => {
              const isSelected = formData.role === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`register-role-card${isSelected ? " register-role-card-selected" : ""}`}
                  onClick={() => handleRoleSelect(option.value)}
                  aria-pressed={isSelected}
                >
                  <span className="register-role-title">{option.title}</span>
                  <span className="register-role-description">{option.description}</span>
                </button>
              );
            })}
          </div>

          <label className="register-field">
            <span>Full Name</span>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </label>

          <label className="register-field">
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

          <label className="register-field">
            <span>Phone</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </label>

          <label className="register-field">
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

          <label className="register-field">
            <span>Confirm Password</span>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />
          </label>

          {error ? <p className="register-message register-message-error">{error}</p> : null}
          {successMessage ? (
            <p className="register-message register-message-success">{successMessage}</p>
          ) : null}

          <button type="submit" className="register-button" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : `Register as ${selectedRole.value}`}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Register;
