import React, { useMemo, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useResetPasswordMutation } from "../store/features/auth/authApi";
import getApiErrorMessage from "../utils/getApiErrorMessage";

const passwordRequirements = [
  { label: "At least 8 characters", isValid: (password) => password.length >= 8 },
  { label: "One uppercase letter", isValid: (password) => /[A-Z]/.test(password) },
  { label: "One lowercase letter", isValid: (password) => /[a-z]/.test(password) },
  { label: "One number", isValid: (password) => /\d/.test(password) },
  { label: "One special character", isValid: (password) => /[^A-Za-z0-9]/.test(password) },
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

export default function ResetPassword() {
  const { token = "" } = useParams();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const isTokenShapeValid = /^[a-f0-9]{64}$/i.test(token);

  const passwordChecklist = useMemo(
    () => passwordRequirements.map((requirement) => ({ ...requirement, met: requirement.isValid(form.password) })),
    [form.password]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const passwordError = getPasswordError(form.password);

    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      passwordRef.current?.focus();
      return;
    }

    try {
      const response = await resetPassword({ token, password: form.password }).unwrap();
      toast.success(response.message || "Password updated successfully.");
      navigate("/login");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "This reset link is invalid or has expired."));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_45%,_#ffffff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex flex-col justify-between bg-linear-to-br from-primary via-blue-600 to-slate-900 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="relative">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white">
              <i className="ri-arrow-left-line"></i>
              Back to sign in
            </Link>
            <div className="mt-8 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/85">
              New Password
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative my-10 max-w-xl lg:my-0"
          >
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: "var(--font-header)" }}>
              Choose a fresh password
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
              Use a strong password that you do not use on other sites.
            </p>
          </motion.div>

          <div className="relative flex flex-wrap gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/15 px-4 py-2">One use link</span>
            <span className="rounded-full border border-white/15 px-4 py-2">Secure update</span>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Reset Password</p>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Update password</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">
                Your new password must meet the same security rules used when creating an account.
              </p>
            </div>

            {!isTokenShapeValid && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                This reset link is invalid. Request a new password reset email to continue.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Password requirements</p>
              <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                {passwordChecklist.map((requirement) => (
                  <li key={requirement.label} className={`flex items-center gap-2 ${requirement.met ? "text-green-700" : "text-slate-500"}`}>
                    <i className={requirement.met ? "ri-checkbox-circle-fill" : "ri-circle-line"}></i>
                    <span>{requirement.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="reset-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a new password"
                    disabled={!isTokenShapeValid}
                    className={`w-full rounded-xl border px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-100 ${
                      errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "reset-password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={!isTokenShapeValid}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p id="reset-password-error" className="mt-2 text-xs text-red-600">
                    {errors.password}
                  </p>
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</span>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    disabled={!isTokenShapeValid}
                    className={`w-full rounded-xl border px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-100 ${
                      errors.confirmPassword ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    disabled={!isTokenShapeValid}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="reset-confirm-error" className="mt-2 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </label>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={isLoading || !isTokenShapeValid}
                className="btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-lock-password-line"></i>}
                {isLoading ? "Updating password..." : "Update password"}
              </button>

              <Link
                to="/forgot-password"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
              >
                <i className="ri-mail-send-line"></i>
                Request a new link
              </Link>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
