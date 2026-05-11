import { createBrowserRouter } from "react-router-dom";
import { useSelector } from "react-redux";
import App from "../App.jsx";
import Home from "../pages/Home/Home.jsx";
import CategoryPage from "../pages/Category/CategoryPage.jsx";
import Search from "../pages/Search/Search.jsx";
import ShopPage from "../pages/Shop/ShopPage.jsx";
import ProductPage from "../pages/Shop/product/ProductPage.jsx";
import ContactPage from "../pages/Contact/ContactPage.jsx";
import Team from "../pages/Team/Team.jsx";
import Login from "../components/Login.jsx";
import Register from "../components/Register.jsx";
import ForgotPassword from "../components/ForgotPassword.jsx";
import ResetPassword from "../components/ResetPassword.jsx";
import PaymentSuccess from "../components/PaymentSuccess.jsx";
import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Privateroutes from "./Privateroutes.jsx";
import UserMain from "../pages/dashboard/user/UserMain.jsx";
import UserOrders from "../pages/dashboard/user/UserOrders.jsx";
import OrderDetails from "../pages/dashboard/user/OrderDetails.jsx";
import UserPayments from "../pages/dashboard/user/UserPayments.jsx";
import UserReviews from "../pages/dashboard/user/UserReviews.jsx";
import UserProfile from "../pages/dashboard/user/UserProfile.jsx";
import AdminMain from "../pages/dashboard/admin/AdminMain.jsx";
import AddProduct from "../pages/dashboard/admin/addProduct/AddProduct.jsx";
import ManageProducts from "../pages/dashboard/admin/manageProduct/ManageProducts.jsx";
import UpdateProduct from "../pages/dashboard/admin/manageProduct/UpdateProduct.jsx";
import ManageUsers from "../pages/dashboard/admin/users/ManageUsers.jsx";
import ManageOrders from "../pages/dashboard/admin/manageOrders/ManageOrders.jsx";
import BlogsPage from "../pages/Blog/BlogsPage.jsx";
import BlogDetails from "../pages/Blog/BlogDetails.jsx";
import AddBlog from "../pages/dashboard/admin/blogs/AddBlog.jsx";
import ManageBlogs from "../pages/dashboard/admin/blogs/ManageBlogs.jsx";
import UpdateBlog from "../pages/dashboard/admin/blogs/UpdateBlog.jsx";
import PolicyPage from "../pages/Policy/PolicyPage.jsx";
import ManagePolicy from "../pages/dashboard/admin/policy/ManagePolicy.jsx";

const DashboardOrders = () => {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === "admin") {
    return (
      <Privateroutes role="admin">
        <ManageOrders />
      </Privateroutes>
    );
  }

  return <UserOrders />;
};

const router = createBrowserRouter ([
  {
    path: "/",
    element: <App/>,
    children: [
      {
        path: "/",
        element: <Home/>,
      },
      {
        path:"/category/:categoryName",
        element:<CategoryPage/>,
      },
      {
        path: "/search",
        element: <Search/>,
      },
      {
        path: "/shop",
        element: <ShopPage/>,
      },
      {
        path: "/contact",
        element: <ContactPage/>,
      },
      {
        path: "/blogs",
        element: <BlogsPage/>,
      },
      {
        path: "/blogs/:slug",
        element: <BlogDetails/>,
      },
      {
        path: "/team",
        element: <Team/>,
      },
      {
        path: "/policy",
        element: <PolicyPage/>,
      },
      {
        path:"/shop/:id",
        element:<ProductPage/>,
      },
      {
        path:"checkout-success",
        element:<PaymentSuccess/>,
      },
      {
        path:"/order/:orderId",
        element:<OrderDetails/>
      }
    ]
  },
  {
    path: "/login",
    element:<Login/>
  },
  {
    path: "/register",
    element:<Register/>
  },
  {
    path: "/forgot-password",
    element:<ForgotPassword/>
  },
  {
    path: "/reset-password/:token",
    element:<ResetPassword/>
  },
  // dashboard routes
  {
    path: "/dashboard",
    element: <Privateroutes role="user"><Dashboard/></Privateroutes>,
    children: [
      {
        path: "",
        element: <UserMain/>,
      },
      {
        path:"orders",
        element:<DashboardOrders/>
      },
      {
        path:"profile",
        element:<UserProfile/>
      },
      {
        path:"payments",
        element:<UserPayments/>
      },
      {
        path:"reviews",
        element:<UserReviews/>
      },

      // admin routes
      {
        path:"admin",
        element:<Privateroutes role="admin"><AdminMain/></Privateroutes>
      },
      {
        path:"add-product",
        element:<Privateroutes role="admin"><AddProduct/></Privateroutes>
      },
      {
        path:"manage-products",
        element:<Privateroutes role="admin"><ManageProducts/></Privateroutes>
      },
      {
        path:"update-product/:id",
        element:<Privateroutes role="admin"><UpdateProduct/></Privateroutes>
      },
      {
        path:"user-management",
        element:<Privateroutes role="admin"><ManageUsers/></Privateroutes>
      },
      {
        path:"manage-orders",
        element:<Privateroutes role="admin"><ManageOrders/></Privateroutes>
      },
      {
        path:"add-blog",
        element:<Privateroutes role="admin"><AddBlog/></Privateroutes>
      },
      {
        path:"manage-blogs",
        element:<Privateroutes role="admin"><ManageBlogs/></Privateroutes>
      },
      {
        path:"update-blog/:id",
        element:<Privateroutes role="admin"><UpdateBlog/></Privateroutes>
      },
      {
        path:"manage-policy",
        element:<Privateroutes role="admin"><ManagePolicy/></Privateroutes>
      }
    ]
  }
]);

export default router;
