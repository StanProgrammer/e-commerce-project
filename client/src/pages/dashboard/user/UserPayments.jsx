import React from 'react'
import { useGetOrdersByEmailQuery } from '../../../store/features/orders/orderApi';
import { useSelector } from 'react-redux';

const UserPayments = () => {
    const { user } = useSelector((state) => state.auth);
    const {data:ordersData ,isError,isLoading} = useGetOrdersByEmailQuery(user?.email ?? "", {
        skip: !user?.email,
      });
      if(isLoading){
        return <div>Loading...</div>
      }
        if(isError){
            return <div>Error fetching orders.</div>
        }
const orders = ordersData || [];
const totalPayments = orders.reduce((total, order) => total + order.amount, 0).toFixed(2);
  return (
    <div className='px-6'>
        <h3 className='text-xl font-semibold mb-4'>Your Payments</h3>
        <div>
            <p className='text-lg font-medium text-gray-700 mb-5'> Total Spent ${totalPayments ? totalPayments : 0}</p>
            <ul>
                {
                    orders && orders.length > 0 ? (
                        orders.map((order,index) => (
                            <li key={index}>
                                <h5 className='font-medium text-gray-800 mb-2'>Order #{index + 1}</h5>
                                <div>
                                    <span className='text-gray-600'>Order ${order?.amount?.toFixed(2) || 0}</span>
                                </div>
                                <div className='flex md:flex-row items-center space-x-2'>
                                    <span className='text-gray-600'>Date: {new Date(order?.createdAt).toLocaleDateString()}</span>
                                    <p className='text-gray-600'>
                                        Status: <span className={`ml-2 py-0.5 px-2 text-sm rounded ${order?.status === "completed" ? "bg-green-100 text-green-700" : order?.status === "pending" ? "bg-yellow-100 text-yellow-700" : order?.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                                            {order?.status}
                                        </span>
                                    </p>
                                </div>
                                <hr className='my-3' />
                            </li>
                        ))
                    ) : (
                        <li className='text-gray-500'>No orders found.</li>
                    )
                }
            </ul>
        </div>
    </div>
  )
}

export default UserPayments