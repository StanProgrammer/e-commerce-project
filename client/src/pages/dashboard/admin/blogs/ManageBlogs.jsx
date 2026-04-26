import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useDeleteBlogMutation,
  useFetchAllBlogsQuery,
} from "../../../../store/features/blogs/blogsApi";
import formatBlogDate from "../../../../utils/formatBlogDate";

const BLOGS_PER_PAGE = 10;

const ManageBlogs = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data = {}, isLoading, isError } = useFetchAllBlogsQuery({
    page: currentPage,
    limit: BLOGS_PER_PAGE,
    includeDrafts: true,
  });
  const { blogs = [], totalPages = 1, totalBlogs = 0 } = data;
  const [deleteBlog, { isLoading: isDeleting }] = useDeleteBlogMutation();

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
    },
    [totalPages]
  );

  const handleDeleteBlog = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this blog?");
    if (!confirmDelete) return;

    try {
      await deleteBlog(id).unwrap();
      toast.success("Blog deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete blog");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-60 text-gray-500">Loading blogs...</div>;
  }

  if (isError) {
    return <div className="text-center text-red-500 mt-10">Failed to load blogs</div>;
  }

  return (
    <section className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 border-b gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Blogs</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {blogs.length} of {totalBlogs} blogs
            </p>
          </div>
          <Link
            to="/dashboard/add-blog"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Add Blog
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-175 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b">
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Blog</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Edit</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    No blogs found
                  </td>
                </tr>
              ) : (
                blogs.map((blog, index) => (
                  <tr key={blog._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {(currentPage - 1) * BLOGS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{blog.title}</div>
                      <div className="text-xs text-gray-500">{blog.subtitle}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatBlogDate(blog.publishedAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          blog.isPublished
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {blog.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/dashboard/update-blog/${blog._id}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      >
                        Edit
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={isDeleting}
                        onClick={() => handleDeleteBlog(blog._id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
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

        <div className="flex flex-wrap justify-center items-center gap-2 p-5 border-t">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                currentPage === page ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default ManageBlogs;
