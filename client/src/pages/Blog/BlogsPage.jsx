import React, { useState } from "react";
import BlogCard from "./BlogCard";
import { useFetchAllBlogsQuery } from "../../store/features/blogs/blogsApi";
import MessageState from "../../components/MessageState";

const BLOGS_PER_PAGE = 8;

const BlogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data = {}, isLoading, isError } = useFetchAllBlogsQuery({
    page: currentPage,
    limit: BLOGS_PER_PAGE,
  });

  const { blogs = [], totalPages = 1 } = data;

  return (
    <section className="section__container py-12">
      <h1 className="section__header">Fashion Journal</h1>
      <p className="section__subheader">Fresh styling notes, wardrobe ideas, and fashion stories.</p>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
          {Array.from({ length: BLOGS_PER_PAGE }).map((_, index) => (
            <div key={index} className="h-96 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <MessageState
          tone="error"
          title="Blogs could not be loaded"
          message="Refresh the page or try again after checking your connection."
          className="mt-10"
        />
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>

          {blogs.length === 0 && (
            <MessageState
              tone="empty"
              title="No blog posts yet"
              message="New styling stories and announcements will appear here when they are published."
              className="mt-10"
            />
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-md text-sm transition ${
                    currentPage === page
                      ? "bg-primary text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default BlogsPage;
