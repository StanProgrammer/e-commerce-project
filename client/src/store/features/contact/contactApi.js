import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

export const contactApi = createApi({
  reducerPath: "contactApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/contact`,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    sendContactMessage: builder.mutation({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
        timeout: 20000,
      }),
    }),
  }),
});

export const { useSendContactMessageMutation } = contactApi;

export default contactApi;
