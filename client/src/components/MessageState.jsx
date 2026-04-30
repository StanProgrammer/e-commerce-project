import React from "react";

const toneStyles = {
  info: {
    wrapper: "border-slate-200 bg-white text-slate-600",
    icon: "ri-information-line text-slate-500",
  },
  loading: {
    wrapper: "border-slate-200 bg-white text-slate-600",
    icon: "ri-loader-4-line animate-spin text-primary",
  },
  error: {
    wrapper: "border-red-100 bg-red-50 text-red-700",
    icon: "ri-error-warning-line text-red-600",
  },
  empty: {
    wrapper: "border-slate-200 bg-white text-slate-600",
    icon: "ri-inbox-line text-slate-500",
  },
  success: {
    wrapper: "border-emerald-100 bg-emerald-50 text-emerald-700",
    icon: "ri-checkbox-circle-line text-emerald-600",
  },
};

const MessageState = ({ title, message, action, tone = "info", className = "" }) => {
  const styles = toneStyles[tone] || toneStyles.info;

  return (
    <div className={`rounded-lg border p-5 text-center shadow-sm ${styles.wrapper} ${className}`}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
        <i className={`${styles.icon} text-xl`} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {message && <p className="mx-auto mt-1 max-w-md text-sm leading-6 opacity-85">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default MessageState;
