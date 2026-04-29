import React from 'react'

const UserStats = ({ stats }) => {
  const cards = [
    {
      title: "Total Spent",
      value: `$${(stats?.totalSpent || 0).toFixed(2)}`,
      helper: "Lifetime order value",
      icon: "ri-wallet-3-line",
      color: "text-blue-600",
      bg: "bg-blue-50",
      ring: "ring-blue-100",
    },
    {
      title: "Total Reviews",
      value: stats?.totalReviews || 0,
      helper: "Product feedback shared",
      icon: "ri-star-smile-line",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
    },
    {
      title: "Total Purchases",
      value: stats?.totalPurchased || 0,
      helper: "Completed purchases",
      icon: "ri-shopping-bag-3-line",
      color: "text-amber-600",
      bg: "bg-amber-50",
      ring: "ring-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
      {cards.map((card) => (
        <article
          key={card.title}
          className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{card.value}</h2>
            </div>

            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bg} ${card.ring} ring-1`}>
              <i className={`${card.icon} text-2xl ${card.color}`} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-400">{card.helper}</p>
            <i
              className={`ri-arrow-right-up-line text-lg ${card.color} opacity-0 transition group-hover:opacity-100`}
              aria-hidden="true"
            />
          </div>
        </article>
      ))}
    </div>
  )
}

export default UserStats
