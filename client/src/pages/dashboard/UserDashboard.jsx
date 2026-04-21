import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useLogoutUserMutation } from "../../store/features/auth/authApi";
import { logout } from "../../store/features/auth/authSlice";
import { useDispatch } from "react-redux";

const icons = {
  Dashboard: "ri-home-5-line",
  Orders: "ri-shopping-bag-3-line",
  Profile: "ri-user-3-line",
  Payments: "ri-bank-card-line",
  Reviews: "ri-star-line",
};

const UserDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const [logoutUser, { isLoading }] = useLogoutUserMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/dashboard/orders", label: "Orders" },
    { path: "/dashboard/profile", label: "Profile" },
    { path: "/dashboard/payments", label: "Payments" },
    { path: "/dashboard/reviews", label: "Reviews" },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!collapsed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [collapsed]);

  return (
    <aside
      ref={sidebarRef}
      className={`h-[100dvh] sticky top-0 bg-white border-r flex flex-col transition-all duration-300
  ${collapsed ? "w-20" : "w-72"}`}
    >
      {/* TOP */}
      <div className="p-4 overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          {!collapsed && (
            <Link to="/" className="text-xl font-bold">
              Willow & Rue<span className="text-primary">.</span>
            </Link>
          )}

          {/* TOGGLE */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center cursor-pointer"
          >
            <i
              className={`ri-arrow-left-s-line text-xl transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            ></i>
          </button>
        </div>

        {/* NAV */}
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/dashboard"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative
    ${isActive ? "bg-linear-to-r from-primary to-indigo-500 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r"></span>
                    )}

                    {/* ICON */}
                    <i
                      className={`${icons[item.label]} text-lg min-w-5 text-center ${
                        isActive ? "text-white" : "text-gray-500 group-hover:text-gray-800"
                      }`}
                    ></i>

                    {/* LABEL */}
                    {!collapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* BOTTOM */}
      <div className="p-4 border-t mt-auto mb-10">
        {!collapsed && <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Willow & Rue</p>}

        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
        >
          {isLoading ? (
            <i className="ri-loader-4-line animate-spin text-lg"></i>
          ) : (
            <>
              <i className="ri-logout-box-r-line text-lg"></i>
              {!collapsed && "Logout"}
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default UserDashboard;
