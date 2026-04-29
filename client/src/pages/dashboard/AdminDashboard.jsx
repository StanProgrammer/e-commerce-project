import React, { useMemo, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useLogoutUserMutation } from "../../store/features/auth/authApi";
import { logout } from "../../store/features/auth/authSlice";
import { useDispatch } from "react-redux";

const AdminDashboard = () => {
  const [logoutUser, { isLoading }] = useLogoutUserMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = useMemo(
    () => [
      { path: "admin", label: "Dashboard", icon: "ri-dashboard-line" },
      { path: "add-product", label: "Add Product", icon: "ri-add-box-line" },
      { path: "manage-products", label: "Products", icon: "ri-box-3-line" },
      { path: "add-blog", label: "Add Blog", icon: "ri-edit-box-line" },
      { path: "manage-blogs", label: "Blogs", icon: "ri-article-line" },
      { path: "manage-policy", label: "Policy", icon: "ri-file-list-3-line" },
      { path: "user-management", label: "Users", icon: "ri-user-3-line" },
      { path: "orders", label: "Orders", icon: "ri-shopping-cart-2-line" },
    ],
    []
  );

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser().unwrap();
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-linear-to-b from-gray-900 to-gray-800 text-gray-300 flex flex-col justify-between min-h-screen shadow-xl">
      
      {/* Top */}
      <div className="p-6">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-semibold text-white tracking-wide"
        >
          Willow & Rue<span className="text-primary">.</span>
        </Link>

        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
          Admin Panel
        </p>

        <div className="my-1 border-t border-gray-700" />

        {/* Nav */}
        <nav className="pd-0">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  <i className={`${item.icon} text-lg`} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Bottom */}
      <div className="p-6 border-t border-gray-700">
        <button
          onClick={handleLogout}
          disabled={loggingOut || isLoading}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <i className="ri-logout-box-r-line" />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          © {new Date().getFullYear()} Willow & Rue
        </p>
      </div>
    </aside>
  );
};

export default AdminDashboard;
