import { createApi,fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

const orderApi = createApi({
    reducerPath: "orderApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${getBaseUrl()}/api/orders`,
        credentials: "include",
    }),
    tagTypes: ["Orders"],
    endpoints: (builder) => ({
        getOrdersByEmail: builder.query({
            query: (email) => ({
                url: `/${email}`,
                method: "GET",  
            }),
                providesTags: ["Orders"],
        }),
        getOrderById: builder.query({
            query: (orderId) => ({
                url: `/order/${orderId}`,
                method: "GET",  
            }),
            providesTags: ["Orders"]
        }),
        getAllOrders: builder.query({
            query: () => ({
                url: `/`,
                method: "GET",
            }),
            providesTags: ["Orders"],
        }),
        updateOrderStatus: builder.mutation({
            query: ({ orderId, status }) => ({
                url: `/update-order-status/${orderId}`,
                method: "PATCH",
                body: { status }
                
            }),
            invalidatesTags: ["Orders"],
        }),
            deleteOrder: builder.mutation({
            query: (orderId) => ({
                url: `/delete/${orderId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Orders"],
        })

    }),
});
export const { useGetOrdersByEmailQuery, useGetOrderByIdQuery, useGetAllOrdersQuery, useUpdateOrderStatusMutation, useDeleteOrderMutation } = orderApi;
export default orderApi;