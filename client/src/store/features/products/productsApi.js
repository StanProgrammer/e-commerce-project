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

    // Fetch all products
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
        // 0 is a valid price floor — only skip truly missing values.
        if (minPrice !== undefined && minPrice !== null) params.append("minPrice", String(minPrice));
        if (maxPrice !== undefined && maxPrice !== null) params.append("maxPrice", String(maxPrice));
        if (search) params.append("search", search);

        params.append("page", String(page));
        params.append("limit", String(limit));

        return `/?${params.toString()}`;
      },

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

    // Get single product
    getSingleProduct: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [
        { type: "Products", id },
      ],
    }),

    // Add product
    addProduct: builder.mutation({
      query: (newProduct) => ({
        url: "/create-product",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    // Update product
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

    // Related products
    fetchRelatedProducts: builder.query({
      query: (id) => `/related-products/${id}`,
      providesTags: [{ type: "Products", id: "LIST" }],
    }),

    // Quick stock update (admin table inline editor)
    updateStock: builder.mutation({
      query: ({ id, stock }) => ({
        url: `/update-stock/${id}`,
        method: "PATCH",
        body: { stock },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Products", id },
        { type: "Products", id: "LIST" },
      ],
    }),

    // Delete product
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
  useUpdateStockMutation,
  useFetchRelatedProductsQuery,
  useDeleteProductMutation,
} = productsApi;