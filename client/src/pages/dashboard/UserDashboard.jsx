import React, { useMemo } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useLogoutUserMutation } from "../../store/features/auth/authApi";
import { logout } from "../../store/features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import avatar from "../../assets/avatar.webp";
import toast from "react-hot-toast";
import getApiErrorMessage from "../../utils/getApiErrorMessage";

const UserDashboard = () => {
  const [logoutUser, { isLoading }] = useLogoutUserMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const navItems = useMemo(
    () => [
      { path: "/dashboard", label: "Dashboard", icon: "ri-home-5-line", end: true },
      { path: "/dashboard/orders", label: "Orders", icon: "ri-shopping-bag-3-line" },
      { path: "/dashboard/profile", label: "Profile", icon: "ri-user-3-line" },
      { path: "/dashboard/payments", label: "Payments", icon: "ri-bank-card-line" },
      { path: "/dashboard/reviews", label: "Reviews", icon: "ri-star-line" },
      { path: "/dashboard/feedback", label: "Feedback", icon: "ri-bug-line" },
    ],
    []
  );

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
      dispatch(logout());
      toast.success("You have been signed out.", { id: "logout-success" });
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "We could not sign you out. Please try again."));
    }
  };

  const displayName = user?.username || user?.email?.split("@")[0] || "Customer";

  return (
    <aside className="flex h-dvh w-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
          <span>Willow & Rue</span>
          <span className="text-primary">.</span>
        </Link>

        <div className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <img
            src={user?.profilePic || avatar}
            alt={displayName}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{user?.email || "Member account"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5" role="navigation" aria-label="User dashboard">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
        <ul className="space-y-1.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-white" />
                    )}
                    <i
                      className={`${item.icon} min-w-5 text-center text-lg ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <i className="ri-loader-4-line animate-spin text-lg" aria-hidden="true" />
          ) : (
            <>
              <i className="ri-logout-box-r-line cursor-pointer text-lg" aria-hidden="true" />
              Logout
            </>
          )}
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} Willow & Rue</p>
      </div>
    </aside>
  );
};

export default UserDashboard;
