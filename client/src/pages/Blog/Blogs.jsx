import React from 'react'
import blogsData from '../../data/blogs'

const Blogs = () => {
  return (
    <section className="section__container blog__container">
      <h2 className="section__header">Latest Blogs</h2>
      <p className="section__subheader">Elevate your style with our fashion insights and tips</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-8!">
        {
          blogsData.map((blog) => (
            <article
              key={blog.id ?? blog.title}
              className="blog__card bg-white rounded-xl overflow-hidden shadow-sm transition-transform duration-300 ease-in-out hover:shadow-lg hover:-translate-y-2 hover:scale-[1.01] cursor-pointer "
              aria-label={blog.title}
            >
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-48 object-cover"
              />

              <div className="blog__card__content">
                <h6 className="text-sm font-medium text-primary mb-2">{blog.subtitle}</h6>
                <h4 className="text-lg font-header text-text-dark mb-2">{blog.title}</h4>
                <p className="text-sm font-semibold text-text-light">{blog.date}</p>
              </div>
            </article>
          ))
        }
      </div>
    </section>
  )
}

export default Blogs
