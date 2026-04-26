import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

export const blogsApi = createApi({
  reducerPath: "blogsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/blogs`,
    credentials: "include",
  }),
  tagTypes: ["Blogs"],
  endpoints: (builder) => ({
    fetchAllBlogs: builder.query({
      query: ({ page = 1, limit = 12, includeDrafts = false } = {}) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (includeDrafts) params.append("includeDrafts", "true");
        return `${includeDrafts ? "/admin" : "/" }?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.blogs
          ? [
              ...result.blogs.map((blog) => ({ type: "Blogs", id: blog._id })),
              { type: "Blogs", id: "LIST" },
            ]
          : [{ type: "Blogs", id: "LIST" }],
    }),
    getBlogBySlug: builder.query({
      query: (slug) => `/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Blogs", id: slug }],
    }),
    getBlogById: builder.query({
      query: (id) => `/admin/${id}`,
      providesTags: (result, error, id) => [{ type: "Blogs", id }],
    }),
    addBlog: builder.mutation({
      query: (formData) => ({
        url: "/create-blog",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "Blogs", id: "LIST" }],
    }),
    updateBlog: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/update-blog/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Blogs", id },
        { type: "Blogs", id: "LIST" },
      ],
    }),
    deleteBlog: builder.mutation({
      query: (id) => ({
        url: `/delete-blog/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Blogs", id },
        { type: "Blogs", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useFetchAllBlogsQuery,
  useGetBlogBySlugQuery,
  useGetBlogByIdQuery,
  useAddBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = blogsApi;
