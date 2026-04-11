import React, { useState } from "react";
import { Link } from "react-router-dom";

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

const studentEmailPattern = /^[A-Z0-9._%+-]+@my\.sliit\.lk$/i;
const phonePattern = /^\d{10}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/;
const passwordHelpText =
  "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.";
const phoneHelpText = "Phone number must contain exactly 10 digits.";

function Register() {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedRole = roleOptions.find((option) => option.value === formData.role) || roleOptions[0];
  const isStudent = formData.role === "STUDENT";

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setFormData((current) => ({
      ...current,
      [name]: nextValue,
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

    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();
    if (isStudent && !studentEmailPattern.test(trimmedEmail)) {
      setError("Student email must end with @my.sliit.lk.");
      return;
    }

    if (trimmedPhone && !phonePattern.test(trimmedPhone)) {
      setError(phoneHelpText);
      return;
    }

    if (!passwordPattern.test(formData.password)) {
      setError(passwordHelpText);
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
          email: trimmedEmail,
          password: formData.password,
          role: formData.role,
          phone: trimmedPhone,
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

      if (formData.role === "TECHNICIAN") {
        setSuccessMessage("Technician registered successfully. Admin approval is required before full access.");
      } else {
        setSuccessMessage(`User registered successfully with ID ${data.id}.`);
      }
      setFormData(initialForm);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden overflow-hidden rounded-[32px] border border-white/60 bg-white/70 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur lg:block">
          <div className="relative h-full min-h-[720px] overflow-hidden bg-primary px-10 py-12 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.22),transparent_28%)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent">Smart Campus</p>
                <h1 className="mt-6 max-w-md text-5xl font-extrabold leading-[1.05]">
                  {selectedRole.title}
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
                  Use your campus identity to join the platform with a cleaner, more secure registration flow.
                </p>
              </div>

              <div className="mt-10 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Student rule</p>
                  <p className="mt-3 text-base leading-7 text-slate-100">
                    Student accounts must use their institutional email ending with
                    {" "}
                    <span className="font-semibold text-secondary">@my.sliit.lk</span>.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Approval flow</p>
                  <p className="mt-3 text-base leading-7 text-slate-100">
                    Technician accounts can register here too, but admin approval is required before full access.
                  </p>
                </div>
              </div>

              <div className="mt-auto rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Already registered?</p>
                <p className="mt-3 text-base text-slate-200">
                  Head back to the sign-in screen and continue with your existing account.
                </p>
                <Link
                  to="/login"
                  className="mt-5 inline-flex items-center rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-emerald-300"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent lg:hidden">Smart Campus</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary">{selectedRole.title}</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              Select one role, complete the account details, and submit the registration. Student accounts must use the campus email domain.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Already have an account?
              {" "}
              <Link to="/login" className="font-semibold text-accent transition hover:text-primary">
                Sign in
              </Link>
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2" aria-label="Select account role">
              {roleOptions.map((option) => {
                const isSelected = formData.role === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`group rounded-[24px] border px-5 py-5 text-left transition ${
                      isSelected
                        ? "border-secondary bg-secondary/10 shadow-[0_18px_30px_rgba(34,197,94,0.18)]"
                        : "border-slate-200 bg-slate-50/80 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
                    }`}
                    onClick={() => handleRoleSelect(option.value)}
                    aria-pressed={isSelected}
                  >
                    <span className="block text-lg font-bold text-primary">{option.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-slate-500">{option.description}</span>
                  </button>
                );
              })}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-primary">Full Name</span>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                required
              />
            </label>

            <label className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-primary">Email</span>
                {isStudent ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                    Student email required
                  </span>
                ) : null}
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={isStudent ? "example@my.sliit.lk" : "Enter email address"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                required
              />
              <p className="text-sm leading-6 text-slate-500">
                {isStudent
                  ? "Student registrations only accept addresses ending with @my.sliit.lk."
                  : "Technician accounts can use their regular work email address."}
              </p>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-primary">Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                inputMode="numeric"
                maxLength="10"
                pattern={phonePattern.source}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
              <p className="text-sm leading-6 text-slate-500">{phoneHelpText}</p>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  minLength="6"
                  pattern={passwordPattern.source}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                  required
                />
                <p className="text-sm leading-6 text-slate-500">{passwordHelpText}</p>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  minLength="6"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                  required
                />
              </label>
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
              className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : `Register as ${selectedRole.value}`}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default Register;
