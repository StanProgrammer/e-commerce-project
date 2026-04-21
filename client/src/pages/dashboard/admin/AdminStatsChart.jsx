import React, { useMemo } from "react";
import { Pie, Line } from "react-chartjs-2";
import "chart.js/auto";

const AdminStatsChart = ({ stats }) => {
  // 🧠 Memoized Pie Data
  const pieData = useMemo(() => {
    return {
      labels: ["Total Reviews", "Total Orders", "Total Users", "Total Products"],
      datasets: [
        {
          label: "Admin Stats",
          data: [stats?.totalReviews || 0, stats?.totalOrders || 0, stats?.totalUsers || 0, stats?.totalProducts || 0],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  // 🧠 Memoized Line Data
  const lineData = useMemo(() => {
    const monthlyData = new Array(12).fill(0);

    stats?.monthlyRevenue?.forEach((item) => {
      const index = item.month - 1;
      monthlyData[index] = item.revenue;
    });

    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Monthly Earnings",
          data: monthlyData,
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.1)",
          borderColor: "#36A2EB",
          pointBackgroundColor: "#36A2EB",
          tension: 0.4,
        },
      ],
    };
  }, [stats]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
        },
      },
    },
  };

  if (!stats) {
    return <div className="mt-12 text-center text-gray-500">No data available</div>;
  }

  return (
    <div className="mt-10 px-2 sm:px-4 lg:px-6">
      {/* Header */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Admin Stats Overview</h2>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Distribution Overview</h3>

          <div className="h-75 sm:h-87.5">
            <Pie data={pieData} options={commonOptions} />
          </div>
        </div>

        {/* Line Chart Card */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 hover:shadow-lg transition">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Monthly Earnings</h3>

          <div className="h-75 sm:h-87.5">
            <Line
              data={lineData}
              options={{
                ...commonOptions,
                plugins: {
                  ...commonOptions.plugins,
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsChart;
