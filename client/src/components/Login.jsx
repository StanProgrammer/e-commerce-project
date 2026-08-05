import React, { useEffect, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "motion/react";
import { useGoogleLoginUserMutation, useLoginUserMutation } from "../store/features/auth/authApi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { setUser } from "../store/features/auth/authSlice";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import getApiErrorMessage from "../utils/getApiErrorMessage";

const getLoginErrors = (form) => {
  const nextErrors = {};

  if (!form.email.trim()) {
    nextErrors.email = "Email is required.";
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(form.email)) {
    nextErrors.email = "Enter a valid email address.";
  }

  if (!form.password) {
    nextErrors.password = "Password is required.";
  }

  return nextErrors;
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const emailRef = useRef(null);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [loginUser, { isLoading, error }] = useLoginUserMutation();
  const [googleLoginUser, { isLoading: isGoogleLoading }] = useGoogleLoginUserMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const redirectTo = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      setGoogleReady(false);
      return undefined;
    }

    let cancelled = false;
    const scriptId = "google-identity-services";

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            const res = await googleLoginUser({ credential: response.credential }).unwrap();
            dispatch(setUser(res.user));
            toast.success("Signed in with Google.");
            navigate(redirectTo, { replace: true });
          } catch (googleError) {
            toast.error(getApiErrorMessage(googleError, "Google sign-in failed. Please try again or use email and password."));
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "center",
        width: googleButtonRef.current.offsetWidth || 320,
      });

      setGoogleReady(true);
    };

    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      initializeGoogle();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      if (!cancelled) {
        setGoogleReady(false);
      }
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [dispatch, googleClientId, googleLoginUser, navigate, redirectTo]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = getLoginErrors(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.email) {
        emailRef.current?.focus();
      }
      return;
    }

    try {
      const res = await loginUser({
        email: form.email.trim(),
        password: form.password,
        remember: form.remember,
      }).unwrap();

      dispatch(setUser(res.user));
      toast.success("You are signed in.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Sign in failed. Check your email and password, then try again."));
    }
  };

  const handleGoogleFallback = () => {
    if (!googleClientId) {
      toast.error("Google sign-in is not configured yet. Use email and password for now.");
      return;
    }

    if (!window.google?.accounts?.id) {
      toast.error("Google sign-in is still loading. Wait a moment, then try again.");
      return;
    }

    window.google.accounts.id.prompt();
  };

  return (
     <div className="min-h-screen bg-radial from-blue-100 via-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:min-h-screen lg:grid-cols-2">
        <div className="relative flex flex-col justify-between bg-linear-to-br from-slate-900 via-slate-800 to-blue-700 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"></div>
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white">
              <i className="ri-arrow-left-line"></i>
              Back to store
            </Link>
            <div className="mt-8 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/85">
              Willow & Rue
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative my-10 max-w-xl lg:my-0"
          >
            <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: "var(--font-header)" }}>
              Step back into a store built around your taste
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
              Sign in to continue exploring curated fashion drops, revisit saved picks, and move from discovery to checkout without losing momentum.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-semibold">Curated collections</p>
                <p className="mt-2 text-sm text-white/75">
                  Jump straight back into trending edits, seasonal essentials, and the pieces you were already eyeing.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-semibold">Wishlist and orders</p>
                <p className="mt-2 text-sm text-white/75">
                  Keep favorites, purchases, and delivery updates together in one smooth shopping flow.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="relative flex flex-wrap gap-3 text-sm text-white/70">
            <span className="rounded-full border border-white/15 px-4 py-2">Secure session</span>
            <span className="rounded-full border border-white/15 px-4 py-2">Responsive on every screen</span>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Sign In</p>
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Access your account</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">
                Use your email and password, or continue with Google for a quicker sign-in.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              {!googleReady && (
                <button
                  type="button"
                  onClick={handleGoogleFallback}
                  disabled={isGoogleLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <i className={`${isGoogleLoading ? "ri-loader-4-line animate-spin" : "ri-google-fill"} text-base`}></i>
                  {isGoogleLoading ? "Signing in with Google..." : "Continue with Google"}
                </button>
              )}

              <div ref={googleButtonRef} className={googleReady ? "flex min-h-11 justify-center" : "hidden"}></div>

              {!googleClientId && (
                <p className="mt-3 text-xs text-amber-600">
                  Google sign-in needs `VITE_GOOGLE_CLIENT_ID` in the client env and `GOOGLE_CLIENT_ID` in the server env.
                </p>
              )}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Or continue with email</span>
             <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                <input
                  ref={emailRef}
                  id="email"
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

              <label className="block">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">Password</span>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary transition hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`w-full rounded-xl border px-4 py-3 pr-20 text-slate-900 outline-none transition focus:border-primary ${
                      errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
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

              <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary"
                />
                Keep me signed in on this device
              </label>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {getApiErrorMessage(error, "Sign in failed. Check your email and password, then try again.")}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-login-box-line"></i>}
                {isLoading ? "Signing in..." : "Sign in"}
              </button>

              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
              >
                <i className="ri-user-add-line"></i>
                Create an account
              </Link>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              New to Willow & Rue?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Register here
              </Link>
            </p>

            <p className="mt-6 text-xs leading-6 text-slate-400">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
