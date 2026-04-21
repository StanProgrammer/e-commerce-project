import React from "react";

const AdminStats = ({ stats = {} }) => {
  const {
    totalRevenue = 0,
    totalOrders = 0,
    totalUsers = 0,
    totalProducts = 0,
  } = stats;

  const cards = [
    {
      title: "Total Earnings",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: "ri-money-dollar-circle-line",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "All Orders",
      value: totalOrders.toLocaleString(),
      icon: "ri-shopping-cart-2-line",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: "ri-user-3-line",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Products",
      value: totalProducts.toLocaleString(),
      icon: "ri-box-3-line",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, index) => (
          <div
            key={index}
            className="group relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Subtle hover gradient */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-linear-to-r from-gray-50 to-gray-100" />

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {card.title}
                </p>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {card.value}
                </h2>
              </div>

              <div
                className={`w-12 h-12 flex items-center justify-center rounded-xl ${card.bg}`}
              >
                <i className={`${card.icon} text-xl ${card.color}`} />
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 ${card.bg}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminStats;