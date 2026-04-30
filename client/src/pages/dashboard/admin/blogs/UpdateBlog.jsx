import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetBlogByIdQuery,
  useUpdateBlogMutation,
} from "../../../../store/features/blogs/blogsApi";
import BlogForm from "./BlogForm";
import MessageState from "../../../../components/MessageState";
import getApiErrorMessage from "../../../../utils/getApiErrorMessage";

const UpdateBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetBlogByIdQuery(id);
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();

  const handleSubmit = async (formData) => {
    try {
      await updateBlog({ id, formData }).unwrap();
      toast.success("Blog updated. Your changes have been saved.");
      navigate("/dashboard/manage-blogs");
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Blog could not be updated. Check the form and try again."));
    }
  };

  if (isLoading) {
    return <MessageState tone="loading" title="Loading blog" message="We are fetching the post details for editing." className="h-60" />;
  }

  if (isError || !data?.blog) {
    return (
      <MessageState
        tone="error"
        title="Blog could not be loaded"
        message="Return to the blog list and try opening this post again."
        className="mt-10"
      />
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
