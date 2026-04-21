"use client";

import React, { useState } from "react";
import UpdateUserModal from "./UpdateUserModal";
import {
  useDeleteUserAccountMutation,
  useGetUserProfileQuery,
} from "../../../../store/features/auth/authApi";
import toast from "react-hot-toast";

const ManageUser = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, error, isLoading, refetch } = useGetUserProfileQuery();
  const users = data?.users || [];

  const [deleteUser, { isLoading: isDeleting }] =
    useDeleteUserAccountMutation();

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(id).unwrap();
      toast.success("User deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <section className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            User Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage all users in your system
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

          {/* Stats */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <span className="text-sm text-gray-600">
              Total users: <span className="font-semibold">{users.length}</span>
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-t animate-pulse">
                      <td className="px-6 py-4 bg-gray-100 rounded"></td>
                      <td className="px-6 py-4 bg-gray-100 rounded"></td>
                      <td className="px-6 py-4 bg-gray-100 rounded"></td>
                      <td className="px-6 py-4 bg-gray-100 rounded"></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-red-500">
                      Failed to load users
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr
                      key={user._id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 text-gray-900 break-all">
                        {user.email}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            user.role === "admin"
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="px-3 cursor-pointer py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition"
                        >
                          Edit
                        </button>

                        <button
                          disabled={isDeleting}
                          onClick={() => handleDelete(user._id)}
                          className="px-3 py-1.5 cursor-pointer text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <UpdateUserModal
            user={selectedUser}
            onClose={() => setIsModalOpen(false)}
            onRoleUpdate={refetch}
          />
        )}
      </div>
    </section>
  );
};

export default ManageUser;