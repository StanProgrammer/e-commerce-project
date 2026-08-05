import React, { useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterUserMutation } from "../store/features/auth/authApi";
import { useDispatch } from "react-redux";
import { setUser } from "../store/features/auth/authSlice";
import toast from "react-hot-toast";
import getApiErrorMessage from "../utils/getApiErrorMessage";

const passwordRequirements = [
  {
    label: "At least 8 characters",
    isValid: (password) => password.length >= 8,
  },
  {
    label: "One uppercase letter",
    isValid: (password) => /[A-Z]/.test(password),
  },
  {
    label: "One lowercase letter",
    isValid: (password) => /[a-z]/.test(password),
  },
  {
    label: "One number",
    isValid: (password) => /\d/.test(password),
  },
  {
    label: "One special character",
    isValid: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

const getPasswordError = (password) => {
  if (!password) {
    return "Password is required.";
  }

  const missingRequirements = passwordRequirements
    .filter((requirement) => !requirement.isValid(password))
    .map((requirement) => requirement.label.toLowerCase());

  if (missingRequirements.length > 0) {
    return `Password must include ${missingRequirements.join(", ")}.`;
  }

  return "";
};

const getRegisterErrors = (form) => {
  const nextErrors = {};

  if (!form.name.trim()) {
    nextErrors.name = "Username is required.";
  } else if (form.name.trim().length < 3) {
    nextErrors.name = "Username must be at least 3 characters.";
  }

  if (!form.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(form.email)) {
    nextErrors.email = "Enter a valid email address.";
  }

  const passwordError = getPasswordError(form.password);
  if (passwordError) {
    nextErrors.password = passwordError;
  }

  if (!form.confirmPassword) {
    nextErrors.confirmPassword = "Please confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    nextErrors.confirmPassword = "Passwords do not match.";
  }

  if (!form.acceptTerms) {
    nextErrors.acceptTerms = "You must accept the terms and privacy policy.";
  }

  return nextErrors;
};

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const nameRef = useRef(null);
  const passwordChecklist = passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.isValid(form.password),
  }));

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerUser, { isLoading, error }] = useRegisterUserMutation();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = getRegisterErrors(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.name) {
        nameRef.current?.focus();
      }
      return;
    }

    try {
      const response = await registerUser({
        username: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }).unwrap();

      dispatch(setUser(response.user));
      toast.success("Account created. You are signed in.");
      navigate("/");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Account could not be created. Check the form and try again."));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_45%,_#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)] lg:grid-cols-[1fr_0.98fr]">
        <div className="relative flex flex-col justify-between bg-linear-to-br from-primary via-blue-600 to-slate-900 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.10),_transparent_35%)]"></div>
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white">
              <i className="ri-arrow-left-line"></i>
              Back to store
            </Link>
            <div className="mt-8 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/85">
              Create Account
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative my-10 max-w-xl lg:my-0"
          >
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: "var(--font-header)" }}>
              Join Willow & Rue in just a minute
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
              Create your account to track orders, save favorites, and enjoy a smoother, more personal shopping experience.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-lg font-semibold">Track every order</p>
                <p className="mt-2 text-sm text-white/75">Manage purchases, reviews, and account details in one place.</p>
              </div>
            </div>
          </motion.div>

          <div className="relative flex flex-wrap gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/15 px-4 py-2">Secure signup</span>
            <span className="rounded-full border border-white/15 px-4 py-2">Mobile-friendly</span>
          </div>
        </div>

        <div className="flex items-center px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
            noValidate
          >
            <div className="mb-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Register</p>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Create your account</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">
                Fill in your details below to get started. You can sign in any time once your account is ready.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
                <input
                  ref={nameRef}
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-primary ${
                    errors.name ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                  }`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="mt-2 text-xs text-red-600">
                    {errors.name}
                  </p>
                )}
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-primary ${
                    errors.email ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="mt-2 text-xs text-red-600">
                    {errors.email}
                  </p>
                )}
              </label>

              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Password requirements</p>
                <ul id="password-requirements" className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  {passwordChecklist.map((requirement) => (
                    <li
                      key={requirement.label}
                      className={`flex items-center gap-2 ${
                        requirement.met ? "text-green-700" : "text-slate-500"
                      }`}
                    >
                      <i className={requirement.met ? "ri-checkbox-circle-fill" : "ri-circle-line"}></i>
                      <span>{requirement.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Create password</span>
                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className={`w-full rounded-xl border px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-primary ${
                      errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={`password-requirements${errors.password ? " password-error" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-2 text-xs text-red-600">
                    {errors.password}
                  </p>
                )}
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`w-full rounded-xl border px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-primary ${
                      errors.confirmPassword ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-error" className="mt-2 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="inline-flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary"
                />
                <span className="leading-6">
                  I agree to the{" "}
                  <Link to="/policy" className="font-medium text-primary hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/policy" className="font-medium text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptTerms && <p className="mt-2 text-xs text-red-600">{errors.acceptTerms}</p>}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getApiErrorMessage(error, "Account could not be created. Check the form and try again.")}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-user-add-line"></i>}
                {isLoading ? "Creating account..." : "Create account"}
              </button>

              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
              >
                <i className="ri-login-box-line"></i>
                Already have an account? Sign in
              </Link>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already registered?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Go to login
              </Link>
            </p>

            <p className="mt-6 text-xs leading-6 text-slate-400">
              By creating an account you agree to our Terms and Privacy Policy.
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
