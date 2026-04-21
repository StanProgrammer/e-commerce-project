import React from 'react'
import { useGetAdminStatsQuery } from '../../../store/features/stats/statsApi'
import AdminStats from './manageProduct/AdminStats'
import { useSelector } from 'react-redux'
import AdminStatsChart from './AdminStatsChart'

const AdminMain = () => {
    const { user } = useSelector((state) => state.auth)
    const { data: stats, isLoading, isError } = useGetAdminStatsQuery()
    if (isLoading) {
        return <div>Loading...</div>
    }
    if (isError) {
        return <div>Error loading stats</div>
    }
if (!stats) {
    return <div>No stats available</div>
}
  return (
    <div className='p-6'>
        <div>
            <h1 className='text-2xl font-semibold mb-4'>Admin Dashboard</h1>
            <p className='text-gray-500'>Hi {user?.username}! Welcome to your Admin Dashboard.</p>
            <AdminStats stats={stats} />
            <AdminStatsChart stats={stats} />
        </div>
    </div>
  )
}

export default AdminMain