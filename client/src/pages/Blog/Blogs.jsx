import React from 'react'
import { Link } from 'react-router-dom'
import { useFetchAllBlogsQuery } from '../../store/features/blogs/blogsApi'
import BlogCard from './BlogCard'

const Blogs = () => {
  const { data = {}, isLoading, isError } = useFetchAllBlogsQuery({ page: 1, limit: 4 })
  const { blogs = [] } = data

  return (
    <section className="section__container blog__container">
      <h2 className="section__header">Latest Blogs</h2>
      <p className="section__subheader">Elevate your style with our fashion insights and tips</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-8!">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-96 rounded-xl bg-white/70 animate-pulse" />
          ))}

        {!isLoading && !isError && blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
      </div>

      {isError && <p className="mt-8 text-center text-red-500">Failed to load blogs.</p>}

      {!isLoading && blogs.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            to="/blogs"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            View all blogs
          </Link>
        </div>
      )}
    </section>
  )
}

export default Blogs
