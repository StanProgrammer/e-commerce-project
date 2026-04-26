import React from "react";
import { Link } from "react-router-dom";
import formatBlogDate from "../../utils/formatBlogDate";

const BlogCard = ({ blog }) => {
  return (
    <Link
      to={`/blogs/${blog.slug}`}
      className="blog__card block bg-white rounded-xl overflow-hidden shadow-sm transition-transform duration-300 ease-in-out hover:shadow-lg hover:-translate-y-2 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Read ${blog.title}`}
    >
      <img src={blog.imageUrl} alt={blog.title} className="w-full h-48 object-cover" />

      <div className="blog__card__content">
        <h6 className="text-sm font-medium text-primary mb-2">{blog.subtitle}</h6>
        <h4 className="text-lg font-header text-text-dark mb-2">{blog.title}</h4>
        <p className="text-sm font-semibold text-text-light">
          {formatBlogDate(blog.publishedAt)}
        </p>
      </div>
    </Link>
  );
};

export default BlogCard;
