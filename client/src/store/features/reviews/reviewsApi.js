import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/reviews`,
    credentials: "include",
  }),
  tagTypes: ["Reviews"],

  endpoints: (builder) => ({
    // Get reviews by user id 
    getReviewsByUserId: builder.query({
      query: (userId) => `/${userId}`, 
      providesTags: (result) =>
        result && Array.isArray(result)
          ? result.map(({ _id }) => ({ type: "Reviews", id: _id }))
          : [],
    }),

    // Post review
    postReview: builder.mutation({
      query: (newReview) => ({
        url: "/post-review",
        method: "POST",
        body: newReview,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Reviews", id: productId },
        "Reviews",
      ],
    }),
  }),
});

export const {
  useGetReviewsByUserIdQuery,
  usePostReviewMutation,
} = reviewsApi;