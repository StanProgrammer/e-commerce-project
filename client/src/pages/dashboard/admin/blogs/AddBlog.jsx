import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAddBlogMutation } from "../../../../store/features/blogs/blogsApi";
import BlogForm from "./BlogForm";
import getApiErrorMessage from "../../../../utils/getApiErrorMessage";

const AddBlog = () => {
  const navigate = useNavigate();
  const [addBlog, { isLoading }] = useAddBlogMutation();

  const handleSubmit = async (formData) => {
    try {
      await addBlog(formData).unwrap();
      toast.success("Blog created. You can manage it from the blog list.");
      navigate("/dashboard/manage-blogs");
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Blog could not be created. Check the form and try again."));
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Add New Blog</h2>
        <BlogForm submitLabel="Add Blog" isSubmitting={isLoading} onSubmit={handleSubmit} />
      </div>
    </section>
  );
};

export default AddBlog;
