import React from "react";
import { useSelector } from "react-redux";
import { useGetUserStatsQuery } from "../../../store/features/stats/statsApi";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import UserStats from "./UserStats";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserMain = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: stats, isLoading, isError } = useGetUserStatsQuery(user?.email);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
        Loading dashboard...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-lg border border-red-100 bg-red-50 text-sm font-semibold text-red-600">
        Failed to load dashboard data.
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
        No stats available.
      </div>
    );
  }

  const data = {
    labels: ["Total Spent", "Total Reviews", "Total Purchases"],
    datasets: [
      {
        label: "Activity",
        data: [stats?.totalSpent || 0, stats?.totalReviews || 0, stats?.totalPurchased || 0],
        backgroundColor: ["rgba(37, 99, 235, 0.82)", "rgba(5, 150, 105, 0.82)", "rgba(217, 119, 6, 0.82)"],
        borderColor: ["#2563eb", "#059669", "#d97706"],
        borderRadius: 10,
        borderSkipped: false,
        borderWidth: 1,
        maxBarThickness: 64,
      },
    ],
  };

  const maxStatValue = Math.max(stats?.totalSpent || 0, stats?.totalReviews || 0, stats?.totalPurchased || 0, 100);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#475569",
          font: {
            weight: 600,
          },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: Math.ceil(maxStatValue * 1.2),
        border: {
          display: false,
        },
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
        ticks: {
          color: "#64748b",
          precision: 0,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12,
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        displayColors: false,
        callbacks: {
          label: function (tooltipItem) {
            const value = Number(tooltipItem.raw) || 0;

            if (tooltipItem.label === "Total Spent") {
              return `Total Spent: $${value.toFixed(2)}`;
            }
            return `${tooltipItem.label}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Account Overview</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Welcome back, <span className="font-semibold text-slate-700">{user?.username}</span>. Here is a quick
              view of your purchases, reviews, and recent account activity.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-primary">
            <i className="ri-shield-check-line text-lg" aria-hidden="true" />
            Active account
          </div>
        </div>
      </div>

      <UserStats stats={stats} />

      {/* Chart Section */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Activity</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">User Activity Overview</h2>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
            <i className="ri-bar-chart-grouped-line text-lg text-primary" aria-hidden="true" />
            Current totals
          </div>
        </div>

        <div className="h-[320px] rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:h-[380px] sm:p-5">
          <Bar data={data} options={options} />
        </div>
      </section>
    </div>
  );
};

export default UserMain;
