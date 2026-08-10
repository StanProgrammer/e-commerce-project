import React from "react";
import { Link, useParams } from "react-router-dom";
import { useGetBlogBySlugQuery } from "../../store/features/blogs/blogsApi";
import formatBlogDate from "../../utils/formatBlogDate";
import { getOptimizedImageUrl } from "../../utils/productImage";

const BlogDetails = () => {
  const { slug } = useParams();
  const { data, isLoading, isError } = useGetBlogBySlugQuery(slug);
  const blog = data?.blog;

  if (isLoading) {
    return (
      <section className="section__container py-12">
        <div className="h-[420px] rounded-xl bg-gray-100 animate-pulse" />
        <div className="mt-8 space-y-4">
          <div className="h-8 w-2/3 bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
        </div>
      </section>
    );
  }

  if (isError || !blog) {
    return (
      <section className="section__container py-16 text-center">
        <h1 className="section__header">Blog not found</h1>
        <Link className="mt-6 inline-flex text-primary font-semibold" to="/blogs">
          Back to blogs
        </Link>
      </section>
    );
  }

  return (
    <article className="section__container py-12 max-w-4xl">
      <Link to="/blogs" className="text-sm font-semibold text-primary hover:underline">
        Back to blogs
      </Link>

      <header className="mt-6">
        <p className="text-primary font-semibold">{blog.subtitle}</p>
        <h1 className="mt-3 font-header text-3xl md:text-5xl leading-tight text-text-dark">
          {blog.title}
        </h1>
        <p className="mt-4 text-text-light font-semibold">
          {formatBlogDate(blog.publishedAt)}
        </p>
      </header>

      <img
        src={getOptimizedImageUrl(blog.imageUrl, 1200)}
        alt={blog.title}
        className="mt-8 w-full aspect-[16/9] object-cover rounded-xl shadow-sm"
      />

      <div className="mt-8 space-y-5 text-base md:text-lg leading-8 text-gray-700">
        {blog.content.split(/\n+/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
};

export default BlogDetails;
