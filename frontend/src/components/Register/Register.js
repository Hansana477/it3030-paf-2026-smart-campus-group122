import React, { useState } from "react";
import { Link } from "react-router-dom";
import signImage from "../../assets/images/sign.jpg";

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
const phonePattern = /^\d{9}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/;
const passwordHelpText =
  "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol.";

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

function Register() {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedRole = roleOptions.find((option) => option.value === formData.role) || roleOptions[0];
  const isStudent = formData.role === "STUDENT";

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? normalizePhoneInput(value) : value;
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
      setError("Phone number must contain 9 digits.");
      return;
    }

    if (!passwordPattern.test(formData.password)) {
      setError(passwordHelpText);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8082/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: trimmedEmail,
          password: formData.password,
          role: formData.role,
          phone: toStoredPhone(trimmedPhone),
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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="absolute inset-0 z-0">
        <img src={signImage} alt="Background" className="h-full w-full object-cover blur-md brightness-50" />
      </div>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 rounded-[32px] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.20)] sm:p-6 lg:grid-cols-2 lg:p-8">
        <div className="relative hidden overflow-hidden rounded-[24px] lg:block">
          <img src={signImage} alt="Sign Up Background" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-wider">Selected Works</span>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <Link to="/login" className="hover:text-slate-200">Sign In</Link>
                <Link to="/register" className="rounded-full border border-white/50 px-5 py-2 transition hover:bg-white/10">Join Us</Link>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-slate-300">
                  <div className="flex h-full w-full items-center justify-center bg-accent text-lg font-bold text-white">S</div>
                </div>
                <div>
                  <p className="text-base font-bold leading-none">Smart Campus</p>
                  <p className="mt-1 text-sm text-slate-200">Portal Access</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/10">
                  <span className="sr-only">Previous</span>
                  &larr;
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/10">
                  <span className="sr-only">Next</span>
                  &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="relative flex flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between shrink-0">
            <p className="text-xl font-black tracking-tight text-slate-900">SMARTCAMPUS</p>
          </div>

          <div className="my-auto pt-8 pb-4 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Create Account</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Join the SMARTCAMPUS platform</p>

            <form className="mx-auto mt-8 w-full max-w-sm grid gap-5 text-left" onSubmit={handleSubmit}>
              <div className="grid gap-2 sm:grid-cols-2" aria-label="Select account role">
                {roleOptions.map((option) => {
                  const isSelected = formData.role === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`group rounded-xl border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-secondary bg-secondary/10 shadow-[0_8px_16px_rgba(34,197,94,0.12)]"
                          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-accent/40"
                      }`}
                      onClick={() => handleRoleSelect(option.value)}
                      aria-pressed={isSelected}
                    >
                      <span className="block text-sm font-bold text-slate-900">{option.title.replace(" Register", "")}</span>
                      <span className="mt-1 block text-[10px] leading-tight text-slate-500">{option.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-1">
                <span className="text-xs font-semibold text-slate-700">Full Name</span>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                  required
                />
              </div>

              <div className="grid gap-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">Email</span>
                  {isStudent ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      @my.sliit.lk only
                    </span>
                  ) : null}
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={isStudent ? "example@my.sliit.lk" : "Enter email address"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                  required
                />
              </div>

              <div className="grid gap-1">
                <span className="text-xs font-semibold text-slate-700">Phone</span>
                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10">
                  <span className="inline-flex items-center border-r border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500">
                    +94
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formatPhoneForInput(formData.phone)}
                    onChange={handleChange}
                    placeholder="7XXXXXXXX"
                    inputMode="numeric"
                    maxLength="9"
                    pattern={phonePattern.source}
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-700">Password</span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    minLength="6"
                    pattern={passwordPattern.source}
                    title={passwordHelpText}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-700">Confirm Password</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm"
                    minLength="6"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                    required
                  />
                </div>
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

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-secondary px-4 py-3.5 text-sm font-semibold text-primary transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : `Register as ${selectedRole.title.replace(" Register", "")}`}
              </button>
            </form>

            <p className="mt-8 text-xs font-medium text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-accent hover:text-cyan-600">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Register;
