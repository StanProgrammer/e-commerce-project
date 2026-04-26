import React, { useEffect, useRef, useState } from "react";

const emptyBlog = {
  title: "",
  subtitle: "",
  slug: "",
  excerpt: "",
  content: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  isPublished: true,
  imageUrl: "",
};

const BlogForm = ({ initialBlog, submitLabel, isSubmitting, onSubmit, onCancel }) => {
  const [blog, setBlog] = useState(emptyBlog);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [errors, setErrors] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialBlog) {
      setBlog({
        title: initialBlog.title || "",
        subtitle: initialBlog.subtitle || "",
        slug: initialBlog.slug || "",
        excerpt: initialBlog.excerpt || "",
        content: initialBlog.content || "",
        publishedAt: initialBlog.publishedAt
          ? new Date(initialBlog.publishedAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        isPublished: Boolean(initialBlog.isPublished),
        imageUrl: initialBlog.imageUrl || "",
      });
      setPreview(initialBlog.imageUrl || "");
    }
  }, [initialBlog]);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setBlog((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, image: "Upload a JPG, PNG, or WEBP image" }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image must be under 10MB" }));
      return;
    }

    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!blog.title.trim()) nextErrors.title = "Title is required";
    if (!blog.subtitle.trim()) nextErrors.subtitle = "Subtitle is required";
    if (blog.excerpt.trim().length < 10) nextErrors.excerpt = "Excerpt needs at least 10 characters";
    if (blog.content.trim().length < 50) nextErrors.content = "Content needs at least 50 characters";
    if (!preview && !blog.imageUrl) nextErrors.image = "Blog image is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    Object.entries(blog).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (image) formData.append("image", image);

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Title</label>
          <input
            name="title"
            value={blog.title}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter blog title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Subtitle</label>
          <input
            name="subtitle"
            value={blog.subtitle}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Enter blog subtitle"
          />
          {errors.subtitle && <p className="text-red-500 text-sm mt-1">{errors.subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Slug</label>
          <input
            name="slug"
            value={blog.slug}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Auto-generated if left blank"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Publish Date</label>
          <input
            name="publishedAt"
            type="date"
            value={blog.publishedAt}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Excerpt</label>
        <textarea
          name="excerpt"
          value={blog.excerpt}
          onChange={handleChange}
          rows="3"
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Short summary for cards and listings"
        />
        {errors.excerpt && <p className="text-red-500 text-sm mt-1">{errors.excerpt}</p>}
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Content</label>
        <textarea
          name="content"
          value={blog.content}
          onChange={handleChange}
          rows="10"
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Write the full blog content. Use blank lines between paragraphs."
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Blog Image</label>
        {preview && (
          <img
            src={preview}
            alt="Blog preview"
            className="mb-4 w-48 h-32 object-cover rounded-lg shadow"
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
        />
        {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          name="isPublished"
          checked={blog.isPublished}
          onChange={handleChange}
          className="size-4"
        />
        Published
      </label>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default BlogForm;
