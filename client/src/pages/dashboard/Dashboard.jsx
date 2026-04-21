import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
import { Toaster } from "react-hot-toast";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "user":
        return <UserDashboard />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return (
    <>
    <Toaster position="top-center" containerStyle={{ zIndex: 9999 }} />
    <div className="flex bg-gray-50 min-h-screen">
      
      {/* Sidebar */}
      <aside className="hidden md:block w-64 fixed h-full">
        {renderDashboard()}
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-6">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  );
};

export default Dashboard;