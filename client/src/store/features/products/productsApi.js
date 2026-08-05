import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/products`,
    credentials: "include",
  }),
  tagTypes: ["Products"],
  endpoints: (builder) => ({

    // FETCH ALL PRODUCTS (LIST + INDIVIDUAL TAGS)
    fetchAllProducts: builder.query({
      query: ({
        category,
        color,
        minPrice,
        maxPrice,
        search,
        page = 1,
        limit = 10,
      } = {}) => {
        const params = new URLSearchParams();

        if (category) params.append("category", category);
        if (color) params.append("color", color);
        if (minPrice) params.append("minPrice", String(minPrice));
        if (maxPrice) params.append("maxPrice", String(maxPrice));
        if (search) params.append("search", search);

        params.append("page", String(page));
        params.append("limit", String(limit));

        return `/?${params.toString()}`;
      },

      // 🔥 IMPORTANT FIX
      providesTags: (result) =>
        result?.products
          ? [
              ...result.products.map((product) => ({
                type: "Products",
                id: product._id,
              })),
              { type: "Products", id: "LIST" },
            ]
          : [{ type: "Products", id: "LIST" }],
    }),

    // GET SINGLE PRODUCT
    getSingleProduct: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [
        { type: "Products", id },
      ],
    }),

    // ADD PRODUCT
    addProduct: builder.mutation({
      query: (newProduct) => ({
        url: "/create-product",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    // UPDATE PRODUCT 
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/update-product/${id}`,
        method: "PATCH",
        body: formData,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },       // update single cache
        { type: "Products", id: "LIST" } // refresh list
      ],
    }),

    // RELATED PRODUCTS
    fetchRelatedProducts: builder.query({
      query: (id) => `/related-products/${id}`,
      providesTags: [{ type: "Products", id: "LIST" }],
    }),

    // DELETE PRODUCT
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/delete-product/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Products", id },
        { type: "Products", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useFetchAllProductsQuery,
  useGetSingleProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useFetchRelatedProductsQuery,
  useDeleteProductMutation,
} = productsApi;