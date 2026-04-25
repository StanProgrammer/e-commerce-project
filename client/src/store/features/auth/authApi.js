import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BACKEND_URL,
    credentials: "include",
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    loginUser: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    googleLoginUser: builder.mutation({
      query: (body) => ({
        url: "/auth/google",
        method: "POST",
        body,
      }),
    }),
    logoutUser: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    getUserProfile: builder.query({
      query: () => ({
        url: "/user",
        method: "GET",
      }),
      refetchOnMountOrArgChange: true,
      invalidatesTags: ["User"],
    }),
    deleteUserAccount: builder.mutation({
      query: (userId) => ({
        url: `/admin/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/admin/${userId}`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["User"],
    }),
    updateUserProfile: builder.mutation({
      query: ({ userId, profileData }) => ({
        url: `/api/user/${userId}`,
        method: "PATCH",
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),
    editProfile: builder.mutation({
      query: ({ userId, body }) => ({
        url: `/user/${userId}`,
        method: "PATCH",
        body,
      }),
    }),
    updateProfileWithAvatar: builder.mutation({
      query: ({ userId, formData }) => ({
        url: `/user/${userId}/profile`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGoogleLoginUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserProfileMutation,
  useDeleteUserAccountMutation,
  useLogoutUserMutation,
  useGetUserProfileQuery,
  useEditProfileMutation,
  useUpdateProfileWithAvatarMutation,
} = authApi;

export default authApi;
