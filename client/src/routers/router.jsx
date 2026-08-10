import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App.jsx";
import PageSuspense from "../components/PageSuspense";
import Privateroutes from "./Privateroutes.jsx";

// Give each lazy route its own Suspense fallback.
const lazyElement = (importer) => {
  const Component = lazy(importer);

  return (
    <Suspense fallback={<PageSuspense />}>
      <Component />
    </Suspense>
  );
};

// Exported so tests can inspect the route tree without rendering it.
export const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: lazyElement(() => import("../pages/Home/Home.jsx")),
      },
      {
        path: "/category/:categoryName",
        element: lazyElement(() => import("../pages/Category/CategoryPage.jsx")),
      },
      {
        path: "/search",
        element: lazyElement(() => import("../pages/Search/Search.jsx")),
      },
      {
        path: "/shop",
        element: lazyElement(() => import("../pages/Shop/ShopPage.jsx")),
      },
      {
        path: "/contact",
        element: lazyElement(() => import("../pages/Contact/ContactPage.jsx")),
      },
      {
        path: "/blogs",
        element: lazyElement(() => import("../pages/Blog/BlogsPage.jsx")),
      },
      {
        path: "/blogs/:slug",
        element: lazyElement(() => import("../pages/Blog/BlogDetails.jsx")),
      },
      {
        path: "/team",
        element: lazyElement(() => import("../pages/Team/Team.jsx")),
      },
      {
        path: "/policy",
        element: lazyElement(() => import("../pages/Policy/PolicyPage.jsx")),
      },
      {
        path: "/shop/:id",
        element: lazyElement(() => import("../pages/Shop/product/ProductPage.jsx")),
      },
      {
        path: "checkout-success",
        element: lazyElement(() => import("../components/PaymentSuccess.jsx")),
      },
      {
        path: "/order/:orderId",
        element: lazyElement(() => import("../pages/dashboard/user/OrderDetails.jsx")),
      },
    ],
  },
  {
    path: "/login",
    element: lazyElement(() => import("../components/Login.jsx")),
  },
  {
    path: "/register",
    element: lazyElement(() => import("../components/Register.jsx")),
  },
  {
    path: "/forgot-password",
    element: lazyElement(() => import("../components/ForgotPassword.jsx")),
  },
  {
    path: "/reset-password/:token",
    element: lazyElement(() => import("../components/ResetPassword.jsx")),
  },
  // dashboard routes
  {
    path: "/dashboard",
    element: (
      <Privateroutes role="user">
        {lazyElement(() => import("../pages/dashboard/Dashboard.jsx"))}
      </Privateroutes>
    ),
    children: [
      {
        path: "",
        element: lazyElement(() => import("../pages/dashboard/user/UserMain.jsx")),
      },
      {
        path: "orders",
        element: lazyElement(() => import("./DashboardOrders.jsx")),
      },
      {
        path: "profile",
        element: lazyElement(() => import("../pages/dashboard/user/UserProfile.jsx")),
      },
      {
        path: "payments",
        element: lazyElement(() => import("../pages/dashboard/user/UserPayments.jsx")),
      },
      {
        path: "reviews",
        element: lazyElement(() => import("../pages/dashboard/user/UserReviews.jsx")),
      },
      {
        path: "feedback",
        element: lazyElement(() => import("../pages/dashboard/user/UserFeedback.jsx")),
      },
      // admin routes
      {
        path: "admin",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/AdminMain.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "add-product",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/addProduct/AddProduct.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "manage-products",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/manageProduct/ManageProducts.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "update-product/:id",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/manageProduct/UpdateProduct.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "user-management",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/users/ManageUsers.jsx"))}
          </Privateroutes>
        ),
      },
      // Old URL kept so bookmarks/links never hit a 404.
      {
        path: "manage-users",
        element: (
          <Privateroutes role="admin">
            <Navigate to="/dashboard/user-management" replace />
          </Privateroutes>
        ),
      },
      {
        path: "manage-orders",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/manageOrders/ManageOrders.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "manage-feedback",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/ManageFeedback.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "add-blog",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/blogs/AddBlog.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "manage-blogs",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/blogs/ManageBlogs.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "update-blog/:id",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/blogs/UpdateBlog.jsx"))}
          </Privateroutes>
        ),
      },
      {
        path: "manage-policy",
        element: (
          <Privateroutes role="admin">
            {lazyElement(() => import("../pages/dashboard/admin/policy/ManagePolicy.jsx"))}
          </Privateroutes>
        ),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;
