import React from "react";
import { Link } from "react-router-dom";
import MessageState from "../../../components/MessageState";
import { useGetMyFeedbackQuery } from "../../../store/features/feedback/feedbackApi";

const statusStyles = {
  new: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  open: "bg-sky-100 text-sky-700",
  in_review: "bg-amber-100 text-amber-700",
  planned: "bg-amber-100 text-amber-700",
  closed: "bg-rose-100 text-rose-700",
};

const typeStyles = {
  bug: {
    label: "Bug",
    icon: "ri-bug-line",
    className: "bg-red-50 text-red-700",
  },
  feature: {
    label: "Feature",
    icon: "ri-lightbulb-flash-line",
    className: "bg-indigo-50 text-indigo-700",
  },
};

const formatStatus = (status = "") =>
  ({
    open: "New",
    in_review: "In Progress",
    planned: "In Progress",
    closed: "Rejected",
  }[status] || status)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const SkeletonRow = () => (
  <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex animate-pulse flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 space-y-3">
        <div className="h-4 w-24 rounded bg-slate-100" />
        <div className="h-5 w-2/3 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
      </div>
      <div className="h-7 w-24 rounded-full bg-slate-100" />
    </div>
  </div>
);

const UserFeedback = () => {
  const { data: feedback = [], isLoading, isError } = useGetMyFeedbackQuery();

  return (
    <section className="px-2 py-8 sm:px-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Feedback</p>
          <h2 className="mt-1 text-3xl font-bold text-slate-900">My Reports</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      ) : isError ? (
        <MessageState
          tone="error"
          title="Reports could not be loaded"
          message="Refresh the page or try again after checking your connection."
        />
      ) : feedback.length === 0 ? (
        <MessageState
          tone="empty"
          title="No signed-in reports yet"
          message="Reports submitted while you are logged in will appear here with their latest status."
          action={
            <Link to="/" className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Go to feedback widget
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => {
            const type = typeStyles[item.type] || typeStyles.bug;

            return (
              <article key={item._id} className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${type.className}`}>
                        <i className={type.icon} aria-hidden="true" />
                        {type.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status] || "bg-slate-100 text-slate-600"}`}>
                    {formatStatus(item.status)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default UserFeedback;
