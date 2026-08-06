import React, { lazy, Suspense } from 'react'
import { useGetAdminStatsQuery } from '../../../store/features/stats/statsApi'
import AdminStats from './manageProduct/AdminStats'
import { useSelector } from 'react-redux'
import MessageState from '../../../components/MessageState'

// Chart.js is heavy — load it only when the admin dashboard actually renders.
const AdminStatsChart = lazy(() => import('./AdminStatsChart'))

const AdminMain = () => {
    const { user } = useSelector((state) => state.auth)
    const { data: stats, isLoading, isError } = useGetAdminStatsQuery()
    if (isLoading) {
        return <MessageState tone="loading" title="Loading admin dashboard" message="We are fetching the latest revenue, orders, users, and product stats." className="min-h-[60vh]" />
    }
    if (isError) {
        return <MessageState tone="error" title="Admin stats could not be loaded" message="Refresh the page in a moment. If the issue continues, confirm the server is running and your admin session is still valid." className="min-h-[60vh]" />
    }
if (!stats) {
    return <MessageState tone="empty" title="No admin stats available" message="Stats will appear here after orders, users, products, or reviews are available." className="min-h-[60vh]" />
}
  return (
    <div className='p-6'>
        <div>
            <h1 className='text-2xl font-semibold mb-4'>Admin Dashboard</h1>
            <p className='text-gray-500'>Hi {user?.username}! Welcome to your Admin Dashboard.</p>
            <AdminStats stats={stats} />
            <Suspense
              fallback={
                <div className="mt-10 flex items-center justify-center gap-3 text-sm font-medium text-slate-500">
                  <i className="ri-loader-4-line animate-spin text-xl text-primary" aria-hidden="true"></i>
                  Loading charts…
                </div>
              }
            >
              <AdminStatsChart stats={stats} />
            </Suspense>
        </div>
    </div>
  )
}

export default AdminMain
