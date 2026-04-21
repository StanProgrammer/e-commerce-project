import React from 'react'

const UserStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white p-5 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Total Spent</p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-2">
            ${stats?.totalSpent?.toFixed(2) || 0}
            </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Total Reviews</p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-2">
            {stats?.totalReviews || 0}
            </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
            <p className="text-sm text-gray-500">Total Purchases</p>
            <h2 className="text-2xl font-semibold text-gray-900 mt-2">
            {stats?.totalPurchased || 0}
            </h2>
        </div>

        </div>
  )
}

export default UserStats