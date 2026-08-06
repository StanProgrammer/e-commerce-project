import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

export const feedbackApi = createApi({
  reducerPath: "feedbackApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/feedback`,
    credentials: "include",
  }),
  tagTypes: ["Feedback"],
  endpoints: (builder) => ({
    submitFeedback: builder.mutation({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Feedback"],
    }),
    getMyFeedback: builder.query({
      query: () => ({
        url: "/me",
        method: "GET",
      }),
      providesTags: ["Feedback"],
    }),
    getAllFeedback: builder.query({
      query: ({ status = "all", type = "all" } = {}) => ({
        url: "/",
        method: "GET",
        params: { status, type },
      }),
      providesTags: ["Feedback"],
    }),
    updateFeedbackStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Feedback"],
    }),
  }),
});

export const {
  useSubmitFeedbackMutation,
  useGetMyFeedbackQuery,
  useGetAllFeedbackQuery,
  useUpdateFeedbackStatusMutation,
} = feedbackApi;
