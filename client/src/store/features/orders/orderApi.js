import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/orders`,
    credentials: "include",
  }),
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    // The signed-in user's own orders — email comes from the token.
    getMyOrders: builder.query({
      query: () => ({
        url: "/mine",
        method: "GET",
      }),
      transformResponse: (response) => (Array.isArray(response) ? response : []),
      providesTags: ["Orders"],
    }),
    getOrderById: builder.query({
      query: (orderId) => ({
        url: `/order/${orderId}`,
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),
    getAllOrders: builder.query({
      query: ({ page = 1, limit = 10, status = "" } = {}) => ({
        url: "/",
        method: "GET",
        params: { page, limit, ...(status ? { status } : {}) },
      }),
      providesTags: ["Orders"],
    }),
    createCheckoutSession: builder.mutation({
      query: ({ products }) => ({
        url: "/checkout-session",
        method: "POST",
        body: { products },
        timeout: 20000,
      }),
    }),
    confirmPayment: builder.mutation({
      query: ({ sessionId }) => ({
        url: "/confirm-payment",
        method: "POST",
        body: { sessionId },
        timeout: 45000,
      }),
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: `/update-order-status/${orderId}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Orders"],
    }),
    deleteOrder: builder.mutation({
      query: (orderId) => ({
        url: `/delete/${orderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});

export const {
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetAllOrdersQuery,
  useCreateCheckoutSessionMutation,
  useConfirmPaymentMutation,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} = orderApi;

export default orderApi;
