import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetBlogByIdQuery,
  useUpdateBlogMutation,
} from "../../../../store/features/blogs/blogsApi";
import BlogForm from "./BlogForm";

const UpdateBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetBlogByIdQuery(id);
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();

  const handleSubmit = async (formData) => {
    try {
      await updateBlog({ id, formData }).unwrap();
      toast.success("Blog updated successfully");
      navigate("/dashboard/manage-blogs");
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.message || "Failed to update blog");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-60 text-gray-500">Loading blog...</div>;
  }

  if (isError || !data?.blog) {
    return (
      <div className="text-center text-red-500 mt-10">
        Failed to load blog
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Update Blog</h2>
        <BlogForm
          initialBlog={data.blog}
          submitLabel="Update Blog"
          isSubmitting={isUpdating}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard/manage-blogs")}
        />
      </div>
    </section>
  );
};

export default UpdateBlog;
