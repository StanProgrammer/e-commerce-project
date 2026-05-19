import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import MessageState from "../../../components/MessageState";
import getApiErrorMessage from "../../../utils/getApiErrorMessage";
import {
  useGetAllFeedbackQuery,
  useUpdateFeedbackStatusMutation,
} from "../../../store/features/feedback/feedbackApi";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "bug", label: "Bugs" },
  { value: "feature", label: "Features" },
];

const statusStyles = {
  new: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const legacyStatusLabels = {
  open: "New",
  in_review: "In progress",
  planned: "In progress",
  closed: "Rejected",
};

const typeStyles = {
  bug: "bg-red-50 text-red-700",
  feature: "bg-indigo-50 text-indigo-700",
};

const normalizeStatusLabel = (status = "") => {
  if (legacyStatusLabels[status]) return legacyStatusLabels[status];
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getReporter = (item) => {
  if (!item.user?.userId) return "Anonymous";
  return item.user?.email || item.user?.username || "Signed-in user";
};

const ManageFeedback = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState("");

  const {
    data: feedback = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllFeedbackQuery({ status: statusFilter, type: typeFilter });

  const [updateFeedbackStatus, { isLoading: isUpdating }] =
    useUpdateFeedbackStatusMutation();

  const counts = useMemo(
    () =>
      feedback.reduce(
        (summary, item) => {
          summary.total += 1;
          summary[item.status] = (summary[item.status] || 0) + 1;
          return summary;
        },
        { total: 0 }
      ),
    [feedback]
  );

  const handleStatusChange = async (id, status) => {
    try {
      await updateFeedbackStatus({ id, status }).unwrap();
      toast.success("Feedback status updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Status could not be updated. Try again."));
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Feedback
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Bug Reports & Feature Requests
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review customer submissions, identify anonymous reports, and move each item through a clear support workflow.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-slate-600">
              Type
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-slate-600">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusOptions.slice(1).map((option) => (
            <div key={option.value} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {option.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {counts[option.value] || 0}
              </p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-lg bg-white shadow-sm" />
            ))}
          </div>
        ) : isError ? (
          <MessageState
            tone="error"
            title="Feedback could not be loaded"
            message={getApiErrorMessage(error, "Refresh the page. If this continues, check that the server is running.")}
            action={
              <button
                type="button"
                onClick={refetch}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Retry
              </button>
            }
          />
        ) : feedback.length === 0 ? (
          <MessageState
            tone="empty"
            title="No matching feedback"
            message="Try another filter, or check back after customers submit reports."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Report</th>
                    <th className="px-5 py-4">Reporter</th>
                    <th className="px-5 py-4">Submitted</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedback.map((item) => {
                    const isExpanded = expandedId === item._id;
                    const isKnownStatus = statusOptions.some((option) => option.value === item.status);

                    return (
                      <React.Fragment key={item._id}>
                        <tr className="align-top transition hover:bg-slate-50">
                          <td className="max-w-md px-5 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${typeStyles[item.type] || "bg-slate-100 text-slate-600"}`}>
                                {item.type === "bug" ? "Bug" : "Feature"}
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status] || "bg-slate-100 text-slate-600"}`}>
                                {normalizeStatusLabel(item.status)}
                              </span>
                            </div>
                            <p className="mt-2 font-semibold text-slate-950">{item.title}</p>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                              {item.description}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-slate-800">{getReporter(item)}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.user?.role || "guest"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={isKnownStatus ? item.status : "new"}
                              disabled={isUpdating}
                              onChange={(event) => handleStatusChange(item._id, event.target.value)}
                              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {statusOptions.slice(1).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? "" : item._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                            >
                              <i className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} aria-hidden="true" />
                              {isExpanded ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50">
                            <td colSpan="5" className="px-5 py-5">
                              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Description
                                  </p>
                                  <p className="mt-2 whitespace-pre-line rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                                    {item.description}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                  <p className="font-semibold text-slate-900">Context</p>
                                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Page</p>
                                  {item.pageUrl ? (
                                    <a
                                      href={item.pageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 block break-all text-primary hover:underline"
                                    >
                                      {item.pageUrl}
                                    </a>
                                  ) : (
                                    <p className="mt-1 text-slate-400">Not captured</p>
                                  )}
                                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Updated</p>
                                  <p className="mt-1">{formatDate(item.updatedAt)}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ManageFeedback;
