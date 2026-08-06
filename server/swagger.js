/**
 * OpenAPI 3.0.3 specification for the Wiles and Rues e-commerce API.
 *
 * This single module is the source of truth for the interactive Swagger UI
 * (/api-docs), the raw spec (/api-docs.json) and the generated Postman
 * collection (npm run docs:postman).
 *
 * Auth model: the JWT is stored in an httpOnly cookie named "token" (set by
 * login/register). Every protected endpoint also accepts the same JWT as a
 * `Authorization: Bearer <token>` header.
 */
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Wiles and Rues API",
    version: "1.0.0",
    description:
      "REST API for the Wiles and Rues e-commerce store — authentication, products, reviews, orders (Stripe checkout + webhooks), blogs, policies, feedback, contact and admin stats.\n\n" +
      "**Authentication** — log in with `POST /api/auth/login`; the server sets an httpOnly cookie named `token`. " +
      "Use the Authorize button (cookie) or send `Authorization: Bearer <token>` on protected routes. " +
      "Admin-only routes return `403` for non-admin users.",
    contact: {
      name: "Wiles and Rues",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local development",
    },
    {
      url: "https://e-commerce-project-hzpl.onrender.com/api",
      description: "Production (Render)",
    },
  ],
  tags: [
    { name: "Auth", description: "Register, login, password reset and session" },
    { name: "Users", description: "User profiles (self-service + admin listing)" },
    { name: "Admin", description: "Admin user management (role change, delete)" },
    { name: "Products", description: "Catalog CRUD (admin writes, public reads)" },
    { name: "Reviews", description: "Product reviews" },
    { name: "Orders", description: "Stripe checkout, webhooks and order management" },
    { name: "Stats", description: "User and admin dashboard statistics" },
    { name: "Contact", description: "Contact form emails" },
    { name: "Blogs", description: "Blog posts (admin writes, public reads)" },
    { name: "Policy", description: "Store terms & conditions" },
    { name: "Feedback", description: "Bug/feature feedback reports" },
    { name: "System", description: "Health check and image upload" },
  ],
  paths: {
    // ============================== AUTH ==============================
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        description: "Creates a user, hashes the password and sets the session cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Account created and logged in",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email + password",
        description: "Sets the httpOnly `token` cookie on success.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } },
          },
        },
        responses: {
          200: {
            description: "Logged in",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["Auth"],
        summary: "Log in with Google (ID token)",
        description: "Exchanges a Google OAuth credential for a session. Requires `GOOGLE_CLIENT_ID` to be configured.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/GoogleLoginRequest" } },
          },
        },
        responses: {
          200: {
            description: "Logged in with Google",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          409: { $ref: "#/components/responses/Conflict" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset email",
        description: "Always returns the same message whether or not the email exists (no account enumeration).",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" } },
          },
        },
        responses: {
          200: {
            description: "Reset link sent (or would have been)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset the password with a token",
        description: "Token comes from the reset email link. The token is valid for 15 minutes.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } },
          },
        },
        responses: {
          200: {
            description: "Password updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current session",
        description: "Returns the signed-in user, or `isAuthenticated: false` when there is no valid session.",
        responses: {
          200: {
            description: "Session state",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MeResponse" } } },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        description: "Clears the session cookie.",
        responses: {
          200: {
            description: "Logged out",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } },
          },
        },
      },
    },

    // ============================== USERS ==============================
    "/user": {
      get: {
        tags: ["Users"],
        summary: "List all users (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", description: "Page number (default 1)", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", description: "Items per page, max 100 (default 10)", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "search", in: "query", description: "Partial email search", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Paginated user list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserListResponse" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/user/{id}/profile": {
      patch: {
        tags: ["Users"],
        summary: "Update own profile (with optional avatar)",
        description: "Multipart form-data. `avatar` is an optional image file; `username`, `bio` and `profession` are optional text fields.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "User ObjectId (must be your own unless admin)", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", minLength: 3, maxLength: 30 },
                  bio: { type: "string", maxLength: 500 },
                  profession: { type: "string", maxLength: 100 },
                  avatar: { type: "string", format: "binary", description: "Image file (max 5MB)" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileUpdateResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/user/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update own account (JSON)",
        description: "Update username, email, profilePic, bio or profession. Must be your own account unless admin.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "User ObjectId", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRequest" } },
          },
        },
        responses: {
          200: {
            description: "User updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserUpdateResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    // ============================== ADMIN ==============================
    "/admin/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Change a user's role (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "User ObjectId", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRoleRequest" } },
          },
        },
        responses: {
          200: {
            description: "Role updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserRoleResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Soft-delete a user (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "User ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "User soft-deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ============================== PRODUCTS ==============================
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products (paginated, filterable)",
        parameters: [
          { name: "category", in: "query", description: "Category filter (use `all` to clear)", schema: { type: "string" } },
          { name: "color", in: "query", description: "Color filter (use `all` to clear)", schema: { type: "string" } },
          { name: "search", in: "query", description: "Case-insensitive name search", schema: { type: "string", maxLength: 100 } },
          { name: "minPrice", in: "query", schema: { type: "number", minimum: 0 } },
          { name: "maxPrice", in: "query", schema: { type: "number", minimum: 0 } },
          { name: "page", in: "query", description: "Page number (default 1)", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", description: "Items per page, max 100 (default 10)", schema: { type: "integer", minimum: 1, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "Paginated product list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductListResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/products/create-product": {
      post: {
        tags: ["Products"],
        summary: "Create a product (admin)",
        description: "Multipart form-data. Upload 1–5 images; the other fields are form text fields.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "category", "description", "price"],
                properties: {
                  name: { type: "string", minLength: 3, maxLength: 100 },
                  category: { type: "string", minLength: 2, maxLength: 50 },
                  description: { type: "string", minLength: 10, maxLength: 1000 },
                  price: { type: "number", minimum: 0.01 },
                  oldPrice: { type: "number", minimum: 0, description: "Must be greater than price" },
                  stock: { type: "integer", minimum: 0, description: "Leave empty for unlimited stock" },
                  color: { type: "string", maxLength: 30 },
                  rating: { type: "number", minimum: 0, maximum: 5 },
                  images: { type: "array", items: { type: "string", format: "binary" }, description: "1–5 image files" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Product created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/products/related-products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get related products",
        parameters: [
          { name: "id", in: "path", required: true, description: "Product ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Related products (up to 8)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RelatedProductsResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get a single product with its reviews",
        parameters: [
          { name: "id", in: "path", required: true, description: "Product ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Product detail + reviews",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductDetailResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/products/update-product/{id}": {
      patch: {
        tags: ["Products"],
        summary: "Update a product (admin)",
        description: "Multipart form-data. Upload new images and/or pass `existingImages` (JSON-encoded array of URLs) to keep.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Product ObjectId", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 3, maxLength: 100 },
                  category: { type: "string", minLength: 2, maxLength: 50 },
                  description: { type: "string", minLength: 10, maxLength: 1000 },
                  price: { type: "number", minimum: 0.01 },
                  oldPrice: { type: "number", minimum: 0 },
                  stock: { type: "integer", minimum: 0 },
                  color: { type: "string", maxLength: 30 },
                  rating: { type: "number", minimum: 0, maximum: 5 },
                  existingImages: { type: "string", description: 'JSON-encoded array of image URLs to keep, e.g. ["url1","url2"]' },
                  images: { type: "array", items: { type: "string", format: "binary" }, description: "New image files (up to 5)" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Product updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/products/delete-product/{id}": {
      delete: {
        tags: ["Products"],
        summary: "Soft-delete a product (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Product ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Product soft-deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ============================== REVIEWS ==============================
    "/reviews/post-review": {
      post: {
        tags: ["Reviews"],
        summary: "Post (or update) a review",
        description: "Only purchasers of the product may review it. Re-posting updates the existing review.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PostReviewRequest" } },
          },
        },
        responses: {
          200: {
            description: "Review updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewWriteResponse" } } },
          },
          201: {
            description: "Review created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/reviews/total-reviews": {
      get: {
        tags: ["Reviews"],
        summary: "Get the total number of reviews",
        responses: {
          200: {
            description: "Total review count",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TotalReviewsResponse" } } },
          },
        },
      },
    },
    "/reviews/{userId}": {
      get: {
        tags: ["Reviews"],
        summary: "Get a user's reviews",
        description: "Users can only view their own reviews unless admin.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "userId", in: "path", required: true, description: "User ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "List of the user's reviews",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Review" } } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    // ============================== ORDERS ==============================
    "/orders/checkout-session": {
      post: {
        tags: ["Orders"],
        summary: "Create a Stripe checkout session",
        description: "Validates stock server-side, then returns the hosted Stripe checkout URL.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CheckoutRequest" } },
          },
        },
        responses: {
          200: {
            description: "Checkout session created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CheckoutResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/orders/confirm-payment": {
      post: {
        tags: ["Orders"],
        summary: "Confirm a checkout session and record the order",
        description: "Idempotent — safe to call again after a page refresh. The Stripe webhook does the same work. " +
          "Authentication is optional: a guest can confirm, while a signed-in user is checked against the session owner.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ConfirmPaymentRequest" } },
          },
        },
        responses: {
          200: {
            description: "Payment confirmed and order recorded",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ConfirmPaymentResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/orders/webhook": {
      post: {
        tags: ["Orders"],
        summary: "Stripe webhook",
        description:
          "Receives `checkout.session.completed` (records paid orders + decrements stock) and `payment_intent.payment_failed` (marks orders canceled). " +
          "Requires a valid `Stripe-Signature` header — the body must be sent raw.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object", description: "Raw Stripe event payload" } },
          },
        },
        responses: {
          200: {
            description: "Event received",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/orders/mine": {
      get: {
        tags: ["Orders"],
        summary: "Get the signed-in user's orders",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "The user's orders (newest first)",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Order" } } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/orders/order/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get one order by id",
        description: "Users can only view their own orders unless admin.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Order ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Order detail",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "List all orders (admin, paginated + filterable)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", description: "Page number (default 1)", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", description: "Items per page, max 100 (default 10)", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "status", in: "query", description: "Filter by status: pending, processing, shipped, delivered, canceled", schema: { type: "string" } },
          { name: "search", in: "query", description: "Partial email search", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Paginated order list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderListResponse" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/orders/update-order-status/{id}": {
      patch: {
        tags: ["Orders"],
        summary: "Update an order's status (admin)",
        description: "Sends the customer a status email for shipped/delivered/canceled.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Order ObjectId", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateOrderStatusRequest" } },
          },
        },
        responses: {
          200: {
            description: "Status updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderStatusResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/orders/delete/{id}": {
      delete: {
        tags: ["Orders"],
        summary: "Soft-delete an order (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Order ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Order soft-deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderStatusResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ============================== STATS ==============================
    "/stats/user-stats/mine": {
      get: {
        tags: ["Stats"],
        summary: "Get the signed-in user's stats",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "User stats",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserStats" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/stats/user-stats/{email}": {
      get: {
        tags: ["Stats"],
        summary: "Get stats for a user by email (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "email", in: "path", required: true, description: "User email", schema: { type: "string", format: "email" } },
        ],
        responses: {
          200: {
            description: "User stats",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserStats" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/stats/admin-stats": {
      get: {
        tags: ["Stats"],
        summary: "Get admin dashboard stats (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Admin stats",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AdminStats" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    // ============================== CONTACT ==============================
    "/contact": {
      post: {
        tags: ["Contact"],
        summary: "Send a contact form message",
        description: "Emails the store inbox via Resend. Returns 500 when email is not configured.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ContactRequest" } },
          },
        },
        responses: {
          200: {
            description: "Message sent",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContactResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { $ref: "#/components/responses/TooManyRequests" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ============================== BLOGS ==============================
    "/blogs": {
      get: {
        tags: ["Blogs"],
        summary: "List published blogs (paginated)",
        parameters: [
          { name: "page", in: "query", description: "Page number (default 1)", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", description: "Items per page, max 100 (default 12)", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "includeDrafts", in: "query", description: "Include unpublished posts (admin only)", schema: { type: "boolean" } },
        ],
        responses: {
          200: {
            description: "Paginated blog list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BlogListResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/blogs/admin": {
      get: {
        tags: ["Blogs"],
        summary: "List all blogs incl. drafts (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", description: "Page number (default 1)", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", description: "Items per page, max 100 (default 12)", schema: { type: "integer", minimum: 1, maximum: 100 } },
        ],
        responses: {
          200: {
            description: "Paginated blog list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BlogListResponse" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/blogs/slug/{slug}": {
      get: {
        tags: ["Blogs"],
        summary: "Get a published blog by slug",
        parameters: [
          { name: "slug", in: "path", required: true, description: "Blog slug", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Blog found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BlogResponse" } } },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/blogs/admin/{id}": {
      get: {
        tags: ["Blogs"],
        summary: "Get any blog by id (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Blog ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Blog found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BlogResponse" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/blogs/create-blog": {
      post: {
        tags: ["Blogs"],
        summary: "Create a blog post (admin)",
        description: "Multipart form-data. `image` is an optional file; the other fields are form text fields.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "subtitle", "excerpt", "content"],
                properties: {
                  title: { type: "string", minLength: 3, maxLength: 160 },
                  subtitle: { type: "string", minLength: 2, maxLength: 80 },
                  slug: { type: "string", description: "Optional; auto-generated from title when empty" },
                  excerpt: { type: "string", minLength: 10, maxLength: 300 },
                  content: { type: "string", minLength: 50, maxLength: 10000 },
                  imageUrl: { type: "string", description: "Optional URL when no image file is uploaded" },
                  publishedAt: { type: "string", format: "date-time" },
                  isPublished: { type: "boolean" },
                  image: { type: "string", format: "binary", description: "Optional image file" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Blog created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BlogWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/blogs/update-blog/{id}": {
      patch: {
        tags: ["Blogs"],
        summary: "Update a blog post (admin)",
        description: "Multipart form-data. `image` is an optional replacement image file.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Blog ObjectId", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", minLength: 3, maxLength: 160 },
                  subtitle: { type: "string", minLength: 2, maxLength: 80 },
                  slug: { type: "string" },
                  excerpt: { type: "string", minLength: 10, maxLength: 300 },
                  content: { type: "string", minLength: 50, maxLength: 10000 },
                  imageUrl: { type: "string" },
                  publishedAt: { type: "string", format: "date-time" },
                  isPublished: { type: "boolean" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Blog updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/BlogWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/blogs/delete-blog/{id}": {
      delete: {
        tags: ["Blogs"],
        summary: "Soft-delete a blog post (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Blog ObjectId", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Blog soft-deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ============================== POLICY ==============================
    "/policy": {
      get: {
        tags: ["Policy"],
        summary: "Get the store policy",
        responses: {
          200: {
            description: "Policy document",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PolicyResponse" } } },
          },
        },
      },
      patch: {
        tags: ["Policy"],
        summary: "Update the store policy (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdatePolicyRequest" } },
          },
        },
        responses: {
          200: {
            description: "Policy updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PolicyWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    // ============================== FEEDBACK ==============================
    "/feedback": {
      get: {
        tags: ["Feedback"],
        summary: "List all feedback (admin, filterable)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", description: "new, in_progress, resolved or rejected", schema: { type: "string" } },
          { name: "type", in: "query", description: "bug or feature", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Feedback list",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Feedback" } } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
      post: {
        tags: ["Feedback"],
        summary: "Submit feedback (bug or feature)",
        description: "Authentication is optional — signed-in users get their identity attached to the report. Guests submit anonymously.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateFeedbackRequest" } },
          },
        },
        responses: {
          201: {
            description: "Feedback submitted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/FeedbackWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/feedback/me": {
      get: {
        tags: ["Feedback"],
        summary: "Get the signed-in user's feedback",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "The user's feedback",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Feedback" } } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/feedback/{id}/status": {
      patch: {
        tags: ["Feedback"],
        summary: "Update feedback status (admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, description: "Feedback ObjectId", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/FeedbackStatusRequest" } },
          },
        },
        responses: {
          200: {
            description: "Status updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/FeedbackWriteResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ============================== SYSTEM ==============================
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        description: "Reports server status, environment, DB connection state and Redis health.",
        responses: {
          200: {
            description: "Health status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
          },
        },
      },
    },
    "/upload-image": {
      post: {
        tags: ["System"],
        summary: "Upload an image to Cloudinary (admin)",
        description: "Body is a JSON object with a base64 data-URI `image` field.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UploadImageRequest" } },
          },
        },
        responses: {
          200: {
            description: "Image uploaded",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UploadImageResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "JWT session cookie set by login/register.",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Alternative: send the JWT in the Authorization header.",
      },
    },
    responses: {
      BadRequest: {
        description: "Validation failed or malformed request",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Unauthorized: {
        description: "Missing, invalid or expired session",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Forbidden: {
        description: "Authenticated but not allowed (admin-only, or not your own resource)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Conflict: {
        description: "Resource already exists (e.g. email/username in use)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      TooManyRequests: {
        description: "Rate limit exceeded",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      ServerError: {
        description: "Internal server error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
    schemas: {
      // ------------------------------ COMMON ------------------------------
      MessageResponse: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          error: { type: "string", description: "Sometimes present with technical details" },
        },
      },
      ObjectId: { type: "string", description: "MongoDB ObjectId (24 hex chars)", pattern: "^[a-fA-F0-9]{24}$" },

      // ------------------------------ AUTH ------------------------------
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 30, pattern: "^[a-zA-Z0-9]+$", description: "Letters and numbers only" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128, description: "Must include upper, lower, digit and special character" },
          profilePic: { type: "string", format: "uri" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
          remember: { type: "boolean", description: "Extend the session to 30 days" },
        },
      },
      GoogleLoginRequest: {
        type: "object",
        required: ["credential"],
        properties: { credential: { type: "string", description: "Google ID token (JWT)" } },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
          phone: { type: "string", description: "Optional, 7–20 chars" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", description: "64-char hex token from the reset email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          id: { $ref: "#/components/schemas/ObjectId" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["user", "admin"] },
          profilePic: { type: "string" },
          bio: { type: "string" },
          profession: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      MeResponse: {
        type: "object",
        properties: {
          isAuthenticated: { type: "boolean" },
          user: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/User" }],
            description: "The signed-in user, or null when not authenticated",
          },
        },
      },

      // ------------------------------ USERS ------------------------------
      UserListResponse: {
        type: "object",
        properties: {
          users: { type: "array", items: { type: "object", properties: { _id: { $ref: "#/components/schemas/ObjectId" }, email: { type: "string" }, role: { type: "string" } } } },
          totalUsers: { type: "integer" },
          totalPages: { type: "integer" },
          currentPage: { type: "integer" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          username: { type: "string", minLength: 3, maxLength: 30 },
          email: { type: "string", format: "email" },
          profilePic: { type: "string", format: "uri" },
          bio: { type: "string", maxLength: 500 },
          profession: { type: "string", maxLength: 100 },
        },
      },
      UserUpdateResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      ProfileUpdateResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
          avatar: {
            type: "object",
            nullable: true,
            properties: { url: { type: "string" }, publicId: { type: "string" } },
          },
        },
      },
      UpdateUserRoleRequest: {
        type: "object",
        required: ["role"],
        properties: { role: { type: "string", enum: ["user", "admin"] } },
      },
      UserRoleResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          user: { type: "object", properties: { id: { $ref: "#/components/schemas/ObjectId" }, email: { type: "string" }, role: { type: "string" } } },
        },
      },

      // ------------------------------ PRODUCTS ------------------------------
      Product: {
        type: "object",
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          name: { type: "string" },
          category: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          oldPrice: { type: "number" },
          stock: { type: "integer", nullable: true, description: "Absent/null means unlimited stock" },
          images: { type: "array", items: { type: "string", format: "uri" } },
          color: { type: "string" },
          rating: { type: "number", minimum: 0, maximum: 5 },
          author: { $ref: "#/components/schemas/ObjectId" },
          isDeleted: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductListResponse: {
        type: "object",
        properties: {
          products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
          totalProducts: { type: "integer" },
          totalPages: { type: "integer" },
          currentPage: { type: "integer" },
        },
      },
      ProductWriteResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          product: { $ref: "#/components/schemas/Product" },
        },
      },
      ProductDetailResponse: {
        type: "object",
        properties: {
          product: { $ref: "#/components/schemas/Product" },
          reviews: { type: "array", items: { $ref: "#/components/schemas/Review" } },
        },
      },
      RelatedProductsResponse: {
        type: "object",
        properties: {
          relatedProducts: { type: "array", items: { $ref: "#/components/schemas/Product" } },
        },
      },

      // ------------------------------ REVIEWS ------------------------------
      Review: {
        type: "object",
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          comment: { type: "string" },
          rating: { type: "integer", minimum: 0, maximum: 5 },
          userId: { $ref: "#/components/schemas/ObjectId" },
          productId: { $ref: "#/components/schemas/ObjectId" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PostReviewRequest: {
        type: "object",
        required: ["comment", "rating", "productId"],
        properties: {
          comment: { type: "string", minLength: 3, maxLength: 500 },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          productId: { $ref: "#/components/schemas/ObjectId" },
        },
      },
      ReviewWriteResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          review: { $ref: "#/components/schemas/Review" },
        },
      },
      TotalReviewsResponse: {
        type: "object",
        properties: { totalReviews: { type: "integer" } },
      },

      // ------------------------------ ORDERS ------------------------------
      CheckoutRequest: {
        type: "object",
        required: ["products"],
        properties: {
          products: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["_id", "quantity"],
              properties: {
                _id: { $ref: "#/components/schemas/ObjectId", description: "Product id" },
                quantity: { type: "integer", minimum: 1 },
              },
            },
          },
        },
      },
      CheckoutResponse: {
        type: "object",
        properties: {
          id: { type: "string", description: "Stripe checkout session id" },
          url: { type: "string", format: "uri", description: "Hosted Stripe checkout page" },
        },
      },
      ConfirmPaymentRequest: {
        type: "object",
        required: ["sessionId"],
        properties: { sessionId: { type: "string", description: "Stripe checkout session id" } },
      },
      ConfirmPaymentResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          order: { $ref: "#/components/schemas/Order" },
        },
      },
      WebhookResponse: {
        type: "object",
        properties: { received: { type: "boolean", example: true } },
      },
      ShippingAddress: {
        type: "object",
        properties: {
          name: { type: "string" },
          line1: { type: "string" },
          line2: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: { type: "string" },
          country: { type: "string" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          orderId: { type: "string", description: "Stripe payment intent id" },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { $ref: "#/components/schemas/ObjectId" },
                quantity: { type: "integer", minimum: 1 },
              },
            },
          },
          amount: { type: "number", description: "Order total in dollars" },
          email: { type: "string", format: "email" },
          status: { type: "string", enum: ["pending", "processing", "shipped", "delivered", "canceled"] },
          statusHistory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                status: { type: "string" },
                time: { type: "string", format: "date-time" },
              },
            },
          },
          shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderListResponse: {
        type: "object",
        properties: {
          orders: { type: "array", items: { $ref: "#/components/schemas/Order" } },
          totalOrders: { type: "integer" },
          totalPages: { type: "integer" },
          currentPage: { type: "integer" },
        },
      },
      UpdateOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", enum: ["pending", "processing", "shipped", "delivered", "canceled"] } },
      },
      OrderStatusResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          order: { $ref: "#/components/schemas/Order" },
        },
      },

      // ------------------------------ STATS ------------------------------
      UserStats: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          totalReviews: { type: "integer" },
          totalPurchased: { type: "integer", description: "Total items purchased" },
          totalSpent: { type: "number", description: "Total spent in dollars" },
        },
      },
      AdminStats: {
        type: "object",
        properties: {
          totalUsers: { type: "integer" },
          totalOrders: { type: "integer" },
          totalProducts: { type: "integer" },
          totalReviews: { type: "integer" },
          totalRevenue: { type: "number" },
          monthlyRevenue: {
            type: "array",
            items: {
              type: "object",
              properties: {
                year: { type: "string" },
                month: { type: "string" },
                revenue: { type: "number" },
              },
            },
          },
        },
      },

      // ------------------------------ CONTACT ------------------------------
      ContactRequest: {
        type: "object",
        required: ["firstName", "lastName", "email", "subject", "message"],
        properties: {
          firstName: { type: "string", minLength: 2, maxLength: 50 },
          lastName: { type: "string", minLength: 2, maxLength: 50 },
          email: { type: "string", format: "email" },
          subject: { type: "string", minLength: 3, maxLength: 120 },
          message: { type: "string", minLength: 10, maxLength: 2000 },
        },
      },
      ContactResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          id: { type: "string", description: "Resend email id" },
        },
      },

      // ------------------------------ BLOGS ------------------------------
      Blog: {
        type: "object",
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          title: { type: "string" },
          subtitle: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          imageUrl: { type: "string" },
          publishedAt: { type: "string", format: "date-time" },
          isPublished: { type: "boolean" },
          author: { $ref: "#/components/schemas/ObjectId" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      BlogListResponse: {
        type: "object",
        properties: {
          blogs: { type: "array", items: { $ref: "#/components/schemas/Blog" } },
          totalBlogs: { type: "integer" },
          totalPages: { type: "integer" },
          currentPage: { type: "integer" },
        },
      },
      BlogResponse: {
        type: "object",
        properties: { blog: { $ref: "#/components/schemas/Blog" } },
      },
      BlogWriteResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          blog: { $ref: "#/components/schemas/Blog" },
        },
      },

      // ------------------------------ POLICY ------------------------------
      PolicySection: {
        type: "object",
        required: ["category", "title", "content"],
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          category: { type: "string", enum: ["buying", "selling", "general"] },
          title: { type: "string", minLength: 3, maxLength: 120 },
          content: { type: "string", minLength: 20, maxLength: 5000 },
          order: { type: "integer", minimum: 0 },
        },
      },
      Policy: {
        type: "object",
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          key: { type: "string" },
          title: { type: "string" },
          introduction: { type: "string" },
          sections: { type: "array", items: { $ref: "#/components/schemas/PolicySection" } },
          updatedBy: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PolicyResponse: {
        type: "object",
        properties: { policy: { $ref: "#/components/schemas/Policy" } },
      },
      UpdatePolicyRequest: {
        type: "object",
        required: ["title", "introduction", "sections"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 160 },
          introduction: { type: "string", minLength: 20, maxLength: 2000 },
          sections: { type: "array", minItems: 1, items: { $ref: "#/components/schemas/PolicySection" } },
        },
      },
      PolicyWriteResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          policy: { $ref: "#/components/schemas/Policy" },
        },
      },

      // ------------------------------ FEEDBACK ------------------------------
      FeedbackUser: {
        type: "object",
        properties: {
          userId: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/ObjectId" }],
            description: "Null for anonymous (guest) feedback",
          },
          username: { type: "string" },
          email: { type: "string" },
          role: { type: "string" },
        },
      },
      Feedback: {
        type: "object",
        properties: {
          _id: { $ref: "#/components/schemas/ObjectId" },
          type: { type: "string", enum: ["bug", "feature"] },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["new", "in_progress", "resolved", "rejected"] },
          user: { $ref: "#/components/schemas/FeedbackUser" },
          pageUrl: { type: "string" },
          userAgent: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateFeedbackRequest: {
        type: "object",
        required: ["type", "title", "description"],
        properties: {
          type: { type: "string", enum: ["bug", "feature"] },
          title: { type: "string", minLength: 3, maxLength: 120 },
          description: { type: "string", minLength: 10, maxLength: 3000 },
          pageUrl: { type: "string", maxLength: 1000 },
        },
      },
      FeedbackStatusRequest: {
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", enum: ["new", "in_progress", "resolved", "rejected"] } },
      },
      FeedbackWriteResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          feedback: { $ref: "#/components/schemas/Feedback" },
        },
      },

      // ------------------------------ SYSTEM ------------------------------
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "degraded"] },
          environment: { type: "string" },
          dbState: { type: "integer", description: "Mongoose connection readyState" },
          redis: { type: "object", nullable: true },
        },
      },
      UploadImageRequest: {
        type: "object",
        required: ["image"],
        properties: { image: { type: "string", description: "Base64 data-URI, e.g. data:image/png;base64,..." } },
      },
      UploadImageResponse: {
        type: "object",
        properties: { url: { type: "string", format: "uri" } },
      },
    },
  },
};

module.exports = { swaggerSpec, swaggerUi };
