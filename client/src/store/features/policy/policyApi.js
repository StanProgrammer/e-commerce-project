import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

export const policyApi = createApi({
  reducerPath: "policyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/policy`,
    credentials: "include",
  }),
  tagTypes: ["Policy"],
  endpoints: (builder) => ({
    getPolicy: builder.query({
      query: () => "/",
      providesTags: [{ type: "Policy", id: "CURRENT" }],
    }),
    updatePolicy: builder.mutation({
      query: (body) => ({
        url: "/",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Policy", id: "CURRENT" }],
    }),
  }),
});

export const { useGetPolicyQuery, useUpdatePolicyMutation } = policyApi;
