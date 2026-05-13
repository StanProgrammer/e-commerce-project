import React, { useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useForgotPasswordMutation } from "../store/features/auth/authApi";
import getApiErrorMessage from "../utils/getApiErrorMessage";

const getEmailError = (email) => {
  if (!email.trim()) {
    return "Email is required.";
  }

  if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
};

const getPhoneError = (phone) => {
  const value = phone.trim();

  if (!value) {
    return "Phone number is required.";
  }

  if (!/^[+()\-\s.\d]{7,20}$/.test(value)) {
    return "Enter a valid phone number.";
  }

  return "";
};

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [isSent, setIsSent] = useState(false);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {
      email: getEmailError(form.email),
      phone: getPhoneError(form.phone),
    };
    const hasErrors = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);

    if (hasErrors) {
      if (nextErrors.email) {
        emailRef.current?.focus();
      } else {
        phoneRef.current?.focus();
      }
      return;
    }

    try {
      const response = await forgotPassword({
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      }).unwrap();
      setIsSent(true);
      toast.success(response.message || "Support has been notified.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "We could not notify support right now. Please try again."));
    }
  };

  return (
    <div className="min-h-screen bg-radial from-blue-100 via-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex flex-col justify-between bg-linear-to-br from-slate-900 via-blue-800 to-primary px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="relative">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white">
              <i className="ri-arrow-left-line"></i>
              Back to sign in
            </Link>
            <div className="mt-8 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/85">
              Account Recovery
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative my-10 max-w-xl lg:my-0"
          >
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: "var(--font-header)" }}>
              Need help signing in?
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
              Share your account email and phone number, and our support team will help you recover access.
            </p>
          </motion.div>

          <div className="relative flex flex-wrap gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/15 px-4 py-2">Support notified</span>
            <span className="rounded-full border border-white/15 px-4 py-2">Private request</span>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Forgot Password</p>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Request assistance</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">
                Send your details to Willow & Rue support. They will contact you shortly to help with your account.
              </p>
            </div>

            {isSent && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
                Your request has been sent. Our support team has been notified and will contact you shortly.
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
              <input
                ref={emailRef}
                id="forgot-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-primary ${
                  errors.email ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                }`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "forgot-email-error" : undefined}
              />
              {errors.email && (
                <p id="forgot-email-error" className="mt-2 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Phone number</span>
              <input
                ref={phoneRef}
                id="forgot-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+1 555 123 4567"
                className={`w-full rounded-xl border px-4 py-3 text-slate-900 outline-none transition focus:border-primary ${
                  errors.phone ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                }`}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "forgot-phone-error" : undefined}
              />
              {errors.phone && (
                <p id="forgot-phone-error" className="mt-2 text-xs text-red-600">
                  {errors.phone}
                </p>
              )}
            </label>

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-customer-service-2-line"></i>}
                {isLoading ? "Notifying support..." : "Notify support"}
              </button>

              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
              >
                <i className="ri-login-box-line"></i>
                Return to sign in
              </Link>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
