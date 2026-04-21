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
    console.log("User Stats:", stats);
    if (isLoading) {
        return <div className="text-center">Loading...</div>;
    }
    if (isError) {
    return <div className='text-center text-red-500'>Failed to load data.</div>;
    }

    if (!stats) {
    return <div className='text-center'>No stats available.</div>;
    }
    const data = {
        labels: ["Total Spent", "Total Reviews", "Total Purchases"],
        datasets: [
        {
            label: "User Stats",
            data: [stats?.totalSpent || 0, stats?.totalReviews || 0, stats?.totalPurchased || 0],
            backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)"],
            borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)"],
            borderWidth: 1,
        },
        ],
    };
    


   const options = {
  responsive: true,

  scales: {
    y: {
      beginAtZero: true,
      min: 0,
      max: 100,
      ticks: {
        stepSize: 50,
        precision: 0, // removes decimals
      },
    },
  },

  plugins: {
    legend: {
      position: "top",
    },
    tooltip: {
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
    <div className="p-6 bg-gray-50 min-h-screen">
        
        {/* Header */}
        <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
            Welcome back, <span className="font-medium text-gray-700">{user?.username}</span>
        </p>
        </div>
        <UserStats stats={stats} />

       

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
            User Activity Overview
        </h3>

        <div className="h-[350px]">
            <Bar data={data} options={options} />
        </div>
        </div>
        
    </div>
    );
    };

    export default UserMain;
